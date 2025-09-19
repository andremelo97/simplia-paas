const database = require('../db/database');

class PlatformLoginAudit {
  constructor(data) {
    this.id = data.id;
    this.userIdFk = data.user_id_fk;
    this.email = data.email;
    this.ipAddress = data.ip_address;
    this.userAgent = data.user_agent;
    this.success = data.success;
    this.reason = data.reason;
    this.createdAt = data.created_at;
  }

  /**
   * Log platform login attempt
   */
  static async logAttempt(data) {
    const { userIdFk, email, ipAddress, userAgent, success, reason } = data;

    const query = `
      INSERT INTO platform_login_audit (
        user_id_fk, email, ip_address, user_agent, success, reason
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await database.query(query, [
      userIdFk || null,
      email,
      ipAddress || null,
      userAgent || null,
      success,
      reason || null
    ]);

    return new PlatformLoginAudit(result.rows[0]);
  }

  /**
   * Get audit logs by email
   */
  static async getByEmail(email, limit = 50) {
    const query = `
      SELECT * FROM platform_login_audit
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await database.query(query, [email, limit]);
    return result.rows.map(row => new PlatformLoginAudit(row));
  }

  /**
   * Get recent failed attempts
   */
  static async getRecentFailedAttempts(email, minutesAgo = 15) {
    const query = `
      SELECT COUNT(*) as count
      FROM platform_login_audit
      WHERE email = $1
        AND success = false
        AND created_at > NOW() - INTERVAL '${minutesAgo} minutes'
    `;

    const result = await database.query(query, [email]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = PlatformLoginAudit;