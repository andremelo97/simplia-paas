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
 * @param {string} params.id - Tenant ID
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
 * @param {string} tenantId - Tenant ID
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
 * @param {string} tenantId - Tenant ID to validate
 * @throws {InvalidTenantError} If tenant ID is invalid
 */
function validateTenantId(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new InvalidTenantError('Tenant ID is required and must be a string');
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
 * @param {string} tenantId - Tenant ID
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