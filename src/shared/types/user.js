// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  OPERATIONS: 'operations'
};

// User status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

/**
 * Create a new user object
 * @param {Object} params - User parameters
 * @param {number} params.tenantId - Tenant ID (numeric _fk)
 * @param {string} params.email - User email
 * @param {string} params.passwordHash - Hashed password
 * @param {string} params.name - Full name
 * @param {string} params.role - User role (admin, manager, operations)
 * @param {string} [params.status='active'] - User status
 * @returns {Object} User object
 */
function createUser({ tenantId, email, passwordHash, name, role, status = USER_STATUS.ACTIVE }) {
  return {
    tenantId,
    email,
    passwordHash,
    name,
    role,
    status,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create JWT payload
 * @param {Object} user - User object
 * @param {Object} tenant - Tenant context (must include timezone)
 * @param {Array} allowedApps - Applications user has access to
 * @param {Object} userType - User type information
 * @returns {Object} JWT payload
 */
function createJwtPayload(user, tenant, allowedApps = [], userType = null) {
  // ALWAYS use numeric tenant ID (_fk) - no legacy string support
  const numericTenantId = user.tenantIdFk || tenant.id;
  if (!numericTenantId || typeof numericTenantId !== 'number') {
    throw new Error(`JWT payload requires numeric tenant ID, got: ${numericTenantId}`);
  }

  // Derive locale from timezone using mapping utility
  let locale = 'en-US'; // Default to English US
  if (tenant.timezone) {
    try {
      const { getLocaleFromTimezone } = require('../../server/infra/utils/localeMapping');
      locale = getLocaleFromTimezone(tenant.timezone);
      console.log(`[JWT] Derived locale '${locale}' from timezone '${tenant.timezone}'`);
    } catch (error) {
      console.warn('[JWT] Failed to derive locale from timezone, using default en-US:', error.message);
    }
  }

  return {
    userId: user.id,
    tenantId: numericTenantId, // ALWAYS numeric tenant ID (_fk)
    email: user.email,
    name: user.name,
    role: user.role,
    schema: tenant.schema,
    timezone: tenant.timezone || 'America/Sao_Paulo', // IANA timezone identifier
    locale: locale, // Derived from timezone (pt-BR, en-AU, etc.)
    allowedApps: allowedApps,
    userType: userType ? {
      id: userType.id,
      slug: userType.slug,
      hierarchyLevel: userType.hierarchyLevel
    } : null,
    platformRole: user.platformRole || null, // 'internal_admin' para equipe Simplia
    iat: Math.floor(Date.now() / 1000)
  };
}

/**
 * Create user context for requests
 * @param {Object} user - User object
 * @param {Object} tenant - Tenant context
 * @returns {Object} User context
 */
function createUserContext(user, tenant) {
  // ALWAYS use numeric tenant ID (_fk) - no legacy string support
  const numericTenantId = user.tenantIdFk || tenant?.id;
  if (tenant && (!numericTenantId || typeof numericTenantId !== 'number')) {
    throw new Error(`User context requires numeric tenant ID, got: ${numericTenantId}`);
  }

  return {
    userId: user.id,
    tenantId: numericTenantId, // ALWAYS numeric tenant ID (_fk)
    email: user.email,
    name: user.name,
    firstName: user.firstName,  // Add for template variables (camelCase from User model)
    lastName: user.lastName,    // Add for template variables (camelCase from User model)
    role: user.role,
    tenant: tenant
  };
}

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
function isValidRole(role) {
  return Object.values(USER_ROLES).includes(role);
}

/**
 * Check if user has required role or higher
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Required role
 * @returns {boolean} True if user has permission
 */
function hasRole(userRole, requiredRole) {
  const roleHierarchy = {
    [USER_ROLES.OPERATIONS]: 1,
    [USER_ROLES.MANAGER]: 2,
    [USER_ROLES.ADMIN]: 3
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
  
  return {
    isValid,
    errors: [
      ...(password.length < minLength ? [`Password must be at least ${minLength} characters`] : []),
      ...(!hasUpperCase ? ['Password must contain uppercase letter'] : []),
      ...(!hasLowerCase ? ['Password must contain lowercase letter'] : []),
      ...(!hasNumbers ? ['Password must contain number'] : [])
    ]
  };
}

// Custom errors
class UserNotFoundError extends Error {
  constructor(identifier) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

class DuplicateUserError extends Error {
  constructor(email) {
    super(`User with email ${email} already exists in this tenant`);
    this.name = 'DuplicateUserError';
  }
}

class InsufficientPermissionsError extends Error {
  constructor(action) {
    super(`Insufficient permissions to ${action}`);
    this.name = 'InsufficientPermissionsError';
  }
}

module.exports = {
  // Constants
  USER_ROLES,
  USER_STATUS,
  
  // Factory functions
  createUser,
  createJwtPayload,
  createUserContext,
  
  // Validation functions
  isValidRole,
  hasRole,
  isValidEmail,
  validatePassword,
  
  // Error classes
  UserNotFoundError,
  InvalidCredentialsError,
  DuplicateUserError,
  InsufficientPermissionsError
};