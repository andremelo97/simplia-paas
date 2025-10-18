const database = require('../db/database');

class TenantBrandingNotFoundError extends Error {
  constructor(message) {
    super(`Tenant branding not found: ${message}`);
    this.name = 'TenantBrandingNotFoundError';
  }
}

class TenantBranding {
  constructor(data) {
    this.id = data.id;
    this.tenantIdFk = data.tenant_id_fk;
    this.primaryColor = data.primary_color || '#B725B7';
    this.secondaryColor = data.secondary_color || '#E91E63';
    this.tertiaryColor = data.tertiary_color || '#5ED6CE';
    this.logoUrl = data.logo_url;
    this.faviconUrl = data.favicon_url;
    this.backgroundVideoUrl = data.background_video_url;
    this.companyName = data.company_name;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find branding configuration by tenant ID
   * Returns defaults if no configuration exists yet
   */
  static async findByTenant(tenantId) {
    const query = `SELECT * FROM tenant_branding WHERE tenant_id_fk = $1`;
    const result = await database.query(query, [tenantId]);

    if (result.rows.length === 0) {
      // Return defaults if not configured yet - fetch tenant name for company name
      const tenantQuery = `SELECT name FROM tenants WHERE id = $1`;
      const tenantResult = await database.query(tenantQuery, [tenantId]);
      const tenantName = tenantResult.rows[0]?.name || null;

      return TenantBranding.getDefaults(tenantId, tenantName);
    }

    return new TenantBranding(result.rows[0]);
  }

  /**
   * Backwards compatibility helper (some services expect findByTenantId)
   */
  static async findByTenantId(tenantId) {
    return this.findByTenant(tenantId);
  }

  /**
   * Get default branding configuration
   */
  static getDefaults(tenantId, companyName = null) {
    return new TenantBranding({
      tenant_id_fk: tenantId,
      primary_color: '#B725B7',
      secondary_color: '#E91E63',
      tertiary_color: '#5ED6CE',
      logo_url: null,
      favicon_url: null,
      background_video_url: null,
      company_name: companyName
    });
  }

  /**
   * Create or update branding configuration for a tenant
   * Uses UPSERT pattern (INSERT ... ON CONFLICT DO UPDATE)
   */
  static async upsert(tenantId, brandingData) {
    const {
      primaryColor,
      secondaryColor,
      tertiaryColor,
      logoUrl,
      faviconUrl,
      backgroundVideoUrl,
      companyName
    } = brandingData;

    const query = `
      INSERT INTO tenant_branding (
        tenant_id_fk,
        primary_color,
        secondary_color,
        tertiary_color,
        logo_url,
        favicon_url,
        background_video_url,
        company_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id_fk)
      DO UPDATE SET
        primary_color = COALESCE(EXCLUDED.primary_color, tenant_branding.primary_color),
        secondary_color = COALESCE(EXCLUDED.secondary_color, tenant_branding.secondary_color),
        tertiary_color = COALESCE(EXCLUDED.tertiary_color, tenant_branding.tertiary_color),
        logo_url = EXCLUDED.logo_url,
        favicon_url = EXCLUDED.favicon_url,
        background_video_url = EXCLUDED.background_video_url,
        company_name = EXCLUDED.company_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      logoUrl,
      faviconUrl,
      backgroundVideoUrl,
      companyName
    ]);

    return new TenantBranding(result.rows[0]);
  }

  /**
   * Delete branding configuration (resets to defaults)
   */
  static async delete(tenantId) {
    const query = `DELETE FROM tenant_branding WHERE tenant_id_fk = $1 RETURNING *`;
    const result = await database.query(query, [tenantId]);

    if (result.rows.length === 0) {
      throw new TenantBrandingNotFoundError(`tenant: ${tenantId}`);
    }

    return new TenantBranding(result.rows[0]);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantIdFk, // Frontend expects tenantId, not tenantIdFk
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      tertiaryColor: this.tertiaryColor,
      logoUrl: this.logoUrl,
      faviconUrl: this.faviconUrl,
      backgroundVideoUrl: this.backgroundVideoUrl,
      companyName: this.companyName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { TenantBranding, TenantBrandingNotFoundError };
