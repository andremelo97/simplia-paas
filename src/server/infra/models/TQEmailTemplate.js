const database = require('../db/database');

/**
 * TQEmailTemplate Model (TQ-Specific)
 * Manages email template for TQ application in tenant schema
 *
 * Structure: Single template per tenant
 * - No locale field (determined by tenant timezone at send time)
 * - No template_type field (TQ only has 1 email type: public quote link)
 * - Subject and body with template variables ($quoteNumber$, $patientName$, etc.)
 * - Settings JSONB for customizable options (CTA text, contact info, toggles)
 */
class TQEmailTemplate {
  constructor(data) {
    this.id = data.id;
    this.subject = data.subject;
    this.body = data.body;
    this.settings = data.settings || {};
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find the email template for tenant (only 1 per tenant)
   * @param {string} schema - Tenant schema name
   * @returns {Promise<TQEmailTemplate|null>}
   */
  static async find(schema) {
    if (!schema) {
      throw new Error('Schema is required');
    }

    const result = await database.query(
      `SELECT * FROM ${schema}.tq_email_template LIMIT 1`
    );

    return result.rows.length > 0 ? new TQEmailTemplate(result.rows[0]) : null;
  }

  /**
   * Create or update email template (upsert)
   * @param {Object} data - Template data
   * @param {string} data.subject - Email subject with variables
   * @param {string} data.body - Email body with variables
   * @param {Object} data.settings - Template settings (optional)
   * @param {string} schema - Tenant schema name
   * @returns {Promise<TQEmailTemplate>}
   */
  static async upsert(data, schema) {
    if (!schema) {
      throw new Error('Schema is required');
    }

    const { subject, body, settings } = data;

    // Validate required fields
    if (!subject || typeof subject !== 'string') {
      throw new Error('Subject is required and must be a string');
    }

    if (!body || typeof body !== 'string') {
      throw new Error('Body is required and must be a string');
    }

    // Validate $PUBLIC_LINK$ presence (mandatory for public quote emails)
    if (!body.includes('$PUBLIC_LINK$')) {
      throw new Error('Template body must contain $PUBLIC_LINK$ variable');
    }

    // Validate $PASSWORD_BLOCK$ presence (mandatory for password display)
    if (!body.includes('$PASSWORD_BLOCK$')) {
      throw new Error('Template body must contain $PASSWORD_BLOCK$ variable');
    }

    // Check if template exists
    const existing = await this.find(schema);

    let query;
    let params;

    if (existing) {
      // Update existing template
      query = `
        UPDATE ${schema}.tq_email_template
        SET subject = $1, body = $2, settings = $3::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      params = [
        subject.trim(),
        body.trim(),
        JSON.stringify(settings || existing.settings || {}),
        existing.id
      ];
    } else {
      // Insert new template
      query = `
        INSERT INTO ${schema}.tq_email_template (subject, body, settings)
        VALUES ($1, $2, $3::jsonb)
        RETURNING *
      `;
      params = [
        subject.trim(),
        body.trim(),
        JSON.stringify(settings || {})
      ];
    }

    const result = await database.query(query, params);
    return new TQEmailTemplate(result.rows[0]);
  }

  /**
   * Update only settings (preserves subject/body)
   * @param {Object} settings - New settings object
   * @param {string} schema - Tenant schema name
   * @returns {Promise<TQEmailTemplate>}
   */
  static async updateSettings(settings, schema) {
    if (!schema) {
      throw new Error('Schema is required');
    }

    const existing = await this.find(schema);
    if (!existing) {
      throw new Error('Email template not found');
    }

    const query = `
      UPDATE ${schema}.tq_email_template
      SET settings = $1::jsonb, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await database.query(query, [
      JSON.stringify(settings),
      existing.id
    ]);

    return new TQEmailTemplate(result.rows[0]);
  }

  /**
   * Get default template content by locale
   * Used for seeding during tenant provisioning
   * @param {string} locale - Locale code (e.g., 'pt-BR', 'en-US')
   * @returns {Object} Default template data { subject, body }
   */
  static getDefaultTemplate(locale) {
    const defaults = {
      'pt-BR': {
        subject: 'Cotação $quoteNumber$ - $clinicName$',
        body: `Olá $patientName$,

Sua cotação $quoteNumber$ está disponível para visualização online.

$PUBLIC_LINK$

$PASSWORD_BLOCK$`
      },
      'en-US': {
        subject: 'Quote $quoteNumber$ - $clinicName$',
        body: `Hello $patientName$,

Your quote $quoteNumber$ is now available for online viewing.

$PUBLIC_LINK$

$PASSWORD_BLOCK$`
      }
    };

    return defaults[locale] || defaults['en-US'];
  }

  /**
   * Get default settings by locale
   * Used for seeding during tenant provisioning
   * @param {string} locale - Locale code (e.g., 'pt-BR', 'en-US')
   * @returns {Object} Default settings
   */
  static getDefaultSettings(locale) {
    const defaults = {
      'pt-BR': {
        ctaButtonText: 'Ver Cotação',
        showLogo: true,
        showSocialLinks: false,
        showAddress: false,
        showPhone: false,
        // Contact info fields
        address: '',
        phone: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          linkedin: '',
          website: ''
        },
        headerColor: 'primary-gradient',
        headerTextColor: 'white',
        buttonColor: 'primary-gradient',
        buttonTextColor: 'white'
      },
      'en-US': {
        ctaButtonText: 'View Quote',
        showLogo: true,
        showSocialLinks: false,
        showAddress: false,
        showPhone: false,
        // Contact info fields
        address: '',
        phone: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          linkedin: '',
          website: ''
        },
        headerColor: 'primary-gradient',
        headerTextColor: 'white',
        buttonColor: 'primary-gradient',
        buttonTextColor: 'white'
      }
    };

    return defaults[locale] || defaults['en-US'];
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      body: this.body,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TQEmailTemplate;
