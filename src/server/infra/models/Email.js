const database = require('../db/database');

/**
 * Email Model (Generic - Used by all apps)
 * Manages email sending audit log in public.email_log table
 *
 * Purpose: Track all emails sent across applications for audit, troubleshooting, and analytics
 * Used by: TQ, CRM, Automation, and any future apps
 */
class Email {
  constructor(data) {
    this.id = data.id;
    this.tenantIdFk = data.tenant_id_fk;
    this.appName = data.app_name;
    this.recipientEmail = data.recipient_email;
    this.subject = data.subject;
    this.body = data.body;
    this.status = data.status;
    this.sentAt = data.sent_at;
    this.errorMessage = data.error_message;
    this.metadata = data.metadata;
  }

  /**
   * Log email send attempt (success or failure)
   * @param {Object} data - Email log data
   * @param {number} data.tenantId - Tenant ID
   * @param {string} data.appName - Application name ('tq', 'crm', etc.)
   * @param {string} data.recipientEmail - Recipient email address
   * @param {string} data.subject - Email subject (with resolved variables)
   * @param {string} data.body - Email body HTML (with resolved variables)
   * @param {string} [data.status='sent'] - Delivery status (sent, failed, bounced)
   * @param {string} [data.errorMessage] - Error message if failed
   * @param {Object} [data.metadata] - App-specific metadata (quote_id, patient_id, etc.)
   * @returns {Promise<Email>}
   */
  static async log(data) {
    const {
      tenantId,
      appName,
      recipientEmail,
      subject,
      body,
      status = 'sent',
      errorMessage = null,
      metadata = null
    } = data;

    // Validate required fields
    if (!tenantId || !appName || !recipientEmail || !subject || !body) {
      throw new Error('Missing required fields: tenantId, appName, recipientEmail, subject, body');
    }

    const query = `
      INSERT INTO public.email_log (
        tenant_id_fk,
        app_name,
        recipient_email,
        subject,
        body,
        status,
        error_message,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      appName,
      recipientEmail,
      subject,
      body,
      status,
      errorMessage,
      metadata ? JSON.stringify(metadata) : null
    ]);

    return new Email(result.rows[0]);
  }

  /**
   * Find email logs by tenant
   * @param {number} tenantId - Tenant ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=50] - Max results
   * @param {number} [options.offset=0] - Offset for pagination
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.appName] - Filter by app name
   * @returns {Promise<Email[]>}
   */
  static async findByTenant(tenantId, options = {}) {
    const { limit = 50, offset = 0, status, appName } = options;

    let query = `
      SELECT * FROM public.email_log
      WHERE tenant_id_fk = $1
    `;

    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (appName) {
      query += ` AND app_name = $${paramIndex}`;
      params.push(appName);
      paramIndex++;
    }

    query += ` ORDER BY sent_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Email(row));
  }

  /**
   * Find email logs by status (useful for retry logic)
   * @param {string} status - Status to filter ('sent', 'failed', 'bounced')
   * @param {number} [limit=100] - Max results
   * @returns {Promise<Email[]>}
   */
  static async findByStatus(status, limit = 100) {
    const query = `
      SELECT * FROM public.email_log
      WHERE status = $1
      ORDER BY sent_at DESC
      LIMIT $2
    `;

    const result = await database.query(query, [status, limit]);
    return result.rows.map(row => new Email(row));
  }

  /**
   * Get email statistics for tenant
   * @param {number} tenantId - Tenant ID
   * @param {string} [appName] - Optional app name filter
   * @returns {Promise<Object>} Statistics object { total, sent, failed, bounced }
   */
  static async getStatsByTenant(tenantId, appName = null) {
    let query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced
      FROM public.email_log
      WHERE tenant_id_fk = $1
    `;

    const params = [tenantId];

    if (appName) {
      query += ` AND app_name = $2`;
      params.push(appName);
    }

    const result = await database.query(query, params);
    return result.rows[0];
  }

  toJSON() {
    return {
      id: this.id,
      tenantIdFk: this.tenantIdFk,
      appName: this.appName,
      recipientEmail: this.recipientEmail,
      subject: this.subject,
      body: this.body,
      status: this.status,
      sentAt: this.sentAt,
      errorMessage: this.errorMessage,
      metadata: this.metadata
    };
  }
}

module.exports = Email;
