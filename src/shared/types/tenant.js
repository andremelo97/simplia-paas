class TenantNotFoundError extends Error {
  constructor(tenantId) {
    super(`Tenant not found: ${tenantId}`);
    this.name = 'TenantNotFoundError';
  }
}

class InvalidTenantError extends Error {
  constructor(message) {
    super(`Invalid tenant: ${message}`);
    this.name = 'InvalidTenantError';
  }
}

// Tenant resolution methods
const TENANT_RESOLUTION_METHODS = {
  HEADER: 'header',
  SUBDOMAIN: 'subdomain',
  PATH: 'path'
};

// Default tenant configuration
const DEFAULT_TENANT_CONFIG = {
  defaultTenant: 'default',
  headerName: 'x-tenant-id',
  resolutionMethod: TENANT_RESOLUTION_METHODS.HEADER
};

/**
 * Create a new tenant object
 * @param {Object} params - Tenant parameters
 * @param {number} params.id - Tenant ID (numeric)
 * @param {string} params.name - Tenant name
 * @param {string} params.schema - Database schema name
 * @param {string} [params.subdomain] - Optional subdomain
 * @param {boolean} [params.active=true] - Whether tenant is active
 * @returns {Object} Tenant object
 */
function createTenant({ id, name, schema, subdomain = null, active = true }) {
  return {
    id,
    name,
    schema,
    subdomain,
    active,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a new tenant context
 * @param {number} tenantId - Tenant ID (numeric)
 * @param {string} schema - Database schema name
 * @returns {Object} Tenant context object
 */
function createTenantContext(tenantId, schema) {
  return {
    tenantId,
    schema
  };
}

/**
 * Validate tenant ID format
 * @param {number|string} tenantId - Tenant ID to validate (accepts numeric or string for backward compatibility)
 * @throws {InvalidTenantError} If tenant ID is invalid
 */
function validateTenantId(tenantId) {
  if (!tenantId) {
    throw new InvalidTenantError('Tenant ID is required');
  }

  // Prefer numeric IDs, but allow string slugs for backward compatibility
  if (typeof tenantId === 'number') {
    if (tenantId <= 0 || !Number.isInteger(tenantId)) {
      throw new InvalidTenantError(`Tenant ID must be a positive integer: ${tenantId}`);
    }
    return; // Valid numeric ID
  }

  // Legacy string validation (for backward compatibility)
  if (typeof tenantId !== 'string') {
    throw new InvalidTenantError('Tenant ID must be a number or string');
  }

  // Basic validation - alphanumeric, underscore, hyphen
  const validTenantRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validTenantRegex.test(tenantId)) {
    throw new InvalidTenantError(`Invalid tenant ID format: ${tenantId}`);
  }

  // Length validation
  if (tenantId.length < 2 || tenantId.length > 50) {
    throw new InvalidTenantError(`Tenant ID length must be between 2-50 characters: ${tenantId}`);
  }
}

/**
 * Convert tenant ID to schema name with security prefix
 * @param {number|string} tenantId - Tenant ID (numeric preferred, string for backward compatibility)
 * @returns {string} Schema name
 */
function tenantIdToSchema(tenantId) {
  validateTenantId(tenantId);
  return `tenant_${tenantId}`;
}

module.exports = {
  // Classes
  TenantNotFoundError,
  InvalidTenantError,
  
  // Constants
  TENANT_RESOLUTION_METHODS,
  DEFAULT_TENANT_CONFIG,
  
  // Factory functions
  createTenant,
  createTenantContext,
  
  // Utility functions
  validateTenantId,
  tenantIdToSchema
};