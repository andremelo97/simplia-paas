const database = require('../config/database');

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

class TenantMiddleware {
  constructor(options = {}) {
    this.options = {
      headerName: options.headerName || process.env.TENANT_HEADER_NAME || 'x-tenant-id',
      defaultTenant: options.defaultTenant || process.env.DEFAULT_TENANT || 'default',
      enableSubdomainResolution: options.enableSubdomainResolution ?? true,
      enablePathResolution: options.enablePathResolution ?? false,
      validateSchema: options.validateSchema ?? true,
    };
  }

  /**
   * Extract tenant ID from request using various resolution methods
   */
  extractTenantId(req) {
    // Method 1: Header-based resolution (priority)
    const headerTenantId = req.get(this.options.headerName);
    if (headerTenantId) {
      return headerTenantId;
    }

    // For API routes, require explicit tenant header
    if (req.path.startsWith('/internal/api/') || req.path.startsWith('/api/')) {
      throw new InvalidTenantError('Tenant ID header required for API access');
    }

    // Method 2: Subdomain-based resolution
    if (this.options.enableSubdomainResolution) {
      const host = req.get('host');
      if (host) {
        const subdomain = this.extractSubdomain(host);
        if (subdomain) {
          return subdomain;
        }
      }
    }

    // Method 3: Path-based resolution
    if (this.options.enablePathResolution) {
      const pathTenantId = this.extractTenantFromPath(req.path);
      if (pathTenantId) {
        return pathTenantId;
      }
    }

    // Fallback to default tenant
    return this.options.defaultTenant;
  }

  /**
   * Extract subdomain from host header
   */
  extractSubdomain(host) {
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];
    
    // Don't extract subdomain from IP addresses
    const ipRegex = /^\d+\.\d+\.\d+\.\d+$/;
    if (ipRegex.test(hostWithoutPort)) {
      return null;
    }
    
    const parts = hostWithoutPort.split('.');
    // Assuming format: tenant.domain.com
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Filter out common non-tenant subdomains
      const commonSubdomains = ['www', 'api', 'admin', 'app', 'localhost'];
      if (!commonSubdomains.includes(subdomain)) {
        return subdomain;
      }
    }
    return null;
  }

  /**
   * Extract tenant from URL path
   */
  extractTenantFromPath(path) {
    // Format: /tenant/{tenantId}/api/...
    const match = path.match(/^\/tenant\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate tenant ID format
   */
  validateTenantId(tenantId) {
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
   * Convert tenant ID to schema name
   */
  tenantIdToSchema(tenantId) {
    // For security, prefix all tenant schemas
    return `tenant_${tenantId}`;
  }

  /**
   * Validate that schema exists in database
   */
  async validateSchema(schemaName) {
    if (this.options.validateSchema) {
      const exists = await database.schemaExists(schemaName);
      if (!exists) {
        throw new TenantNotFoundError(`Schema not found: ${schemaName}`);
      }
    }
  }

  /**
   * Express middleware function
   */
  middleware = async (req, res, next) => {
    try {
      // Extract tenant ID from request
      const tenantId = this.extractTenantId(req);
      
      // Validate tenant ID format
      this.validateTenantId(tenantId);
      
      // Convert to schema name
      const schema = this.tenantIdToSchema(tenantId);
      
      // Validate schema exists
      await this.validateSchema(schema);
      
      // Get tenant record from database to get the integer ID
      const tenantQuery = `SELECT * FROM tenants WHERE subdomain = $1 AND active = true`;
      const tenantResult = await database.query(tenantQuery, [tenantId]);
      
      if (tenantResult.rows.length === 0) {
        throw new TenantNotFoundError(`Tenant not found in database: ${tenantId}`);
      }
      
      const tenant = tenantResult.rows[0];
      
      // Create tenant context with both string subdomain and integer ID
      const tenantContext = {
        id: tenant.id,           // INTEGER for database foreign keys
        tenantId,                // STRING subdomain for backwards compatibility  
        schema,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status
      };
      
      // Attach to request
      req.tenant = tenantContext;
      
      // Initialize user context placeholder
      req.user = null;
      
      // Log tenant resolution
      console.log('Tenant resolved:', {
        tenantId,
        schema,
        method: req.get(this.options.headerName) ? 'header' : 'subdomain',
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
      
      next();
    } catch (error) {
      console.error('Tenant resolution error:', error);
      
      if (error instanceof TenantNotFoundError || error instanceof InvalidTenantError) {
        // More specific error based on the message
        if (error.message.includes('header required')) {
          return res.status(400).json({
            error: {
              message: error.message
            }
          });
        }
        
        return res.status(400).json({
          error: {
            message: error.message
          }
        });
      }
      
      // Generic server error
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to resolve tenant',
      });
    }
  };
}

// Export configured middleware instance
const tenantMiddleware = new TenantMiddleware();
module.exports = tenantMiddleware.middleware;

// Export class for custom configuration
module.exports.TenantMiddleware = TenantMiddleware;
module.exports.TenantNotFoundError = TenantNotFoundError;
module.exports.InvalidTenantError = InvalidTenantError;