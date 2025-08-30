const User = require('../models/User');
const TenantUser = require('../models/TenantUser');
const authService = require('./authService');
const { 
  USER_ROLES, 
  hasRole, 
  InsufficientPermissionsError,
  isValidEmail,
  isValidRole 
} = require('../../shared/types/user');

class UserService {
  /**
   * Get all users for a tenant
   */
  async getUsers(tenantContext, requestingUser, options = {}) {
    // Only admins and managers can list all users
    if (!hasRole(requestingUser.role, USER_ROLES.MANAGER)) {
      throw new InsufficientPermissionsError('view users');
    }

    return await TenantUser.getUsersByTenant(tenantContext, options);
  }

  /**
   * Get user by ID
   */
  async getUserById(tenantContext, requestingUser, userId) {
    // Users can view their own profile, admins can view any
    if (requestingUser.userId !== parseInt(userId) && requestingUser.role !== USER_ROLES.ADMIN) {
      throw new InsufficientPermissionsError('view this user');
    }

    return await TenantUser.getUserInTenant(tenantContext, userId);
  }

  /**
   * Create new user
   */
  async createUser(tenantContext, requestingUser, userData) {
    // Only admins can create users
    if (requestingUser.role !== USER_ROLES.ADMIN) {
      throw new InsufficientPermissionsError('create users');
    }

    const { email, password, name, role = USER_ROLES.OPERATIONS } = userData;

    // Validate input
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!isValidRole(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    return await TenantUser.createUserInTenant(tenantContext, {
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      role,
      status: 'active'
    });
  }

  /**
   * Update user
   */
  async updateUser(tenantContext, requestingUser, userId, updates) {
    const targetUserId = parseInt(userId);
    
    // Users can update their own profile (limited fields)
    // Admins can update any user (all fields)
    const isOwnProfile = requestingUser.userId === targetUserId;
    const isAdmin = requestingUser.role === USER_ROLES.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      throw new InsufficientPermissionsError('update this user');
    }

    // Filter allowed updates based on permissions
    const allowedUpdates = isAdmin 
      ? ['name', 'role', 'status']  // Admins can update everything
      : ['name'];                   // Users can only update their name

    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // Validate role if being updated
    if (filteredUpdates.role && !isValidRole(filteredUpdates.role)) {
      throw new Error(`Invalid role: ${filteredUpdates.role}`);
    }

    // Validate name if being updated
    if (filteredUpdates.name && filteredUpdates.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    return await TenantUser.updateUserInTenant(tenantContext, userId, filteredUpdates);
  }

  /**
   * Delete user
   */
  async deleteUser(tenantContext, requestingUser, userId) {
    const targetUserId = parseInt(userId);

    // Only admins can delete users
    if (requestingUser.role !== USER_ROLES.ADMIN) {
      throw new InsufficientPermissionsError('delete users');
    }

    // Prevent self-deletion
    if (requestingUser.userId === targetUserId) {
      throw new Error('Cannot delete your own account');
    }

    return await TenantUser.deleteUserInTenant(tenantContext, userId);
  }

  /**
   * Get users by role
   */
  async getUsersByRole(tenantContext, requestingUser, role, options = {}) {
    // Only admins and managers can filter users by role
    if (!hasRole(requestingUser.role, USER_ROLES.MANAGER)) {
      throw new InsufficientPermissionsError('view users by role');
    }

    if (!isValidRole(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    return await TenantUser.getUsersByRole(tenantContext, role, options);
  }

  /**
   * Get tenant user statistics
   */
  async getTenantStats(tenantContext, requestingUser) {
    // Only admins can view tenant statistics
    if (requestingUser.role !== USER_ROLES.ADMIN) {
      throw new InsufficientPermissionsError('view tenant statistics');
    }

    return await TenantUser.getTenantStats(tenantContext);
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(tenantContext, requestingUser, userIds, updates) {
    // Only admins can perform bulk operations
    if (requestingUser.role !== USER_ROLES.ADMIN) {
      throw new InsufficientPermissionsError('perform bulk operations');
    }

    // Validate updates
    const allowedUpdates = ['role', 'status'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        if (key === 'role' && !isValidRole(value)) {
          throw new Error(`Invalid role: ${value}`);
        }
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid updates provided for bulk operation');
    }

    // Prevent self-modification in bulk operations
    if (userIds.includes(requestingUser.userId)) {
      throw new Error('Cannot include your own account in bulk operations');
    }

    return await TenantUser.bulkUpdateUsers(tenantContext, userIds, filteredUpdates);
  }

  /**
   * Change user password
   */
  async changePassword(tenantContext, requestingUser, oldPassword, newPassword) {
    return await authService.changePassword(
      requestingUser.userId,
      tenantContext.tenantId,
      oldPassword,
      newPassword
    );
  }

  /**
   * Reset user password (admin only)
   */
  async resetUserPassword(tenantContext, requestingUser, userId, newPassword) {
    // Only admins can reset passwords
    if (requestingUser.role !== USER_ROLES.ADMIN) {
      throw new InsufficientPermissionsError('reset passwords');
    }

    return await authService.resetPassword(
      userId,
      tenantContext.tenantId,
      newPassword,
      requestingUser.userId
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(tenantContext, requestingUser) {
    return await TenantUser.getUserInTenant(tenantContext, requestingUser.userId);
  }

  /**
   * Update current user profile
   */
  async updateCurrentUserProfile(tenantContext, requestingUser, updates) {
    // Users can only update their name and email
    const allowedUpdates = ['name'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (filteredUpdates.name && filteredUpdates.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    return await TenantUser.updateUserInTenant(tenantContext, requestingUser.userId, filteredUpdates);
  }

  /**
   * Validate user permissions for action
   */
  validatePermissions(requestingUser, requiredRole, action) {
    if (!hasRole(requestingUser.role, requiredRole)) {
      throw new InsufficientPermissionsError(action);
    }
    return true;
  }
}

// Export singleton instance
const userService = new UserService();
module.exports = userService;