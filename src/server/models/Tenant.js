const database = require('../config/database');

class Tenant {
  // Criar novo tenant
  static async create({ name, subdomain, schemaName, status = 'active' }) {
    const query = `
      INSERT INTO tenants (name, subdomain, schema_name, status, active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;
    const result = await database.query(query, [name, subdomain, schemaName, status]);
    return result.rows[0];
  }

  // Buscar tenant por subdomain
  static async findBySubdomain(subdomain) {
    const query = `
      SELECT * FROM tenants 
      WHERE subdomain = $1 AND active = true
    `;
    const result = await database.query(query, [subdomain]);
    return result.rows[0];
  }

  // Buscar tenant por ID
  static async findById(id) {
    const query = `
      SELECT * FROM tenants 
      WHERE id = $1 AND active = true
    `;
    const result = await database.query(query, [id]);
    return result.rows[0];
  }

  // Listar todos os tenants ativos
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
    const allowedFields = ['name', 'subdomain', 'schema_name', 'status'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const query = `
      UPDATE tenants 
      SET ${setClause}
      WHERE id = $1 AND active = true
      RETURNING *
    `;
    
    const result = await database.query(query, values);
    return result.rows[0];
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
      AND (ta.expiry_date IS NULL OR ta.expiry_date > CURRENT_DATE)
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
            'application_id', ta.application_id,
            'app_name', a.name,
            'app_slug', a.slug,
            'status', ta.status,
            'expiry_date', ta.expiry_date,
            'user_limit', ta.user_limit,
            'seats_used', ta.seats_used,
            'seats_available', (ta.user_limit - ta.seats_used)
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as licenses
      FROM tenants t
      LEFT JOIN tenant_applications ta ON t.id = ta.tenant_id_fk AND ta.active = true
      LEFT JOIN applications a ON ta.application_id = a.id
      WHERE t.id = $1 AND t.active = true
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

module.exports = Tenant;