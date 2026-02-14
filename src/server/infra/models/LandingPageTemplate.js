const database = require('../db/database');

class LandingPageTemplateNotFoundError extends Error {
  constructor(message) {
    super(`Landing Page Template not found: ${message}`);
    this.name = 'LandingPageTemplateNotFoundError';
  }
}

class LandingPageTemplate {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.name = data.name;
    this.description = data.description;
    this.content = data.content;
    this.isDefault = data.is_default;
    this.active = data.active;
  }

  /**
   * Find template by ID within a tenant schema
   */
  static async findById(id, schema) {
    const query = `
      SELECT *
      FROM ${schema}.landing_page_template
      WHERE id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new LandingPageTemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new LandingPageTemplate(result.rows[0]);
  }

  /**
   * Find all templates within a tenant schema
   */
  static async findAll(schema, options = {}) {
    const { limit = 50, offset = 0, active, isDefault } = options;

    let query = `
      SELECT *
      FROM ${schema}.landing_page_template
    `;

    const params = [];
    const conditions = [];

    if (active !== undefined) {
      conditions.push(`active = $${params.length + 1}`);
      params.push(active);
    }

    if (isDefault !== undefined) {
      conditions.push(`is_default = $${params.length + 1}`);
      params.push(isDefault);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY is_default DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new LandingPageTemplate(row));
  }

  /**
   * Count templates within a tenant schema
   */
  static async count(schema, options = {}) {
    const { active, isDefault } = options;

    let query = `
      SELECT COUNT(*) as count
      FROM ${schema}.landing_page_template
    `;

    const params = [];
    const conditions = [];

    if (active !== undefined) {
      conditions.push(`active = $${params.length + 1}`);
      params.push(active);
    }

    if (isDefault !== undefined) {
      conditions.push(`is_default = $${params.length + 1}`);
      params.push(isDefault);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new template
   */
  static async create(schema, data) {
    const { name, description, content, isDefault = false, active = true } = data;

    // If setting as default, unset all other defaults first
    if (isDefault) {
      await database.query(`
        UPDATE ${schema}.landing_page_template
        SET is_default = false
        WHERE is_default = true
      `);
    }

    const query = `
      INSERT INTO ${schema}.landing_page_template (name, description, content, is_default, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await database.query(query, [name, description, content, isDefault, active]);
    return new LandingPageTemplate(result.rows[0]);
  }

  /**
   * Update a template
   */
  static async update(id, schema, data) {
    const { name, description, content, isDefault, active } = data;

    // If setting as default, unset all other defaults first
    if (isDefault === true) {
      await database.query(`
        UPDATE ${schema}.landing_page_template
        SET is_default = false
        WHERE is_default = true AND id != $1
      `, [id]);
    }

    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(name);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(description);
    }

    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      params.push(content);
    }

    if (isDefault !== undefined) {
      updateFields.push(`is_default = $${paramIndex++}`);
      params.push(isDefault);
    }

    if (active !== undefined) {
      updateFields.push(`active = $${paramIndex++}`);
      params.push(active);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);

    const query = `
      UPDATE ${schema}.landing_page_template
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, params);

    if (result.rows.length === 0) {
      throw new LandingPageTemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new LandingPageTemplate(result.rows[0]);
  }

  /**
   * Delete a template
   */
  static async delete(id, schema) {
    const query = `
      DELETE FROM ${schema}.landing_page_template
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new LandingPageTemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new LandingPageTemplate(result.rows[0]);
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      name: this.name,
      description: this.description,
      content: this.content,
      isDefault: this.isDefault,
      active: this.active
    };
  }
}

module.exports = { LandingPageTemplate, LandingPageTemplateNotFoundError };
