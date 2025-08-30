const database = require('../config/database');

class UserTypeNotFoundError extends Error {
  constructor(message) {
    super(`User type not found: ${message}`);
    this.name = 'UserTypeNotFoundError';
  }
}

class UserType {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.basePrice = parseFloat(data.base_price || 0);
    this.description = data.description;
    this.hierarchyLevel = data.hierarchy_level;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find user type by ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM public.user_types 
      WHERE id = $1
    `;
    
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new UserTypeNotFoundError(`ID: ${id}`);
    }
    
    return new UserType(result.rows[0]);
  }

  /**
   * Find user type by slug
   */
  static async findBySlug(slug) {
    const query = `
      SELECT * FROM public.user_types 
      WHERE slug = $1
    `;
    
    const result = await database.query(query, [slug]);
    
    if (result.rows.length === 0) {
      throw new UserTypeNotFoundError(`slug: ${slug}`);
    }
    
    return new UserType(result.rows[0]);
  }

  /**
   * Get all user types ordered by hierarchy
   */
  static async findAll(options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const query = `
      SELECT * FROM public.user_types 
      ORDER BY hierarchy_level ASC, name ASC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await database.query(query, [limit, offset]);
    return result.rows.map(row => new UserType(row));
  }

  /**
   * Create new user type
   */
  static async create(typeData) {
    const { name, slug, basePrice = 0, description, hierarchyLevel = 0 } = typeData;
    
    // Check if user type already exists
    try {
      await UserType.findBySlug(slug);
      throw new Error(`User type with slug '${slug}' already exists`);
    } catch (error) {
      if (!(error instanceof UserTypeNotFoundError)) {
        throw error;
      }
    }
    
    const query = `
      INSERT INTO public.user_types (name, slug, base_price, description, hierarchy_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await database.query(query, [
      name, 
      slug, 
      basePrice, 
      description, 
      hierarchyLevel
    ]);
    
    return new UserType(result.rows[0]);
  }

  /**
   * Update user type
   */
  async update(updates) {
    const allowedUpdates = ['name', 'base_price', 'description', 'hierarchy_level'];
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
      UPDATE public.user_types 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await database.query(query, [
      ...updateValues,
      this.id
    ]);
    
    if (result.rows.length === 0) {
      throw new UserTypeNotFoundError(`ID: ${this.id}`);
    }
    
    // Update current instance
    Object.assign(this, new UserType(result.rows[0]));
    return this;
  }

  /**
   * Check if this user type has higher or equal hierarchy than another
   */
  canAccess(otherUserType) {
    return this.hierarchyLevel >= otherUserType.hierarchyLevel;
  }

  /**
   * Get hierarchy level name
   */
  getHierarchyName() {
    const hierarchyNames = {
      0: 'Secretary',
      1: 'Doctor',
      2: 'Administrator'
    };
    return hierarchyNames[this.hierarchyLevel] || 'Unknown';
  }

  /**
   * Get users count by type
   */
  static async getUserCountByType(userTypeId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM public.users 
      WHERE user_type_id = $1 AND status = 'active'
    `;
    
    const result = await database.query(query, [userTypeId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get all users of this type
   */
  async getUsers(tenantId = null, options = {}) {
    const { limit = 50, offset = 0, status = 'active' } = options;
    
    let query = `
      SELECT u.*, ut.name as user_type_name, ut.slug as user_type_slug
      FROM public.users u
      INNER JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE u.user_type_id = $1 AND u.status = $2
    `;
    const params = [this.id, status];
    
    if (tenantId) {
      query += ` AND u.tenant_id = $${params.length + 1}`;
      params.push(tenantId);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows;
  }

  /**
   * Calculate pricing for this user type with applications
   */
  async calculatePricing(applicationIds = []) {
    if (applicationIds.length === 0) {
      return {
        basePrice: this.basePrice,
        applicationCosts: [],
        totalPrice: this.basePrice
      };
    }
    
    const query = `
      SELECT id, name, slug, price_per_user
      FROM public.applications
      WHERE id = ANY($1) AND status = 'active'
    `;
    
    const result = await database.query(query, [applicationIds]);
    
    const applicationCosts = result.rows.map(app => ({
      applicationId: app.id,
      name: app.name,
      slug: app.slug,
      price: parseFloat(app.price_per_user)
    }));
    
    const totalAppCost = applicationCosts.reduce((sum, app) => sum + app.price, 0);
    
    return {
      basePrice: this.basePrice,
      applicationCosts,
      totalApplicationCost: totalAppCost,
      totalPrice: this.basePrice + totalAppCost
    };
  }

  /**
   * Get default permissions for this user type
   */
  getDefaultPermissions() {
    const permissions = {
      0: { // Secretary
        canCreateUsers: false,
        canManageApplications: false,
        canViewReports: false,
        canManageBilling: false
      },
      1: { // Doctor
        canCreateUsers: false,
        canManageApplications: false,
        canViewReports: true,
        canManageBilling: false
      },
      2: { // Administrator
        canCreateUsers: true,
        canManageApplications: true,
        canViewReports: true,
        canManageBilling: true
      }
    };
    
    return permissions[this.hierarchyLevel] || permissions[0];
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      basePrice: this.basePrice,
      description: this.description,
      hierarchyLevel: this.hierarchyLevel,
      hierarchyName: this.getHierarchyName(),
      defaultPermissions: this.getDefaultPermissions(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { UserType, UserTypeNotFoundError };