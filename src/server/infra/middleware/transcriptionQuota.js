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

    // Get tenant transcription config
    let config;
    try {
      config = await TenantTranscriptionConfig.findByTenantId(tenantId);
    } catch (error) {
      if (error instanceof TenantTranscriptionConfigNotFoundError) {
        // No config = transcription not enabled for this tenant
        return res.status(403).json({
          error: {
            code: 403,
            message: 'Transcription service not configured for your account'
          }
        });
      }
      throw error;
    }

    // Check if transcription is enabled
    if (!config.enabled) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Transcription service is disabled for your account'
        }
      });
    }

    // Get effective monthly limit
    const monthlyLimitMinutes = config.getEffectiveMonthlyLimit();

    // Get current month usage
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);

    // Check if quota exceeded
    if (currentUsage.totalMinutes >= monthlyLimitMinutes) {
      // Check if overage is allowed
      if (!config.overageAllowed) {
        return res.status(429).json({
          error: {
            code: 429,
            message: 'Monthly transcription quota exceeded',
            details: {
              used: currentUsage.totalMinutes,
              limit: monthlyLimitMinutes,
              remaining: 0
            }
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
