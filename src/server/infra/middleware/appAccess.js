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
      console.log(`\n🔐 [Auth Middleware] Checking access for ${applicationSlug}`);

      // LAYER 1: Authentication Check
      console.log('📋 [Layer 1] Authentication check:', {
        hasUser: !!req.user,
        hasTenant: !!req.tenant,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
        allowedApps: req.user?.allowedApps
      });

      if (!req.user) {
        console.log('❌ [Layer 1] FAILED: No user in request');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      if (!req.tenant) {
        console.log('❌ [Layer 1] FAILED: No tenant in request');
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Tenant context required'
        });
      }

      const { userId, tenantId } = req.user;
      const tenantIdFk = req.tenant.id;

      console.log('✅ [Layer 1] PASSED:', { userId, tenantId, tenantIdFk });

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
      console.log('📋 [Layer 2] Checking tenant license:', { tenantIdFk, applicationSlug });
      const license = await TenantApplication.checkLicense(tenantIdFk, applicationSlug);
      console.log('📋 [Layer 2] License result:', license);

      if (!license) {
        console.log('❌ [Layer 2] FAILED: No tenant license found');
        if (logAccess) {
          await AccessLog.logDenied(userId, tenantIdFk, application.id, 'no_tenant_license', req);
        }
        return res.status(403).json({
          error: 'Application not licensed for this tenant',
          message: `Tenant does not have active license for ${applicationSlug}`
        });
      }

      console.log('✅ [Layer 2] PASSED: Tenant has license');

      // LAYER 3: Get Seat Information (for logging only - not for blocking access)
      // Seat limits are enforced at grant time via Internal Admin, not at API usage time
      const seats = await TenantApplication.checkSeatAvailability(tenantIdFk, application.id);

      // LAYER 4: User Access Check (JWT first, DB fallback)
      console.log('📋 [Layer 3] Checking user access:', {
        userId,
        tenantId,
        applicationSlug,
        jwtAllowedApps: req.user.allowedApps
      });

      let userAccess = null;

      // Fast JWT check
      if (req.user.allowedApps && req.user.allowedApps.includes(applicationSlug)) {
        console.log('✅ [Layer 3] User access found in JWT token');
        userAccess = { hasAccess: true, source: 'jwt' };
      } else {
        console.log('⚠️  [Layer 3] App not in JWT, checking database fallback...');
        // Database fallback
        const dbAccess = await UserApplicationAccess.hasAccess(userId, tenantId, applicationSlug);
        console.log('📋 [Layer 3] Database access result:', dbAccess);

        if (dbAccess) {
          console.log('✅ [Layer 3] User access found in database');
          userAccess = { hasAccess: true, source: 'database', ...dbAccess };
        }
      }

      if (!userAccess) {
        console.log('❌ [Layer 3] FAILED: No user access found in JWT or database');
        if (logAccess) {
          await AccessLog.logDenied(userId, tenantIdFk, application.id, 'no_user_access', req);
        }
        return res.status(403).json({
          error: 'User not allowed to access this application',
          message: `User access denied for ${applicationSlug}`
        });
      }

      console.log('✅ [Layer 3] PASSED:', userAccess);

      // LAYER 5: Role Check (if required)
      if (roleInApp) {
        console.log('📋 [Layer 4] Checking role requirement:', {
          requiredRole: roleInApp,
          currentRole: userAccess.role_in_app || req.user.role
        });

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
          console.log('❌ [Layer 4] FAILED: Insufficient role');
          if (logAccess) {
            await AccessLog.logDenied(userId, tenantIdFk, application.id, `role_insufficient_${roleInApp}`, req);
          }
          return res.status(403).json({
            error: 'Insufficient role for this endpoint',
            message: `Role '${roleInApp}' required for ${applicationSlug}`
          });
        }

        console.log('✅ [Layer 4] PASSED: Role check successful');
      }

      // SUCCESS: All checks passed - attach context and log
      console.log('🎉 [Auth Middleware] SUCCESS: All checks passed\n');

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