const database = require('../db/database');

/**
 * TQEmailTemplate Model (TQ-Specific)
 * Manages email templates for TQ application in tenant schema
 *
 * Structure: One template per type per tenant (quote, prevention)
 * - No locale field (determined by tenant timezone at send time)
 * - template_type field distinguishes between quote and prevention emails
 * - Subject and body with template variables ($quoteNumber$, $patientName$, etc.)
 * - Settings JSONB for customizable options (CTA text, contact info, toggles)
 */
class TQEmailTemplate {
  constructor(data) {
    this.id = data.id;
    this.subject = data.subject;
    this.body = data.body;
    this.settings = data.settings || {};
    this.templateType = data.template_type || 'quote';
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Ensure template_type column exists (self-migration for existing tenants)
   * @param {string} schema - Tenant schema name
   */
  static async ensureTemplateTypeColumn(schema) {
    try {
      await database.query(`
        ALTER TABLE ${schema}.tq_email_template
        ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) NOT NULL DEFAULT 'quote'
      `);
    } catch (err) {
      // 42701 = duplicate_column (concurrent migration), safe to ignore
      if (err.code !== '42701') throw err;
    }
  }

  /**
   * Find email template by type for tenant
   * @param {string} schema - Tenant schema name
   * @param {string} templateType - Template type ('quote' or 'prevention')
   * @returns {Promise<TQEmailTemplate|null>}
   */
  static async findByType(schema, templateType = 'quote') {
    if (!schema) {
      throw new Error('Schema is required');
    }

    try {
      const result = await database.query(
        `SELECT * FROM ${schema}.tq_email_template WHERE template_type = $1 LIMIT 1`,
        [templateType]
      );
      return result.rows.length > 0 ? new TQEmailTemplate(result.rows[0]) : null;
    } catch (err) {
      // 42703 = undefined_column - column doesn't exist yet, self-migrate
      if (err.code === '42703') {
        await this.ensureTemplateTypeColumn(schema);
        const result = await database.query(
          `SELECT * FROM ${schema}.tq_email_template WHERE template_type = $1 LIMIT 1`,
          [templateType]
        );
        return result.rows.length > 0 ? new TQEmailTemplate(result.rows[0]) : null;
      }
      throw err;
    }
  }

  /**
   * Backward-compatible alias for findByType with 'quote'
   * @param {string} schema - Tenant schema name
   * @returns {Promise<TQEmailTemplate|null>}
   */
  static async find(schema) {
    return this.findByType(schema, 'quote');
  }

  /**
   * Create or update email template (upsert) by type
   * @param {Object} data - Template data
   * @param {string} data.subject - Email subject with variables
   * @param {string} data.body - Email body with variables
   * @param {Object} data.settings - Template settings (optional)
   * @param {string} schema - Tenant schema name
   * @param {string} templateType - Template type ('quote' or 'prevention')
   * @returns {Promise<TQEmailTemplate>}
   */
  static async upsert(data, schema, templateType = 'quote') {
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

    // Validate $PUBLIC_LINK$ presence (mandatory for document link emails)
    if (!body.includes('$PUBLIC_LINK$')) {
      throw new Error('Template body must contain $PUBLIC_LINK$ variable');
    }

    // Validate $PASSWORD_BLOCK$ presence (mandatory for password display)
    if (!body.includes('$PASSWORD_BLOCK$')) {
      throw new Error('Template body must contain $PASSWORD_BLOCK$ variable');
    }

    // Check if template exists for this type
    const existing = await this.findByType(schema, templateType);

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
      // Ensure column exists before insert
      await this.ensureTemplateTypeColumn(schema);
      // Insert new template
      query = `
        INSERT INTO ${schema}.tq_email_template (subject, body, settings, template_type)
        VALUES ($1, $2, $3::jsonb, $4)
        RETURNING *
      `;
      params = [
        subject.trim(),
        body.trim(),
        JSON.stringify(settings || {}),
        templateType
      ];
    }

    const result = await database.query(query, params);
    return new TQEmailTemplate(result.rows[0]);
  }

  /**
   * Update only settings (preserves subject/body)
   * @param {Object} settings - New settings object
   * @param {string} schema - Tenant schema name
   * @param {string} templateType - Template type ('quote' or 'prevention')
   * @returns {Promise<TQEmailTemplate>}
   */
  static async updateSettings(settings, schema, templateType = 'quote') {
    if (!schema) {
      throw new Error('Schema is required');
    }

    const existing = await this.findByType(schema, templateType);
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
   * Get default template content by locale and type
   * @param {string} locale - Locale code (e.g., 'pt-BR', 'en-US')
   * @param {string} templateType - Template type ('quote' or 'prevention')
   * @returns {Object} Default template data { subject, body }
   */
  static getDefaultTemplate(locale, templateType = 'quote') {
    const defaults = {
      quote: {
        'pt-BR': {
          subject: 'Cotação $quoteNumber$ - $clinicName$',
          body: `Olá $patientName$,

Sua cotação está disponível para visualização online.

$PUBLIC_LINK$

$PASSWORD_BLOCK$`
        },
        'en-US': {
          subject: 'Quote $quoteNumber$ - $clinicName$',
          body: `Hello $patientName$,

Your quote is now available for online viewing.

$PUBLIC_LINK$

$PASSWORD_BLOCK$`
        }
      },
      prevention: {
        'pt-BR': {
          subject: 'Plano Preventivo $preventionNumber$ - $clinicName$',
          body: `Olá $patientName$,

Seu plano preventivo está disponível para visualização online.

$PUBLIC_LINK$

$PASSWORD_BLOCK$`
        },
        'en-US': {
          subject: 'Prevention Plan $preventionNumber$ - $clinicName$',
          body: `Hello $patientName$,

Your prevention plan is now available for online viewing.

$PUBLIC_LINK$

$PASSWORD_BLOCK$`
        }
      }
    };

    const typeDefaults = defaults[templateType] || defaults.quote;
    return typeDefaults[locale] || typeDefaults['en-US'];
  }

  /**
   * Get default settings by locale and type
   * @param {string} locale - Locale code (e.g., 'pt-BR', 'en-US')
   * @param {string} templateType - Template type ('quote' or 'prevention')
   * @returns {Object} Default settings
   */
  static getDefaultSettings(locale, templateType = 'quote') {
    const ctaText = {
      quote: { 'pt-BR': 'Ver Cotação', 'en-US': 'View Quote' },
      prevention: { 'pt-BR': 'Ver Plano Preventivo', 'en-US': 'View Prevention Plan' }
    };

    const typeCta = ctaText[templateType] || ctaText.quote;

    return {
      ctaButtonText: typeCta[locale] || typeCta['en-US'],
      showLogo: true,
      headerText: '',
      headerColor: 'primary-gradient',
      headerTextColor: 'white',
      buttonColor: 'primary-gradient',
      buttonTextColor: 'white',
      showEmail: true,
      showPhone: true,
      showAddress: true,
      showSocialLinks: true
    };
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      body: this.body,
      settings: this.settings,
      templateType: this.templateType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TQEmailTemplate;
