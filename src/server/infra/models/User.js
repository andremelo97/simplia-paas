const database = require('../db/database');
const { UserNotFoundError, DuplicateUserError } = require('../../../shared/types/user');

class User {
  constructor(data) {
    this.id = data.id;
    // DEPRECATED: tenantId string field - use tenantIdFk instead
    // this.tenantId = data.tenant_id; 
    this.tenantIdFk = data.tenant_id_fk; // Primary numeric FK - source of truth
    this.tenantName = data.tenant_name; // Denormalized tenant name for performance
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    this.role = data.role;
    this.status = data.status;
    this.userTypeId = data.user_type_id_fk;
    this.platformRole = data.platform_role;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create users table in public schema
   * DEPRECATED: Use migrations instead (001_create_core_tables.sql)
   */
  /* 
  static async createTable() {
    // This method is deprecated - table structure is managed by migrations
    // See: src/server/infra/migrations/001_create_core_tables.sql
    throw new Error('createTable is deprecated - use database migrations');
  }
  */

  /**
   * Find user by ID and tenant (using numeric FK)
   */
  static async findById(id, tenantIdFk) {
    const query = `
      SELECT * FROM public.users 
      WHERE id = $1 AND tenant_id_fk = $2 AND status != 'deleted'
    `;
    
    const result = await database.query(query, [id, tenantIdFk]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`ID: ${id}`);
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Find user by email and tenant (using numeric FK)
   */
  static async findByEmail(email, tenantIdFk) {
    const query = `
      SELECT * FROM public.users 
      WHERE email = $1 AND tenant_id_fk = $2 AND status != 'deleted'
    `;
    
    const result = await database.query(query, [email, tenantIdFk]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`email: ${email}`);
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Find user by email globally (no tenant context) - for platform admin login
   */
  static async findByEmailGlobal(email) {
    const query = `
      SELECT * FROM public.users 
      WHERE email = $1 AND status != 'deleted'
    `;
    
    const result = await database.query(query, [email]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`email: ${email}`);
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Find user by ID globally (no tenant context) - for platform admin token validation
   */
  static async findByIdGlobal(id) {
    const query = `
      SELECT * FROM public.users 
      WHERE id = $1 AND status != 'deleted'
    `;
    
    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`ID: ${id}`);
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Find all users globally (for internal admin)
   */
  static async findAll(options = {}) {
    const { limit = 50, offset = 0, tenantId, search, status } = options;
    
    let query = `SELECT * FROM public.users WHERE 1=1`;
    const params = [];
    
    if (tenantId) {
      query += ` AND tenant_id_fk = $${params.length + 1}`;
      params.push(tenantId);
    }
    
    if (search) {
      query += ` AND (email ILIKE $${params.length + 1} OR first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    } else {
      query += ` AND status != 'deleted'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new User(row));
  }

  /**
   * Find all users by tenant (using numeric FK)
   */
  static async findByTenant(tenantIdFk, options = {}) {
    const { limit = 50, offset = 0, role, status = 'active', search } = options;
    
    let query = `
      SELECT * FROM public.users 
      WHERE tenant_id_fk = $1 AND status = $2
    `;
    const params = [tenantIdFk, status];
    
    if (role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(role);
    }
    
    if (search) {
      query += ` AND (email ILIKE $${params.length + 1} OR first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new User(row));
  }

  /**
   * Create new user (using numeric tenant FK)
   */
  static async create(userData) {
    const { 
      tenantIdFk, 
      email, 
      passwordHash, 
      firstName, 
      lastName, 
      role = 'operations', 
      status = 'active',
      userTypeId
    } = userData;
    
    // Check if user already exists globally (email is unique)
    try {
      await User.findByEmailGlobal(email);
      throw new DuplicateUserError(email);
    } catch (error) {
      if (!(error instanceof UserNotFoundError)) {
        throw error;
      }
    }
    
    // Get tenant subdomain and name for legacy compatibility and denormalization
    const tenantQuery = `SELECT subdomain, name FROM tenants WHERE id = $1 AND active = true`;
    const tenantResult = await database.query(tenantQuery, [tenantIdFk]);
    
    if (tenantResult.rows.length === 0) {
      throw new Error(`Tenant not found with ID: ${tenantIdFk}`);
    }
    
    const tenantSubdomain = tenantResult.rows[0].subdomain;
    const tenantName = tenantResult.rows[0].name;
    
    const query = `
      INSERT INTO public.users (
        tenant_id_fk, tenant_name, email, password_hash, 
        first_name, last_name, role, status, user_type_id_fk
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await database.query(query, [
      tenantIdFk, // Primary numeric FK
      tenantName, // Denormalized tenant name
      email, 
      passwordHash, 
      firstName,
      lastName,
      role, 
      status,
      userTypeId
    ]);
    
    return new User(result.rows[0]);
  }

  /**
   * Update user (using numeric tenant FK)
   */
  async update(updates) {
    const allowedUpdates = ['first_name', 'last_name', 'role', 'status'];
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
      UPDATE public.users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id_fk = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await database.query(query, [
      ...updateValues,
      this.id,
      this.tenantIdFk
    ]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`ID: ${this.id}`);
    }
    
    // Update current instance
    Object.assign(this, new User(result.rows[0]));
    return this;
  }

  /**
   * Change password (using numeric tenant FK)
   */
  async updatePassword(newPasswordHash) {
    const query = `
      UPDATE public.users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id_fk = $3
      RETURNING *
    `;
    
    const result = await database.query(query, [
      newPasswordHash,
      this.id,
      this.tenantIdFk
    ]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`ID: ${this.id}`);
    }
    
    this.passwordHash = newPasswordHash;
    this.updatedAt = result.rows[0].updated_at;
    return this;
  }

  /**
   * Soft delete user
   */
  async delete() {
    return await this.update({ status: 'deleted' });
  }

  /**
   * Get user count by tenant (using numeric FK)
   */
  static async countByTenant(tenantIdFk, status = 'active') {
    const query = `
      SELECT COUNT(*) as count 
      FROM public.users 
      WHERE tenant_id_fk = $1 AND status = $2
    `;
    
    const result = await database.query(query, [tenantIdFk, status]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    const { passwordHash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  /**
   * Get safe user data for JWT/responses
   */
  getSafeData() {
    return {
      id: this.id,
      tenantId: this.tenantIdFk, // Use numeric FK for JWT
      tenantName: this.tenantName, // Denormalized tenant name
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      name: this.name,
      role: this.role,
      status: this.status,
      platformRole: this.platformRole,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;