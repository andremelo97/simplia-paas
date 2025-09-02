const database = require('../db/database');

/**
 * TenantContact Model
 * Manages contact persons for tenants
 */
class TenantContact {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id;
    this.type = data.type;
    this.fullName = data.full_name;
    this.email = data.email;
    this.phoneE164 = data.phone_e164;
    this.title = data.title;
    this.department = data.department;
    this.notes = data.notes;
    this.isPrimary = data.is_primary;
    this.active = data.active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findByTenant(tenantId, options = {}) {
    const { type, active = true, limit, offset } = options;
    
    let query = `
      SELECT * FROM tenant_contacts 
      WHERE tenant_id = $1
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
    return result.rows.map(row => new TenantContact(row));
  }

  static async findById(id, tenantId) {
    const result = await database.query(
      'SELECT * FROM tenant_contacts WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    return result.rows.length > 0 ? new TenantContact(result.rows[0]) : null;
  }

  static async create(data) {
    const {
      tenantId,
      type,
      fullName,
      email,
      phoneE164,
      title,
      department,
      notes,
      isPrimary = false
    } = data;

    // Validate required fields
    if (!tenantId || !type || !fullName) {
      throw new Error('Missing required fields: tenantId, type, fullName');
    }

    // Validate type
    const validTypes = ['ADMIN', 'BILLING', 'TECH', 'LEGAL', 'OTHER'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate and normalize email
    let normalizedEmail = null;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      normalizedEmail = email.toLowerCase().trim();
    }

    // Validate phone format if provided (E.164)
    if (phoneE164) {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phoneE164)) {
        throw new Error('Phone must be in E.164 format (e.g., +5511999999999)');
      }
    }


    // If setting as primary, unset other primaries of same type first
    if (isPrimary) {
      await database.query(
        'UPDATE tenant_contacts SET is_primary = false WHERE tenant_id = $1 AND type = $2 AND active = true',
        [tenantId, type]
      );
    }

    const query = `
      INSERT INTO tenant_contacts (
        tenant_id, type, full_name, email, phone_e164, title, department,
        notes, is_primary, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      type,
      fullName.trim(),
      normalizedEmail,
      phoneE164,
      title ? title.trim() : null,
      department ? department.trim() : null,
      notes ? notes.trim() : null,
      isPrimary,
      true
    ]);

    return new TenantContact(result.rows[0]);
  }

  static async update(id, tenantId, data) {
    const {
      type,
      fullName,
      email,
      phoneE164,
      title,
      department,
      notes,
      isPrimary
    } = data;

    // Build update query dynamically
    const updates = [];
    const params = [id, tenantId];
    let paramIndex = 3;

    if (type !== undefined) {
      const validTypes = ['ADMIN', 'BILLING', 'TECH', 'LEGAL', 'OTHER'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }
      updates.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (fullName !== undefined) {
      if (!fullName || !fullName.trim()) {
        throw new Error('fullName is required and cannot be empty');
      }
      updates.push(`full_name = $${paramIndex}`);
      params.push(fullName.trim());
      paramIndex++;
    }

    if (email !== undefined) {
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format');
        }
        updates.push(`email = $${paramIndex}`);
        params.push(email.toLowerCase().trim());
        paramIndex++;
      } else {
        updates.push(`email = NULL`);
      }
    }

    if (phoneE164 !== undefined) {
      if (phoneE164) {
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        if (!e164Regex.test(phoneE164)) {
          throw new Error('Phone must be in E.164 format (e.g., +5511999999999)');
        }
        updates.push(`phone_e164 = $${paramIndex}`);
        params.push(phoneE164);
        paramIndex++;
      } else {
        updates.push(`phone_e164 = NULL`);
      }
    }

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title ? title.trim() : null);
      paramIndex++;
    }

    if (department !== undefined) {
      updates.push(`department = $${paramIndex}`);
      params.push(department ? department.trim() : null);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(notes ? notes.trim() : null);
      paramIndex++;
    }


    if (isPrimary !== undefined) {
      if (isPrimary) {
        // First get the current record to know its type
        const current = await TenantContact.findById(id, tenantId);
        if (current) {
          await database.query(
            'UPDATE tenant_contacts SET is_primary = false WHERE tenant_id = $1 AND type = $2 AND active = true AND id != $3',
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
      UPDATE tenant_contacts 
      SET ${updates.join(', ')} 
      WHERE id = $1 AND tenant_id = $2 AND active = true
      RETURNING *
    `;

    const result = await database.query(query, params);
    
    return result.rows.length > 0 ? new TenantContact(result.rows[0]) : null;
  }

  static async softDelete(id, tenantId) {
    const result = await database.query(
      'UPDATE tenant_contacts SET active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 AND active = true RETURNING *',
      [id, tenantId]
    );
    
    return result.rowCount > 0;
  }

  static async count(tenantId, options = {}) {
    const { type, active = true } = options;
    
    let query = 'SELECT COUNT(*) FROM tenant_contacts WHERE tenant_id = $1';
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
      fullName: this.fullName,
      email: this.email,
      phoneE164: this.phoneE164,
      title: this.title,
      department: this.department,
      notes: this.notes,
      isPrimary: this.isPrimary,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TenantContact;