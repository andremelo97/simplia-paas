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
    this.createdByUserId = data.created_by_user_id_fk;

    // Include creator data if joined
    if (data.creator_first_name !== undefined) {
      this.createdBy = {
        id: data.created_by_user_id_fk,
        firstName: data.creator_first_name,
        lastName: data.creator_last_name
      };
    }

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
        email: data.patient_email,
        phone: data.patient_phone,
        phoneCountryCode: data.patient_phone_country_code
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
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email, p.phone as patient_phone, p.phone_country_code as patient_phone_country_code,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.quote q
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON q.created_by_user_id_fk = u.id
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
        itemId: item.item_id,
        name: item.name,
        basePrice: parseFloat(item.base_price),
        discountAmount: parseFloat(item.discount_amount || 0),
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
    const { limit = 50, offset = 0, sessionId, status, createdFrom, createdTo, patientId, createdByUserId } = options;

    let query = `
      SELECT q.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email, p.phone as patient_phone, p.phone_country_code as patient_phone_country_code,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.quote q
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON q.created_by_user_id_fk = u.id
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

    if (createdFrom) {
      // Accept ISO timestamp UTC from frontend (timezone-aware)
      conditions.push(`q.created_at >= $${params.length + 1}::timestamptz`);
      params.push(createdFrom);
    }

    if (createdTo) {
      // Accept ISO timestamp UTC from frontend (includes end of day)
      conditions.push(`q.created_at <= $${params.length + 1}::timestamptz`);
      params.push(createdTo);
    }

    if (patientId) {
      conditions.push(`s.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (createdByUserId) {
      conditions.push(`q.created_by_user_id_fk = $${params.length + 1}`);
      params.push(createdByUserId);
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
    const { sessionId, status, patientId, createdByUserId } = options;

    let query = `SELECT COUNT(*) as count FROM ${schema}.quote q`;
    const params = [];
    const conditions = [];

    // Join with session if filtering by patientId
    if (patientId) {
      query += ` LEFT JOIN ${schema}.session s ON q.session_id = s.id`;
    }

    if (sessionId) {
      conditions.push(`q.session_id = $${params.length + 1}`);
      params.push(sessionId);
    }

    if (status) {
      conditions.push(`q.status = $${params.length + 1}`);
      params.push(status);
    }

    if (patientId) {
      conditions.push(`s.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (createdByUserId) {
      conditions.push(`q.created_by_user_id_fk = $${params.length + 1}`);
      params.push(createdByUserId);
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
    const { sessionId, content, status = 'draft', createdByUserId = null } = quoteData;

    const insertQuery = `
      INSERT INTO ${schema}.quote (session_id, content, status, created_by_user_id_fk)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const insertResult = await database.query(insertQuery, [
      sessionId,
      content,
      status,
      createdByUserId
    ]);

    const quoteId = insertResult.rows[0].id;

    // Fetch the created quote with all joined data (session + patient + creator)
    const selectQuery = `
      SELECT q.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email, p.phone as patient_phone, p.phone_country_code as patient_phone_country_code,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.quote q
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON q.created_by_user_id_fk = u.id
      WHERE q.id = $1
    `;

    const selectResult = await database.query(selectQuery, [quoteId]);

    return new Quote(selectResult.rows[0]);
  }

  /**
   * Update an existing quote within a tenant schema
   */
  static async update(id, updates, schema) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    const allowedUpdates = ['content', 'total', 'status'];
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

    const updateQuery = `
      UPDATE ${schema}.quote
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    const updateResult = await database.query(updateQuery, [
      ...updateValues,
      id
    ]);

    if (updateResult.rows.length === 0) {
      throw new QuoteNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    // Fetch the updated quote with all joined data (session + patient + creator)
    const selectQuery = `
      SELECT q.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email, p.phone as patient_phone, p.phone_country_code as patient_phone_country_code,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.quote q
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON q.created_by_user_id_fk = u.id
      WHERE q.id = $1
    `;

    const selectResult = await database.query(selectQuery, [id]);

    return new Quote(selectResult.rows[0]);
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
   * Note: final_price already includes quantity (final_price = (base_price - discount) * quantity)
   */
  static async calculateTotal(quoteId, schema) {
    const result = await database.query(`
      SELECT SUM(final_price) as total
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
      createdByUserId: this.createdByUserId
    };

    // Include creator data if available
    if (this.createdBy) {
      result.createdBy = this.createdBy;
    }

    // Include session data if available (flat fields for frontend compatibility)
    if (this.session) {
      result.session_number = this.session.number;
      result.session_status = this.session.status;
    }

    // Include patient data if available (flat fields for frontend compatibility)
    if (this.patient) {
      result.patient_id = this.patient.id;
      result.patient_first_name = this.patient.firstName;
      result.patient_last_name = this.patient.lastName;
      result.patient_email = this.patient.email;
      result.patient_phone = this.patient.phone;
      result.patient_phone_country_code = this.patient.phoneCountryCode;
    }

    // Include items if available
    if (this.items) {
      result.items = this.items;
    }

    return result;
  }
}

module.exports = { Quote, QuoteNotFoundError };