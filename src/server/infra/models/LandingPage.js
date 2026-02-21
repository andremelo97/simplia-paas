const database = require('../db/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { encryptSecret, decryptSecret } = require('../utils/secretEncryption');

class LandingPageNotFoundError extends Error {
  constructor(message) {
    super(`Landing page not found: ${message}`);
    this.name = 'LandingPageNotFoundError';
  }
}

class LandingPage {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.tenantId = data.tenant_id;
    this.documentId = data.document_id;
    this.documentType = data.document_type || 'quote';
    this.templateId = data.template_id;
    this.accessToken = data.access_token;
    this.publicUrl = data.public_url;
    this.content = data.content; // Resolved Puck content
    this.passwordHash = data.password_hash;
    this.passwordEncrypted = data.password_encrypted;
    this.viewsCount = data.views_count || 0;
    this.lastViewedAt = data.last_viewed_at;
    this.active = data.active !== false;
    this.expiresAt = data.expires_at;

    // Include quote data if joined (for document_type = 'quote')
    if (data.quote_number) {
      this.quote = {
        id: data.document_id,
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

    // Include prevention data if joined (for document_type = 'prevention')
    if (data.prevention_number) {
      this.prevention = {
        id: data.document_id,
        number: data.prevention_number,
        content: data.prevention_content,
        status: data.prevention_status,
        sessionId: data.prevention_session_id
      };

      // Include patient data nested in prevention if available
      if (data.patient_first_name || data.patient_last_name) {
        this.prevention.patient = {
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
   * Generate a secure random password for landing page access
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
   * Create a new landing page link
   */
  static async create(schema, data) {
    const {
      tenantId,
      documentId,
      documentType = 'quote',
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
    const passwordEncrypted = password ? encryptSecret(password) : null;

    const query = `
      INSERT INTO ${schema}.landing_page (
        tenant_id,
        document_id,
        document_type,
        template_id,
        access_token,
        public_url,
        content,
        password_hash,
        password_encrypted,
        active,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      documentId,
      documentType,
      templateId,
      finalAccessToken,
      publicUrl,
      content ? JSON.stringify(content) : null,
      passwordHash,
      passwordEncrypted,
      active,
      expiresAt
    ]);

    return new LandingPage(result.rows[0]);
  }

  /**
   * Find landing page by access token (simple lookup)
   */
  static async findByToken(accessToken, schema) {
    const query = `SELECT * FROM ${schema}.landing_page WHERE access_token = $1 AND active = true`;
    const result = await database.query(query, [accessToken]);

    if (result.rows.length === 0) {
      throw new LandingPageNotFoundError(`token: ${accessToken}`);
    }

    return new LandingPage(result.rows[0]);
  }

  /**
   * Find landing page by access token with full document data (includes patient, template)
   * Supports both quote and prevention document types
   */
  static async findByTokenWithDocumentData(accessToken, schema) {
    // First, get the landing page to check document_type
    const lpQuery = `SELECT * FROM ${schema}.landing_page WHERE access_token = $1 AND active = true`;
    const lpResult = await database.query(lpQuery, [accessToken]);

    if (lpResult.rows.length === 0) {
      throw new LandingPageNotFoundError(`token: ${accessToken}`);
    }

    const landingPage = lpResult.rows[0];

    if (landingPage.document_type === 'prevention') {
      // Query for prevention document
      const query = `
        SELECT
          lp.*,
          prv.number as prevention_number,
          prv.content as prevention_content,
          prv.status as prevention_status,
          prv.session_id as prevention_session_id,
          s.patient_id as session_patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.email as patient_email,
          t.name as template_name,
          t.content as template_content
        FROM ${schema}.landing_page lp
        INNER JOIN ${schema}.prevention prv ON lp.document_id = prv.id
        INNER JOIN ${schema}.session s ON prv.session_id = s.id
        INNER JOIN ${schema}.patient p ON s.patient_id = p.id
        LEFT JOIN ${schema}.landing_page_template t ON lp.template_id = t.id
        WHERE lp.access_token = $1 AND lp.active = true
      `;

      const result = await database.query(query, [accessToken]);

      if (result.rows.length === 0) {
        throw new LandingPageNotFoundError(`token: ${accessToken}`);
      }

      return new LandingPage(result.rows[0]);
    } else {
      // Query for quote document (default)
      const query = `
        SELECT
          lp.*,
          q.number as quote_number,
          q.content as quote_content,
          q.total as quote_total,
          q.status as quote_status,
          q.session_id as quote_session_id,
          s.patient_id as session_patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.email as patient_email,
          t.name as template_name,
          t.content as template_content
        FROM ${schema}.landing_page lp
        INNER JOIN ${schema}.quote q ON lp.document_id = q.id
        INNER JOIN ${schema}.session s ON q.session_id = s.id
        INNER JOIN ${schema}.patient p ON s.patient_id = p.id
        LEFT JOIN ${schema}.landing_page_template t ON lp.template_id = t.id
        WHERE lp.access_token = $1 AND lp.active = true
      `;

      const result = await database.query(query, [accessToken]);

      if (result.rows.length === 0) {
        throw new LandingPageNotFoundError(`token: ${accessToken}`);
      }

      return new LandingPage(result.rows[0]);
    }
  }

  /**
   * Find all landing page links for a specific document
   */
  static async findByDocumentId(documentId, schema, documentType = 'quote') {
    const query = `
      SELECT * FROM ${schema}.landing_page
      WHERE document_id = $1 AND document_type = $2 AND active = true
      ORDER BY created_at DESC
    `;
    const result = await database.query(query, [documentId, documentType]);

    return result.rows.map(row => new LandingPage(row));
  }

  /**
   * Find landing page by ID
   */
  static async findById(id, schema) {
    const query = `SELECT * FROM ${schema}.landing_page WHERE id = $1`;
    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new LandingPageNotFoundError(`id: ${id}`);
    }

    return new LandingPage(result.rows[0]);
  }

  /**
   * Delete landing page by ID
   */
  static async deleteById(id, schema) {
    const query = `DELETE FROM ${schema}.landing_page WHERE id = $1 RETURNING *`;
    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new LandingPageNotFoundError(`id: ${id}`);
    }

    return new LandingPage(result.rows[0]);
  }

  /**
   * Verify password for protected landing page
   * Returns true if no password set or password matches
   */
  async verifyPassword(password) {
    if (!this.passwordHash) {
      return true; // No password protection
    }

    return await bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Get the decrypted plaintext password (for display/resend)
   */
  getDecryptedPassword() {
    if (!this.passwordEncrypted) return null;
    return decryptSecret(this.passwordEncrypted);
  }

  /**
   * Increment view count and update last viewed timestamp
   */
  async incrementViews(schema) {
    const query = `
      UPDATE ${schema}.landing_page
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
   * Revoke landing page link (soft delete)
   */
  async revoke(schema) {
    const query = `
      UPDATE ${schema}.landing_page
      SET active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [this.id]);

    if (result.rows.length === 0) {
      throw new LandingPageNotFoundError(`id: ${this.id}`);
    }

    this.active = false;
    return this;
  }

  /**
   * Check if landing page link is expired
   */
  isExpired() {
    if (!this.expiresAt) {
      return false; // No expiration set
    }
    return new Date(this.expiresAt) < new Date();
  }

  /**
   * Check if landing page link is accessible (active and not expired)
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
      documentId: this.documentId,
      documentType: this.documentType,
      templateId: this.templateId,
      accessToken: this.accessToken,
      publicUrl: this.publicUrl,
      content: this.content, // Resolved Puck content
      viewsCount: this.viewsCount,
      lastViewedAt: this.lastViewedAt,
      active: this.active,
      expiresAt: this.expiresAt,
      hasPassword: !!this.passwordHash,
      password: this.getDecryptedPassword(),
      isExpired: this.isExpired(),
      isAccessible: this.isAccessible()
    };

    // Include quote data if available
    if (this.quote) {
      result.quote = this.quote;
    }

    // Include prevention data if available
    if (this.prevention) {
      result.prevention = this.prevention;
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

module.exports = { LandingPage, LandingPageNotFoundError };
