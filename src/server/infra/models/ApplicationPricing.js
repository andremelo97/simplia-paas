const database = require('../db/database');
const { overlaps, normalizeToUTCSeconds, formatDateRange } = require('../utils/datetime');

/**
 * ApplicationPricing Model
 * Manages pricing matrix for applications by user type with versioning support
 */
class ApplicationPricing {
  constructor(data = {}) {
    this.id = data.id || null;
    this.applicationId = data.applicationId || data.application_id;
    this.userTypeId = data.userTypeId || data.user_type_id;
    this.price = data.price;
    this.currency = data.currency || 'BRL';
    this.billingCycle = data.billingCycle || data.billing_cycle || 'monthly';
    this.validFrom = data.validFrom || data.valid_from;
    this.validTo = data.validTo || data.valid_to || null;
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  /**
   * Get current active pricing for application and user type
   * @param {number} applicationId 
   * @param {number} userTypeId 
   * @param {Date} at - Date to check pricing at (default: now)
   * @returns {ApplicationPricing|null}
   */
  static async getCurrentPrice(applicationId, userTypeId, at = new Date()) {
    const query = `
      SELECT *
      FROM application_pricing 
      WHERE application_id = $1 
        AND user_type_id = $2
        AND active = TRUE
        AND valid_from <= $3
        AND (valid_to IS NULL OR valid_to > $3)
      ORDER BY valid_from DESC
      LIMIT 1
    `;
    
    const result = await database.query(query, [applicationId, userTypeId, at]);
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
      WHERE application_id = $1 AND user_type_id = $2
      ORDER BY valid_from DESC
    `;
    
    const result = await database.query(query, [applicationId, userTypeId]);
    return result.rows.map(row => new ApplicationPricing(row));
  }

  /**
   * Get pricing matrix for an application (all user types)
   * @param {number} applicationId 
   * @param {boolean} currentOnly - Return only current pricing (default: true)
   * @returns {ApplicationPricing[]}
   */
  static async getByApplication(applicationId, currentOnly = true) {
    let query = `
      SELECT ap.*, ut.name as user_type_name, ut.slug as user_type_slug
      FROM application_pricing ap
      JOIN user_types ut ON ut.id = ap.user_type_id
      WHERE ap.application_id = $1
    `;
    
    const params = [applicationId];
    
    if (currentOnly) {
      query += `
        AND ap.active = TRUE
        AND ap.valid_from <= NOW()
        AND (ap.valid_to IS NULL OR ap.valid_to > NOW())
      `;
    }
    
    query += ` ORDER BY ut.hierarchy_level, ap.valid_from DESC`;
    
    const result = await database.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      applicationId: row.application_id,
      userTypeId: row.user_type_id,
      userTypeName: row.user_type_name,
      userTypeSlug: row.user_type_slug,
      price: row.price,
      currency: row.currency,
      billingCycle: row.billing_cycle,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Check for overlapping pricing periods
   * @param {number} applicationId 
   * @param {number} userTypeId 
   * @param {Date} validFrom 
   * @param {Date|null} validTo 
   * @param {string} billingCycle 
   * @param {string} currency 
   * @param {number|null} excludeId - ID to exclude from check (for updates)
   * @returns {Object|null} Conflict details or null if no overlap
   */
  static async checkOverlap(applicationId, userTypeId, validFrom, validTo, billingCycle = 'monthly', currency = 'BRL', excludeId = null) {
    const validFromNorm = normalizeToUTCSeconds(validFrom);
    const validToNorm = validTo ? normalizeToUTCSeconds(validTo) : null;
    
    // Query for existing pricing that might overlap
    let query = `
      SELECT id, valid_from, valid_to, price, active
      FROM application_pricing 
      WHERE application_id = $1 
        AND user_type_id = $2
        AND billing_cycle = $3
        AND currency = $4
        AND active = TRUE
    `;
    
    const params = [applicationId, userTypeId, billingCycle, currency];
    
    if (excludeId) {
      query += ` AND id != $${params.length + 1}`;
      params.push(excludeId);
    }
    
    const result = await database.query(query, params);
    
    // Check each existing period for overlap using our utility function
    for (const existing of result.rows) {
      if (overlaps(validFromNorm, validToNorm, existing.valid_from, existing.valid_to)) {
        return {
          conflict: true,
          existingRange: formatDateRange(existing.valid_from, existing.valid_to),
          newRange: formatDateRange(validFromNorm, validToNorm),
          conflictingId: existing.id,
          existingPrice: existing.price
        };
      }
    }
    
    return null; // No overlap found
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

    const validFrom = data.validFrom || new Date();
    const billingCycle = data.billingCycle || 'monthly';
    const currency = data.currency || 'BRL';

    // Check for overlapping periods before insertion
    const overlap = await this.checkOverlap(
      data.applicationId,
      data.userTypeId, 
      validFrom,
      data.validTo || null,
      billingCycle,
      currency
    );
    
    if (overlap) {
      const error = new Error('Pricing period overlaps with existing pricing');
      error.code = 'PRICING_OVERLAP';
      error.status = 422;
      error.details = {
        conflict: overlap,
        businessKey: {
          applicationId: data.applicationId,
          userTypeId: data.userTypeId,
          billingCycle,
          currency
        }
      };
      throw error;
    }

    const query = `
      INSERT INTO application_pricing 
        (application_id, user_type_id, price, currency, billing_cycle, valid_from, valid_to, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await database.query(query, [
      data.applicationId,
      data.userTypeId,
      data.price,
      currency,
      billingCycle,
      validFrom,
      data.validTo || null,
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
    const allowedFields = ['price', 'currency', 'billingCycle', 'validTo', 'active'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Get current record for overlap checking
    const currentQuery = `SELECT * FROM application_pricing WHERE id = $1`;
    const currentResult = await database.query(currentQuery, [id]);
    
    if (currentResult.rows.length === 0) {
      throw new Error('Pricing entry not found');
    }
    
    const current = currentResult.rows[0];
    
    // If updating validTo, check for overlaps with the new period
    if (data.validTo !== undefined) {
      const overlap = await this.checkOverlap(
        current.application_id,
        current.user_type_id,
        current.valid_from,
        data.validTo,
        current.billing_cycle,
        current.currency,
        id // Exclude current record
      );
      
      if (overlap) {
        const error = new Error('Updated pricing period overlaps with existing pricing');
        error.code = 'PRICING_OVERLAP';
        error.status = 422;
        error.details = {
          conflict: overlap,
          businessKey: {
            applicationId: current.application_id,
            userTypeId: current.user_type_id,
            billingCycle: current.billing_cycle,
            currency: current.currency
          }
        };
        throw error;
      }
    }

    // Build dynamic update query
    for (const [key, value] of Object.entries(data)) {
      const dbField = key === 'billingCycle' ? 'billing_cycle' : 
                      key === 'validTo' ? 'valid_to' : key;
      
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
   * Schedule future pricing change
   * @param {number} applicationId 
   * @param {number} userTypeId 
   * @param {number} newPrice 
   * @param {Date} validFrom 
   * @param {Object} options - Additional options
   * @returns {ApplicationPricing}
   */
  static async schedulePrice(applicationId, userTypeId, newPrice, validFrom, options = {}) {
    if (validFrom <= new Date()) {
      throw new Error('validFrom must be in the future');
    }

    // End current pricing at the day before new pricing starts
    const currentPricing = await this.getCurrentPrice(applicationId, userTypeId);
    if (currentPricing && !currentPricing.validTo) {
      const endDate = new Date(validFrom);
      endDate.setMilliseconds(endDate.getMilliseconds() - 1);
      
      await this.update(currentPricing.id, { validTo: endDate });
    }

    // Create new pricing entry
    return await this.create({
      applicationId,
      userTypeId,
      price: newPrice,
      currency: options.currency || 'BRL',
      billingCycle: options.billingCycle || 'monthly',
      validFrom,
      validTo: options.validTo || null
    });
  }

  /**
   * Get pricing summary for billing calculation
   * @param {number} tenantId 
   * @param {Date} forDate - Date to calculate billing for
   * @returns {Object} Summary with totals by application
   */
  static async getBillingSummary(tenantId, forDate = new Date()) {
    const query = `
      SELECT 
        a.id as application_id,
        a.name as application_name,
        a.slug as application_slug,
        COUNT(uaa.*) as active_seats,
        SUM(COALESCE(uaa.price_snapshot, ap.price, 0)) as total_amount,
        uaa.currency_snapshot as currency
      FROM user_application_access uaa
      JOIN applications a ON a.id = uaa.application_id
      JOIN users u ON u.id = uaa.user_id
      LEFT JOIN application_pricing ap ON (
        ap.application_id = uaa.application_id 
        AND ap.user_type_id = COALESCE(uaa.user_type_id_snapshot, u.user_type_id)
        AND ap.active = TRUE 
        AND ap.valid_from <= $2
        AND (ap.valid_to IS NULL OR ap.valid_to > $2)
      )
      WHERE uaa.tenant_id_fk = $1 
        AND uaa.is_active = TRUE
      GROUP BY 1,2,3,6
      ORDER BY application_name
    `;

    const result = await database.query(query, [tenantId, forDate]);
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
      validFrom: this.validFrom,
      validTo: this.validTo,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ApplicationPricing;