const database = require('../db/database');
const { DEFAULT_STT_MODEL, MODEL_COSTS, DEFAULT_COST_PER_MINUTE, MULTILINGUAL_COST_PER_MINUTE } = require('../constants/transcription');

class TenantTranscriptionUsage {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id_fk;
    this.transcriptionId = data.transcription_id;
    this.audioDurationSeconds = parseInt(data.audio_duration_seconds) || 0;
    this.sttModel = data.stt_model || DEFAULT_STT_MODEL;
    this.detectedLanguage = data.detected_language || null;
    this.sttProviderRequestId = data.stt_provider_request_id;
    this.costUsd = parseFloat(data.cost_usd) || 0;
    this.usageDate = data.usage_date;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new transcription usage record
   *
   * Cost calculation priority:
   * 1. If costUsd is provided (from Deepgram Management API), use it
   * 2. Otherwise, calculate locally based on language detection:
   *    - Multilingual (detectedLanguage present): $0.0052/min
   *    - Monolingual (no detectedLanguage): $0.0043/min
   */
  static async create(tenantId, data) {
    console.log(`[TenantTranscriptionUsage] 🔧 ========== CREATE METHOD CALLED ==========`);
    console.log(`[TenantTranscriptionUsage] 🔧 tenantId: ${tenantId} (type: ${typeof tenantId})`);
    console.log(`[TenantTranscriptionUsage] 🔧 data received:`, JSON.stringify(data, null, 2));

    const {
      transcriptionId,
      audioDurationSeconds,
      sttModel = DEFAULT_STT_MODEL,
      detectedLanguage = null,
      sttProviderRequestId,
      costUsd = null, // Real cost from Deepgram (optional)
      usageDate = new Date()
    } = data;

    console.log(`[TenantTranscriptionUsage] 🔧 Destructured values:`);
    console.log(`[TenantTranscriptionUsage] 🔧   transcriptionId: ${transcriptionId}`);
    console.log(`[TenantTranscriptionUsage] 🔧   audioDurationSeconds: ${audioDurationSeconds}`);
    console.log(`[TenantTranscriptionUsage] 🔧   sttModel: ${sttModel}`);
    console.log(`[TenantTranscriptionUsage] 🔧   detectedLanguage: ${detectedLanguage}`);
    console.log(`[TenantTranscriptionUsage] 🔧   sttProviderRequestId: ${sttProviderRequestId}`);
    console.log(`[TenantTranscriptionUsage] 🔧   costUsd: ${costUsd}`);

    // Use provided cost or calculate locally
    let finalCostUsd;

    if (costUsd !== null) {
      // Use real cost from Deepgram Management API
      finalCostUsd = costUsd;
      console.log(`[TenantTranscriptionUsage] 💰 Using real cost from Deepgram: $${finalCostUsd}`);
    } else {
      // Fallback: Calculate cost locally based on model pricing and language detection
      const durationMinutes = audioDurationSeconds / 60;

      // If detectedLanguage is present, it means multilingual mode was used
      const costPerMinute = detectedLanguage
        ? MULTILINGUAL_COST_PER_MINUTE  // $0.0052/min for multilingual
        : (MODEL_COSTS[sttModel] || DEFAULT_COST_PER_MINUTE); // $0.0043/min for monolingual

      finalCostUsd = durationMinutes * costPerMinute;
      console.log(`[TenantTranscriptionUsage] 💰 Calculating cost locally:`);
      console.log(`[TenantTranscriptionUsage] 💰   Duration: ${durationMinutes.toFixed(2)} minutes`);
      console.log(`[TenantTranscriptionUsage] 💰   Cost per minute: $${costPerMinute}`);
      console.log(`[TenantTranscriptionUsage] 💰   Final cost: $${finalCostUsd.toFixed(4)}`);
    }

    const query = `
      INSERT INTO public.tenant_transcription_usage (
        tenant_id_fk,
        transcription_id,
        audio_duration_seconds,
        stt_model,
        detected_language,
        stt_provider_request_id,
        cost_usd,
        usage_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    console.log(`[TenantTranscriptionUsage] 💾 Executing INSERT query...`);
    console.log(`[TenantTranscriptionUsage] 💾 Parameters:`, [
      tenantId,
      transcriptionId,
      audioDurationSeconds,
      sttModel,
      detectedLanguage,
      sttProviderRequestId,
      finalCostUsd.toFixed(4),
      usageDate
    ]);

    try {
      const result = await database.query(query, [
        tenantId,
        transcriptionId,
        audioDurationSeconds,
        sttModel,
        detectedLanguage,
        sttProviderRequestId,
        finalCostUsd.toFixed(4),
        usageDate
      ]);

      console.log(`[TenantTranscriptionUsage] ✅ INSERT successful! Rows inserted: ${result.rowCount}`);
      console.log(`[TenantTranscriptionUsage] ✅ Returned row:`, result.rows[0]);

      return new TenantTranscriptionUsage(result.rows[0]);
    } catch (error) {
      console.error(`[TenantTranscriptionUsage] ❌ INSERT FAILED!`);
      console.error(`[TenantTranscriptionUsage] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Get current month usage for tenant (aggregated)
   * Returns total minutes and total cost
   */
  static async getCurrentMonthUsage(tenantId) {
    const query = `
      SELECT
        COALESCE(SUM(audio_duration_seconds), 0) as total_seconds,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) as total_transcriptions
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
        AND DATE_TRUNC('month', usage_date) = DATE_TRUNC('month', CURRENT_DATE)
    `;

    const result = await database.query(query, [tenantId]);
    const row = result.rows[0];

    const totalMinutes = Math.ceil(parseInt(row.total_seconds || 0) / 60);
    const totalCost = parseFloat(row.total_cost || 0);
    const totalTranscriptions = parseInt(row.total_transcriptions || 0);

    return {
      totalMinutes,
      totalCost,
      totalTranscriptions
    };
  }

  /**
   * Get usage for a specific month
   */
  static async getMonthlyUsage(tenantId, year, month) {
    const monthStr = String(month).padStart(2, '0');
    const targetMonth = `${year}-${monthStr}-01`;

    const query = `
      SELECT
        COALESCE(SUM(audio_duration_seconds), 0) as total_seconds,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) as total_transcriptions
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
        AND DATE_TRUNC('month', usage_date) = DATE_TRUNC('month', $2::date)
    `;

    const result = await database.query(query, [tenantId, targetMonth]);
    const row = result.rows[0];

    const totalMinutes = Math.ceil(parseInt(row.total_seconds || 0) / 60);
    const totalCost = parseFloat(row.total_cost || 0);
    const totalTranscriptions = parseInt(row.total_transcriptions || 0);

    return {
      minutesUsed: totalMinutes, // For backward compatibility
      totalMinutes,
      totalCost,
      totalTranscriptions
    };
  }

  /**
   * Get usage history for tenant (last N months)
   * Returns aggregated data per month
   */
  static async getUsageHistory(tenantId, months = 6) {
    const query = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', usage_date), 'YYYY-MM') as month,
        COALESCE(SUM(audio_duration_seconds), 0) as total_seconds,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COUNT(*) as total_transcriptions
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
        AND usage_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
      GROUP BY DATE_TRUNC('month', usage_date)
      ORDER BY DATE_TRUNC('month', usage_date) DESC
    `;

    const result = await database.query(query, [tenantId]);

    return result.rows.map(row => ({
      month: row.month, // Already in YYYY-MM format from TO_CHAR
      minutesUsed: Math.ceil(parseInt(row.total_seconds || 0) / 60),
      totalCost: parseFloat(row.total_cost || 0),
      totalTranscriptions: parseInt(row.total_transcriptions || 0)
    }));
  }

  /**
   * Get all usage records for tenant (granular, not aggregated)
   */
  static async getAllUsage(tenantId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT *
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
      ORDER BY usage_date DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await database.query(query, [
      tenantId,
      limit,
      offset
    ]);

    return result.rows.map(row => new TenantTranscriptionUsage(row));
  }

  /**
   * Get total count of all usage records for tenant
   */
  static async getTotalCount(tenantId) {
    const query = `
      SELECT COUNT(*) as count
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
    `;

    const result = await database.query(query, [tenantId]);
    return parseInt(result.rows[0]?.count || 0);
  }

  /**
   * Calculate overage cost if tenant exceeded quota
   * Returns cost in USD for minutes over limit
   */
  static async getOverageCost(tenantId, monthlyLimitMinutes, costPerMinute = DEFAULT_COST_PER_MINUTE) {
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);

    if (currentUsage.totalMinutes <= monthlyLimitMinutes) {
      return 0; // No overage
    }

    const overageMinutes = currentUsage.totalMinutes - monthlyLimitMinutes;
    const overageCost = overageMinutes * costPerMinute;

    return parseFloat(overageCost.toFixed(4));
  }

  /**
   * Check if tenant has exceeded monthly quota
   */
  static async hasExceededQuota(tenantId, monthlyLimitMinutes) {
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);
    return currentUsage.totalMinutes >= monthlyLimitMinutes;
  }

  /**
   * Get remaining minutes for current month
   */
  static async getRemainingMinutes(tenantId, monthlyLimitMinutes) {
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);
    const remaining = monthlyLimitMinutes - currentUsage.totalMinutes;
    return Math.max(0, remaining);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      transcriptionId: this.transcriptionId,
      audioDurationSeconds: this.audioDurationSeconds,
      audioDurationMinutes: Math.ceil(this.audioDurationSeconds / 60),
      sttModel: this.sttModel,
      sttProviderRequestId: this.sttProviderRequestId,
      costUsd: this.costUsd,
      usageDate: this.usageDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { TenantTranscriptionUsage };
