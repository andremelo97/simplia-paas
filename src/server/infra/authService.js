const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { UserApplicationAccess } = require('./models/UserApplicationAccess');
const { TenantApplication } = require('./models/TenantApplication');
const { UserType } = require('./models/UserType');
const { 
  InvalidCredentialsError, 
  UserNotFoundError, 
  createJwtPayload,
  validatePassword,
  isValidEmail,
  USER_ROLES 
} = require('../../shared/types/user');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'simplia-paas'
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Get user entitlements (allowed app slugs and user type)
   */
  async getUserEntitlements(user, tenantIdFk) {
    try {
      // Get user's allowed application slugs (for JWT efficiency)
      let allowedApps = [];
      
      try {
        // First try to get from user access table
        const userApps = await UserApplicationAccess.getUserAllowedApps(user.id, user.tenantId);
        if (userApps && userApps.length > 0) {
          allowedApps = userApps.map(app => app.slug || app.application?.slug).filter(Boolean);
        } else {
          // Fallback to tenant-level allowed apps (all apps tenant has licensed)
          allowedApps = await TenantApplication.getAllowedAppSlugs(tenantIdFk);
        }
      } catch (error) {
        console.warn('Error getting user app access, falling back to tenant apps:', error.message);
        allowedApps = await TenantApplication.getAllowedAppSlugs(tenantIdFk);
      }

      // Get user type if available
      let userType = null;
      if (user.userTypeId) {
        try {
          userType = await UserType.findById(user.userTypeId);
        } catch (error) {
          console.warn(`User type not found for user ${user.id}:`, error.message);
        }
      }

      return { allowedApps, userType };
    } catch (error) {
      console.error('Error getting user entitlements:', error);
      return { allowedApps: [], userType: null };
    }
  }

  /**
   * Register new user
   */
  async register(tenantContext, userData) {
    const { email, password, name, role = USER_ROLES.OPERATIONS } = userData;

    // Validate input
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await User.create({
      tenantIdFk: tenantContext.id || tenantContext.tenantId,
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName: name.split(' ')[0] || name.trim(),
      lastName: name.split(' ').slice(1).join(' ') || '',
      role,
      status: 'active'
    });

    // Get user entitlements (pass tenant ID if available)
    const tenantIdFk = tenantContext.id || tenantContext.tenantId;
    const { allowedApps, userType } = await this.getUserEntitlements(user, tenantIdFk);

    // Ensure tenant context includes timezone (fetch from DB if missing)
    let enrichedTenantContext = tenantContext;
    if (!tenantContext.timezone) {
      try {
        const { Tenant } = require('./models/Tenant');
        const tenant = await Tenant.findById(tenantIdFk);
        if (tenant) {
          enrichedTenantContext = {
            ...tenantContext,
            timezone: tenant.timezone
          };
        }
      } catch (error) {
        console.warn('Failed to fetch tenant timezone, using default:', error.message);
      }
    }

    // Generate JWT payload with entitlements (includes timezone & locale)
    const jwtPayload = createJwtPayload(user, enrichedTenantContext, allowedApps, userType);

    // Generate token
    const token = this.generateToken(jwtPayload);

    return {
      user: user.getSafeData(),
      token,
      expiresIn: this.jwtExpiresIn,
      allowedApps,
      userType: userType ? userType.toJSON() : null
    };
  }

  /**
   * Platform login for Simplia internal team
   * Authenticate user without tenant context, verify platform_role = 'internal_admin'
   */
  async platformLogin(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new InvalidCredentialsError();
    }

    let user;
    try {
      // Find user in public.users table (no tenant context needed)
      user = await User.findByEmailGlobal(email.toLowerCase().trim());
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive or suspended');
    }

    // Verify platform role
    if (!user.platformRole || user.platformRole !== 'internal_admin') {
      throw new Error('Insufficient platform privileges - internal_admin role required');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Update last_login timestamp (side effect for platform login tracking)
    await user.updateLastLogin();

    // Create platform JWT payload (no tenant context, no app entitlements)
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
      iat: Math.floor(Date.now() / 1000),
      type: 'platform_admin'
    };
    
    // Generate token
    const token = this.generateToken(jwtPayload);

    return {
      user: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        platformRole: user.platformRole,
        active: user.active,
        createdAt: user.createdAt
      },
      token,
      expiresIn: this.jwtExpiresIn
    };
  }

  /**
   * Login user
   */
  async login(tenantContext, credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new InvalidCredentialsError();
    }

    let user;
    try {
      // Use numeric tenant ID for user lookup
      const tenantIdFk = tenantContext.id || tenantContext.tenantId;
      user = await User.findByEmail(email.toLowerCase().trim(), tenantIdFk);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive or suspended');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Get user entitlements (pass tenant ID if available)
    const tenantIdFk = tenantContext.id || tenantContext.tenantId;
    const { allowedApps, userType } = await this.getUserEntitlements(user, tenantIdFk);

    // Ensure tenant context includes timezone (fetch from DB if missing)
    let enrichedTenantContext = tenantContext;
    if (!tenantContext.timezone) {
      try {
        const { Tenant } = require('./models/Tenant');
        const tenant = await Tenant.findById(tenantIdFk);
        if (tenant) {
          enrichedTenantContext = {
            ...tenantContext,
            timezone: tenant.timezone
          };
        }
      } catch (error) {
        console.warn('Failed to fetch tenant timezone, using default:', error.message);
      }
    }

    // Generate JWT payload with entitlements (includes timezone & locale)
    const jwtPayload = createJwtPayload(user, enrichedTenantContext, allowedApps, userType);

    // Generate token
    const token = this.generateToken(jwtPayload);

    return {
      user: user.getSafeData(),
      token,
      expiresIn: this.jwtExpiresIn,
      allowedApps,
      userType: userType ? userType.toJSON() : null
    };
  }

  /**
   * Refresh token
   */
  async refreshToken(oldToken) {
    try {
      const payload = this.verifyToken(oldToken);

      // For platform admin tokens, use global lookup
      let user;
      if (payload.type === 'platform_admin') {
        user = await User.findByIdGlobal(payload.userId);
      } else {
        // Use numeric tenant ID from JWT payload
        const tenantIdFk = payload.tenantId; // Should be numeric in new tokens
        user = await User.findById(payload.userId, tenantIdFk);
      }

      if (user.status !== 'active') {
        throw new Error('User account is no longer active');
      }

      // Get fresh user entitlements (they might have changed)
      const tenantIdFk = payload.tenantId; // Use numeric ID from JWT
      const { allowedApps, userType } = await this.getUserEntitlements(user, tenantIdFk);

      // Fetch fresh tenant timezone (might have changed)
      let tenantContext = {
        tenantId: tenantIdFk,
        schema: payload.schema,
        id: tenantIdFk,
        timezone: payload.timezone // Use existing timezone from old token as fallback
      };

      try {
        const { Tenant } = require('./models/Tenant');
        const tenant = await Tenant.findById(tenantIdFk);
        if (tenant) {
          tenantContext.timezone = tenant.timezone;
        }
      } catch (error) {
        console.warn('Failed to fetch tenant timezone during refresh, using token value:', error.message);
      }

      // Create new token with fresh entitlements and timezone
      const newPayload = createJwtPayload(user, tenantContext, allowedApps, userType);

      const newToken = this.generateToken(newPayload);

      return {
        user: user.getSafeData(),
        token: newToken,
        expiresIn: this.jwtExpiresIn,
        allowedApps,
        userType: userType ? userType.toJSON() : null
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, tenantId, oldPassword, newPassword) {
    const user = await User.findById(userId, tenantId);

    // Verify old password
    const isOldPasswordValid = await this.comparePassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await user.updatePassword(newPasswordHash);

    return {
      message: 'Password changed successfully',
      user: user.getSafeData()
    };
  }

  /**
   * Reset password (admin only)
   */
  async resetPassword(userId, tenantId, newPassword, adminUserId) {
    // Verify admin permissions
    const adminUser = await User.findById(adminUserId, tenantId);
    if (adminUser.role !== USER_ROLES.ADMIN) {
      throw new Error('Insufficient permissions to reset password');
    }

    const user = await User.findById(userId, tenantId);

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await user.updatePassword(newPasswordHash);

    return {
      message: 'Password reset successfully',
      user: user.getSafeData(),
      resetBy: adminUser.getSafeData()
    };
  }

  /**
   * Logout (token blacklisting would be implemented here in production)
   */
  async logout(token) {
    // In a production environment, you would add this token to a blacklist
    // For now, we'll just verify the token and return success
    try {
      this.verifyToken(token);
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Invalid token for logout');
    }
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token) {
    const payload = this.verifyToken(token);
    
    // Handle platform admin vs regular user tokens
    let user;
    if (payload.type === 'platform_admin') {
      user = await User.findByIdGlobal(payload.userId);
    } else {
      // Use numeric tenant ID from JWT
      user = await User.findById(payload.userId, payload.tenantId);
    }
    
    if (user.status !== 'active') {
      throw new Error('User account is no longer active');
    }

    return {
      user: user.getSafeData(),
      tenant: payload.type === 'platform_admin' ? null : {
        tenantId: payload.tenantId, // Numeric ID
        schema: payload.schema
      }
    };
  }
}

// Export singleton instance
const authService = new AuthService();
module.exports = authService;