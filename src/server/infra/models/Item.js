const database = require('../db/database');

class ItemNotFoundError extends Error {
  constructor(message) {
    super(`Item not found: ${message}`);
    this.name = 'ItemNotFoundError';
  }
}

class Item {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.name = data.name;
    this.description = data.description;
    this.basePrice = data.base_price;
    this.active = data.active;
  }

  /**
   * Find item by ID within a tenant schema
   */
  static async findById(id, schema) {
    try {
      const result = await database.query(`
        SELECT * FROM ${schema}.item
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        throw new ItemNotFoundError(`ID: ${id}`);
      }

      return new Item(result.rows[0]);
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      console.error('Error finding item by ID:', error);
      throw new Error('Failed to find item');
    }
  }

  /**
   * Find all items within a tenant schema with pagination and filtering
   */
  static async findAll(schema, options = {}) {
    const {
      page = 1,
      pageSize = 10,
      query = '',
      activeOnly = false
    } = options;

    try {
      let whereClause = '';
      const params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      const conditions = [];

      if (activeOnly) {
        conditions.push('active = true');
      }

      if (query) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        params.push(`%${query}%`);
        paramIndex++;
      }

      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      // Count total items
      const countResult = await database.query(`
        SELECT COUNT(*) as total
        FROM ${schema}.item
        ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);

      // Get paginated items
      const offset = (page - 1) * pageSize;
      const itemsResult = await database.query(`
        SELECT *
        FROM ${schema}.item
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, pageSize, offset]);

      const items = itemsResult.rows.map(row => new Item(row));

      return {
        data: items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('Error finding items:', error);
      throw new Error('Failed to find items');
    }
  }

  /**
   * Create a new item within a tenant schema
   */
  static async create(schema, itemData) {
    const {
      name,
      description,
      basePrice,
      active = true
    } = itemData;

    try {
      const result = await database.query(`
        INSERT INTO ${schema}.item (name, description, base_price, active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, description, basePrice, active]);

      return new Item(result.rows[0]);
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error('Failed to create item');
    }
  }

  /**
   * Update an existing item within a tenant schema
   */
  static async update(id, schema, itemData) {
    const {
      name,
      description,
      basePrice,
      active
    } = itemData;

    try {
      // First check if item exists
      await Item.findById(id, schema);

      const result = await database.query(`
        UPDATE ${schema}.item
        SET name = $1, description = $2, base_price = $3, active = $4
        WHERE id = $5
        RETURNING *
      `, [name, description, basePrice, active, id]);

      return new Item(result.rows[0]);
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      console.error('Error updating item:', error);
      throw new Error('Failed to update item');
    }
  }

  /**
   * Delete an item within a tenant schema
   */
  static async delete(id, schema) {
    try {
      // First check if item exists
      await Item.findById(id, schema);

      // Check if item is being used in any quote_items
      const usageResult = await database.query(`
        SELECT COUNT(*) as usage_count
        FROM ${schema}.quote_item
        WHERE item_id = $1
      `, [id]);

      const usageCount = parseInt(usageResult.rows[0].usage_count);
      if (usageCount > 0) {
        throw new Error('Cannot delete item that is being used in quotes');
      }

      await database.query(`
        DELETE FROM ${schema}.item
        WHERE id = $1
      `, [id]);

      return true;
    } catch (error) {
      if (error instanceof ItemNotFoundError) {
        throw error;
      }
      if (error.message.includes('Cannot delete item')) {
        throw error;
      }
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }

}

module.exports = {
  Item,
  ItemNotFoundError
};