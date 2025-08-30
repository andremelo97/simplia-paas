const database = require('../db/database');

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
   * Find logs with comprehensive filtering (for audit route)
   */
  static async findFiltered(filters = {}, options = {}) {
    const { 
      tenantId, 
      applicationSlug, 
      decision, 
      userId, 
      ipAddress, 
      startDate, 
      endDate 
    } = filters;
    
    const { 
      limit = 50, 
      offset = 0, 
      sortBy = 'timestamp', 
      sortOrder = 'desc' 
    } = options;

    let query = `
      SELECT 
        al.*,
        u.email as user_email,
        t.name as tenant_name,
        a.slug as application_slug,
        a.name as application_name
      FROM application_access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON al.tenant_id_fk = t.id
      LEFT JOIN applications a ON al.application_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(tenantId);
    }

    if (applicationSlug) {
      query += ` AND a.slug = $${params.length + 1}`;
      params.push(applicationSlug);
    }

    if (decision) {
      query += ` AND al.decision = $${params.length + 1}`;
      params.push(decision);
    }

    if (userId) {
      query += ` AND al.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (ipAddress) {
      query += ` AND al.ip_address = $${params.length + 1}`;
      params.push(ipAddress);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    // Sorting
    const sortField = sortBy === 'timestamp' ? 'al.created_at' :
                     sortBy === 'tenant' ? 't.name' :
                     sortBy === 'user' ? 'u.email' :
                     sortBy === 'application' ? 'a.name' : 'al.created_at';
    
    query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => {
      const log = new AccessLog(row);
      if (row.user_email) log.userEmail = row.user_email;
      if (row.tenant_name) log.tenantName = row.tenant_name;
      if (row.application_slug) log.applicationSlug = row.application_slug;
      if (row.application_name) log.applicationName = row.application_name;
      return log;
    });
  }

  /**
   * Count logs with filtering
   */
  static async count(filters = {}) {
    const { 
      tenantId, 
      applicationSlug, 
      decision, 
      userId, 
      ipAddress, 
      startDate, 
      endDate 
    } = filters;

    let query = `
      SELECT COUNT(*) as count
      FROM application_access_logs al
      LEFT JOIN applications a ON al.application_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(tenantId);
    }

    if (applicationSlug) {
      query += ` AND a.slug = $${params.length + 1}`;
      params.push(applicationSlug);
    }

    if (decision) {
      query += ` AND al.decision = $${params.length + 1}`;
      params.push(decision);
    }

    if (userId) {
      query += ` AND al.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (ipAddress) {
      query += ` AND al.ip_address = $${params.length + 1}`;
      params.push(ipAddress);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get summary statistics
   */
  static async getSummary(filters = {}) {
    const { 
      tenantId, 
      applicationSlug, 
      startDate, 
      endDate 
    } = filters;

    let query = `
      SELECT 
        COUNT(*) as total_access,
        COUNT(CASE WHEN al.decision = 'granted' THEN 1 END) as granted_access,
        COUNT(CASE WHEN al.decision = 'denied' THEN 1 END) as denied_access,
        COUNT(DISTINCT al.user_id) as unique_users,
        COUNT(DISTINCT al.tenant_id_fk) as unique_tenants
      FROM application_access_logs al
      LEFT JOIN applications a ON al.application_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(tenantId);
    }

    if (applicationSlug) {
      query += ` AND a.slug = $${params.length + 1}`;
      params.push(applicationSlug);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await database.query(query, params);
    const row = result.rows[0];
    
    return {
      totalAccess: parseInt(row.total_access),
      grantedAccess: parseInt(row.granted_access),
      deniedAccess: parseInt(row.denied_access),
      uniqueUsers: parseInt(row.unique_users),
      uniqueTenants: parseInt(row.unique_tenants)
    };
  }

  /**
   * Get overview statistics
   */
  static async getOverview(filters = {}) {
    const summary = await AccessLog.getSummary(filters);
    const totalRequests = summary.totalAccess;
    const denialRate = totalRequests > 0 ? (summary.deniedAccess / totalRequests) * 100 : 0;

    return {
      totalRequests,
      grantedRequests: summary.grantedAccess,
      deniedRequests: summary.deniedAccess,
      denialRate: parseFloat(denialRate.toFixed(2)),
      uniqueUsers: summary.uniqueUsers,
      uniqueTenants: summary.uniqueTenants,
      uniqueIPs: 0 // Placeholder - would need separate query
    };
  }

  /**
   * Get statistics by application
   */
  static async getByApplication(filters = {}) {
    let query = `
      SELECT 
        a.slug as application,
        COUNT(*) as total,
        COUNT(CASE WHEN al.decision = 'granted' THEN 1 END) as granted,
        COUNT(CASE WHEN al.decision = 'denied' THEN 1 END) as denied
      FROM application_access_logs al
      LEFT JOIN applications a ON al.application_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(filters.tenantId);
    }

    if (filters.startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(filters.endDate);
    }

    query += ` GROUP BY a.slug ORDER BY total DESC`;

    const result = await database.query(query, params);
    return result.rows.map(row => ({
      application: row.application,
      total: parseInt(row.total),
      granted: parseInt(row.granted),
      denied: parseInt(row.denied)
    }));
  }

  /**
   * Get statistics by tenant
   */
  static async getByTenant(filters = {}) {
    let query = `
      SELECT 
        al.tenant_id_fk as tenant_id,
        t.name as tenant_name,
        COUNT(*) as total,
        COUNT(CASE WHEN al.decision = 'granted' THEN 1 END) as granted,
        COUNT(CASE WHEN al.decision = 'denied' THEN 1 END) as denied
      FROM application_access_logs al
      LEFT JOIN tenants t ON al.tenant_id_fk = t.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(filters.tenantId);
    }

    if (filters.startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(filters.endDate);
    }

    query += ` GROUP BY al.tenant_id_fk, t.name ORDER BY total DESC`;

    const result = await database.query(query, params);
    return result.rows.map(row => ({
      tenantId: parseInt(row.tenant_id),
      tenantName: row.tenant_name,
      total: parseInt(row.total),
      granted: parseInt(row.granted),
      denied: parseInt(row.denied)
    }));
  }

  /**
   * Get timeline statistics
   */
  static async getTimeline(filters = {}, period = 'day') {
    const dateFormat = period === 'hour' ? 'YYYY-MM-DD HH24:00:00' :
                      period === 'day' ? 'YYYY-MM-DD' :
                      period === 'week' ? 'YYYY-"W"WW' :
                      'YYYY-MM';

    let query = `
      SELECT 
        TO_CHAR(al.created_at, '${dateFormat}') as period,
        COUNT(*) as total,
        COUNT(CASE WHEN al.decision = 'granted' THEN 1 END) as granted,
        COUNT(CASE WHEN al.decision = 'denied' THEN 1 END) as denied
      FROM application_access_logs al
      WHERE 1=1
    `;
    const params = [];

    if (filters.tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(filters.tenantId);
    }

    if (filters.startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(filters.endDate);
    }

    query += ` GROUP BY period ORDER BY period`;

    const result = await database.query(query, params);
    return result.rows.map(row => ({
      period: row.period,
      total: parseInt(row.total),
      granted: parseInt(row.granted),
      denied: parseInt(row.denied)
    }));
  }

  /**
   * Get top denial reasons
   */
  static async getTopDenialReasons(filters = {}) {
    let query = `
      SELECT 
        al.reason,
        COUNT(*) as count
      FROM application_access_logs al
      WHERE al.decision = 'denied' AND al.reason IS NOT NULL
    `;
    const params = [];

    if (filters.tenantId) {
      query += ` AND al.tenant_id_fk = $${params.length + 1}`;
      params.push(filters.tenantId);
    }

    if (filters.startDate) {
      query += ` AND al.created_at >= $${params.length + 1}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND al.created_at <= $${params.length + 1}`;
      params.push(filters.endDate);
    }

    query += ` GROUP BY al.reason ORDER BY count DESC LIMIT 10`;

    const result = await database.query(query, params);
    return result.rows.map(row => ({
      reason: row.reason,
      count: parseInt(row.count)
    }));
  }

  /**
   * Get security alerts (simplified implementation)
   */
  static async getSecurityAlerts(options = {}) {
    const { severity, hours = 24, limit = 25 } = options;
    
    // Simple implementation - repeated failed attempts
    let query = `
      SELECT 
        'repeated_failures' as type,
        'medium' as severity,
        'Repeated Access Failures' as title,
        'Multiple failed access attempts from same IP/user' as description,
        al.user_id as userId,
        al.ip_address as ipAddress,
        COUNT(*) as count,
        MIN(al.created_at) as firstSeen,
        MAX(al.created_at) as lastSeen
      FROM application_access_logs al
      WHERE al.decision = 'denied' 
        AND al.created_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY al.user_id, al.ip_address
      HAVING COUNT(*) >= 3
    `;

    if (severity) {
      query += ` AND 'medium' = $1`;
    }

    query += ` ORDER BY count DESC LIMIT ${limit}`;

    const params = severity ? [severity] : [];
    const result = await database.query(query, params);
    
    return result.rows.map((row, index) => ({
      id: `alert_${index + 1}`,
      type: row.type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      userId: row.userid,
      ipAddress: row.ipaddress,
      count: parseInt(row.count),
      firstSeen: row.firstseen,
      lastSeen: row.lastseen
    }));
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
      ...(this.appSlug && { appSlug: this.appSlug }),
      ...(this.tenantName && { tenantName: this.tenantName }),
      ...(this.applicationSlug && { applicationSlug: this.applicationSlug }),
      ...(this.applicationName && { applicationName: this.applicationName })
    };
  }
}

module.exports = AccessLog;