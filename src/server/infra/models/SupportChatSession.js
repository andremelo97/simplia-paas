const database = require('../db/database');

const MAX_MESSAGES = 100;

class SupportChatSession {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id_fk;
    this.messages = data.messages || [];
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Find chat session by user ID
   *
   * @param {number} userId - User ID
   * @param {string} schema - Tenant schema
   * @returns {Promise<SupportChatSession|null>}
   */
  static async findByUserId(userId, schema) {
    const query = `
      SELECT * FROM ${schema}.support_chat_session
      WHERE user_id_fk = $1
      LIMIT 1
    `;
    const result = await database.query(query, [userId]);

    if (result.rows.length === 0) return null;
    return new SupportChatSession(result.rows[0]);
  }

  /**
   * Create or update chat session (upsert)
   * Trims messages to MAX_MESSAGES keeping the most recent
   *
   * @param {number} userId - User ID
   * @param {string} schema - Tenant schema
   * @param {Array} messages - Full messages array
   * @returns {Promise<SupportChatSession>}
   */
  static async createOrUpdate(userId, schema, messages) {
    // Keep only the most recent messages
    const trimmed = messages.length > MAX_MESSAGES
      ? messages.slice(-MAX_MESSAGES)
      : messages;

    const query = `
      INSERT INTO ${schema}.support_chat_session (user_id_fk, messages)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (user_id_fk)
      DO UPDATE SET messages = $2::jsonb, updated_at = now()
      RETURNING *
    `;
    const result = await database.query(query, [userId, JSON.stringify(trimmed)]);
    return new SupportChatSession(result.rows[0]);
  }

  /**
   * Clear chat history for a user
   *
   * @param {number} userId - User ID
   * @param {string} schema - Tenant schema
   * @returns {Promise<boolean>}
   */
  static async clearHistory(userId, schema) {
    const query = `
      DELETE FROM ${schema}.support_chat_session
      WHERE user_id_fk = $1
    `;
    await database.query(query, [userId]);
    return true;
  }
}

module.exports = { SupportChatSession };
