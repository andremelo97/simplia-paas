const { UserApplicationAccess } = require('../models/UserApplicationAccess');
const { TenantApplication } = require('../models/TenantApplication');
const AccessLog = require('../models/AccessLog');
const { Application } = require('../models/Application');

/**
 * Enterprise-grade middleware with 4-layer authorization + audit logging
 * Layer 1: Authentication, Layer 2: Tenant License, Layer 3: User Access, Layer 4: Role Check
 */
function requireAppAccess(applicationSlug, options = {}) {
  const { roleInApp, logAccess = true } = options;
  
  return async (req, res, next) => {
    let application = null;
    
    try {
      // LAYER 1: Authentication Check
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      if (!req.tenant) {
        return res.status(400).json({
          error: 'Bad Request', 
          message: 'Tenant context required'
        });
      }

      const { userId, tenantId } = req.user;
      const tenantIdFk = req.tenant.id;

      // Get application info for logging
      try {
        application = await Application.findBySlug(applicationSlug);
      } catch (error) {
        if (logAccess) {
          await AccessLog.logDenied(userId, tenantIdFk, null, 'application_not_found', req);
        }
        return res.status(404).json({
          error: 'Not Found',
          message: `Application not found: ${applicationSlug}`
        });
      }

      // LAYER 2: Tenant License Check
      const license = await TenantApplication.checkLicense(tenantIdFk, applicationSlug);
      if (!license) {
        if (logAccess) {
          await AccessLog.logDenied(userId, tenantIdFk, application.id, 'no_tenant_license', req);
        }
        return res.status(403).json({
          error: 'Application not licensed for this tenant',
          message: `Tenant does not have active license for ${applicationSlug}`
        });
      }

      // LAYER 3: Seat Availability Check
      const seats = await TenantApplication.checkSeatAvailability(tenantIdFk, application.id);
      if (seats && seats.seats_available <= 0) {
        if (logAccess) {
          await AccessLog.logDenied(userId, tenantIdFk, application.id, 'seat_limit_exceeded', req);
        }
        return res.status(403).json({
          error: 'User seat limit exceeded for this application', 
          message: `User limit exceeded for ${applicationSlug}`
        });
      }

      // LAYER 4: User Access Check (JWT first, DB fallback)
      let userAccess = null;
      
      // Fast JWT check
      if (req.user.allowedApps && req.user.allowedApps.includes(applicationSlug)) {
        userAccess = { hasAccess: true, source: 'jwt' };
      } else {
        // Database fallback
        const dbAccess = await UserApplicationAccess.hasAccess(userId, tenantId, applicationSlug);
        if (dbAccess) {
          userAccess = { hasAccess: true, source: 'database', ...dbAccess };
        }
      }

      if (!userAccess) {
        if (logAccess) {
          await AccessLog.logDenied(userId, tenantIdFk, application.id, 'no_user_access', req);
        }
        return res.status(403).json({
          error: 'User not allowed to access this application',
          message: `User access denied for ${applicationSlug}`
        });
      }

      // LAYER 5: Role Check (if required)
      if (roleInApp) {
        // Get user role from JWT token or database access record
        const currentUserRole = userAccess.role_in_app || req.user.role;
        
        // Role validation logic:
        // - admin: only admin role can access
        // - manager/operations: both manager and operations can access (same level)
        let hasRequiredRole = false;
        
        if (roleInApp === 'admin') {
          hasRequiredRole = currentUserRole === 'admin';
        } else if (roleInApp === 'manager' || roleInApp === 'operations') {
          // Both manager and operations have the same access level
          hasRequiredRole = ['manager', 'operations'].includes(currentUserRole);
        } else {
          // For any other specific role requirement
          hasRequiredRole = currentUserRole === roleInApp;
        }
        
        if (!hasRequiredRole) {
          if (logAccess) {
            await AccessLog.logDenied(userId, tenantIdFk, application.id, `role_insufficient_${roleInApp}`, req);
          }
          return res.status(403).json({
            error: 'Insufficient role for this endpoint',
            message: `Role '${roleInApp}' required for ${applicationSlug}`
          });
        }
      }

      // SUCCESS: All checks passed - attach context and log
      req.appAccess = {
        applicationSlug,
        applicationId: application.id,
        applicationName: application.name,
        roleInApp: userAccess.role_in_app || 'user',
        license,
        seats,
        accessSource: userAccess.source
      };

      if (logAccess) {
        await AccessLog.logGranted(userId, tenantIdFk, application.id, req);
      }

      next();
    } catch (error) {
      console.error('Application access middleware error:', error);
      
      if (logAccess && req.user && req.tenant) {
        try {
          await AccessLog.logDenied(
            req.user.userId, 
            req.tenant.id, 
            application?.id || null, 
            `middleware_error: ${error.message}`, 
            req
          );
        } catch (logError) {
          console.error('Failed to log access attempt:', logError);
        }
      }
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking application access'
      });
    }
  };
}

