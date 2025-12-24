const database = require('../db/database');

class UserOnboarding {
  constructor(data) {
    this.id = data.id;
    this.userIdFk = data.user_id_fk;
    this.appSlug = data.app_slug;
    this.completed = data.completed;
    this.completedAt = data.completed_at;
    this.skipped = data.skipped;
    this.skippedAt = data.skipped_at;
    this.createdAt = data.created_at;
  }

  /**
   * Find onboarding status for a user and app
   * @param {number} userId - User ID
   * @param {string} appSlug - App slug (hub, tq, etc.)
   * @returns {UserOnboarding|null}
   */
  static async findByUserAndApp(userId, appSlug) {
    const query = `
      SELECT * FROM public.user_onboarding
      WHERE user_id_fk = $1 AND app_slug = $2
    `;

    const result = await database.query(query, [userId, appSlug]);

    if (result.rows.length === 0) {
      return null;
    }

    return new UserOnboarding(result.rows[0]);
  }

  /**
   * Find all onboarding records for a user
   * @param {number} userId - User ID
   * @returns {UserOnboarding[]}
   */
  static async findByUser(userId) {
    const query = `
      SELECT * FROM public.user_onboarding
      WHERE user_id_fk = $1
      ORDER BY app_slug
    `;

    const result = await database.query(query, [userId]);
    return result.rows.map(row => new UserOnboarding(row));
  }

  /**
   * Check if user needs onboarding for an app (no record or not completed/skipped)
   * @param {number} userId - User ID
   * @param {string} appSlug - App slug (hub, tq, etc.)
   * @returns {boolean}
   */
  static async needsOnboarding(userId, appSlug) {
    const onboarding = await UserOnboarding.findByUserAndApp(userId, appSlug);

    if (!onboarding) {
      return true; // No record means first access
    }

    return !onboarding.completed && !onboarding.skipped;
  }

  /**
   * Mark onboarding as completed
   * @param {number} userId - User ID
   * @param {string} appSlug - App slug (hub, tq, etc.)
   * @returns {UserOnboarding}
   */
  static async markCompleted(userId, appSlug) {
    const query = `
      INSERT INTO public.user_onboarding (user_id_fk, app_slug, completed, completed_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (user_id_fk, app_slug)
      DO UPDATE SET
        completed = true,
        completed_at = NOW(),
        skipped = false,
        skipped_at = NULL
      RETURNING *
    `;

    const result = await database.query(query, [userId, appSlug]);
    return new UserOnboarding(result.rows[0]);
  }

  /**
   * Mark onboarding as skipped
   * @param {number} userId - User ID
   * @param {string} appSlug - App slug (hub, tq, etc.)
   * @returns {UserOnboarding}
   */
  static async markSkipped(userId, appSlug) {
    const query = `
      INSERT INTO public.user_onboarding (user_id_fk, app_slug, skipped, skipped_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (user_id_fk, app_slug)
      DO UPDATE SET
        skipped = true,
        skipped_at = NOW()
      RETURNING *
    `;

    const result = await database.query(query, [userId, appSlug]);
    return new UserOnboarding(result.rows[0]);
  }

  /**
   * Reset onboarding for a user and app (allows re-running wizard)
   * @param {number} userId - User ID
   * @param {string} appSlug - App slug (hub, tq, etc.)
   * @returns {boolean}
   */
  static async reset(userId, appSlug) {
    const query = `
      DELETE FROM public.user_onboarding
      WHERE user_id_fk = $1 AND app_slug = $2
    `;

    const result = await database.query(query, [userId, appSlug]);
    return result.rowCount > 0;
  }

  /**
   * Get onboarding status map for a user (all apps)
   * @param {number} userId - User ID
   * @returns {Object} - { hub: { completed, skipped }, tq: { completed, skipped } }
   */
  static async getStatusMap(userId) {
    const records = await UserOnboarding.findByUser(userId);

    const statusMap = {};
    for (const record of records) {
      statusMap[record.appSlug] = {
        completed: record.completed,
        skipped: record.skipped,
        completedAt: record.completedAt,
        skippedAt: record.skippedAt
      };
    }

    return statusMap;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userIdFk,
      appSlug: this.appSlug,
      completed: this.completed,
      completedAt: this.completedAt,
      skipped: this.skipped,
      skippedAt: this.skippedAt,
      createdAt: this.createdAt
    };
  }
}

module.exports = UserOnboarding;
