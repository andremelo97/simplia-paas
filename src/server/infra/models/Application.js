const database = require('../db/database');

class ApplicationNotFoundError extends Error {
  constructor(message) {
    super(`Application not found: ${message}`);
    this.name = 'ApplicationNotFoundError';
  }
}

class DuplicateApplicationError extends Error {
  constructor(slug) {
    super(`Application with slug '${slug}' already exists`);
    this.name = 'DuplicateApplicationError';
  }
}

class Application {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description;
    this.pricePerUser = parseFloat(data.price_per_user || 0);
    this.status = data.status;
    this.version = data.version;
    this.active = data.active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find application by ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM public.applications 
      WHERE id = $1
    `;
    
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new ApplicationNotFoundError(`ID: ${id}`);
    }
    
    return new Application(result.rows[0]);
  }

  /**
   * Find application by slug
   */
  static async findBySlug(slug) {
    const query = `
      SELECT * FROM public.applications 
      WHERE slug = $1
    `;
    
    const result = await database.query(query, [slug]);
    
    if (result.rows.length === 0) {
      throw new ApplicationNotFoundError(`slug: ${slug}`);
    }
    
    return new Application(result.rows[0]);
  }

  /**
   * Get all applications with optional filtering
   */
  static async findAll(options = {}) {
    const { status = 'active', limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT * FROM public.applications 
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new Application(row));
  }

  /**
   * Create new application
   */
  static async create(appData) {
    const { name, slug, description, pricePerUser = 0, status = 'active', version = '1.0.0', active = true } = appData;
    
    // Check if application already exists
    try {
      await Application.findBySlug(slug);
      throw new DuplicateApplicationError(slug);
    } catch (error) {
      if (!(error instanceof ApplicationNotFoundError)) {
        throw error;
      }
    }
    
    const query = `
      INSERT INTO public.applications (name, slug, description, price_per_user, status, version, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await database.query(query, [
      name, 
      slug, 
      description, 
      pricePerUser, 
      status, 
      version,
      active
    ]);
    
    return new Application(result.rows[0]);
  }

  /**
   * Update application
   */
  async update(updates) {
    const allowedUpdates = ['name', 'description', 'price_per_user', 'status', 'version', 'active'];
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
      UPDATE public.applications 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await database.query(query, [
      ...updateValues,
      this.id
    ]);
    
    if (result.rows.length === 0) {
      throw new ApplicationNotFoundError(`ID: ${this.id}`);
    }
    
    // Update current instance
    Object.assign(this, new Application(result.rows[0]));
    return this;
  }

  /**
   * Get applications licensed to a specific tenant
   */
  static async findByTenant(tenantId, options = {}) {
    const { status = 'active', limit = 50, offset = 0 } = options;

    const query = `
      SELECT a.*, ta.status as tenant_status, ta.activated_at, ta.expires_at, ta.max_users, ta.seats_used
      FROM public.applications a
      INNER JOIN public.tenant_applications ta ON a.id = ta.application_id_fk
      WHERE ta.tenant_id_fk = $1 AND ta.status = $2
      ORDER BY a.name ASC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await database.query(query, [tenantId, status, limit, offset]);
    
    return result.rows.map(row => {
      const app = new Application(row);
      app.tenantStatus = row.tenant_status;
      app.activatedAt = row.activated_at;
      app.expiresAt = row.expires_at;
      app.maxUsers = row.max_users;
      app.seatsUsed = row.seats_used || 0;
      return app;
    });
  }

  /**
   * Check if tenant has access to this application
   */
  static async isTenantAuthorized(tenantId, applicationSlug) {
    const query = `
      SELECT ta.*, a.name, a.slug
      FROM public.tenant_applications ta
      INNER JOIN public.applications a ON ta.application_id_fk = a.id
      WHERE ta.tenant_id_fk = $1 AND a.slug = $2 AND ta.status = 'active'
        AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
    `;
    
    const result = await database.query(query, [tenantId, applicationSlug]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get application count
   */
  static async count(status = 'active') {
    const query = `
      SELECT COUNT(*) as count 
      FROM public.applications 
      WHERE status = $1
    `;
    
    const result = await database.query(query, [status]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      pricePerUser: this.pricePerUser,
      status: this.status,
      version: this.version,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...(this.tenantStatus && {
        tenantStatus: this.tenantStatus,
        activatedAt: this.activatedAt,
        expiresAt: this.expiresAt,
        maxUsers: this.maxUsers
      })
    };
  }
}

module.exports = { Application, ApplicationNotFoundError, DuplicateApplicationError };