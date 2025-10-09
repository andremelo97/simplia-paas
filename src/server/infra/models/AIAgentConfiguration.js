const database = require('../db/database');
const { DEFAULT_SYSTEM_MESSAGE } = require('../utils/aiAgentDefaults');

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
  static getDefaultSystemMessage() {
    return DEFAULT_SYSTEM_MESSAGE;
  }

  /**
   * Get default configuration values
   */
  static getDefaults() {
    return {
      id: null,
      createdAt: null,
      updatedAt: null,
      systemMessage: this.getDefaultSystemMessage()
    };
  }

  /**
   * Find configuration within a tenant schema (always returns one, creates if needed)
   */
  static async findByTenant(schema) {
    const query = `
      SELECT *
      FROM ${schema}.ai_agent_configuration
      LIMIT 1
    `;

    const result = await database.query(query);

    if (result.rows.length === 0) {
      // Return defaults if no configuration exists yet
      return this.getDefaults();
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
  static async reset(schema) {
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
      const result = await database.query(query, [this.getDefaultSystemMessage()]);
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
        this.getDefaultSystemMessage(),
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

