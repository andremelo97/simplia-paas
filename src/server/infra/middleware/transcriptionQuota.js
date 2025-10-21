const { TenantTranscriptionConfig, TenantTranscriptionConfigNotFoundError } = require('../models/TenantTranscriptionConfig');
const { TenantTranscriptionUsage } = require('../models/TenantTranscriptionUsage');

/**
 * Middleware to check if tenant has exceeded transcription quota
 * Should be applied BEFORE transcription routes that consume quota
 */
async function checkTranscriptionQuota(req, res, next) {
  try {
    // Get tenant ID from authenticated request
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Tenant authentication required'
        }
      });
    }

    // Try to get tenant transcription config (optional - if not exists, use defaults)
    let config = null;
    let monthlyLimitMinutes = 60; // Default: 60 minutes/month
    let overageAllowed = false; // Default: no overage

    try {
      config = await TenantTranscriptionConfig.findByTenantId(tenantId);
      monthlyLimitMinutes = config.getEffectiveMonthlyLimit();
      overageAllowed = config.plan?.allowsOverage || config.overageAllowed || false;
    } catch (error) {
      if (error instanceof TenantTranscriptionConfigNotFoundError) {
        // No config found - use default limits (60 min/month, no overage)
        console.log(`[Transcription Quota] No config for tenant ${tenantId}, using defaults (60 min/month, no overage)`);
      } else {
        throw error;
      }
    }

    // Get current month usage
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);

    // Check if quota exceeded
    if (currentUsage.totalMinutes >= monthlyLimitMinutes) {
      // Check if overage is allowed
      if (!overageAllowed) {
        return res.status(429).json({
          error: {
            code: 429,
            message: 'Monthly transcription quota exceeded',
            details: {
              used: currentUsage.totalMinutes,
              limit: monthlyLimitMinutes,
              remaining: 0
            }
          },
          meta: {
            code: 'TRANSCRIPTION_QUOTA_EXCEEDED',
            used: currentUsage.totalMinutes,
            limit: monthlyLimitMinutes
          }
        });
      }
      // If overage allowed, log warning but continue
      console.warn(`[Transcription Quota] Tenant ${tenantId} exceeded quota but overage allowed (${currentUsage.totalMinutes}/${monthlyLimitMinutes} minutes)`);
    }

    // Attach quota info to request for downstream use
    req.transcriptionQuota = {
      config: config,
      usage: currentUsage,
      limit: monthlyLimitMinutes,
      remaining: Math.max(0, monthlyLimitMinutes - currentUsage.totalMinutes),
      hasExceeded: currentUsage.totalMinutes >= monthlyLimitMinutes
    };

    next();
  } catch (error) {
    console.error('[Transcription Quota Middleware] Error:', error);
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to check transcription quota'
      }
    });
  }
}

module.exports = { checkTranscriptionQuota };
