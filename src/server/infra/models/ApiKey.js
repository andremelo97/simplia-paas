const database = require('../db/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class ApiKeyNotFoundError extends Error {
  constructor(message) {
    super(`API Key not found: ${message}`);
    this.name = 'ApiKeyNotFoundError';
  }
}

class ApiKey {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.keyPrefix = data.key_prefix;
    this.scope = data.scope;
    this.createdByFk = data.created_by_fk;
    this.lastUsedAt = data.last_used_at;
    this.expiresAt = data.expires_at;
    this.active = data.active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    // Never expose key_hash
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      keyPrefix: this.keyPrefix,
      scope: this.scope,
      createdByFk: this.createdByFk,
      lastUsedAt: this.lastUsedAt,
      expiresAt: this.expiresAt,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Generate a new API key
   * Format: livo_<32 random hex chars> = 37 chars total
   */
  static generateKey() {
    const randomPart = crypto.randomBytes(16).toString('hex'); // 32 chars
    return `livo_${randomPart}`;
  }

  /**
   * Create a new API key
   * Returns the plain key ONLY on creation (never stored)
   */
  static async create({ name, scope = 'provisioning', createdByFk = null, expiresAt = null }) {
    const plainKey = ApiKey.generateKey();
    const keyPrefix = plainKey.substring(0, 12); // "livo_a1b2..."

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const keyHash = await bcrypt.hash(plainKey, saltRounds);

    const query = `
      INSERT INTO public.api_keys (name, key_hash, key_prefix, scope, created_by_fk, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await database.query(query, [
      name,
      keyHash,
      keyPrefix,
      scope,
      createdByFk,
      expiresAt
    ]);

    const apiKey = new ApiKey(result.rows[0]);

    // Return both the model and the plain key (only time it's available)
    return {
      apiKey,
      plainKey
    };
  }

  /**
   * Find all active API keys
   */
  static async findAll({ scope = null, includeInactive = false } = {}) {
    let query = 'SELECT * FROM public.api_keys WHERE 1=1';
    const params = [];

    if (!includeInactive) {
      query += ' AND active = true';
    }

    if (scope) {
      params.push(scope);
      query += ` AND scope = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await database.query(query, params);
    return result.rows.map(row => new ApiKey(row));
  }

  /**
   * Find API key by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM public.api_keys WHERE id = $1';
    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new ApiKeyNotFoundError(`ID: ${id}`);
    }

    return new ApiKey(result.rows[0]);
  }

  /**
   * Validate an API key and return the matching key if valid
   * Also updates last_used_at
   */
  static async validate(plainKey, requiredScope = null) {
    if (!plainKey || !plainKey.startsWith('livo_')) {
      return null;
    }

    const keyPrefix = plainKey.substring(0, 12);

    // Find all active keys with matching prefix
    const query = `
      SELECT * FROM public.api_keys
      WHERE key_prefix = $1
        AND active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const result = await database.query(query, [keyPrefix]);

    // Check each potential match
    for (const row of result.rows) {
      const isValid = await bcrypt.compare(plainKey, row.key_hash);

      if (isValid) {
        // Check scope if required
        if (requiredScope && row.scope !== requiredScope) {
          return null;
        }

        // Update last_used_at
        await database.query(
          'UPDATE public.api_keys SET last_used_at = NOW() WHERE id = $1',
          [row.id]
        );

        return new ApiKey(row);
      }
    }

    return null;
  }

  /**
   * Revoke (soft delete) an API key
   */
  static async revoke(id) {
    const query = `
      UPDATE public.api_keys
      SET active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new ApiKeyNotFoundError(`ID: ${id}`);
    }

    return new ApiKey(result.rows[0]);
  }

  /**
   * Update API key metadata (name, expires_at)
   */
  static async update(id, { name, expiresAt }) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }

    if (expiresAt !== undefined) {
      updates.push(`expires_at = $${paramIndex++}`);
      params.push(expiresAt);
    }

    if (updates.length === 0) {
      return ApiKey.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE public.api_keys
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, params);

    if (result.rows.length === 0) {
      throw new ApiKeyNotFoundError(`ID: ${id}`);
    }

    return new ApiKey(result.rows[0]);
  }

  /**
   * Count active API keys
   */
  static async count({ scope = null } = {}) {
    let query = 'SELECT COUNT(*) as count FROM public.api_keys WHERE active = true';
    const params = [];

    if (scope) {
      params.push(scope);
      query += ` AND scope = $${params.length}`;
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = {
  ApiKey,
  ApiKeyNotFoundError
};
