const database = require('../db/database');
const { createTenantBucket } = require('../../services/supabaseStorage');

class TenantNotFoundError extends Error {
  constructor(message) {
    super(`Tenant not found: ${message}`);
    this.name = 'TenantNotFoundError';
  }
}

class Tenant {
  constructor(data) {
    if (data) {
      this.id = data.id;
      this.name = data.name;
      this.subdomain = data.subdomain;
      this.schemaName = data.schema_name;
      this.timezone = data.timezone;
      this.status = data.status;
      this.active = data.active;
      this.stripeCustomerId = data.stripe_customer_id;
      this.stripeSubscriptionId = data.stripe_subscription_id;
      this.createdAt = data.created_at;
      this.updatedAt = data.updated_at;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      subdomain: this.subdomain,
      schemaName: this.schemaName,
      timezone: this.timezone,
      status: this.status,
      active: this.active,
      stripeCustomerId: this.stripeCustomerId,
      stripeSubscriptionId: this.stripeSubscriptionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  // Criar novo tenant
  static async create({ name, subdomain, schemaName, timezone, status = 'active', stripeCustomerId = null, stripeSubscriptionId = null }) {
    const query = `
      INSERT INTO tenants (name, subdomain, schema_name, timezone, status, active, stripe_customer_id, stripe_subscription_id)
      VALUES ($1, $2, $3, $4, $5, true, $6, $7)
      RETURNING *
    `;
    const result = await database.query(query, [name, subdomain, schemaName, timezone, status, stripeCustomerId, stripeSubscriptionId]);

    // Create tenant-specific Supabase Storage bucket (private for security)
    console.log(`🪣 [Tenant.create] Attempting to create PRIVATE bucket for subdomain: ${subdomain}`);
    try {
      const bucketResult = await createTenantBucket(subdomain, false); // private bucket
      console.log(`✅ [Tenant.create] Bucket creation result:`, bucketResult);
    } catch (bucketError) {
      console.error(`❌ [Tenant.create] Failed to create tenant bucket for ${subdomain}:`, bucketError);
      console.error(`❌ [Tenant.create] Error stack:`, bucketError.stack);
      // Don't fail tenant creation if bucket creation fails - can be created manually
    }

    return new Tenant(result.rows[0]);
  }

  // Buscar tenant por subdomain
  static async findBySubdomain(subdomain) {
    const query = `
      SELECT * FROM tenants
      WHERE subdomain = $1 AND active = true
    `;
    const result = await database.query(query, [subdomain]);
    return result.rows[0] ? new Tenant(result.rows[0]) : null;
  }

  // Buscar tenant por nome
  static async findByName(name) {
    const query = `
      SELECT * FROM tenants
      WHERE name = $1 AND active = true
    `;
    const result = await database.query(query, [name]);
    return result.rows[0] ? new Tenant(result.rows[0]) : null;
  }

  // Buscar tenant por ID
  static async findById(id) {
    const query = `
      SELECT * FROM tenants
      WHERE id = $1
    `;
    const result = await database.query(query, [id]);
    return result.rows[0] ? new Tenant(result.rows[0]) : null;
  }

  // Listar todos os tenants com filtros e paginação
  static async findAll(options = {}) {
    const { status, limit = 50, offset = 0, search } = options;

    let query = 'SELECT * FROM tenants WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR subdomain ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows.map(row => new Tenant(row));
  }

  // Contar tenants com filtros
  static async count(options = {}) {
    const { status, search } = options;

    let query = 'SELECT COUNT(*) as count FROM tenants WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR subdomain ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  // Listar todos os tenants ativos (compatibilidade)
  static async findAllActive() {
    const query = `
      SELECT * FROM tenants 
      WHERE active = true 
      ORDER BY name
    `;
    const result = await database.query(query);
    return result.rows;
  }

  // Atualizar tenant
  static async update(id, updates) {
    const allowedFields = ['name', 'subdomain', 'schema_name', 'status', 'active'];

    // Auto-sync active field based on status
    if (updates.status) {
      updates.active = updates.status === 'active';
    }

    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const query = `
      UPDATE tenants
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows[0] ? new Tenant(result.rows[0]) : null;
  }

  // Desativar tenant (soft delete)
  static async deactivate(id) {
    const query = `
      UPDATE tenants 
      SET active = false 
      WHERE id = $1
      RETURNING *
    `;
    const result = await database.query(query, [id]);
    return result.rows[0];
  }

  // Verificar se tenant tem licenças ativas
  static async hasActiveLicenses(id) {
    const query = `
      SELECT COUNT(*) as count
      FROM tenant_applications ta
      WHERE ta.tenant_id_fk = $1
      AND ta.active = true
      AND ta.status = 'active'
      AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
    `;
    const result = await database.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Buscar tenant com suas licenças
  static async findWithLicenses(id) {
    const query = `
      SELECT
        t.*,
        json_agg(
          json_build_object(
            'application_id', ta.application_id_fk,
            'app_name', a.name,
            'app_slug', a.slug,
            'status', ta.status,
            'expires_at', ta.expires_at,
            'seats_purchased', ta.seats_purchased,
            'seats_used', ta.seats_used,
            'seats_available', (ta.seats_purchased - ta.seats_used)
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as licenses
      FROM tenants t
      LEFT JOIN tenant_applications ta ON t.id = ta.tenant_id_fk AND ta.active = true
      LEFT JOIN applications a ON ta.application_id_fk = a.id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    const result = await database.query(query, [id]);
    return result.rows[0];
  }

  // Criar schema para o tenant
  static async createSchema(schemaName) {
    const query = `CREATE SCHEMA IF NOT EXISTS ${schemaName}`;
    await database.query(query);
    return true;
  }

  // Validar formato do subdomain
  static validateSubdomain(subdomain) {
    const regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    return regex.test(subdomain) && subdomain.length >= 2 && subdomain.length <= 63;
  }

  // Validar formato do schema name
  static validateSchemaName(schemaName) {
    const regex = /^[a-z][a-z0-9_]*$/;
    return regex.test(schemaName) && schemaName.length >= 2 && schemaName.length <= 63;
  }
}

module.exports = {
  Tenant,
  TenantNotFoundError
};