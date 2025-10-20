const database = require('../db/database');

class TenantTranscriptionUsage {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id_fk;
    this.month = data.month;
    this.minutesUsed = parseInt(data.minutes_used) || 0;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Add minutes to tenant's monthly usage (upsert)
   */
  static async addMinutes(tenantId, minutes, month = null) {
    // If no month provided, use current month (YYYY-MM-01 format)
    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

    const query = `
      INSERT INTO public.tenant_transcription_usage (
        tenant_id_fk,
        month,
        minutes_used
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id_fk, month)
      DO UPDATE SET
        minutes_used = tenant_transcription_usage.minutes_used + EXCLUDED.minutes_used,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await database.query(query, [tenantId, targetMonth, minutes]);
    return new TenantTranscriptionUsage(result.rows[0]);
  }

  /**
   * Get usage for a specific month
   */
  static async getMonthlyUsage(tenantId, year, month) {
    // Convert year/month to YYYY-MM-01 format
    const monthStr = String(month).padStart(2, '0');
    const targetMonth = `${year}-${monthStr}-01`;

    const query = `
      SELECT *
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
        AND month = $2
    `;

    const result = await database.query(query, [tenantId, targetMonth]);

    if (result.rows.length === 0) {
      return {
        minutesUsed: 0
      };
    }

    return {
      minutesUsed: parseInt(result.rows[0].minutes_used) || 0
    };
  }

  /**
   * Get current month usage for tenant
   */
  static async getCurrentMonthUsage(tenantId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    return await TenantTranscriptionUsage.getMonthlyUsage(tenantId, year, month);
  }

  /**
   * Get usage history for tenant (last N months)
   */
  static async getUsageHistory(tenantId, months = 6) {
    const query = `
      SELECT *
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
        AND month >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
      ORDER BY month DESC
    `;

    const result = await database.query(query, [tenantId]);

    return result.rows.map(row => ({
      month: row.month,
      minutesUsed: parseInt(row.minutes_used) || 0
    }));
  }

  /**
   * Get all usage records for tenant
   */
  static async getAllUsage(tenantId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT *
      FROM public.tenant_transcription_usage
      WHERE tenant_id_fk = $1
      ORDER BY month DESC
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
   * Check if tenant has exceeded monthly quota
   */
  static async hasExceededQuota(tenantId, monthlyLimitMinutes) {
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);
    return currentUsage.minutesUsed >= monthlyLimitMinutes;
  }

  /**
   * Get remaining minutes for current month
   */
  static async getRemainingMinutes(tenantId, monthlyLimitMinutes) {
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);
    const remaining = monthlyLimitMinutes - currentUsage.minutesUsed;
    return Math.max(0, remaining);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      month: this.month,
      minutesUsed: this.minutesUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { TenantTranscriptionUsage };
