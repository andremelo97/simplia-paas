const database = require('../db/database');
const { TRANSCRIPTION_BASIC_MONTHLY_LIMIT } = require('../constants/transcription');

class TenantTranscriptionConfigNotFoundError extends Error {
  constructor(message) {
    super(`Tenant transcription config not found: ${message}`);
    this.name = 'TenantTranscriptionConfigNotFoundError';
  }
}

class InvalidCustomLimitError extends Error {
  constructor(limit, minLimit) {
    super(`Custom limit ${limit} is below minimum required limit of ${minLimit} minutes`);
    this.name = 'InvalidCustomLimitError';
  }
}

class TenantTranscriptionConfig {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id_fk;
    this.planId = data.plan_id_fk;
    this.customMonthlyLimit = data.custom_monthly_limit ? parseInt(data.custom_monthly_limit) : null;
    this.transcriptionLanguage = data.transcription_language || null;
    this.overageAllowed = data.overage_allowed;
    this.planActivatedAt = data.plan_activated_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find config by tenant ID
   */
  static async findByTenantId(tenantId) {
    const query = `
      SELECT
        ttc.*,
        tp.slug as plan_slug,
        tp.name as plan_name,
        tp.monthly_minutes_limit as plan_monthly_minutes_limit,
        tp.allows_custom_limits as plan_allows_custom_limits,
        tp.allows_overage as plan_allows_overage,
        tp.language_detection_enabled as plan_language_detection_enabled,
        tp.is_trial as plan_is_trial,
        tp.trial_days as plan_trial_days
      FROM public.tenant_transcription_config ttc
      INNER JOIN public.transcription_plans tp ON ttc.plan_id_fk = tp.id
      WHERE ttc.tenant_id_fk = $1
    `;

    const result = await database.query(query, [tenantId]);

    if (result.rows.length === 0) {
      throw new TenantTranscriptionConfigNotFoundError(`tenantId: ${tenantId}`);
    }

    const config = new TenantTranscriptionConfig(result.rows[0]);
    config.plan = {
      slug: result.rows[0].plan_slug,
      name: result.rows[0].plan_name,
      monthlyMinutesLimit: parseInt(result.rows[0].plan_monthly_minutes_limit),
      allowsCustomLimits: result.rows[0].plan_allows_custom_limits,
      allowsOverage: result.rows[0].plan_allows_overage,
      languageDetectionEnabled: result.rows[0].plan_language_detection_enabled,
      isTrial: result.rows[0].plan_is_trial,
      trialDays: result.rows[0].plan_trial_days ? parseInt(result.rows[0].plan_trial_days) : null
    };

    return config;
  }

  /**
   * Find config by ID
   */
  static async findById(id) {
    const query = `
      SELECT
        ttc.*,
        tp.slug as plan_slug,
        tp.name as plan_name,
        tp.monthly_minutes_limit as plan_monthly_minutes_limit,
        tp.allows_custom_limits as plan_allows_custom_limits,
        tp.allows_overage as plan_allows_overage,
        tp.language_detection_enabled as plan_language_detection_enabled,
        tp.is_trial as plan_is_trial,
        tp.trial_days as plan_trial_days
      FROM public.tenant_transcription_config ttc
      INNER JOIN public.transcription_plans tp ON ttc.plan_id_fk = tp.id
      WHERE ttc.id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new TenantTranscriptionConfigNotFoundError(`ID: ${id}`);
    }

    const config = new TenantTranscriptionConfig(result.rows[0]);
    config.plan = {
      slug: result.rows[0].plan_slug,
      name: result.rows[0].plan_name,
      monthlyMinutesLimit: parseInt(result.rows[0].plan_monthly_minutes_limit),
      allowsCustomLimits: result.rows[0].plan_allows_custom_limits,
      allowsOverage: result.rows[0].plan_allows_overage,
      languageDetectionEnabled: result.rows[0].plan_language_detection_enabled,
      isTrial: result.rows[0].plan_is_trial,
      trialDays: result.rows[0].plan_trial_days ? parseInt(result.rows[0].plan_trial_days) : null
    };

    return config;
  }

  /**
   * Create or update config (upsert)
   */
  static async upsert(tenantId, configData) {
    const {
      planId,
      customMonthlyLimit = null,
      transcriptionLanguage = null,
      overageAllowed = false
    } = configData;

    // Check if config already exists to determine if plan is changing
    let existingConfig = null;
    try {
      existingConfig = await TenantTranscriptionConfig.findByTenantId(tenantId);
    } catch (err) {
      // No existing config, that's fine
    }

    const planChanged = !existingConfig || existingConfig.planId !== planId;

    const query = `
      INSERT INTO public.tenant_transcription_config (
        tenant_id_fk,
        plan_id_fk,
        custom_monthly_limit,
        transcription_language,
        overage_allowed,
        plan_activated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (tenant_id_fk)
      DO UPDATE SET
        plan_id_fk = EXCLUDED.plan_id_fk,
        custom_monthly_limit = EXCLUDED.custom_monthly_limit,
        transcription_language = EXCLUDED.transcription_language,
        overage_allowed = EXCLUDED.overage_allowed,
        plan_activated_at = CASE
          WHEN public.tenant_transcription_config.plan_id_fk != EXCLUDED.plan_id_fk
          THEN NOW()
          ELSE public.tenant_transcription_config.plan_activated_at
        END,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      planId,
      customMonthlyLimit,
      transcriptionLanguage,
      overageAllowed
    ]);

