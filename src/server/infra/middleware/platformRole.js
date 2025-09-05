/**
 * Middleware para controlar acesso por platform role (Simplia internal team)
 * Diferente de 'admin' que é admin do tenant, platform roles controlam acesso à API interna
 */
const requirePlatformRole = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('🔐 [PLATFORM] Checking platform role for:', req.method, req.path);
    console.log('🔐 [PLATFORM] Required roles:', allowedRoles);
    console.log('🔐 [PLATFORM] User present:', !!req.user);
    
    if (!req.user) {
      console.log('❌ [PLATFORM] No user in request');
      return res.status(401).json({ 
        error: { 
          code: 401, 
          message: 'Authentication required' 
        } 
      });
    }
    
    const platformRole = req.user.platformRole;
    console.log('🔐 [PLATFORM] User platform role:', platformRole);
    
    if (!platformRole) {
      console.log('❌ [PLATFORM] No platform role found');
      return res.status(403).json({ 
        error: { 
          code: 403, 
          message: 'Platform role required for internal API access' 
        } 
      });
    }
    
    if (!allowedRoles.includes(platformRole)) {
      console.log('❌ [PLATFORM] Role not allowed:', platformRole, 'not in', allowedRoles);
      return res.status(403).json({ 
        error: { 
          code: 403, 
          message: `Insufficient platform role. Required: ${allowedRoles.join(' or ')}` 
        } 
      });
    }
    
    console.log('✅ [PLATFORM] Role check passed');
    next();
  };
};

module.exports = {
  requirePlatformRole,
};