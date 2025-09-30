const database = require('../db/database');

class QuoteItemNotFoundError extends Error {
  constructor(message) {
    super(`Quote item not found: ${message}`);
    this.name = 'QuoteItemNotFoundError';
  }
}

class QuoteItem {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.quoteId = data.quote_id;
    this.itemId = data.item_id;
    this.name = data.name;
    this.basePrice = data.base_price;
    this.quantity = data.quantity;
    this.discountAmount = data.discount_amount;
    this.finalPrice = data.final_price;
  }

  /**
   * Find quote item by ID within a tenant schema
   * name and base_price are stored directly in quote_item table
   */
  static async findById(id, schema) {
    const query = `
      SELECT * FROM ${schema}.quote_item
      WHERE id = $1
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new QuoteItemNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new QuoteItem(result.rows[0]);
  }

  /**
   * Find all quote items for a specific quote
   * name and base_price are stored directly in quote_item table
   */
  static async findByQuoteId(quoteId, schema) {
    const query = `
      SELECT * FROM ${schema}.quote_item
      WHERE quote_id = $1
      ORDER BY created_at ASC
    `;

    const result = await database.query(query, [quoteId]);
    return result.rows.map(row => new QuoteItem(row));
  }

  /**
   * Create a new quote item within a tenant schema
   * Copies name and base_price from item catalog
   */
  static async create(itemData, schema) {
    const {
      quoteId,
      itemId,
      quantity = 1,
      discountAmount = 0
    } = itemData;

    if (!itemId) {
      throw new Error('itemId is required');
    }

    // Get item name and base_price from catalog
    const itemResult = await database.query(`
      SELECT name, base_price FROM ${schema}.item WHERE id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('Item not found in catalog');
    }

    const itemName = itemResult.rows[0].name;
    const basePrice = parseFloat(itemResult.rows[0].base_price);
    const finalPrice = (basePrice - discountAmount) * quantity;

    const query = `
      INSERT INTO ${schema}.quote_item (quote_id, item_id, name, base_price, quantity, discount_amount, final_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await database.query(query, [
      quoteId,
      itemId,
      itemName,
      basePrice,
      quantity,
      discountAmount || 0,
      finalPrice
    ]);

    return new QuoteItem(result.rows[0]);
  }

  /**
   * Update an existing quote item within a tenant schema
   */
  static async update(id, updates, schema) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    // Get current item data to recalculate final price if needed
    const currentItem = await this.findById(id, schema);

    const allowedUpdates = ['quantity', 'discount_amount'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Build update fields
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Recalculate final price if any pricing field changed
    if (['discount_amount', 'quantity'].some(field => updates[field] !== undefined)) {
      // Use base_price stored directly in quote_item
      const basePrice = parseFloat(currentItem.basePrice) || 0;
      const newDiscountAmount = updates.discount_amount !== undefined ? updates.discount_amount : currentItem.discountAmount;
      const newQuantity = updates.quantity !== undefined ? updates.quantity : currentItem.quantity;

      const newFinalPrice = (basePrice - newDiscountAmount) * newQuantity;

      updateFields.push(`final_price = $${paramIndex}`);
      updateValues.push(newFinalPrice);
      paramIndex++;
    }

    const query = `
      UPDATE ${schema}.quote_item
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query(query, [
      ...updateValues,
      id
    ]);

    if (result.rows.length === 0) {
      throw new QuoteItemNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new QuoteItem(result.rows[0]);
  }

  /**
   * Delete a quote item within a tenant schema (hard delete)
   */
  static async delete(id, schema) {
    const query = `
      DELETE FROM ${schema}.quote_item
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rows.length === 0) {
      throw new QuoteItemNotFoundError(`ID: ${id} in schema: ${schema}`);
    }

    return new QuoteItem(result.rows[0]);
  }

  /**
   * Replace all quote items for a quote (delete old + insert new)
   * This is used when saving the complete items list from the frontend
   */
  static async replaceAll(quoteId, items, schema) {
    const client = await database.getClient();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL search_path TO ${schema}, public`);

      // Delete all existing items for this quote
      await client.query(`
        DELETE FROM ${schema}.quote_item WHERE quote_id = $1
      `, [quoteId]);

      const createdItems = [];

      // Create new items if provided
      if (Array.isArray(items) && items.length > 0) {
        for (const itemData of items) {
          const { itemId, quantity = 1, discountAmount = 0 } = itemData;

          if (!itemId) {
            throw new Error('itemId is required for each item');
          }

          // Get item name and base_price from catalog
          const itemResult = await client.query(`
            SELECT name, base_price FROM ${schema}.item WHERE id = $1
          `, [itemId]);

          if (itemResult.rows.length === 0) {
            throw new Error(`Item not found in catalog: ${itemId}`);
          }

          const itemName = itemResult.rows[0].name;
          const basePrice = parseFloat(itemResult.rows[0].base_price);
          const finalPrice = (basePrice - discountAmount) * quantity;

          // Insert new quote item with copied name and base_price
          const result = await client.query(`
            INSERT INTO ${schema}.quote_item (quote_id, item_id, name, base_price, quantity, discount_amount, final_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `, [quoteId, itemId, itemName, basePrice, quantity, discountAmount || 0, finalPrice]);

          createdItems.push(new QuoteItem(result.rows[0]));
        }
      }

      await client.query('COMMIT');
      return createdItems;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk create quote items for a quote (deprecated - use replaceAll instead)
   */
  static async createBulk(items, schema) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const client = await database.getClient();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL search_path TO ${schema}, public`);

      const createdItems = [];

      for (const itemData of items) {
        const item = await this.create(itemData, schema);
        createdItems.push(item);
      }

      await client.query('COMMIT');
      return createdItems;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      quoteId: this.quoteId,
      itemId: this.itemId,
      name: this.name, // Copied from item catalog at creation
      basePrice: this.basePrice ? parseFloat(this.basePrice) : 0, // Independent, editable
      quantity: this.quantity || 1,
      discountAmount: this.discountAmount ? parseFloat(this.discountAmount) : 0,
      finalPrice: this.finalPrice ? parseFloat(this.finalPrice) : 0
    };
  }
}

module.exports = { QuoteItem, QuoteItemNotFoundError };