    return new TenantTranscriptionConfig(result.rows[0]);
  }

  /**
   * Update config
   */
  async update(updates) {
    const allowedUpdates = [
      'plan_id_fk',
      'custom_monthly_limit',
      'transcription_language',
      'overage_allowed'
    ];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Check if plan is changing - if so, update plan_activated_at
    const planChanging = updates.plan_id_fk !== undefined && updates.plan_id_fk !== this.planId;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return this;
    }

    // If plan is changing, update plan_activated_at
    if (planChanging) {
      updateFields.push(`plan_activated_at = NOW()`);
    }

    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE public.tenant_transcription_config
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, [
      ...updateValues,
      this.id
    ]);

    if (result.rows.length === 0) {
      throw new TenantTranscriptionConfigNotFoundError(`ID: ${this.id}`);
    }

    // Update current instance
    Object.assign(this, new TenantTranscriptionConfig(result.rows[0]));
    return this;
  }

  /**
   * Get effective monthly limit for tenant
   * Returns custom limit if VIP and set, otherwise plan default
   */
  getEffectiveMonthlyLimit() {
    if (this.customMonthlyLimit !== null && this.plan?.allowsCustomLimits) {
      return this.customMonthlyLimit;
    }
    return this.plan?.monthlyMinutesLimit || TRANSCRIPTION_BASIC_MONTHLY_LIMIT;
  }

  /**
   * Check if tenant can customize limits
   */
  canCustomizeLimits() {
    return this.plan?.allowsCustomLimits === true;
  }

  /**
   * Calculate expiration date for trial plans
   * Returns null for non-trial plans
   */
  getExpiresAt() {
    if (!this.plan?.isTrial || !this.plan?.trialDays || !this.planActivatedAt) {
      return null;
    }
    const activatedAt = new Date(this.planActivatedAt);
    const expiresAt = new Date(activatedAt.getTime() + this.plan.trialDays * 24 * 60 * 60 * 1000);
    return expiresAt;
  }

  /**
   * Check if trial has expired
   */
  isTrialExpired() {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  }

  /**
   * Get remaining trial days (null if not trial)
   */
  getRemainingTrialDays() {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return null;
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      planId: this.planId,
      customMonthlyLimit: this.customMonthlyLimit,
      transcriptionLanguage: this.transcriptionLanguage,
      overageAllowed: this.overageAllowed,
      planActivatedAt: this.planActivatedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...(this.plan && {
        plan: this.plan
      }),
      effectiveMonthlyLimit: this.getEffectiveMonthlyLimit(),
      canCustomizeLimits: this.canCustomizeLimits(),
      expiresAt: this.getExpiresAt(),
      isTrialExpired: this.isTrialExpired(),
      remainingTrialDays: this.getRemainingTrialDays()
    };
  }
}

module.exports = {
  TenantTranscriptionConfig,
  TenantTranscriptionConfigNotFoundError,
  InvalidCustomLimitError
};
