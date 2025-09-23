const database = require('../db/database');

class PatientNotFoundError extends Error {
  constructor(message) {
    super(`Patient not found: ${message}`);
    this.name = 'PatientNotFoundError';
  }
}

class Patient {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
    this.notes = data.notes;
  }

  /**
   * Find patient by ID within a tenant schema
   */
  static async findById(id, schema) {
    const query = `
      SELECT * FROM ${schema}.patient
      WHERE id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new PatientNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Patient(result.rows[0]);
  }

  /**
   * Find all patients within a tenant schema
   */
  static async findAll(schema, options = {}) {
    const { limit = 50, offset = 0, search } = options;

    let query = `
      SELECT * FROM ${schema}.patient
    `;
    const params = [];

    if (search) {
      query += ` WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Patient(row));
  }

  /**
   * Count patients within a tenant schema
   */
  static async count(schema, options = {}) {
    const { search } = options;

    let query = `SELECT COUNT(*) as count FROM ${schema}.patient`;
    const params = [];

    if (search) {
      query += ` WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new patient within a tenant schema
   */
  static async create(patientData, schema) {
    const { firstName, lastName, email, phone, notes } = patientData;

    const query = `
      INSERT INTO ${schema}.patient (first_name, last_name, email, phone, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await database.query(query, [
      firstName,
      lastName,
      email,
      phone,
      notes
    ]);

    return new Patient(result.rows[0]);
  }

  /**
   * Update an existing patient within a tenant schema
   */
  static async update(id, updates, schema) {
    const allowedUpdates = ['first_name', 'last_name', 'email', 'phone', 'notes'];
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
      UPDATE ${schema}.patient
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, [
      ...updateValues,
      id
    ]);

    if (result.rows.length === 0) {
      throw new PatientNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Patient(result.rows[0]);
  }

  /**
   * Delete a patient within a tenant schema (hard delete)
   */
  static async delete(id, schema) {
    const query = `
      DELETE FROM ${schema}.patient
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new PatientNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Patient(result.rows[0]);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      notes: this.notes
    };
  }
}

module.exports = { Patient, PatientNotFoundError };