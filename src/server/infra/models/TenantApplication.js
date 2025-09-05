const database = require('../db/database');
const { Application, ApplicationNotFoundError } = require('./Application');

class TenantApplicationNotFoundError extends Error {
  constructor(message) {
    super(`Tenant application not found: ${message}`);
    this.name = 'TenantApplicationNotFoundError';
  }
}

class TenantApplication {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id;
    this.tenantIdFk = data.tenant_id_fk;
    this.applicationId = data.application_id;
    this.status = data.status;
    this.activatedAt = data.activated_at;
    this.expiresAt = data.expires_at || data.expiry_date;
    this.maxUsers = data.max_users || data.user_limit;
    this.seatsUsed = data.seats_used || 0;
    this.active = data.active !== false;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // Application data if joined
    if (data.app_name) {
      this.application = {
        id: data.application_id,
        name: data.app_name,
        slug: data.app_slug,
        description: data.app_description,
        pricePerUser: parseFloat(data.app_price_per_user || 0),
        version: data.app_version
      };
    }
  }

  /**
   * Find tenant application by ID
   */
  static async findById(id) {
    const query = `
      SELECT ta.*, a.name as app_name, a.slug as app_slug, a.description as app_description,
             a.price_per_user as app_price_per_user, a.version as app_version
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.id = $1
    `;
    
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new TenantApplicationNotFoundError(`ID: ${id}`);
    }
    
    return new TenantApplication(result.rows[0]);
  }

  /**
   * Find tenant applications by tenant ID
   */
  static async findByTenant(tenantId, options = {}) {
    const { status, limit = 50, offset = 0, includeExpired = false } = options;
    
    let query = `
      SELECT ta.*, a.name as app_name, a.slug as app_slug, a.description as app_description,
             a.price_per_user as app_price_per_user, a.version as app_version
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.tenant_id_fk = $1 AND ta.active = true
    `;
    const params = [tenantId];
    
    if (status) {
      query += ` AND ta.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (!includeExpired) {
      query += ` AND (ta.expires_at IS NULL OR ta.expires_at > NOW())`;
    }
    
    query += ` ORDER BY ta.activated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new TenantApplication(row));
  }

  /**
   * Count tenant applications by tenant ID
   */
  static async count(tenantId, options = {}) {
    const { status, includeExpired = false } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.tenant_id_fk = $1 AND ta.active = true
    `;
    const params = [tenantId];
    
    if (status) {
      query += ` AND ta.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (!includeExpired) {
      query += ` AND (ta.expires_at IS NULL OR ta.expires_at > NOW())`;
    }
    
    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Find specific tenant application by tenant and application
   */
  static async findByTenantAndApplication(tenantId, applicationId) {
    const query = `
      SELECT ta.*, a.name as app_name, a.slug as app_slug, a.description as app_description,
             a.price_per_user as app_price_per_user, a.version as app_version
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.tenant_id = $1 AND ta.application_id = $2
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    
    if (result.rows.length === 0) {
      throw new TenantApplicationNotFoundError(`tenant: ${tenantId}, app: ${applicationId}`);
    }
    
    return new TenantApplication(result.rows[0]);
  }

  /**
   * Grant application license to tenant
   */
  static async grantLicense(licenseData) {
    const { tenantId, applicationId, maxUsers = null, expiresAt = null, status = 'active' } = licenseData;
    
    // Verify application exists
    await Application.findById(applicationId);
    
    // Check if license already exists
    try {
      const existing = await TenantApplication.findByTenantAndApplication(tenantId, applicationId);
      throw new Error(`License already exists for tenant ${tenantId} and application ${applicationId}`);
    } catch (error) {
      if (!(error instanceof TenantApplicationNotFoundError)) {
        throw error;
      }
    }
    
    const query = `
      INSERT INTO public.tenant_applications (tenant_id, application_id, status, expires_at, max_users)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await database.query(query, [
      tenantId, 
      applicationId, 
      status, 
      expiresAt, 
      maxUsers
    ]);
    
    return await TenantApplication.findById(result.rows[0].id);
  }

  /**
   * Update tenant application license
   */
  async update(updates) {
    const allowedUpdates = ['status', 'expires_at', 'max_users'];
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
      UPDATE public.tenant_applications 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await database.query(query, [
      ...updateValues,
      this.id
    ]);
    
    if (result.rows.length === 0) {
      throw new TenantApplicationNotFoundError(`ID: ${this.id}`);
    }
    
    // Refresh the instance with updated data
    const updated = await TenantApplication.findById(this.id);
    Object.assign(this, updated);
    return this;
  }

  /**
   * Count active licenses for a tenant
   */
  static async countActiveLicenses(tenantId) {
    const query = `
      SELECT COUNT(*) as count
      FROM public.tenant_applications ta
      JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.tenant_id_fk = $1 
      AND ta.active = true 
      AND ta.status = 'active'
      AND (ta.expiry_date IS NULL OR ta.expiry_date > CURRENT_DATE)
    `;
    const result = await database.query(query, [tenantId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if tenant has active license for application
   */
  static async hasActiveLicense(tenantId, applicationSlug) {
    const query = `
      SELECT ta.*, a.slug
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.tenant_id = $1 AND a.slug = $2 AND ta.status = 'active'
        AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
    `;
    
    const result = await database.query(query, [tenantId, applicationSlug]);
    return result.rows.length > 0;
  }

  /**
   * Get license details for tenant and application
   */
  static async getLicenseInfo(tenantId, applicationSlug) {
    const query = `
      SELECT ta.*, a.name, a.slug, a.description, a.price_per_user
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id = a.id
      WHERE ta.tenant_id = $1 AND a.slug = $2
    `;
    
    const result = await database.query(query, [tenantId, applicationSlug]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Revoke license (soft delete by setting status to 'revoked')
   */
  async revoke() {
    return await this.update({ status: 'revoked' });
  }

  /**
   * Suspend license
   */
  async suspend() {
    return await this.update({ status: 'suspended' });
  }

  /**
   * Reactivate license
   */
  async reactivate() {
    return await this.update({ status: 'active' });
  }

  /**
   * Check if license is active and not expired
   */
  isActive() {
    if (this.status !== 'active') {
      return false;
    }
    
    if (this.expiresAt && new Date(this.expiresAt) <= new Date()) {
      return false;
    }
    
    return true;
  }

  /**
   * Get user count for this tenant application
   */
  async getUserCount() {
    const query = `
      SELECT COUNT(*) as count
      FROM public.user_application_access uaa
      WHERE uaa.application_id = $1 AND uaa.tenant_id = $2 AND uaa.is_active = true
    `;
    
    const result = await database.query(query, [this.applicationId, this.tenantId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if tenant can add more users to this application
   */
  async canAddUser() {
    if (!this.maxUsers) {
      return true; // No limit
    }
    
    const currentCount = await this.getUserCount();
    return currentCount < this.maxUsers;
  }

  /**
   * Check license with slug-based lookup
   */
  static async checkLicense(tenantId, appSlug) {
    const query = `
      SELECT ta.*, a.slug, a.name, a.id as app_id
      FROM tenant_applications ta
      JOIN applications a ON ta.application_id = a.id  
      WHERE ta.tenant_id_fk = $1 AND a.slug = $2 
      AND ta.active = true 
      AND ta.status = 'active'
      AND (ta.expiry_date IS NULL OR ta.expiry_date > CURRENT_DATE)
    `;
    const result = await database.query(query, [tenantId, appSlug]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Check seat availability for a tenant application
   */
  static async checkSeatAvailability(tenantId, applicationId) {
    const query = `
      SELECT user_limit, seats_used,
             (user_limit - seats_used) as seats_available
      FROM tenant_applications 
      WHERE tenant_id_fk = $1 AND application_id = $2 AND active = true
    `;
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Expire licenses that have passed their expiry date
   */
  static async expireLicenses() {
    const query = `
      UPDATE tenant_applications 
      SET status = 'expired'
      WHERE expiry_date < CURRENT_DATE 
      AND status != 'expired' 
      AND active = true
      RETURNING tenant_id_fk, application_id
    `;
    const result = await database.query(query);
    return result.rows;
  }

  /**
   * Get allowed application slugs for a tenant
   */
  static async getAllowedAppSlugs(tenantId) {
    const query = `
      SELECT DISTINCT a.slug
      FROM tenant_applications ta
      JOIN applications a ON ta.application_id = a.id
      WHERE ta.tenant_id_fk = $1
      AND ta.active = true
      AND ta.status = 'active'
      AND (ta.expiry_date IS NULL OR ta.expiry_date > CURRENT_DATE)
    `;
    const result = await database.query(query, [tenantId]);
    return result.rows.map(row => row.slug);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      tenantIdFk: this.tenantIdFk,
      applicationId: this.applicationId,
      status: this.status,
      activatedAt: this.activatedAt,
      expiresAt: this.expiresAt,
      maxUsers: this.maxUsers,
      seatsUsed: this.seatsUsed,
      seatsAvailable: this.maxUsers ? (this.maxUsers - this.seatsUsed) : null,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive(),
      ...(this.application && { application: this.application })
    };
  }

  /**
   * Increment seat count for a tenant application
   * @param {number} tenantId - Tenant ID
   * @param {number} applicationId - Application ID
   * @returns {boolean} Success
   */
  static async incrementSeat(tenantId, applicationId) {
    const query = `
      UPDATE tenant_applications 
      SET seats_used = COALESCE(seats_used, 0) + 1,
          updated_at = NOW()
      WHERE tenant_id_fk = $1 AND application_id = $2 AND active = TRUE
      RETURNING seats_used
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0;
  }

  /**
   * Decrement seat count for a tenant application
   * @param {number} tenantId - Tenant ID  
   * @param {number} applicationId - Application ID
   * @returns {boolean} Success
   */
  static async decrementSeat(tenantId, applicationId) {
    const query = `
      UPDATE tenant_applications 
      SET seats_used = GREATEST(COALESCE(seats_used, 0) - 1, 0),
          updated_at = NOW()
      WHERE tenant_id_fk = $1 AND application_id = $2 AND active = TRUE
      RETURNING seats_used
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0;
  }

  /**
   * Find tenant application by tenant and application
   * @param {number} tenantId - Tenant ID
   * @param {number} applicationId - Application ID  
   * @returns {TenantApplication|null}
   */
  static async findByTenantAndApplication(tenantId, applicationId) {
    const query = `
      SELECT * FROM tenant_applications
      WHERE tenant_id_fk = $1 AND application_id = $2
      LIMIT 1
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0 ? new TenantApplication(result.rows[0]) : null;
  }
}

module.exports = { TenantApplication, TenantApplicationNotFoundError };