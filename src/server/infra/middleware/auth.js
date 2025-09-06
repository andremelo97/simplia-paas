const authService = require('../authService');
const User = require('../models/User');
const { createUserContext } = require('../../../shared/types/user');

/**
 * Extract JWT token from request headers
 */
function extractToken(req) {
  const authHeader = req.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer token" and "token" formats
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  
  return null;
}

/**
 * Authentication middleware - requires valid JWT token
 */
async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    console.log('🔍 [AUTH] Request:', req.method, req.path, '| Token present:', !!token);
    
    if (!token) {
      console.log('❌ [AUTH] No token provided');
      return res.status(401).json({
        error: {
          message: 'No authentication token provided'
        }
      });
    }
    
    // Verify token
    console.log('🔑 [AUTH] Verifying JWT token...');
    const payload = authService.verifyToken(token);
    console.log('✅ [AUTH] Token verified, payload:', {
      userId: payload.userId,
      tenantId: payload.tenantId,
      type: payload.type,
      platformRole: payload.platformRole,
      role: payload.role
    });
    
    // Verify user still exists and is active
    // For platform admin tokens (type: 'platform_admin'), use global lookup
    let user;
    console.log('👤 [AUTH] Looking up user...');
    if (payload.type === 'platform_admin') {
      console.log('🌐 [AUTH] Using global lookup for platform admin');
      user = await User.findByIdGlobal(payload.userId);
    } else {
      console.log('🏢 [AUTH] Using tenant-scoped lookup');
      user = await User.findById(payload.userId, payload.tenantId);
    }
    console.log('✅ [AUTH] User found:', {
      id: user.id,
      email: user.email,
      status: user.status,
      platformRole: user.platformRole
    });
    
    if (user.status !== 'active') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account is inactive'
      });
    }
    
    // Verify tenant matches (security check) - skip for platform admin tokens
    // Note: payload.tenantId is numeric, req.tenant.id is also numeric
    if (payload.type !== 'platform_admin' && req.tenant && req.tenant.id !== payload.tenantId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Token tenant does not match request tenant'
      });
    }
    
    // Create user context with JWT payload data
    // For platform admin tokens, create minimal context without tenant data
    let userContext;
    if (payload.type === 'platform_admin') {
      userContext = createUserContext(user, null);
    } else {
      userContext = createUserContext(user, req.tenant || { 
        tenantId: payload.tenantId, 
        schema: payload.schema 
      });
    }
    
    // Add JWT payload data that isn't in the user context
    userContext.allowedApps = payload.allowedApps || [];
    userContext.userType = payload.userType;
    
    // Add platform role from database or JWT payload
    userContext.platformRole = user.platform_role || payload.platformRole;
    
    // Override role with JWT payload if present (for testing and flexibility)
    if (payload.role) {
      userContext.role = payload.role;
    }
    
    // Attach user context to request
    req.user = userContext;
    
    // Log authentication
    console.log('User authenticated:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: payload.tenantId,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Check for specific error types
    if (error.message && error.message.includes('expired')) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired'
      });
    }
    
    return res.status(401).json({
      error: 'Invalid token signature',
      message: 'Invalid authentication token'
    });
  }
}

/**
 * Optional authentication middleware - sets user context if token is valid
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      // No token provided - continue without user context
      return next();
    }
    
    // Verify token
    const payload = authService.verifyToken(token);
    
    // Verify user still exists and is active
    // Handle platform admin vs regular user tokens
    let user;
    if (payload.type === 'platform_admin') {
      user = await User.findByIdGlobal(payload.userId);
    } else {
      user = await User.findById(payload.userId, payload.tenantId);
    }
    
    if (user.status === 'active') {
      // Create user context only if user is active
      let userContext;
      if (payload.type === 'platform_admin') {
        userContext = createUserContext(user, null);
      } else {
        userContext = createUserContext(user, req.tenant || { 
          tenantId: payload.tenantId, 
          schema: payload.schema 
        });
      }
      
      // Add JWT payload data that isn't in the user context
      userContext.allowedApps = payload.allowedApps || [];
      userContext.userType = payload.userType;
      userContext.platformRole = user.platform_role || payload.platformRole;
      
      // Override role with JWT payload if present (for testing and flexibility)
      if (payload.role) {
        userContext.role = payload.role;
      }
      
      req.user = userContext;
    }
    
    next();
  } catch (error) {
    // Continue without user context on any error
    console.warn('Optional auth failed:', error.message);
    next();
  }
}

/**
 * Role-based authorization middleware
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
}

/**
 * Admin-only middleware
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Manager or Admin middleware
 */
function requireManagerOrAdmin(req, res, next) {
  return requireRole(['manager', 'admin'])(req, res, next);
}

/**
 * Self-access or Admin middleware - allows users to access their own resources
 */
function requireSelfOrAdmin(userIdParam = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const requestedUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    if (currentUserId === requestedUserId || isAdmin) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Can only access your own resources or admin privileges required'
    });
  };
}

/**
 * Tenant isolation middleware - ensures user belongs to the current tenant
 */
function requireTenantMatch(req, res, next) {
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
  
  if (req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'User does not belong to this tenant'
    });
  }
  
  next();
}

/**
 * Rate limiting middleware (basic implementation)
 */
function createRateLimit(windowMs = 15 * 60 * 1000, max = 100) {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}-${req.user ? req.user.userId : 'anonymous'}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    const userRequests = requests.get(key) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  requireSelfOrAdmin,
  requireTenantMatch,
  createRateLimit,
  extractToken
};