const database = require('../db/database');
const { Application, ApplicationNotFoundError } = require('./Application');
const { provisionTQAppSchema, isTQAppProvisioned } = require('../provisioners/tq');

class TenantApplicationNotFoundError extends Error {
  constructor(message) {
    super(`Tenant application not found: ${message}`);
    this.name = 'TenantApplicationNotFoundError';
  }
}

class TenantApplication {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id_fk;
    this.tenantIdFk = data.tenant_id_fk;
    this.applicationId = data.application_id_fk;
    this.status = data.status;
    this.activatedAt = data.activated_at;
    this.expiresAt = data.expires_at;
    this.seatsPurchased = data.seats_purchased || 1;
    this.seatsUsed = data.seats_used || 0;
    this.trialUsed = data.trial_used || false;
    this.active = data.active !== false;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // Application data if joined
    if (data.app_name) {
      this.application = {
        id: data.application_id_fk,
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
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
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
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
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
    const { status, applicationSlug, includeExpired = false } = options;

    let query = `
      SELECT COUNT(*) as count
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND ta.active = true
    `;
    const params = [tenantId];

    if (status) {
      query += ` AND ta.status = $${params.length + 1}`;
      params.push(status);
    }

    if (applicationSlug) {
      query += ` AND a.slug = $${params.length + 1}`;
      params.push(applicationSlug);
    }

    if (!includeExpired) {
      query += ` AND (ta.expires_at IS NULL OR ta.expires_at > NOW())`;
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Find specific tenant application by tenant and application (with app data)
   */
  static async findByTenantAndApplicationWithAppData(tenantId, applicationId) {
    const query = `
      SELECT ta.*, a.name as app_name, a.slug as app_slug, a.description as app_description,
             a.price_per_user as app_price_per_user, a.version as app_version
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND ta.application_id_fk = $2
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    
    if (result.rows.length === 0) {
      throw new TenantApplicationNotFoundError(`tenant: ${tenantId}, app: ${applicationId}`);
    }
    
    return new TenantApplication(result.rows[0]);
  }

  /**
   * Grant application license to tenant
   * This method also provisions app-specific database schemas when needed
   */
  static async grantLicense(licenseData) {
    const { tenantId, applicationId, seatsPurchased = 1, expiresAt = null, status = 'active', trialUsed = false } = licenseData;

    // Verify application exists and get app details
    const application = await Application.findById(applicationId);

    // Check if license already exists
    const existing = await TenantApplication.findByTenantAndApplication(tenantId, applicationId);
    if (existing && existing.id) {
      throw new Error(`License already exists for tenant ${tenantId} and application ${applicationId}`);
    }

    // Get tenant schema for app provisioning
    const tenantQuery = 'SELECT subdomain, timezone FROM tenants WHERE id = $1 AND active = true';
    const tenantResult = await database.query(tenantQuery, [tenantId]);

    if (tenantResult.rows.length === 0) {
      throw new Error(`Active tenant not found: ${tenantId}`);
    }

    const tenantSlug = tenantResult.rows[0].subdomain;
    const schemaName = `tenant_${tenantSlug.replace(/-/g, '_')}`;

    const query = `
      INSERT INTO public.tenant_applications (tenant_id_fk, application_id_fk, status, expires_at, seats_purchased, trial_used)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    try {
      const result = await database.query(query, [
        tenantId,
        applicationId,
        status,
        expiresAt,
        seatsPurchased,
        trialUsed
      ]);

      // Provision app-specific schemas based on application slug
      if (application.slug === 'tq') {

        const client = await database.getClient();
        try {
          // Check if already provisioned to avoid conflicts
          const isProvisioned = await isTQAppProvisioned(client, schemaName);

          if (!isProvisioned) {
            // Get tenant timezone for timestamp defaults
            const tenantTimezone = tenantResult.rows[0].timezone || 'UTC';
            // Pass tenantSlug for bucket creation and tenantId for communication settings
            await provisionTQAppSchema(client, schemaName, tenantTimezone, tenantSlug, tenantId);
          }
        } finally {
          client.release();
        }
      }

      return await TenantApplication.findById(result.rows[0].id);
    } catch (insertError) {
      throw insertError;
    }
  }

  /**
   * Update tenant application license
   */
  async update(updates) {
    const allowedUpdates = ['status', 'expires_at', 'seats_purchased', 'trial_used', 'active'];

    // Auto-sync active field based on status
    if (updates.status) {
      updates.active = updates.status === 'active';
    }

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
      JOIN public.applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1
      AND ta.active = true
      AND ta.status = 'active'
      AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
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
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND a.slug = $2 AND ta.status = 'active'
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
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND a.slug = $2
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
      WHERE uaa.application_id_fk = $1 AND uaa.tenant_id_fk = $2 AND uaa.active = true
    `;
    
    const result = await database.query(query, [this.applicationId, this.tenantId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if tenant can add more users to this application
   */
  async canAddUser() {
    if (!this.seatsPurchased) {
      return true; // No limit
    }

    const currentCount = await this.getUserCount();
    return currentCount < this.seatsPurchased;
  }

  /**
   * Check license with slug-based lookup
   */
  static async checkLicense(tenantId, appSlug) {
    const query = `
      SELECT ta.*, a.slug, a.name, a.id as app_id
      FROM tenant_applications ta
      JOIN applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND a.slug = $2
      AND ta.active = true
      AND ta.status = 'active'
      AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
    `;
    const result = await database.query(query, [tenantId, appSlug]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Check seat availability for a tenant application
   */
  static async checkSeatAvailability(tenantId, applicationId) {
    const query = `
      SELECT seats_purchased, seats_used,
             (seats_purchased - seats_used) as seats_available
      FROM tenant_applications
      WHERE tenant_id_fk = $1 AND application_id_fk = $2 AND active = true
    `;
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Expire licenses that have passed their expires_at date
   */
  static async expireLicenses() {
    const query = `
      UPDATE tenant_applications
      SET status = 'expired'
      WHERE expires_at < NOW()
      AND status != 'expired'
      AND active = true
      RETURNING tenant_id_fk, application_id_fk
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
      JOIN applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1
      AND ta.active = true
      AND ta.status = 'active'
      AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
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
      seatsPurchased: this.seatsPurchased,
      seatsUsed: this.seatsUsed,
      seatsAvailable: this.seatsPurchased ? (this.seatsPurchased - this.seatsUsed) : null,
      trialUsed: this.trialUsed,
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
      WHERE tenant_id_fk = $1 AND application_id_fk = $2 AND active = TRUE
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
      WHERE tenant_id_fk = $1 AND application_id_fk = $2 AND active = TRUE
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
      WHERE tenant_id_fk = $1 AND application_id_fk = $2
      LIMIT 1
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0 ? new TenantApplication(result.rows[0]) : null;
  }

  /**
   * Find tenant application by tenant and application with row lock
   * @param {number} tenantId - Tenant ID
   * @param {number} applicationId - Application ID  
   * @returns {TenantApplication|null}
   */
  static async findByTenantAndApplicationWithLock(tenantId, applicationId) {
    const query = `
      SELECT ta.*, a.name as app_name, a.slug as app_slug, a.description as app_description,
             a.price_per_user as app_price_per_user, a.version as app_version
      FROM tenant_applications ta
      INNER JOIN applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND ta.application_id_fk = $2
      FOR UPDATE
      LIMIT 1
    `;
    
    const result = await database.query(query, [tenantId, applicationId]);
    return result.rows.length > 0 ? new TenantApplication(result.rows[0]) : null;
  }
}

module.exports = { TenantApplication, TenantApplicationNotFoundError };