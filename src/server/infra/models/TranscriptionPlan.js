const database = require('../db/database');

class TranscriptionPlanNotFoundError extends Error {
  constructor(message) {
    super(`Transcription plan not found: ${message}`);
    this.name = 'TranscriptionPlanNotFoundError';
  }
}

class DuplicateTranscriptionPlanError extends Error {
  constructor(slug) {
    super(`Transcription plan with slug '${slug}' already exists`);
    this.name = 'DuplicateTranscriptionPlanError';
  }
}

class TranscriptionPlan {
  constructor(data) {
    this.id = data.id;
    this.slug = data.slug;
    this.name = data.name;
    this.monthlyMinutesLimit = parseInt(data.monthly_minutes_limit);
    this.allowsCustomLimits = data.allows_custom_limits;
    this.allowsOverage = data.allows_overage;
    this.sttModel = data.stt_model;
    this.languageDetectionEnabled = data.language_detection_enabled;
    this.costPerMinuteUsd = parseFloat(data.cost_per_minute_usd);
    this.isTrial = data.is_trial;
    this.trialDays = data.trial_days ? parseInt(data.trial_days) : null;
    this.showCost = data.show_cost;
    this.active = data.active;
    this.description = data.description;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find transcription plan by ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM public.transcription_plans
      WHERE id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new TranscriptionPlanNotFoundError(`ID: ${id}`);
    }

    return new TranscriptionPlan(result.rows[0]);
  }

  /**
   * Find transcription plan by slug
   */
  static async findBySlug(slug) {
    const query = `
      SELECT * FROM public.transcription_plans
      WHERE slug = $1
    `;

    const result = await database.query(query, [slug]);

    if (result.rows.length === 0) {
      throw new TranscriptionPlanNotFoundError(`slug: ${slug}`);
    }

    return new TranscriptionPlan(result.rows[0]);
  }

  /**
   * Get all transcription plans with optional filtering
   */
  static async findAll(options = {}) {
    const { active = null, limit = 50, offset = 0 } = options;

    let query = `
      SELECT * FROM public.transcription_plans
      WHERE 1=1
    `;
    const params = [];

    if (active !== null) {
      query += ` AND active = $${params.length + 1}`;
      params.push(active);
    }

    query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new TranscriptionPlan(row));
  }

  /**
   * Create new transcription plan
   */
  static async create(planData) {
    const {
      slug,
      name,
      monthlyMinutesLimit,
      allowsCustomLimits,
      allowsOverage,
      sttModel,
      languageDetectionEnabled,
      costPerMinuteUsd,
      isTrial = false,
      trialDays = null,
      showCost = false,
      active,
      description = null
    } = planData;

    // Check if plan already exists
    try {
      await TranscriptionPlan.findBySlug(slug);
      throw new DuplicateTranscriptionPlanError(slug);
    } catch (error) {
      if (!(error instanceof TranscriptionPlanNotFoundError)) {
        throw error;
      }
    }

    const query = `
      INSERT INTO public.transcription_plans (
        slug,
        name,
        monthly_minutes_limit,
        allows_custom_limits,
        allows_overage,
        stt_model,
        language_detection_enabled,
        cost_per_minute_usd,
        is_trial,
        trial_days,
        show_cost,
        active,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await database.query(query, [
      slug,
      name,
      monthlyMinutesLimit,
      allowsCustomLimits,
      allowsOverage,
      sttModel,
      languageDetectionEnabled,
      costPerMinuteUsd,
      isTrial,
      trialDays,
      showCost,
      active,
      description
    ]);

    return new TranscriptionPlan(result.rows[0]);
  }

  /**
   * Update transcription plan
   */
  async update(updates) {
    const allowedUpdates = [
      'slug',
      'name',
      'monthly_minutes_limit',
      'allows_custom_limits',
      'allows_overage',
      'stt_model',
      'language_detection_enabled',
      'cost_per_minute_usd',
      'is_trial',
      'trial_days',
      'show_cost',
      'active',
      'description'
    ];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

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

    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE public.transcription_plans
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, [
      ...updateValues,
      this.id
    ]);

    if (result.rows.length === 0) {
      throw new TranscriptionPlanNotFoundError(`ID: ${this.id}`);
    }

    // Update current instance
    Object.assign(this, new TranscriptionPlan(result.rows[0]));
    return this;
  }

  /**
   * Soft delete transcription plan (set active = false)
   */
  async softDelete() {
    // Check if plan is in use by any tenant
    const usageCheckQuery = `
      SELECT COUNT(*) as count,
             array_agg(t.name) as tenant_names
      FROM public.tenant_transcription_config ttc
      INNER JOIN public.tenants t ON ttc.tenant_id_fk = t.id
      WHERE ttc.plan_id_fk = $1
    `;

    const usageResult = await database.query(usageCheckQuery, [this.id]);
    const usageCount = parseInt(usageResult.rows[0].count);
    const tenantNames = usageResult.rows[0].tenant_names;

    if (usageCount > 0) {
      const tenantList = tenantNames.slice(0, 3).join(', ');
      const remaining = usageCount - 3;
      const message = usageCount <= 3
        ? `Cannot deactivate plan "${this.name}" - it is currently assigned to: ${tenantList}`
        : `Cannot deactivate plan "${this.name}" - it is currently assigned to: ${tenantList} and ${remaining} more tenant${remaining > 1 ? 's' : ''}`;

      const error = new Error(message);
      error.code = 'PLAN_IN_USE';
      error.statusCode = 400;
      error.usageCount = usageCount;
      error.tenantNames = tenantNames;
      throw error;
    }

    const query = `
      UPDATE public.transcription_plans
      SET active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [this.id]);

    if (result.rows.length === 0) {
      throw new TranscriptionPlanNotFoundError(`ID: ${this.id}`);
    }

    // Update current instance
    Object.assign(this, new TranscriptionPlan(result.rows[0]));
    return this;
  }

  /**
   * Get transcription plan count
   */
  static async count(active = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM public.transcription_plans
      WHERE 1=1
    `;
    const params = [];

    if (active !== null) {
      query += ` AND active = $1`;
      params.push(active);
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      monthlyMinutesLimit: this.monthlyMinutesLimit,
      allowsCustomLimits: this.allowsCustomLimits,
      allowsOverage: this.allowsOverage,
      sttModel: this.sttModel,
      languageDetectionEnabled: this.languageDetectionEnabled,
      costPerMinuteUsd: this.costPerMinuteUsd,
      isTrial: this.isTrial,
      trialDays: this.trialDays,
      showCost: this.showCost,
      active: this.active,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  TranscriptionPlan,
  TranscriptionPlanNotFoundError,
  DuplicateTranscriptionPlanError
};