/**
 * Middleware to check if tenant has active license for application
 */
function requireTenantLicense(applicationSlug) {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Tenant context required'
        });
      }

      const { tenantId } = req.tenant;

      // Check if tenant has active license
      const hasLicense = await TenantApplication.hasActiveLicense(tenantId, applicationSlug);
      
      if (!hasLicense) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Tenant does not have active license for application: ${applicationSlug}`
        });
      }

      // Get license details and attach to request
      const licenseInfo = await TenantApplication.getLicenseInfo(tenantId, applicationSlug);
      req.tenantLicense = licenseInfo;

      next();
    } catch (error) {
      console.error('Tenant license middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking tenant license'
      });
    }
  };
}

/**
 * Combined middleware that checks both tenant license and user access
 */
function requireFullAppAccess(applicationSlug, options = {}) {
  return async (req, res, next) => {
    // First check tenant license
    const tenantLicenseCheck = requireTenantLicense(applicationSlug);
    
    tenantLicenseCheck(req, res, (error) => {
      if (error) return next(error);
      
      // Then check user access
      const userAccessCheck = requireAppAccess(applicationSlug, options);
      userAccessCheck(req, res, next);
    });
  };
}

/**
 * Middleware for transcription quote application access (using correct slug)
 */
function requireTranscriptionQuoteAccess(roleInApp) {
  return requireAppAccess('tq', { roleInApp });
}

/**
 * Admin role check for specific application
 */
function requireAppAdmin(applicationSlug) {
  return requireAppAccess(applicationSlug, { roleInApp: 'admin' });
}

/**
 * Check if user has any application access (for general dashboard)
 */
function requireAnyAppAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Check if user has any allowed apps
  if (req.user.allowedApps && req.user.allowedApps.length > 0) {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    message: 'No application access granted'
  });
}

/**
 * Get user's application access summary
 */
async function getAppAccessSummary(req, res, next) {
  if (!req.user) {
    return next();
  }

  try {
    const { userId, tenantId } = req.user;
    
    // Get fresh access data from database
    const userAccess = await UserApplicationAccess.findByUser(userId, tenantId, { isActive: true });
    
    req.appAccessSummary = {
      totalApps: userAccess.length,
      applications: userAccess.map(access => ({
        slug: access.application.slug,
        name: access.application.name,
        roleInApp: access.roleInApp,
        grantedAt: access.grantedAt,
        expiresAt: access.expiresAt
      }))
    };
    
    next();
  } catch (error) {
    console.error('Error getting app access summary:', error);
    req.appAccessSummary = { totalApps: 0, applications: [] };
    next();
  }
}

module.exports = {
  requireAppAccess,
  requireTenantLicense,
  requireFullAppAccess,
  requireTranscriptionQuoteAccess,
  requireAppAdmin,
  requireAnyAppAccess,
  getAppAccessSummary
};