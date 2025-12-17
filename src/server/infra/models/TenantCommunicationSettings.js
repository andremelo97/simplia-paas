const database = require('../db/database');
const { encryptSecret, decryptSecret } = require('../utils/secretEncryption');

/**
 * TenantCommunicationSettings Model
 * Manages communication configuration (SMTP, etc) for sending emails per tenant
 */
class TenantCommunicationSettings {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id_fk;
    this.smtpHost = data.smtp_host;
    this.smtpPort = data.smtp_port;
    this.smtpSecure = data.smtp_secure;
    this.smtpUsername = data.smtp_username;
    this.smtpPassword = data.smtp_password;
    this.smtpFromEmail = data.smtp_from_email;
    this.smtpFromName = data.smtp_from_name;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Get communication settings for a tenant
   * @param {number} tenantId - Tenant ID
   * @returns {Promise<TenantCommunicationSettings|null>}
   */
  static async findByTenantId(tenantId) {
    const result = await database.query(
      'SELECT * FROM tenant_communication_settings WHERE tenant_id_fk = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = { ...result.rows[0] };
    if (row.smtp_password) {
      row.smtp_password = decryptSecret(row.smtp_password);
    }

    return new TenantCommunicationSettings(row);
  }

  /**
   * Create or update communication settings for a tenant (upsert)
   * @param {number} tenantId - Tenant ID
   * @param {Object} data - Communication configuration data
   * @returns {Promise<TenantCommunicationSettings>}
   */
  static async upsert(tenantId, data) {
    const {
      smtpHost,
      smtpPort = 587,
      smtpSecure = true,
      smtpUsername,
      smtpPassword,
      smtpFromEmail,
      smtpFromName = null
    } = data;

    // Validate required fields
    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromEmail) {
      throw new Error('Missing required SMTP fields: smtpHost, smtpUsername, smtpPassword, smtpFromEmail');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(smtpFromEmail)) {
      throw new Error('Invalid email format for smtpFromEmail');
    }

    // Validate port number
    if (smtpPort < 1 || smtpPort > 65535) {
      throw new Error('SMTP port must be between 1 and 65535');
    }

    const query = `
      INSERT INTO tenant_communication_settings (
        tenant_id_fk,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_username,
        smtp_password,
        smtp_from_email,
        smtp_from_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id_fk)
      DO UPDATE SET
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_secure = EXCLUDED.smtp_secure,
        smtp_username = EXCLUDED.smtp_username,
        smtp_password = EXCLUDED.smtp_password,
        smtp_from_email = EXCLUDED.smtp_from_email,
        smtp_from_name = EXCLUDED.smtp_from_name,
        updated_at = NOW()
      RETURNING *
    `;

    let encryptedPassword;
    try {
      encryptedPassword = encryptSecret(smtpPassword);
    } catch (error) {
      console.error('[TenantCommunicationSettings] Failed to encrypt SMTP password:', error);
      throw new Error('Failed to encrypt SMTP password');
    }

    const result = await database.query(query, [
      tenantId,
      smtpHost.trim(),
      smtpPort,
      smtpSecure,
      smtpUsername.trim(),
      encryptedPassword,
      smtpFromEmail.toLowerCase().trim(),
      smtpFromName ? smtpFromName.trim() : null
    ]);

    const savedRow = { ...result.rows[0] };
    if (savedRow.smtp_password) {
      savedRow.smtp_password = decryptSecret(savedRow.smtp_password);
    }

    return new TenantCommunicationSettings(savedRow);
  }

  /**
   * Delete communication settings for a tenant
   * @param {number} tenantId - Tenant ID
   * @returns {Promise<boolean>}
   */
  static async delete(tenantId) {
    const result = await database.query(
      'DELETE FROM tenant_communication_settings WHERE tenant_id_fk = $1',
      [tenantId]
    );

    return result.rowCount > 0;
  }

  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      smtpHost: this.smtpHost,
      smtpPort: this.smtpPort,
      smtpSecure: this.smtpSecure,
      smtpUsername: this.smtpUsername,
      smtpPassword: this.smtpPassword, // Note: Password is returned decrypted for client usage
      smtpFromEmail: this.smtpFromEmail,
      smtpFromName: this.smtpFromName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TenantCommunicationSettings;
