const database = require('../db/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class PublicQuoteNotFoundError extends Error {
  constructor(message) {
    super(`Public quote not found: ${message}`);
    this.name = 'PublicQuoteNotFoundError';
  }
}

class PublicQuote {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.quoteId = data.quote_id;
    this.templateId = data.template_id;
    this.accessToken = data.access_token;
    this.passwordHash = data.password_hash;
    this.viewsCount = data.views_count || 0;
    this.lastViewedAt = data.last_viewed_at;
    this.active = data.active !== false;
    this.expiresAt = data.expires_at;

    // Include quote data if joined
    if (data.quote_number) {
      this.quote = {
        id: data.quote_id,
        number: data.quote_number,
        content: data.content,
        total: parseFloat(data.total || 0),
        status: data.status,
        sessionId: data.session_id
      };
    }

    // Include template data if joined
    if (data.template_name) {
      this.template = {
        id: data.template_id,
        name: data.template_name,
        content: data.template_content
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
  }

  /**
   * Generate a secure random access token
   */
  static generateAccessToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new public quote link
   */
  static async create(schema, data) {
    const {
      quoteId,
      templateId = null,
      password = null,
      active = true,
      expiresAt = null
    } = data;

    const accessToken = this.generateAccessToken();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO ${schema}.public_quote (
        quote_id,
        template_id,
        access_token,
        password_hash,
        active,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await database.query(query, [
      quoteId,
      templateId,
      accessToken,
      passwordHash,
      active,
      expiresAt
    ]);

    return new PublicQuote(result.rows[0]);
  }

  /**
   * Find public quote by access token (simple lookup)
   */
  static async findByToken(accessToken, schema) {
    const query = `SELECT * FROM ${schema}.public_quote WHERE access_token = $1 AND active = true`;
    const result = await database.query(query, [accessToken]);

    if (result.rows.length === 0) {
      throw new PublicQuoteNotFoundError(`token: ${accessToken}`);
    }

    return new PublicQuote(result.rows[0]);
  }

  /**
   * Find public quote by access token with full quote data (includes patient, template)
   */
  static async findByTokenWithQuoteData(accessToken, schema) {
    const query = `
      SELECT
        pq.*,
        q.number as quote_number,
        q.content,
        q.total,
        q.status,
        q.session_id,
        s.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        t.name as template_name,
        t.content as template_content
      FROM ${schema}.public_quote pq
      INNER JOIN ${schema}.quote q ON pq.quote_id = q.id
      INNER JOIN ${schema}.session s ON q.session_id = s.id
      INNER JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN ${schema}.public_quote_template t ON pq.template_id = t.id
      WHERE pq.access_token = $1 AND pq.active = true
    `;

    const result = await database.query(query, [accessToken]);

    if (result.rows.length === 0) {
      throw new PublicQuoteNotFoundError(`token: ${accessToken}`);
    }

    return new PublicQuote(result.rows[0]);
  }

  /**
   * Find all public quote links for a specific quote
   */
  static async findByQuoteId(quoteId, schema) {
    const query = `
      SELECT * FROM ${schema}.public_quote
      WHERE quote_id = $1 AND active = true
      ORDER BY created_at DESC
    `;
    const result = await database.query(query, [quoteId]);

    return result.rows.map(row => new PublicQuote(row));
  }

  /**
   * Find public quote by ID
   */
  static async findById(id, schema) {
    const query = `SELECT * FROM ${schema}.public_quote WHERE id = $1`;
    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new PublicQuoteNotFoundError(`id: ${id}`);
    }

    return new PublicQuote(result.rows[0]);
  }

  /**
   * Verify password for protected public quote
   * Returns true if no password set or password matches
   */
  async verifyPassword(password) {
    if (!this.passwordHash) {
      return true; // No password protection
    }

    return await bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Increment view count and update last viewed timestamp
   */
  async incrementViews(schema) {
    const query = `
      UPDATE ${schema}.public_quote
      SET views_count = views_count + 1,
          last_viewed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [this.id]);

    if (result.rows.length > 0) {
      // Update instance with new values
      this.viewsCount = result.rows[0].views_count;
      this.lastViewedAt = result.rows[0].last_viewed_at;
      this.updatedAt = result.rows[0].updated_at;
    }

    return this;
  }

  /**
   * Revoke public quote link (soft delete)
   */
  async revoke(schema) {
    const query = `
      UPDATE ${schema}.public_quote
      SET active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [this.id]);

    if (result.rows.length === 0) {
      throw new PublicQuoteNotFoundError(`id: ${this.id}`);
    }

    this.active = false;
    return this;
  }

  /**
   * Check if public quote link is expired
   */
  isExpired() {
    if (!this.expiresAt) {
      return false; // No expiration set
    }
    return new Date(this.expiresAt) < new Date();
  }

  /**
   * Check if public quote link is accessible (active and not expired)
   */
  isAccessible() {
    return this.active && !this.isExpired();
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    const result = {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      quoteId: this.quoteId,
      templateId: this.templateId,
      accessToken: this.accessToken,
      viewsCount: this.viewsCount,
      lastViewedAt: this.lastViewedAt,
      active: this.active,
      expiresAt: this.expiresAt,
      hasPassword: !!this.passwordHash,
      isExpired: this.isExpired(),
      isAccessible: this.isAccessible()
    };

    // Include quote data if available
    if (this.quote) {
      result.quote = this.quote;
    }

    // Include template data if available
    if (this.template) {
      result.template = this.template;
    }

    // Include patient data if available
    if (this.patient) {
      result.patient = this.patient;
    }

    return result;
  }
}

module.exports = { PublicQuote, PublicQuoteNotFoundError };
