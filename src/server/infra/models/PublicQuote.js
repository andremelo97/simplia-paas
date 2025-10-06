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
    this.tenantId = data.tenant_id;
    this.quoteId = data.quote_id;
    this.templateId = data.template_id;
    this.accessToken = data.access_token;
    this.publicUrl = data.public_url;
    this.content = data.content; // Resolved Puck content
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
        content: data.quote_content,
        total: parseFloat(data.quote_total || 0),
        status: data.quote_status,
        sessionId: data.quote_session_id
      };
      
      // Include patient data nested in quote if available
      if (data.patient_first_name || data.patient_last_name) {
        this.quote.patient = {
          id: data.session_patient_id,
          firstName: data.patient_first_name,
          lastName: data.patient_last_name,
          email: data.patient_email
        };
      }
    }

    // Include template data if joined
    if (data.template_name) {
      this.template = {
        id: data.template_id,
        name: data.template_name,
        content: data.template_content
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
   * Generate a secure random password for public quote access
   * Returns 8-character base64url encoded string (e.g., "aB3xZ9Qr")
   */
  static generatePassword() {
    return crypto.randomBytes(6).toString('base64url');
  }

  /**
   * Hash a password for storage
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Create a new public quote link
   */
  static async create(schema, data) {
    const {
      tenantId,
      quoteId,
      templateId = null,
      accessToken = null, // Accept pre-generated token
      publicUrl = null,
      content = null, // Resolved Puck content
      password = null,
      active = true,
      expiresAt = null
    } = data;

    const finalAccessToken = accessToken || this.generateAccessToken();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO ${schema}.public_quote (
        tenant_id,
        quote_id,
        template_id,
        access_token,
        public_url,
        content,
        password_hash,
        active,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      quoteId,
      templateId,
      finalAccessToken,
      publicUrl,
      content ? JSON.stringify(content) : null,
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
      tenantId: this.tenantId,
      quoteId: this.quoteId,
      templateId: this.templateId,
      accessToken: this.accessToken,
      publicUrl: this.publicUrl,
      content: this.content, // Resolved Puck content
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
