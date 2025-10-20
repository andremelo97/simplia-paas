const database = require('../db/database');

class SessionNotFoundError extends Error {
  constructor(message) {
    super(`Session not found: ${message}`);
    this.name = 'SessionNotFoundError';
  }
}

class Session {
  constructor(data) {
    this.id = data.id;
    this.number = data.number;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.patientId = data.patient_id;
    this.transcriptionId = data.transcription_id;
    this.status = data.status;

    // Include patient data if joined
    if (data.patient_first_name) {
      this.patient = {
        id: data.patient_id,
        firstName: data.patient_first_name,
        lastName: data.patient_last_name,
        email: data.patient_email
      };
    }

    // Include transcription data if available
    if (data.transcription_text !== undefined) {
      this.transcription = {
        text: data.transcription_text,
        confidence: data.transcription_confidence,
        audio_url: data.transcription_audio_url,
        audio_deleted_at: data.transcription_audio_deleted_at
      };
    }
  }

  /**
   * Find session by ID within a tenant schema
   */
  static async findById(id, schema, includePatient = false) {
    let query = `
      SELECT s.*
    `;

    if (includePatient) {
      query += `, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email`;
    }

    // Always include transcription data if available
    query += `, t.transcript as transcription_text, t.confidence_score as transcription_confidence, t.audio_url as transcription_audio_url, t.audio_deleted_at as transcription_audio_deleted_at`;

    query += ` FROM ${schema}.session s`;

    if (includePatient) {
      query += ` LEFT JOIN ${schema}.patient p ON s.patient_id = p.id`;
    }

    // Always left join transcription
    query += ` LEFT JOIN ${schema}.transcription t ON s.transcription_id = t.id`;

    query += ` WHERE s.id = $1`;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new SessionNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Session(result.rows[0]);
  }

  /**
   * Find all sessions within a tenant schema
   */
  static async findAll(schema, options = {}) {
    const { limit = 50, offset = 0, patientId, status, includePatient = false } = options;

    let query = `
      SELECT s.*
    `;

    if (includePatient) {
      query += `, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email`;
    }

    // Always include transcription data if available
    query += `, t.transcript as transcription_text, t.confidence_score as transcription_confidence, t.audio_url as transcription_audio_url, t.audio_deleted_at as transcription_audio_deleted_at`;

    query += ` FROM ${schema}.session s`;

    if (includePatient) {
      query += ` LEFT JOIN ${schema}.patient p ON s.patient_id = p.id`;
    }

    // Always left join transcription
    query += ` LEFT JOIN ${schema}.transcription t ON s.transcription_id = t.id`;

    const params = [];
    const conditions = [];

    if (patientId) {
      conditions.push(`s.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (status) {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Session(row));
  }

  /**
   * Count sessions within a tenant schema
   */
  static async count(schema, options = {}) {
    const { patientId, status } = options;

    let query = `SELECT COUNT(*) as count FROM ${schema}.session`;
    const params = [];
    const conditions = [];

    if (patientId) {
      conditions.push(`patient_id = $${params.length + 1}`);
      params.push(patientId);
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
   * Create a new session within a tenant schema
   */
  static async create(sessionData, schema) {
    const { patientId, transcriptionId, status = 'draft' } = sessionData;

    const query = `
      INSERT INTO ${schema}.session (patient_id, transcription_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await database.query(query, [
      patientId,
      transcriptionId,
      status
    ]);

    return new Session(result.rows[0]);
  }

  /**
   * Update an existing session within a tenant schema
   */
  static async update(id, updates, schema, transcriptionText) {
    if (Object.keys(updates).length === 0 && transcriptionText === undefined) {
      throw new Error('No updates provided');
    }

    // Start transaction to update both session and transcription
    const client = await database.getClient();

    try {
      await client.query('BEGIN');

      // Update session if there are updates
      let session;
      if (Object.keys(updates).length > 0) {
        const allowedUpdates = ['transcription_id', 'status'];
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

        const sessionQuery = `
          UPDATE ${schema}.session
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const sessionResult = await client.query(sessionQuery, [
          ...updateValues,
          id
        ]);

        if (sessionResult.rows.length === 0) {
          throw new SessionNotFoundError(`ID: ${id} in schema: ${schema}`);
        }

        session = sessionResult.rows[0];
      } else {
        // Just get the session
        const sessionResult = await client.query(
          `SELECT * FROM ${schema}.session WHERE id = $1`,
          [id]
        );

        if (sessionResult.rows.length === 0) {
          throw new SessionNotFoundError(`ID: ${id} in schema: ${schema}`);
        }

        session = sessionResult.rows[0];
      }

      // Update transcription text if provided
      if (transcriptionText !== undefined && session.transcription_id) {
        await client.query(
          `UPDATE ${schema}.transcription
           SET transcript = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [transcriptionText, session.transcription_id]
        );
      }

      await client.query('COMMIT');

      // Fetch updated session with includes
      return await Session.findById(id, schema, true);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a session within a tenant schema (hard delete)
   */
  static async delete(id, schema) {
    // First, check if session has any quotes
    const quoteCheckQuery = `
      SELECT COUNT(*) as quote_count
      FROM ${schema}.quote
      WHERE session_id = $1
    `;

    const quoteCheck = await database.query(quoteCheckQuery, [id]);
    const quoteCount = parseInt(quoteCheck.rows[0].quote_count);

    if (quoteCount > 0) {
      const error = new Error(
        `Cannot delete session - session has ${quoteCount} quote${quoteCount > 1 ? 's' : ''} attached. Delete or reassign quotes first.`
      );
      error.code = 'SESSION_HAS_QUOTES';
      error.statusCode = 400;
      error.quoteCount = quoteCount;
      throw error;
    }

    // Check if session has any clinical reports
    const reportCheckQuery = `
      SELECT COUNT(*) as report_count
      FROM ${schema}.clinical_report
      WHERE session_id = $1
    `;

    const reportCheck = await database.query(reportCheckQuery, [id]);
    const reportCount = parseInt(reportCheck.rows[0].report_count);

    if (reportCount > 0) {
      const error = new Error(
        `Cannot delete session - session has ${reportCount} clinical report${reportCount > 1 ? 's' : ''} attached. Delete or reassign reports first.`
      );
      error.code = 'SESSION_HAS_REPORTS';
      error.statusCode = 400;
      error.reportCount = reportCount;
      throw error;
    }

    // If no quotes or reports, proceed with delete
    const query = `
      DELETE FROM ${schema}.session
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new SessionNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Session(result.rows[0]);
  }

  /**
   * Find sessions by patient ID within a tenant schema
   */
  static async findByPatientId(patientId, schema, options = {}) {
    const { limit = 50, offset = 0, status } = options;

    let query = `
      SELECT s.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email
      FROM ${schema}.session s
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      WHERE s.patient_id = $1
    `;
    const params = [patientId];

    if (status) {
      query += ` AND s.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Session(row));
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    const result = {
      id: this.id,
      number: this.number,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      patientId: this.patientId,
      transcriptionId: this.transcriptionId,
      status: this.status
    };

    // Include patient data if available
    if (this.patient) {
      result.patient = this.patient;
      // Also include direct patient fields for compatibility
      result.patient_first_name = this.patient.firstName;
      result.patient_last_name = this.patient.lastName;
      result.patient_email = this.patient.email;
    }

    // Include transcription data if available
    if (this.transcription) {
      result.transcription = this.transcription;
      // Also include direct transcription fields for compatibility
      result.transcription_text = this.transcription.text;
      result.transcription_confidence = this.transcription.confidence;
    }

    return result;
  }
}

module.exports = { Session, SessionNotFoundError };