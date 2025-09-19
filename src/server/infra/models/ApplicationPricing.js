const database = require('../db/database');

/**
 * ApplicationPricing Model
 * Manages pricing matrix for applications by user type with simple active/inactive model
 */
class ApplicationPricing {
  constructor(data = {}) {
    this.id = data.id || null;
    this.applicationId = data.applicationId || data.application_id_fk;
    this.userTypeId = data.userTypeId || data.user_type_id_fk;
    this.price = data.price;
    this.currency = data.currency || 'BRL';
    this.billingCycle = data.billingCycle || data.billing_cycle || 'monthly';
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  /**
   * Get current active pricing for application and user type
   * @param {number} applicationId
   * @param {number} userTypeId
   * @returns {ApplicationPricing|null}
   */
  static async getCurrentPrice(applicationId, userTypeId) {
    const query = `
      SELECT *
      FROM application_pricing
      WHERE application_id_fk = $1
        AND user_type_id_fk = $2
        AND active = TRUE
      LIMIT 1
    `;

    const result = await database.query(query, [applicationId, userTypeId]);
    return result.rows.length > 0 ? new ApplicationPricing(result.rows[0]) : null;
  }

  /**
   * Get all pricing history for application and user type
   * @param {number} applicationId 
   * @param {number} userTypeId 
   * @returns {ApplicationPricing[]}
   */
  static async getPricingHistory(applicationId, userTypeId) {
    const query = `
      SELECT *
      FROM application_pricing 
      WHERE application_id_fk = $1 AND user_type_id_fk = $2
      ORDER BY valid_from DESC
    `;
    
    const result = await database.query(query, [applicationId, userTypeId]);
    return result.rows.map(row => new ApplicationPricing(row));
  }

  /**
   * Get pricing matrix for an application (all user types)
   * @param {number} applicationId
   * @param {boolean} activeOnly - Return only active pricing (default: true)
   * @returns {ApplicationPricing[]}
   */
  static async getByApplication(applicationId, activeOnly = true) {
    let query = `
      SELECT ap.*, ut.name as user_type_name, ut.slug as user_type_slug
      FROM application_pricing ap
      JOIN user_types ut ON ut.id = ap.user_type_id_fk
      WHERE ap.application_id_fk = $1
    `;

    const params = [applicationId];

    if (activeOnly) {
      query += ` AND ap.active = TRUE`;
    }

    query += ` ORDER BY ut.hierarchy_level, ap.created_at DESC`;

    const result = await database.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      applicationId: row.application_id_fk,
      userTypeId: row.user_type_id_fk,
      userTypeName: row.user_type_name,
      userTypeSlug: row.user_type_slug,
      price: row.price,
      currency: row.currency,
      billingCycle: row.billing_cycle,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Check for duplicate pricing entry
   * @param {number} applicationId
   * @param {number} userTypeId
   * @param {string} billingCycle
   * @param {number|null} excludeId - ID to exclude from check (for updates)
   * @returns {Object|null} Conflict details or null if no conflict
   */
  static async checkDuplicate(applicationId, userTypeId, billingCycle = 'monthly', excludeId = null) {
    let query = `
      SELECT id, price, active
      FROM application_pricing
      WHERE application_id_fk = $1
        AND user_type_id_fk = $2
        AND billing_cycle = $3
    `;

    const params = [applicationId, userTypeId, billingCycle];

    if (excludeId) {
      query += ` AND id != $${params.length + 1}`;
      params.push(excludeId);
    }

    const result = await database.query(query, params);

    if (result.rows.length > 0) {
      const existing = result.rows[0];
      return {
        conflict: true,
        conflictingId: existing.id,
        existingPrice: existing.price,
        existingActive: existing.active
      };
    }

    return null; // No conflict found
  }

  /**
   * Create new pricing entry
   * @param {Object} data - Pricing data
   * @returns {ApplicationPricing}
   */
  static async create(data) {
    // Validation
    if (!data.applicationId || !data.userTypeId || data.price == null) {
      throw new Error('applicationId, userTypeId and price are required');
    }

    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (!['monthly', 'yearly'].includes(data.billingCycle || 'monthly')) {
      throw new Error('billingCycle must be monthly or yearly');
    }

    const billingCycle = data.billingCycle || 'monthly';
    const currency = data.currency || 'BRL';

    // Note: Multiple pricing entries are now allowed for the same combination

    const query = `
      INSERT INTO application_pricing
        (application_id_fk, user_type_id_fk, price, currency, billing_cycle, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await database.query(query, [
      data.applicationId,
      data.userTypeId,
      data.price,
      currency,
      billingCycle,
      data.active !== undefined ? data.active : true
    ]);

    return new ApplicationPricing(result.rows[0]);
  }

  /**
   * Update pricing entry
   * @param {number} id
   * @param {Object} data
   * @returns {ApplicationPricing|null}
   */
  static async update(id, data) {
    const allowedFields = ['price', 'currency', 'billingCycle', 'active'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Get current record
    const currentQuery = `SELECT * FROM application_pricing WHERE id = $1`;
    const currentResult = await database.query(currentQuery, [id]);

    if (currentResult.rows.length === 0) {
      throw new Error('Pricing entry not found');
    }

    // Build dynamic update query
    for (const [key, value] of Object.entries(data)) {
      const dbField = key === 'billingCycle' ? 'billing_cycle' : key;

      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'price' && value < 0) {
          throw new Error('Price cannot be negative');
        }
        if (key === 'billingCycle' && !['monthly', 'yearly'].includes(value)) {
          throw new Error('billingCycle must be monthly or yearly');
        }

        updates.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE application_pricing
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows.length > 0 ? new ApplicationPricing(result.rows[0]) : null;
  }


  /**
   * Get pricing summary for billing calculation
   * @param {number} tenantId
   * @returns {Object} Summary with totals by application
   */
  static async getBillingSummary(tenantId) {
    const query = `
      SELECT
        a.id as application_id,
        a.name as application_name,
        a.slug as application_slug,
        COUNT(uaa.*) as active_seats,
        SUM(COALESCE(uaa.price_snapshot, ap.price, 0)) as total_amount,
        uaa.currency_snapshot as currency
      FROM user_application_access uaa
      JOIN applications a ON a.id = uaa.application_id_fk
      JOIN users u ON u.id = uaa.user_id_fk
      LEFT JOIN application_pricing ap ON (
        ap.application_id_fk = uaa.application_id_fk
        AND ap.user_type_id_fk = COALESCE(uaa.user_type_id_fk_snapshot, u.user_type_id_fk)
        AND ap.active = TRUE
      )
      WHERE uaa.tenant_id_fk = $1
        AND uaa.active = TRUE
      GROUP BY 1,2,3,6
      ORDER BY application_name
    `;

    const result = await database.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Convert instance to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      applicationId: this.applicationId,
      userTypeId: this.userTypeId,
      price: parseFloat(this.price) || 0,
      currency: this.currency,
      billingCycle: this.billingCycle,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ApplicationPricing;
