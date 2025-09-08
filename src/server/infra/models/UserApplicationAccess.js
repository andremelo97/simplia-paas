const database = require('../db/database');
const { Application, ApplicationNotFoundError } = require('./Application');
const { TenantApplication } = require('./TenantApplication');
const ApplicationPricing = require('./ApplicationPricing');

class UserApplicationAccessNotFoundError extends Error {
  constructor(message) {
    super(`User application access not found: ${message}`);
    this.name = 'UserApplicationAccessNotFoundError';
  }
}

class UserApplicationAccess {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id_fk;
    this.applicationId = data.application_id_fk;
    this.tenantId = data.tenant_id_fk;
    this.roleInApp = data.role_in_app;
    this.grantedAt = data.granted_at;
    this.grantedBy = data.granted_by;
    this.expiresAt = data.expires_at;
    this.isActive = data.active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // User data if joined
    if (data.user_name) {
      this.user = {
        id: data.user_id_fk,
        name: data.user_name,
        email: data.user_email,
        role: data.user_role
      };
    }
    
    // Application data if joined
    if (data.app_name) {
      this.application = {
        id: data.application_id_fk,
        name: data.app_name,
        slug: data.app_slug,
        description: data.app_description
      };
    }
  }

  /**
   * Find user application access by ID
   */
  static async findById(id) {
    const query = `
      SELECT uaa.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email, u.role as user_role,
             a.name as app_name, a.slug as app_slug, a.description as app_description
      FROM public.user_application_access uaa
      INNER JOIN public.users u ON uaa.user_id_fk = u.id
      INNER JOIN public.applications a ON uaa.application_id_fk = a.id
      WHERE uaa.id = $1
    `;
    
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new UserApplicationAccessNotFoundError(`ID: ${id}`);
    }
    
    return new UserApplicationAccess(result.rows[0]);
  }

  /**
   * Find user's application access for specific tenant
   */
  static async findByUser(userId, tenantId, options = {}) {
    const { applicationId, isActive = true, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT uaa.*, a.name as app_name, a.slug as app_slug, a.description as app_description
      FROM public.user_application_access uaa
      INNER JOIN public.applications a ON uaa.application_id_fk = a.id
      WHERE uaa.user_id_fk = $1 AND uaa.tenant_id_fk = $2
    `;
    const params = [userId, tenantId];
    
    if (applicationId) {
      query += ` AND uaa.application_id_fk = $${params.length + 1}`;
      params.push(applicationId);
    }
    
    if (isActive !== null) {
      query += ` AND uaa.active = $${params.length + 1}`;
      params.push(isActive);
    }
    
    // Check for expiration
    query += ` AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())`;
    
    query += ` ORDER BY uaa.granted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new UserApplicationAccess(row));
  }

  /**
   * Find all users with access to specific application in tenant
   */
  static async findByApplication(applicationId, tenantId, options = {}) {
    const { isActive = true, roleInApp, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT uaa.*, u.name as user_name, u.email as user_email, u.role as user_role,
             a.name as app_name, a.slug as app_slug
      FROM public.user_application_access uaa
      INNER JOIN public.users u ON uaa.user_id_fk = u.id
      INNER JOIN public.applications a ON uaa.application_id_fk = a.id
      WHERE uaa.application_id_fk = $1 AND uaa.tenant_id_fk = $2
    `;
    const params = [applicationId, tenantId];
    
    if (isActive !== null) {
      query += ` AND uaa.active = $${params.length + 1}`;
      params.push(isActive);
    }
    
    if (roleInApp) {
      query += ` AND uaa.role_in_app = $${params.length + 1}`;
      params.push(roleInApp);
    }
    
    // Check for expiration
    query += ` AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())`;
    
    query += ` ORDER BY uaa.granted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new UserApplicationAccess(row));
  }

  /**
   * Grant user access to application
   */
  static async grantAccess(accessData) {
    const { 
      userId, 
      applicationId, 
      tenantId, 
      tenantIdFk,
      roleInApp = 'user', 
      grantedBy, 
      expiresAt = null,
      // Pricing snapshots
      priceSnapshot,
      currencySnapshot,
      userTypeIdSnapshot,
      grantedCycle
    } = accessData;
    
    // Verify application exists
    await Application.findById(applicationId);
    
    // Verify tenant has license for the application
    const tenantApp = await TenantApplication.findByTenantAndApplication(tenantId, applicationId);
    if (!tenantApp.isActive()) {
      throw new Error(`Tenant ${tenantId} does not have active license for application ${applicationId}`);
    }
    
    // Check if tenant can add more users
    if (!(await tenantApp.canAddUser())) {
      throw new Error(`Maximum user limit reached for application ${applicationId} in tenant ${tenantId}`);
    }
    
    // Check if user already has access
    try {
      const existing = await UserApplicationAccess.findByUser(userId, tenantId, { applicationId });
      if (existing.length > 0 && existing[0].isActive) {
        throw new Error(`User ${userId} already has access to application ${applicationId}`);
      }
    } catch (error) {
      // If no existing access found, that's fine
    }
    
    const query = `
      INSERT INTO public.user_application_access 
      (user_id_fk, application_id_fk, tenant_id_fk, role_in_app, granted_by_fk, expires_at,
       price_snapshot, currency_snapshot, user_type_id_snapshot_fk, granted_cycle, granted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;
    
    const result = await database.query(query, [
      userId, 
      applicationId, 
      tenantIdFk,
      roleInApp, 
      grantedBy, 
      expiresAt,
      priceSnapshot,
      currencySnapshot, 
      userTypeIdSnapshot,
      grantedCycle
    ]);
    
    // Log the access grant
    await UserApplicationAccess.logAccess({
      userId,
      tenantId,
      applicationId,
      accessType: 'granted',
      reason: `Access granted by user ${grantedBy}`
    });
    
    return await UserApplicationAccess.findById(result.rows[0].id);
  }

  /**
   * Check if user has access to specific application
   */
  static async hasAccess(userId, tenantId, applicationSlug) {
    const query = `
      SELECT uaa.*, a.slug
      FROM public.user_application_access uaa
      INNER JOIN public.applications a ON uaa.application_id_fk = a.id
      WHERE uaa.user_id_fk = $1 AND uaa.tenant_id_fk = $2 AND a.slug = $3 
        AND uaa.active = true
        AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())
    `;
    
    const result = await database.query(query, [userId, tenantId, applicationSlug]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get user's allowed applications for JWT payload
   */
  static async getUserAllowedApps(userId, tenantId) {
    const query = `
      SELECT DISTINCT a.slug, a.name, uaa.role_in_app
      FROM public.user_application_access uaa
      INNER JOIN public.applications a ON uaa.application_id_fk = a.id
      INNER JOIN public.tenant_applications ta ON (ta.application_id_fk = a.id AND ta.tenant_id_fk = uaa.tenant_id_fk)
      WHERE uaa.user_id_fk = $1 AND uaa.tenant_id_fk = $2 AND uaa.active = true
        AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())
        AND ta.status = 'active'
        AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
    `;
    
    const result = await database.query(query, [userId, tenantId]);
    return result.rows.map(row => ({
      slug: row.slug,
      name: row.name,
      roleInApp: row.role_in_app
    }));
  }

  /**
   * Update user application access
   */
  async update(updates) {
    const allowedUpdates = ['role_in_app', 'expires_at', 'active'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return this;
    }
    
    updateFields.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE public.user_application_access 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await database.query(query, [
      ...updateValues,
      this.id
    ]);
    
    if (result.rows.length === 0) {
      throw new UserApplicationAccessNotFoundError(`ID: ${this.id}`);
    }
    
    // Refresh the instance with updated data
    const updated = await UserApplicationAccess.findById(this.id);
    Object.assign(this, updated);
    return this;
  }

  /**
   * Revoke user access (set active to false)
   */
  async revoke(revokedBy) {
    const result = await this.update({ active: false });
    
    // Log the access revocation
    await UserApplicationAccess.logAccess({
      userId: this.userId,
      tenantId: this.tenantId,
      applicationId: this.applicationId,
      accessType: 'revoked',
      reason: `Access revoked by user ${revokedBy}`
    });
    
    return result;
  }

  /**
   * Log access attempt for audit trail
   */
  static async logAccess(logData) {
    const { userId, tenantId, applicationId, accessType, ipAddress, userAgent, endpoint, reason } = logData;
    
    const query = `
      INSERT INTO public.application_access_logs 
      (user_id_fk, tenant_id_fk, application_id_fk, access_type, ip_address, user_agent, endpoint, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    await database.query(query, [
      userId, 
      tenantId, 
      applicationId, 
      accessType, 
      ipAddress, 
      userAgent, 
      endpoint, 
      reason
    ]);
  }

  /**
   * Get access logs for user
   */
  static async getAccessLogs(userId, tenantId, options = {}) {
    const { applicationId, limit = 50, offset = 0, days = 30 } = options;
    
    let query = `
      SELECT aal.*, a.name as app_name, a.slug as app_slug
      FROM public.application_access_logs aal
      LEFT JOIN public.applications a ON aal.application_id_fk = a.id
      WHERE aal.user_id_fk = $1 AND aal.tenant_id_fk = $2
        AND aal.created_at > NOW() - INTERVAL '${days} days'
    `;
    const params = [userId, tenantId];
    
    if (applicationId) {
      query += ` AND aal.application_id_fk = $${params.length + 1}`;
      params.push(applicationId);
    }
    
    query += ` ORDER BY aal.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows;
  }

  /**
   * Create new user application access with pricing validation and snapshots
   * @param {Object} data - Access data
   * @returns {UserApplicationAccess}
   */
  static async create(data) {
    const {
      tenantIdFk,
      userIdFk,
      applicationIdFk,
      userTypeIdFkSnapshot,
      grantedByFk,
      roleInApp = 'user',
      isActive = true
    } = data;
    
    console.log(`🔄 [UserApplicationAccess.create] Creating access for user ${userIdFk} to app ${applicationIdFk}`);
    
    // Validate required fields
    if (!tenantIdFk || !userIdFk || !applicationIdFk || !userTypeIdFkSnapshot) {
      const error = new Error('tenantIdFk, userIdFk, applicationIdFk and userTypeIdFkSnapshot are required');
      error.code = 'INVALID_PARAMS';
      error.status = 400;
      throw error;
    }
    
    // Validate role_in_app
    const allowedRoles = ['user', 'admin', 'manager', 'operations'];
    if (!allowedRoles.includes(roleInApp)) {
      const error = new Error(`Invalid role_in_app. Must be one of: ${allowedRoles.join(', ')}`);
      error.code = 'INVALID_ROLE_IN_APP';
      error.status = 422;
      error.details = {
        provided: roleInApp,
        allowed: allowedRoles
      };
      throw error;
    }
    
    // BE-FIX-001: Validate pricing is configured for (application × user_type)
    const pricing = await ApplicationPricing.getCurrentPrice(applicationIdFk, userTypeIdFkSnapshot);
    if (!pricing) {
      console.log(`❌ [UserApplicationAccess.create] No pricing found for app ${applicationIdFk} × user_type ${userTypeIdFkSnapshot}`);
      
      const error = new Error('Application pricing not configured for this user type');
      error.code = 'PRICING_NOT_CONFIGURED';
      error.status = 422;
      error.details = {
        applicationId: applicationIdFk,
        userTypeId: userTypeIdFkSnapshot,
        reason: 'No valid pricing configuration found for the current date'
      };
      throw error;
    }
    
    console.log(`✅ [UserApplicationAccess.create] Found pricing: ${pricing.currency} ${pricing.price}/${pricing.billingCycle}`);
    
    // BE-FIX-002: Insert with complete pricing snapshots
    const query = `
      INSERT INTO user_application_access (
        tenant_id_fk, user_id_fk, application_id_fk, user_type_id_snapshot_fk, 
        granted_by_fk, role_in_app, active, granted_at,
        price_snapshot, currency_snapshot, granted_cycle
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
      RETURNING *
    `;
    
    const params = [
      tenantIdFk,
      userIdFk,
      applicationIdFk,
      userTypeIdFkSnapshot, // Snapshot of user's type at grant time
      grantedByFk,
      roleInApp, // BE-FIX-003: Use provided role instead of hardcoded 'user'
      isActive,
      pricing.price, // Price snapshot
      pricing.currency, // Currency snapshot
      pricing.billingCycle // Billing cycle snapshot
    ];
    
    console.log(`🔄 [UserApplicationAccess.create] Inserting with snapshots: price=${pricing.price} ${pricing.currency}, cycle=${pricing.billingCycle}, role=${roleInApp}`);
    
    const result = await database.query(query, params);
    
    console.log(`✅ [UserApplicationAccess.create] Access created with ID: ${result.rows[0].id}`);
    
    return new UserApplicationAccess(result.rows[0]);
  }

  /**
   * Find user application access by user and application
   * @param {number} userId - User ID
   * @param {number} applicationId - Application ID  
   * @param {number} tenantId - Tenant ID
   * @returns {UserApplicationAccess|null}
   */
  static async findByUserAndApp(userId, applicationId, tenantId) {
    const query = `
      SELECT uaa.*, 
             u.first_name || ' ' || u.last_name as user_name,
             u.email as user_email,
             u.role as user_role,
             a.name as app_name,
             a.slug as app_slug,
             a.description as app_description
      FROM user_application_access uaa
      LEFT JOIN users u ON uaa.user_id_fk = u.id
      LEFT JOIN applications a ON uaa.application_id_fk = a.id
      WHERE uaa.user_id_fk = $1 AND uaa.application_id_fk = $2 AND uaa.tenant_id_fk = $3
      LIMIT 1
    `;
    
    const result = await database.query(query, [userId, applicationId, tenantId]);
    return result.rows.length > 0 ? new UserApplicationAccess(result.rows[0]) : null;
  }

  /**
   * Check if access is currently valid (active and not expired)
   */
  isCurrentlyValid() {
    if (!this.isActive) {
      return false;
    }
    
    if (this.expiresAt && new Date(this.expiresAt) <= new Date()) {
      return false;
    }
    
    return true;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      applicationId: this.applicationId,
      tenantId: this.tenantId,
      roleInApp: this.roleInApp,
      grantedAt: this.grantedAt,
      grantedBy: this.grantedBy,
      expiresAt: this.expiresAt,
      isActive: this.isActive,
      isCurrentlyValid: this.isCurrentlyValid(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...(this.user && { user: this.user }),
      ...(this.application && { application: this.application })
    };
  }
}

module.exports = { UserApplicationAccess, UserApplicationAccessNotFoundError };