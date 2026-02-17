const database = require('../db/database');

class MarketplaceItemNotFoundError extends Error {
  constructor(message) {
    super(`Marketplace item not found: ${message}`);
    this.name = 'MarketplaceItemNotFoundError';
  }
}

class MarketplaceItem {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.type = data.type;
    this.title = data.title;
    this.description = data.description;
    this.content = data.content;
    this.specialty = data.specialty;
    this.locale = data.locale;
    this.thumbnailUrl = data.thumbnail_url;
    this.importCount = data.import_count;
    this.active = data.active;
  }

  /**
   * Find all marketplace items with filters (public schema, no tenant)
   */
  static async findAll(options = {}) {
    const { type, specialty, locale, search, limit = 50, offset = 0 } = options;

    let query = `SELECT id, created_at, updated_at, type, title, description, specialty, locale, thumbnail_url, import_count, active FROM public.marketplace_items`;

    const params = [];
    const conditions = ['active = true'];

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (specialty) {
      conditions.push(`specialty = $${params.length + 1}`);
      params.push(specialty);
    }

    if (locale) {
      conditions.push(`locale = $${params.length + 1}`);
      params.push(locale);
    }

    if (search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY import_count DESC, created_at DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new MarketplaceItem(row));
  }

  /**
   * Find marketplace item by ID (includes content)
   */
  static async findById(id) {
    const query = `SELECT * FROM public.marketplace_items WHERE id = $1 AND active = true`;
    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new MarketplaceItemNotFoundError(`ID: ${id}`);
    }

    return new MarketplaceItem(result.rows[0]);
  }

  /**
   * Count marketplace items with filters
   */
  static async count(options = {}) {
    const { type, specialty, locale, search } = options;

    let query = `SELECT COUNT(*) as count FROM public.marketplace_items`;

    const params = [];
    const conditions = ['active = true'];

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (specialty) {
      conditions.push(`specialty = $${params.length + 1}`);
      params.push(specialty);
    }

    if (locale) {
      conditions.push(`locale = $${params.length + 1}`);
      params.push(locale);
    }

    if (search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` WHERE ${conditions.join(' AND ')}`;

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Increment import count (fire-and-forget)
   */
  static async incrementImportCount(id) {
    const query = `
      UPDATE public.marketplace_items
      SET import_count = import_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND active = true
    `;
    await database.query(query, [id]);
  }

  /**
   * Convert to JSON without content (for list views)
   */
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      type: this.type,
      title: this.title,
      description: this.description,
      specialty: this.specialty,
      locale: this.locale,
      thumbnailUrl: this.thumbnailUrl,
      importCount: this.importCount,
      active: this.active
    };
  }

  /**
   * Convert to JSON with content (for detail/import)
   */
  toJSONWithContent() {
    return {
      ...this.toJSON(),
      content: this.content
    };
  }
}

module.exports = { MarketplaceItem, MarketplaceItemNotFoundError };
