const database = require('../db/database');

class QuoteNotFoundError extends Error {
  constructor(message) {
    super(`Quote not found: ${message}`);
    this.name = 'QuoteNotFoundError';
  }
}

class Quote {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.number = data.number;
    this.sessionId = data.session_id;
    this.content = data.content;
    this.total = data.total;
    this.status = data.status;
    this.expiresAt = data.expires_at;

    // Include session data if joined
    if (data.session_number) {
      this.session = {
        id: data.session_id,
        number: data.session_number,
        status: data.session_status
      };
    }

    // Include patient data if joined
    if (data.patient_first_name || data.patient_last_name) {
      this.patient = {
        id: data.patient_id,
        firstName: data.patient_first_name,
        lastName: data.patient_last_name,
        email: data.patient_email
      };
    }

    // Include quote items if available
    if (data.items) {
      this.items = data.items;
    }
  }

  /**
   * Find quote by ID within a tenant schema
   */
  static async findById(id, schema, includeItems = false, includeSession = true) {
    let query = `
      SELECT q.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email
      FROM ${schema}.quote q
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      WHERE q.id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new QuoteNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    const quote = new Quote(result.rows[0]);

    // Load quote items if requested
    if (includeItems) {
      const itemsResult = await database.query(`
        SELECT * FROM ${schema}.quote_item
        WHERE quote_id = $1
        ORDER BY created_at ASC
      `, [id]);

      quote.items = itemsResult.rows.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        basePrice: parseFloat(item.base_price),
        discountAmount: parseFloat(item.discount_amount),
        finalPrice: parseFloat(item.final_price),
        quantity: item.quantity,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    }

    return quote;
  }

  /**
   * Find all quotes within a tenant schema
   */
  static async findAll(schema, options = {}) {
    const { limit = 50, offset = 0, sessionId, status } = options;

    let query = `
      SELECT q.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email
      FROM ${schema}.quote q
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
    `;

    const params = [];
    const conditions = [];

    if (sessionId) {
      conditions.push(`q.session_id = $${params.length + 1}`);
      params.push(sessionId);
    }

    if (status) {
      conditions.push(`q.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Quote(row));
  }

  /**
   * Count quotes within a tenant schema
   */
  static async count(schema, options = {}) {
    const { sessionId, status } = options;

    let query = `SELECT COUNT(*) as count FROM ${schema}.quote`;
    const params = [];
    const conditions = [];

    if (sessionId) {
      conditions.push(`session_id = $${params.length + 1}`);
      params.push(sessionId);
    }

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new quote within a tenant schema
   */
  static async create(quoteData, schema) {
    const { sessionId, content, status = 'draft', expiresAt } = quoteData;

    const query = `
      INSERT INTO ${schema}.quote (session_id, content, status, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await database.query(query, [
      sessionId,
      content,
      status,
      expiresAt
    ]);

    return new Quote(result.rows[0]);
  }

  /**
   * Update an existing quote within a tenant schema
   */
  static async update(id, updates, schema) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    const allowedUpdates = ['content', 'total', 'status', 'expires_at'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE ${schema}.quote
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, [
      ...updateValues,
      id
    ]);

    if (result.rows.length === 0) {
      throw new QuoteNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Quote(result.rows[0]);
  }

  /**
   * Delete a quote within a tenant schema (hard delete)
   */
  static async delete(id, schema) {
    const query = `
      DELETE FROM ${schema}.quote
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new QuoteNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Quote(result.rows[0]);
  }

  /**
   * Calculate quote total based on items
   */
  static async calculateTotal(quoteId, schema) {
    const result = await database.query(`
      SELECT SUM(final_price * quantity) as total
      FROM ${schema}.quote_item
      WHERE quote_id = $1
    `, [quoteId]);

    const total = parseFloat(result.rows[0].total) || 0;

    await this.update(quoteId, { total }, schema);

    return { total };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    const result = {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      number: this.number,
      sessionId: this.sessionId,
      content: this.content,
      total: this.total ? parseFloat(this.total) : 0,
      status: this.status,
      expiresAt: this.expiresAt
    };

    // Include session data if available
    if (this.session) {
      result.session = this.session;
    }

    // Include patient data if available
    if (this.patient) {
      result.patient = this.patient;
    }

    // Include items if available
    if (this.items) {
      result.items = this.items;
    }

    return result;
  }
}

module.exports = { Quote, QuoteNotFoundError };