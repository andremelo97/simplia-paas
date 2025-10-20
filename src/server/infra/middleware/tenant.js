const database = require('../db/database');

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
      // Compatibility flag for slug fallback (default: disabled)
      compatSlugFallback: options.compatSlugFallback ?? (process.env.COMPAT_TENANT_SLUG_FALLBACK === 'true'),
    };
  }

  /**
   * Check if route is tenant-scoped (requires x-tenant-id header)
   */
  isTenantScopedRoute(req) {
    const path = req.path;
    
    // Tenant-scoped routes that REQUIRE x-tenant-id header
    const tenantScopedPaths = [
      '/internal/api/v1/users', // tenant-scoped user routes (requires x-tenant-id)
    ];
    
    // Platform-scoped routes (no tenant header required)
    const platformScopedPaths = [
      '/internal/api/v1/applications',
      '/internal/api/v1/platform-auth',
      '/internal/api/v1/tenants', // tenant management is platform-scoped
      '/internal/api/v1/audit',
      '/internal/api/v1/me', // self-service routes use public schema only
      '/internal/api/v1/entitlements', // entitlements queries only public schema
      '/health',
      '/docs',
    ];
    
    // Check platform-scoped first (more specific)
    for (const platformPath of platformScopedPaths) {
      if (path.startsWith(platformPath)) {
        return false;
      }
    }
    
    // Check tenant-scoped patterns
    for (const tenantPath of tenantScopedPaths) {
      if (path.startsWith(tenantPath.replace('/:id', '')) || path.includes('/users')) {
        return true;
      }
    }
    
    // Default: API routes are tenant-scoped unless explicitly platform-scoped
    return path.startsWith('/internal/api/') || path.startsWith('/api/');
  }

  /**
   * Extract tenant ID from request using various resolution methods
   */
  extractTenantId(req) {
    const isTenantScoped = this.isTenantScopedRoute(req);
    
    // Method 1: Header-based resolution (priority)
    const headerTenantId = req.get(this.options.headerName);
    if (headerTenantId) {
      return { identifier: headerTenantId, source: 'header' };
    }

    // For tenant-scoped routes, header is MANDATORY
    if (isTenantScoped) {
      throw new InvalidTenantError(`${this.options.headerName} header is required for tenant-scoped API access`);
    }

    // Method 2: Subdomain-based resolution (only for non-API routes or with compat flag)
    if (this.options.enableSubdomainResolution && (this.options.compatSlugFallback || !req.path.startsWith('/internal/api/'))) {
      const host = req.get('host');
      if (host) {
        const subdomain = this.extractSubdomain(host);
        if (subdomain) {
          return { identifier: subdomain, source: 'subdomain' };
        }
      }
    }

    // Method 3: Path-based resolution
    if (this.options.enablePathResolution) {
      const pathTenantId = this.extractTenantFromPath(req.path);
      if (pathTenantId) {
        return { identifier: pathTenantId, source: 'path' };
      }
    }

    // Fallback to default tenant (only if compat flag enabled)
    if (this.options.compatSlugFallback) {
      return { identifier: this.options.defaultTenant, source: 'fallback' };
    }

    console.error(`[Tenant] No tenant identifier - Path: ${req.path}, Method: ${req.method}, Headers:`, {
      'x-tenant-id': req.headers['x-tenant-id'],
      'host': req.headers['host'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
    throw new InvalidTenantError('No tenant identifier found and compatibility fallback is disabled');
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
   * Validate tenant identifier format (accepts numeric ID or slug)
   */
  validateTenantIdentifier(identifier) {
    if (!identifier) {
      throw new InvalidTenantError('Tenant identifier is required');
    }

    // Allow numeric IDs (preferred)
    if (/^\d+$/.test(identifier)) {
      const numericId = parseInt(identifier, 10);
      if (numericId <= 0) {
        throw new InvalidTenantError(`Invalid numeric tenant ID: ${identifier}`);
      }
      return;
    }

    // Allow string slugs (deprecated but supported for compatibility)
    const validSlugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validSlugRegex.test(identifier)) {
      throw new InvalidTenantError(`Invalid tenant identifier format: ${identifier}`);
    }

    // Length validation for slugs only
    if (identifier.length < 2 || identifier.length > 50) {
      throw new InvalidTenantError(`Tenant slug length must be between 2-50 characters: ${identifier}`);
    }
  }

  /**
   * Resolve tenant from database using dual resolution (numeric ID or slug)
   */
  async resolveTenant(identifier, source, userAgent = 'unknown') {
    const inputFormat = /^\d+$/.test(identifier) ? 'numeric' : 'slug';
    
    // Check if identifier is numeric (preferred)
    if (inputFormat === 'numeric') {
      const numericId = parseInt(identifier, 10);
      const query = 'SELECT * FROM tenants WHERE id = $1 AND active = true';
      const result = await database.query(query, [numericId]);
      
      if (result.rows.length === 0) {
        throw new TenantNotFoundError(`Tenant not found by ID: ${numericId}`);
      }
      
      return { tenant: result.rows[0], inputFormat, source };
    }
    
    // String identifier (slug/subdomain) - resolve to numeric ID
    // Always resolve slug to ID via query for compatibility, no warnings
    const query = 'SELECT * FROM tenants WHERE subdomain = $1 AND active = true';
    const result = await database.query(query, [identifier]);
    
    if (result.rows.length === 0) {
      throw new TenantNotFoundError(`Tenant not found by slug: ${identifier}`);
    }
    
    return { tenant: result.rows[0], inputFormat, source };
  }

  /**
   * Convert tenant to schema name using slug
   */
  tenantToSchema(tenant) {
    // Use tenant slug for schema name, convert hyphens to underscores (e.g., tenant_test_andre)
    const schemaSlug = tenant.subdomain.replace(/-/g, '_');
    return `tenant_${schemaSlug}`;
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
   * Apply tenant schema search_path and timezone for database queries
   * Only called for tenant-scoped routes
   */
  async applyTenantSearchPath(schemaName, tenantTimezone) {
    try {
      // Check if schema exists before applying search_path
      const schemaExists = await database.schemaExists(schemaName);
      if (!schemaExists) {
        console.warn(`Schema ${schemaName} does not exist, skipping search_path application`);
        return;
      }

      // Use a transaction to ensure SET LOCAL works properly
      await database.query('BEGIN');

      try {
        // Set search_path to tenant schema first, then public for fallback
        const searchPathQuery = `SET LOCAL search_path TO ${schemaName}, public`;
        await database.query(searchPathQuery);

        // ALWAYS use UTC for database timestamps (industry standard)
        // Frontend will convert UTC to tenant timezone for display
        const timezoneQuery = `SET LOCAL TIME ZONE 'UTC'`;
        await database.query(timezoneQuery);
        console.log(`Applied UTC timezone and search_path: ${schemaName}, public`);

        await database.query('COMMIT');
      } catch (error) {
        await database.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Failed to apply tenant search_path/timezone for ${schemaName}:`, error);
      // Don't throw error, just warn - let query proceed with default search_path
      console.warn(`Continuing with default search_path (public)`);
    }
  }

  /**
   * Express middleware function
   */
  middleware = async (req, res, next) => {
    try {
      // Extract tenant identifier from request
      const { identifier: rawIdentifier, source } = this.extractTenantId(req);
      const userAgent = req.get('user-agent') || 'unknown';
      
      // Validate identifier format (accepts both numeric and slug)
      this.validateTenantIdentifier(rawIdentifier);
      
      // Resolve tenant using dual resolution (numeric ID or slug)
      const { tenant, inputFormat } = await this.resolveTenant(rawIdentifier, source, userAgent);
      
      // Use tenant slug for schema name (e.g., tenant_test_andre)
      const schema = this.tenantToSchema(tenant);
      
      // Validate schema exists (non-blocking for tenant-scoped routes)
      try {
        await this.validateSchema(schema);
      } catch (schemaError) {
        if (isTenantScoped) {
          // For tenant-scoped routes, warn but continue
          console.warn(`Schema validation failed for ${schema}, continuing with public schema:`, schemaError.message);
        } else {
          // For platform routes, schema validation failure is not critical
          console.log(`Schema validation skipped for platform route: ${req.path}`);
        }
      }
      
      // Create normalized tenant context - ID ALWAYS numeric, no string persistence
      const tenantContext = {
        id: tenant.id,           // ALWAYS INTEGER (source of truth)
        slug: tenant.subdomain,  // Read-only display/URL-friendly identifier
        schema,
        timezone: tenant.timezone, // Tenant timezone for session configuration
        name: tenant.name,
        status: tenant.status,
        // Resolution metadata (for logging only)
        source,
        inputFormat
      };
      
      // Attach to request
      req.tenant = tenantContext;
      
      // Initialize user context placeholder
      req.user = null;
      
      // Apply tenant schema search_path and timezone for tenant-scoped routes only
      // Platform/Global routes stay in public schema
      const isTenantScoped = this.isTenantScopedRoute(req);
      if (isTenantScoped) {
        await this.applyTenantSearchPath(schema, tenant.timezone);
      }
      
      // Enhanced telemetry logging
      const isCurl = userAgent.toLowerCase().includes('curl/');
      const logLevel = (inputFormat === 'slug' && !isCurl) ? 'warn' : 'log';
      
      console[logLevel]('Tenant resolved:', {
        id: tenant.id,
        slug: tenant.subdomain,
        schema,
        inputFormat,
        method: source,
        userAgent: isCurl ? 'curl' : userAgent.substring(0, 50),
        ip: req.ip,
        path: req.path,
        compatMode: this.options.compatSlugFallback,
        tenantScoped: isTenantScoped,
        searchPathApplied: isTenantScoped ? `${schema}, public` : 'public (default)'
      });
      
      next();
    } catch (error) {
      console.error('Tenant resolution error:', error);
      
      if (error instanceof TenantNotFoundError || error instanceof InvalidTenantError) {
        // Enhanced error responses with helpful guidance
        const errorResponse = {
          error: 'TENANT_RESOLUTION_FAILED',
          message: error.message,
          code: error instanceof TenantNotFoundError ? 'TENANT_NOT_FOUND' : 'INVALID_TENANT_ID'
        };
        
        // Add helpful guidance for common errors
        if (error.message.includes('header is required')) {
          errorResponse.guidance = `Include numeric tenant ID in ${this.options.headerName} header (e.g., '${this.options.headerName}: 1')`;
          errorResponse.examples = {
            curl: `curl -H '${this.options.headerName}: 1' ${req.protocol}://${req.get('host')}${req.path}`,
            javascript: `fetch(url, { headers: { '${this.options.headerName}': '1' } })`
          };
        }
        
        if (error.message.includes('Slug-based tenant resolution is disabled')) {
          errorResponse.guidance = 'Use numeric tenant ID instead of slug. Enable COMPAT_TENANT_SLUG_FALLBACK=true for temporary compatibility.';
        }
        
        return res.status(error.message.includes('header is required') ? 422 : 400).json(errorResponse);
      }
      
      // Generic server error
      return res.status(500).json({
        error: 'TENANT_RESOLUTION_ERROR',
        message: 'Failed to resolve tenant',
        code: 'INTERNAL_ERROR'
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