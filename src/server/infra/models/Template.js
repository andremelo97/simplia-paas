const database = require('../db/database');

class TemplateNotFoundError extends Error {
  constructor(message) {
    super(`Template not found: ${message}`);
    this.name = 'TemplateNotFoundError';
  }
}

class Template {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.title = data.title;
    this.content = data.content;
    this.description = data.description;
    this.active = data.active;
    this.usageCount = data.usage_count;
  }

  /**
   * Find template by ID within a tenant schema
   */
  static async findById(id, schema) {
    const query = `
      SELECT *
      FROM ${schema}.template
      WHERE id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new TemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Template(result.rows[0]);
  }

  /**
   * Find all templates within a tenant schema
   */
  static async findAll(schema, options = {}) {
    const { limit = 50, offset = 0, active, search } = options;

    let query = `
      SELECT *
      FROM ${schema}.template
    `;

    const params = [];
    const conditions = [];

    if (active !== undefined) {
      conditions.push(`active = $${params.length + 1}`);
      params.push(active);
    }

    if (search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Template(row));
  }

  /**
   * Count templates within a tenant schema
   */
  static async count(schema, options = {}) {
    const { active, search } = options;

    let query = `SELECT COUNT(*) as count FROM ${schema}.template`;
    const params = [];
    const conditions = [];

    if (active !== undefined) {
      conditions.push(`active = $${params.length + 1}`);
      params.push(active);
    }

    if (search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new template within a tenant schema
   */
  static async create(templateData, schema) {
    const { title, content, description, active = true } = templateData;

    const query = `
      INSERT INTO ${schema}.template (title, content, description, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await database.query(query, [
      title,
      content,
      description,
      active
    ]);

    return new Template(result.rows[0]);
  }

  /**
   * Update an existing template within a tenant schema
   */
  static async update(id, updates, schema) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    const allowedUpdates = ['title', 'content', 'description', 'active'];
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
      UPDATE ${schema}.template
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, [
      ...updateValues,
      id
    ]);

    if (result.rows.length === 0) {
      throw new TemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Template(result.rows[0]);
  }

  /**
   * Delete a template within a tenant schema (soft delete)
   */
  static async delete(id, schema) {
    const query = `
      UPDATE ${schema}.template
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new TemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Template(result.rows[0]);
  }

  /**
   * Hard delete a template within a tenant schema
   */
  static async hardDelete(id, schema) {
    const query = `
      DELETE FROM ${schema}.template
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new TemplateNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new Template(result.rows[0]);
  }

  /**
   * Increment usage count for a template
   */
  static async incrementUsage(id, schema) {
    const query = `
      UPDATE ${schema}.template
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND active = true
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new TemplateNotFoundError(`ID: ${id} in schema: ${schema} or template is inactive`);
    }

    return new Template(result.rows[0]);
  }

  /**
   * Find most used templates within a tenant schema
   */
  static async findMostUsed(schema, options = {}) {
    const { limit = 10 } = options;

    const query = `
      SELECT *
      FROM ${schema}.template
      WHERE active = true AND usage_count > 0
      ORDER BY usage_count DESC, created_at DESC
      LIMIT $1
    `;

    const result = await database.query(query, [limit]);
    return result.rows.map(row => new Template(row));
  }

  /**
   * Convert to JSON
   */

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      title: this.title,
      content: this.content,
      description: this.description,
      active: this.active,
      usageCount: this.usageCount
    };
  }
}

module.exports = { Template, TemplateNotFoundError };