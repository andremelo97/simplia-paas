const database = require('../config/database');

class AccessLog {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.tenantId = data.tenant_id;
    this.tenantIdFk = data.tenant_id_fk;
    this.applicationId = data.application_id;
    this.decision = data.decision;
    this.reason = data.reason;
    this.apiPath = data.api_path;
    this.ipAddress = data.ip_address;
    this.userAgent = data.user_agent;
    this.endpoint = data.endpoint;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create new access log entry
   */
  static async create(logData) {
    const {
      userId,
      tenantId,
      tenantIdFk,
      applicationId,
      decision = 'granted',
      reason,
      apiPath,
      ipAddress,
      userAgent,
      endpoint
    } = logData;

    const query = `
      INSERT INTO application_access_logs (
        user_id, tenant_id, tenant_id_fk, application_id, decision, 
        reason, api_path, ip_address, user_agent, endpoint
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await database.query(query, [
      userId,
      tenantId,
      tenantIdFk,
      applicationId,
      decision,
      reason,
      apiPath,
      ipAddress,
      userAgent,
      endpoint
    ]);

    return new AccessLog(result.rows[0]);
  }

  /**
   * Find logs by tenant with pagination
   */
  static async findByTenant(tenantIdFk, options = {}) {
    const { limit = 50, offset = 0, decision, userId, applicationId, startDate, endDate } = options;

    let query = `
      SELECT al.*, u.email as user_email, a.name as app_name, a.slug as app_slug
      FROM application_access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN applications a ON al.application_id = a.id
      WHERE al.tenant_id_fk = $1
    `;
    const params = [tenantIdFk];

    if (decision) {
      query += ` AND al.decision = $${params.length + 1}`;
      params.push(decision);
    }

    if (userId) {
      query += ` AND al.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (applicationId) {
      query += ` AND al.application_id = $${params.length + 1}`;
      params.push(applicationId);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => {
      const log = new AccessLog(row);
      if (row.user_email) log.userEmail = row.user_email;
      if (row.app_name) log.appName = row.app_name;
      if (row.app_slug) log.appSlug = row.app_slug;
      return log;
    });
  }

  /**
   * Get access statistics for a tenant
   */
  static async getStats(tenantIdFk, options = {}) {
    const { startDate, endDate, applicationId } = options;

    let query = `
      SELECT 
        decision,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT application_id) as unique_apps
      FROM application_access_logs
      WHERE tenant_id_fk = $1
    `;
    const params = [tenantIdFk];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    if (applicationId) {
      query += ` AND application_id = $${params.length + 1}`;
      params.push(applicationId);
    }

    query += ` GROUP BY decision ORDER BY count DESC`;

    const result = await database.query(query, params);
    return result.rows;
  }

  /**
   * Get most denied reasons
   */
  static async getTopDeniedReasons(tenantIdFk, options = {}) {
    const { limit = 10, startDate, endDate } = options;

    let query = `
      SELECT 
        reason,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as affected_users
      FROM application_access_logs
      WHERE tenant_id_fk = $1 AND decision = 'denied' AND reason IS NOT NULL
    `;
    const params = [tenantIdFk];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY reason ORDER BY count DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await database.query(query, params);
    return result.rows;
  }

  /**
   * Log denied access with context
   */
  static async logDenied(userId, tenantIdFk, applicationId, reason, request) {
    return await AccessLog.create({
      userId,
      tenantIdFk,
      applicationId,
      decision: 'denied',
      reason,
      apiPath: request.originalUrl,
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
      endpoint: `${request.method} ${request.route?.path || request.originalUrl}`
    });
  }

  /**
   * Log successful access
   */
  static async logGranted(userId, tenantIdFk, applicationId, request) {
    return await AccessLog.create({
      userId,
      tenantIdFk,
      applicationId,
      decision: 'granted',
      apiPath: request.originalUrl,
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
      endpoint: `${request.method} ${request.route?.path || request.originalUrl}`
    });
  }

  /**
   * Clean old logs (for GDPR compliance)
   */
  static async cleanOldLogs(daysOld = 365) {
    const query = `
      DELETE FROM application_access_logs
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await database.query(query);
    return result.rows[0]?.deleted_count || 0;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      tenantId: this.tenantId,
      tenantIdFk: this.tenantIdFk,
      applicationId: this.applicationId,
      decision: this.decision,
      reason: this.reason,
      apiPath: this.apiPath,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      endpoint: this.endpoint,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...(this.userEmail && { userEmail: this.userEmail }),
      ...(this.appName && { appName: this.appName }),
      ...(this.appSlug && { appSlug: this.appSlug })
    };
  }
}

module.exports = AccessLog;