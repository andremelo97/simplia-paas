const database = require('../db/database');

/**
 * TQEmailTemplate Model (TQ-Specific)
 * Manages email template for TQ application in tenant schema
 *
 * Structure: Single template per tenant
 * - No locale field (determined by tenant timezone at send time)
 * - No template_type field (TQ only has 1 email type: public quote link)
 * - Subject and body with template variables ({{quoteNumber}}, {{patientName}}, etc.)
 */
class TQEmailTemplate {
  constructor(data) {
    this.id = data.id;
    this.subject = data.subject;
    this.body = data.body;
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
   * @param {string} schema - Tenant schema name
   * @returns {Promise<TQEmailTemplate>}
   */
  static async upsert(data, schema) {
    if (!schema) {
      throw new Error('Schema is required');
    }

    const { subject, body } = data;

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
        SET subject = $1, body = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      params = [subject.trim(), body.trim(), existing.id];
    } else {
      // Insert new template
      query = `
        INSERT INTO ${schema}.tq_email_template (subject, body)
        VALUES ($1, $2)
        RETURNING *
      `;
      params = [subject.trim(), body.trim()];
    }

    const result = await database.query(query, params);
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

---

📋 ACESSE SUA COTAÇÃO:
$PUBLIC_LINK$

---

🔒 SENHA DE ACESSO:
$PASSWORD_BLOCK$

---

Se tiver alguma dúvida, entre em contato conosco.

Atenciosamente,
$clinicName$`
      },
      'en-US': {
        subject: 'Quote $quoteNumber$ - $clinicName$',
        body: `Hello $patientName$,

Your quote $quoteNumber$ is now available for online viewing.

---

📋 ACCESS YOUR QUOTE:
$PUBLIC_LINK$

---

🔒 ACCESS PASSWORD:
$PASSWORD_BLOCK$

---

If you have any questions, please contact us.

Best regards,
$clinicName$`
      }
    };

    return defaults[locale] || defaults['en-US'];
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      body: this.body,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TQEmailTemplate;
