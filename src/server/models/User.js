const database = require('../config/database');
const { UserNotFoundError, DuplicateUserError } = require('../../shared/types/user');

class User {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.name = data.name;
    this.role = data.role;
    this.status = data.status;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create users table in public schema
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'secretary',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON public.users(tenant_id, email);
    `;
    
    await database.query(query);
  }

  /**
   * Find user by ID and tenant
   */
  static async findById(id, tenantId) {
    const query = `
      SELECT * FROM public.users 
      WHERE id = $1 AND tenant_id = $2 AND status != 'deleted'
    `;
    
    const result = await database.query(query, [id, tenantId]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`ID: ${id}`);
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Find user by email and tenant
   */
  static async findByEmail(email, tenantId) {
    const query = `
      SELECT * FROM public.users 
      WHERE email = $1 AND tenant_id = $2 AND status != 'deleted'
    `;
    
    const result = await database.query(query, [email, tenantId]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`email: ${email}`);
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Find all users by tenant
   */
  static async findByTenant(tenantId, options = {}) {
    const { limit = 50, offset = 0, role, status = 'active' } = options;
    
    let query = `
      SELECT * FROM public.users 
      WHERE tenant_id = $1 AND status = $2
    `;
    const params = [tenantId, status];
    
    if (role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(role);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await database.query(query, params);
    return result.rows.map(row => new User(row));
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { tenantId, email, passwordHash, name, role, status = 'active' } = userData;
    
    // Check if user already exists
    try {
      await User.findByEmail(email, tenantId);
      throw new DuplicateUserError(email);
    } catch (error) {
      if (!(error instanceof UserNotFoundError)) {
        throw error;
      }
    }
    
    const query = `
      INSERT INTO public.users (tenant_id, email, password_hash, name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await database.query(query, [
      tenantId, 
      email, 
      passwordHash, 
      name, 
      role, 
      status
    ]);
    
    return new User(result.rows[0]);
  }

  /**
   * Update user
   */
  async update(updates) {
    const allowedUpdates = ['name', 'role', 'status'];
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
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await database.query(query, [
      ...updateValues,
      this.id,
      this.tenantId
    ]);
    
    if (result.rows.length === 0) {
      throw new UserNotFoundError(`ID: ${this.id}`);
    }
    
    // Update current instance
    Object.assign(this, new User(result.rows[0]));
    return this;
  }

  /**
   * Change password
   */
  async updatePassword(newPasswordHash) {
    const query = `
      UPDATE public.users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    
    const result = await database.query(query, [
      newPasswordHash,
      this.id,
      this.tenantId
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
   * Get user count by tenant
   */
  static async countByTenant(tenantId, status = 'active') {
    const query = `
      SELECT COUNT(*) as count 
      FROM public.users 
      WHERE tenant_id = $1 AND status = $2
    `;
    
    const result = await database.query(query, [tenantId, status]);
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
      tenantId: this.tenantId,
      email: this.email,
      name: this.name,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;