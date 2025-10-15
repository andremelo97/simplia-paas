const database = require('../db/database');
const { getDefaultSystemMessage } = require('../utils/aiAgentDefaults');

class AIAgentConfigurationNotFoundError extends Error {
  constructor(message) {
    super(`AI Agent Configuration not found: ${message}`);
    this.name = 'AIAgentConfigurationNotFoundError';
  }
}

class AIAgentConfiguration {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.systemMessage = data.system_message;
  }

  /**
   * Get default AI Agent system message
   */
  static getDefaultSystemMessage(locale = 'en-US') {
    return getDefaultSystemMessage(locale);
  }

  /**
   * Get default configuration values
   */
  static getDefaults(locale = 'en-US') {
    return {
      id: null,
      createdAt: null,
      updatedAt: null,
      systemMessage: this.getDefaultSystemMessage(locale)
    };
  }

  /**
   * Find configuration within a tenant schema (always returns one, creates if needed)
   */
  static async findByTenant(schema, locale = 'en-US') {
    const query = `
      SELECT *
      FROM ${schema}.ai_agent_configuration
      LIMIT 1
    `;

    const result = await database.query(query);

    if (result.rows.length === 0) {
      // Return defaults if no configuration exists yet
      return this.getDefaults(locale);
    }

    return new AIAgentConfiguration(result.rows[0]);
  }

  /**
   * Upsert configuration within a tenant schema
   * Creates a new config if none exists, updates if it does
   */
  static async upsert(schema, configData) {
    const { systemMessage } = configData;

    // Check if config exists
    const existingResult = await database.query(
      `SELECT id FROM ${schema}.ai_agent_configuration LIMIT 1`
    );

    if (existingResult.rows.length === 0) {
      // Insert new configuration
      const query = `
        INSERT INTO ${schema}.ai_agent_configuration (system_message)
        VALUES ($1)
        RETURNING *
      `;
      const result = await database.query(query, [systemMessage]);
      return new AIAgentConfiguration(result.rows[0]);
    } else {
      // Update existing configuration
      const query = `
        UPDATE ${schema}.ai_agent_configuration
        SET system_message = $1
        WHERE id = $2
        RETURNING *
      `;
      const result = await database.query(query, [
        systemMessage,
        existingResult.rows[0].id
      ]);
      return new AIAgentConfiguration(result.rows[0]);
    }
  }

  /**
   * Reset configuration to defaults within a tenant schema
   */
  static async reset(schema, locale = 'en-US') {
    const existingResult = await database.query(
      `SELECT id FROM ${schema}.ai_agent_configuration LIMIT 1`
    );

    if (existingResult.rows.length === 0) {
      // Insert default configuration
      const query = `
        INSERT INTO ${schema}.ai_agent_configuration (system_message)
        VALUES ($1)
        RETURNING *
      `;
      const result = await database.query(query, [this.getDefaultSystemMessage(locale)]);
      return new AIAgentConfiguration(result.rows[0]);
    } else {
      // Reset to defaults
      const query = `
        UPDATE ${schema}.ai_agent_configuration
        SET system_message = $1
        WHERE id = $2
        RETURNING *
      `;
      const result = await database.query(query, [
        this.getDefaultSystemMessage(locale),
        existingResult.rows[0].id
      ]);
      return new AIAgentConfiguration(result.rows[0]);
    }
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      systemMessage: this.systemMessage
    };
  }
}

module.exports = {
  AIAgentConfiguration,
  AIAgentConfigurationNotFoundError
};

