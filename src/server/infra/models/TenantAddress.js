const database = require('../db/database');

/**
 * TenantAddress Model
 * Manages institutional addresses for tenants
 */
class TenantAddress {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id_fk_fk;
    this.type = data.type;
    this.label = data.label;
    this.line1 = data.line1;
    this.line2 = data.line2;
    this.city = data.city;
    this.state = data.state;
    this.postalCode = data.postal_code;
    this.countryCode = data.country_code;
    this.isPrimary = data.is_primary;
    this.active = data.active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findByTenant(tenantId, options = {}) {
    const { type, active = true, limit, offset } = options;
    
    let query = `
      SELECT * FROM tenant_addresses 
      WHERE tenant_id_fk = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (active !== undefined) {
      query += ` AND active = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    query += ` ORDER BY is_primary DESC, type, created_at`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
      
      if (offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }
    }

    const result = await database.query(query, params);
    return result.rows.map(row => new TenantAddress(row));
  }

  static async findById(id, tenantId) {
    const result = await database.query(
      'SELECT * FROM tenant_addresses WHERE id = $1 AND tenant_id_fk = $2',
      [id, tenantId]
    );
    
    return result.rows.length > 0 ? new TenantAddress(result.rows[0]) : null;
  }

  static async create(data) {
    const {
      tenantId,
      type,
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      countryCode,
      isPrimary = false
    } = data;

    // Validate required fields
    if (!tenantId || !type || !line1 || !countryCode) {
      throw new Error('Missing required fields: tenantId, type, line1, countryCode');
    }

    // Validate type
    const validTypes = ['HQ', 'BILLING', 'SHIPPING', 'BRANCH', 'OTHER'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Normalize country code to uppercase
    const normalizedCountryCode = countryCode.toUpperCase();

    // If setting as primary, unset other primaries of same type first
    if (isPrimary) {
      await database.query(
        'UPDATE tenant_addresses SET is_primary = false WHERE tenant_id_fk = $1 AND type = $2 AND active = true',
        [tenantId, type]
      );
    }

    const query = `
      INSERT INTO tenant_addresses (
        tenant_id_fk, type, label, line1, line2, city, state, 
        postal_code, country_code, is_primary, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      type,
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      normalizedCountryCode,
      isPrimary,
      true
    ]);

    return new TenantAddress(result.rows[0]);
  }

  static async update(id, tenantId, data) {
    const {
      type,
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      countryCode,
      isPrimary
    } = data;

    // Build update query dynamically
    const updates = [];
    const params = [id, tenantId];
    let paramIndex = 3;

    if (type !== undefined) {
      const validTypes = ['HQ', 'BILLING', 'SHIPPING', 'BRANCH', 'OTHER'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }
      updates.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (label !== undefined) {
      updates.push(`label = $${paramIndex}`);
      params.push(label);
      paramIndex++;
    }

    if (line1 !== undefined) {
      if (!line1) {
        throw new Error('line1 is required and cannot be empty');
      }
      updates.push(`line1 = $${paramIndex}`);
      params.push(line1);
      paramIndex++;
    }

    if (line2 !== undefined) {
      updates.push(`line2 = $${paramIndex}`);
      params.push(line2);
      paramIndex++;
    }

    if (city !== undefined) {
      updates.push(`city = $${paramIndex}`);
      params.push(city);
      paramIndex++;
    }

    if (state !== undefined) {
      updates.push(`state = $${paramIndex}`);
      params.push(state);
      paramIndex++;
    }

    if (postalCode !== undefined) {
      updates.push(`postal_code = $${paramIndex}`);
      params.push(postalCode);
      paramIndex++;
    }

    if (countryCode !== undefined) {
      if (!countryCode || countryCode.length !== 2) {
        throw new Error('countryCode must be a 2-character ISO country code');
      }
      updates.push(`country_code = $${paramIndex}`);
      params.push(countryCode.toUpperCase());
      paramIndex++;
    }

    if (isPrimary !== undefined) {
      if (isPrimary) {
        // First get the current record to know its type
        const current = await TenantAddress.findById(id, tenantId);
        if (current) {
          await database.query(
            'UPDATE tenant_addresses SET is_primary = false WHERE tenant_id_fk = $1 AND type = $2 AND active = true AND id != $3',
            [tenantId, current.type, id]
          );
        }
      }
      updates.push(`is_primary = $${paramIndex}`);
      params.push(isPrimary);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields provided for update');
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE tenant_addresses 
      SET ${updates.join(', ')} 
      WHERE id = $1 AND tenant_id_fk = $2 AND active = true
      RETURNING *
    `;

    const result = await database.query(query, params);
    
    return result.rows.length > 0 ? new TenantAddress(result.rows[0]) : null;
  }

  static async softDelete(id, tenantId) {
    const result = await database.query(
      'UPDATE tenant_addresses SET active = false, updated_at = NOW() WHERE id = $1 AND tenant_id_fk = $2 AND active = true RETURNING *',
      [id, tenantId]
    );
    
    return result.rowCount > 0;
  }

  static async count(tenantId, options = {}) {
    const { type, active = true } = options;
    
    let query = 'SELECT COUNT(*) FROM tenant_addresses WHERE tenant_id_fk = $1';
    const params = [tenantId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (active !== undefined) {
      query += ` AND active = $${paramIndex}`;
      params.push(active);
    }

    const result = await database.query(query, params);
    return parseInt(result.rows[0].count);
  }

  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      type: this.type,
      label: this.label,
      line1: this.line1,
      line2: this.line2,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      countryCode: this.countryCode,
      isPrimary: this.isPrimary,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TenantAddress;