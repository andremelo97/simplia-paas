/**
 * Middleware para controlar acesso por platform role (Simplia internal team)
 * Diferente de 'admin' que é admin do tenant, platform roles controlam acesso à API interna
 */
const requirePlatformRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 401, 
          message: 'Authentication required' 
        } 
      });
    }
    
    const platformRole = req.user.platformRole;
    
    if (!platformRole) {
      return res.status(403).json({ 
        error: { 
          code: 403, 
          message: 'Platform role required for internal API access' 
        } 
      });
    }
    
    if (!allowedRoles.includes(platformRole)) {
      return res.status(403).json({ 
        error: { 
          code: 403, 
          message: `Insufficient platform role. Required: ${allowedRoles.join(' or ')}` 
        } 
      });
    }
    
    next();
  };
};

module.exports = {
  requirePlatformRole,
};