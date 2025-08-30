const database = require('../db/database');
const User = require('./User');

class TenantUser {
  /**
   * Get all users for a specific tenant with additional metadata
   */
  static async getUsersByTenant(tenantContext, options = {}) {
    const users = await User.findByTenant(tenantContext.tenantId, options);
    
    // Add tenant context to each user
    return users.map(user => ({
      ...user.getSafeData(),
      tenant: {
        id: tenantContext.tenantId,
        schema: tenantContext.schema
      }
    }));
  }

  /**
   * Get count of users for a specific tenant
   */
  static async getUserCountByTenant(tenantContext, options = {}) {
    return await User.countByTenant(tenantContext.tenantId, options);
  }

  /**
   * Create a new user within a tenant context
   */
  static async createUserInTenant(tenantContext, userData) {
    // Ensure tenant ID matches context
    const userDataWithTenant = {
      ...userData,
      tenantId: tenantContext.tenantId
    };
    
    const user = await User.create(userDataWithTenant);
    
    return {
      ...user.getSafeData(),
      tenant: {
        id: tenantContext.tenantId,
        schema: tenantContext.schema
      }
    };
  }

  /**
   * Get user by ID within tenant context
   */
  static async getUserInTenant(tenantContext, userId) {
    const user = await User.findById(userId, tenantContext.tenantId);
    
    return {
      ...user.getSafeData(),
      tenant: {
        id: tenantContext.tenantId,
        schema: tenantContext.schema
      }
    };
  }

  /**
   * Update user within tenant context
   */
  static async updateUserInTenant(tenantContext, userId, updates) {
    const user = await User.findById(userId, tenantContext.tenantId);
    const updatedUser = await user.update(updates);
    
    return {
      ...updatedUser.getSafeData(),
      tenant: {
        id: tenantContext.tenantId,
        schema: tenantContext.schema
      }
    };
  }

  /**
   * Delete user within tenant context
   */
  static async deleteUserInTenant(tenantContext, userId) {
    const user = await User.findById(userId, tenantContext.tenantId);
    const deletedUser = await user.delete();
    
    return {
      ...deletedUser.getSafeData(),
      tenant: {
        id: tenantContext.tenantId,
        schema: tenantContext.schema
      }
    };
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantContext) {
    const [totalUsers, activeUsers, adminUsers, managerUsers, operationsUsers] = await Promise.all([
      User.countByTenant(tenantContext.tenantId, null), // all statuses
      User.countByTenant(tenantContext.tenantId, 'active'),
      database.query(
        'SELECT COUNT(*) as count FROM public.users WHERE tenant_id = $1 AND role = $2 AND status = $3',
        [tenantContext.tenantId, 'admin', 'active']
      ),
      database.query(
        'SELECT COUNT(*) as count FROM public.users WHERE tenant_id = $1 AND role = $2 AND status = $3',
        [tenantContext.tenantId, 'manager', 'active']
      ),
      database.query(
        'SELECT COUNT(*) as count FROM public.users WHERE tenant_id = $1 AND role = $2 AND status = $3',
        [tenantContext.tenantId, 'operations', 'active']
      )
    ]);

    return {
      tenantId: tenantContext.tenantId,
      schema: tenantContext.schema,
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: {
          admin: parseInt(adminUsers.rows[0].count),
          manager: parseInt(managerUsers.rows[0].count),
          operations: parseInt(operationsUsers.rows[0].count)
        }
      }
    };
  }

  /**
   * Validate user belongs to tenant
   */
  static async validateUserTenant(userId, tenantId) {
    try {
      const user = await User.findById(userId, tenantId);
      return user.tenantId === tenantId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get users by role within tenant
   */
  static async getUsersByRole(tenantContext, role, options = {}) {
    const users = await User.findByTenant(tenantContext.tenantId, {
      ...options,
      role
    });
    
    return users.map(user => ({
      ...user.getSafeData(),
      tenant: {
        id: tenantContext.tenantId,
        schema: tenantContext.schema
      }
    }));
  }

  /**
   * Bulk operations within tenant
   */
  static async bulkUpdateUsers(tenantContext, userIds, updates) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId, tenantContext.tenantId);
        const updatedUser = await user.update(updates);
        results.push({
          success: true,
          userId,
          user: updatedUser.getSafeData()
        });
      } catch (error) {
        results.push({
          success: false,
          userId,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Transfer user to another tenant (admin operation)
   */
  static async transferUserToTenant(currentTenantContext, userId, targetTenantId) {
    const user = await User.findById(userId, currentTenantContext.tenantId);
    
    // This would require more complex logic in a real application
    // For now, we'll mark as deleted in current tenant and create new in target
    await user.delete();
    
    const transferredUser = await User.create({
      tenantId: targetTenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role,
      status: 'active'
    });
    
    return {
      originalUser: user.getSafeData(),
      transferredUser: transferredUser.getSafeData(),
      fromTenant: currentTenantContext.tenantId,
      toTenant: targetTenantId
    };
  }
}

module.exports = TenantUser;