const database = require('../db/database');

class PreventionNotFoundError extends Error {
  constructor(message) {
    super(`Prevention not found: ${message}`);
    this.name = 'PreventionNotFoundError';
  }
}

class Prevention {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.number = data.number;
    this.sessionId = data.session_id;
    this.content = data.content;
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
        phone: data.patient_phone
      };
    }
  }

  /**
   * Find prevention by ID within a tenant schema
   */
  static async findById(id, schema, includeSession = true) {
    let query = `
      SELECT prv.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.email as patient_email, p.phone as patient_phone,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.prevention prv
      LEFT JOIN ${schema}.session s ON prv.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON prv.created_by_user_id_fk = u.id
      WHERE prv.id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new PreventionNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Prevention(result.rows[0]);
  }

  /**
   * Find all preventions within a tenant schema
   */
  static async findAll(schema, options = {}) {
    const { limit = 50, offset = 0, sessionId, status, createdFrom, createdTo, patientId, createdByUserId } = options;

    let query = `
      SELECT prv.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.email as patient_email, p.phone as patient_phone,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.prevention prv
      LEFT JOIN ${schema}.session s ON prv.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON prv.created_by_user_id_fk = u.id
    `;

    const params = [];
    const conditions = [];

    if (sessionId) {
      conditions.push(`prv.session_id = $${params.length + 1}`);
      params.push(sessionId);
    }

    if (status) {
      conditions.push(`prv.status = $${params.length + 1}`);
      params.push(status);
    }

    if (createdFrom) {
      // Accept ISO timestamp UTC from frontend (timezone-aware)
      conditions.push(`prv.created_at >= $${params.length + 1}::timestamptz`);
      params.push(createdFrom);
    }

    if (createdTo) {
      // Accept ISO timestamp UTC from frontend (includes end of day)
      conditions.push(`prv.created_at <= $${params.length + 1}::timestamptz`);
      params.push(createdTo);
    }

    if (patientId) {
      conditions.push(`s.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (createdByUserId) {
      conditions.push(`prv.created_by_user_id_fk = $${params.length + 1}`);
      params.push(createdByUserId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY prv.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Prevention(row));
  }

  /**
   * Count preventions within a tenant schema
   */
  static async count(schema, options = {}) {
    const { sessionId, status, patientId, createdByUserId } = options;

    let query = `SELECT COUNT(*) as count FROM ${schema}.prevention prv`;
    const params = [];
    const conditions = [];

    // Join with session if filtering by patientId
    if (patientId) {
      query += ` LEFT JOIN ${schema}.session s ON prv.session_id = s.id`;
    }

    if (sessionId) {
      conditions.push(`prv.session_id = $${params.length + 1}`);
      params.push(sessionId);
    }

    if (status) {
      conditions.push(`prv.status = $${params.length + 1}`);
      params.push(status);
    }

    if (patientId) {
      conditions.push(`s.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (createdByUserId) {
      conditions.push(`prv.created_by_user_id_fk = $${params.length + 1}`);
      params.push(createdByUserId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new prevention within a tenant schema
   */
  static async create(preventionData, schema) {
    const { sessionId, content, status = 'draft', createdByUserId = null } = preventionData;

    const insertQuery = `
      INSERT INTO ${schema}.prevention (session_id, content, status, created_by_user_id_fk)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const insertResult = await database.query(insertQuery, [
      sessionId,
      content,
      status,
      createdByUserId
    ]);

    const preventionId = insertResult.rows[0].id;

    // Fetch the created prevention with all joined data (session + patient + creator)
    const selectQuery = `
      SELECT prv.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.email as patient_email, p.phone as patient_phone,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.prevention prv
      LEFT JOIN ${schema}.session s ON prv.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON prv.created_by_user_id_fk = u.id
      WHERE prv.id = $1
    `;

    const selectResult = await database.query(selectQuery, [preventionId]);

    return new Prevention(selectResult.rows[0]);
  }

  /**
   * Update an existing prevention within a tenant schema
   */
  static async update(id, updates, schema) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    const allowedUpdates = ['content', 'status'];
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
      UPDATE ${schema}.prevention
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    const updateResult = await database.query(updateQuery, [
      ...updateValues,
      id
    ]);

    if (updateResult.rows.length === 0) {
      throw new PreventionNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    // Fetch the updated prevention with all joined data (session + patient + creator)
    const selectQuery = `
      SELECT prv.*, s.number as session_number, s.status as session_status, s.patient_id,
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.email as patient_email, p.phone as patient_phone,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM ${schema}.prevention prv
      LEFT JOIN ${schema}.session s ON prv.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN public.users u ON prv.created_by_user_id_fk = u.id
      WHERE prv.id = $1
    `;

    const selectResult = await database.query(selectQuery, [id]);

    return new Prevention(selectResult.rows[0]);
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
    }

    return result;
  }
}

module.exports = { Prevention, PreventionNotFoundError };
