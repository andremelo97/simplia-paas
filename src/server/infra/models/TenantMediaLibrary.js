const database = require('../db/database');
const SupabaseStorageService = require('../../services/supabaseStorage');

const MAX_MEDIA_FILES = 20;

class MediaLibraryLimitExceededError extends Error {
  constructor(message) {
    super(`Media library limit exceeded: ${message}`);
    this.name = 'MediaLibraryLimitExceededError';
  }
}

class MediaNotFoundError extends Error {
  constructor(message) {
    super(`Media not found: ${message}`);
    this.name = 'MediaNotFoundError';
  }
}

class TenantMediaLibrary {
  constructor(data) {
    this.id = data.id;
    this.tenantIdFk = data.tenant_id_fk;
    this.filename = data.filename;
    this.originalFilename = data.original_filename;
    this.storagePath = data.storage_path;
    this.mediaType = data.media_type;
    this.mimeType = data.mime_type;
    this.fileSize = data.file_size;
    this.altText = data.alt_text;
    this.uploadedByFk = data.uploaded_by_fk;
    this.createdAt = data.created_at;
  }

  /**
   * Find all media files for a tenant
   * @param {number} tenantId - Tenant ID
   * @param {string} [mediaType] - Optional filter: 'image' or 'video'
   * @returns {Promise<TenantMediaLibrary[]>}
   */
  static async findByTenant(tenantId, mediaType = null) {
    let query = `
      SELECT * FROM tenant_media_library
      WHERE tenant_id_fk = $1
    `;
    const params = [tenantId];

    if (mediaType) {
      query += ` AND media_type = $2`;
      params.push(mediaType);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await database.query(query, params);
    return result.rows.map(row => new TenantMediaLibrary(row));
  }

  /**
   * Find a media file by ID
   * @param {number} id - Media ID
   * @param {number} tenantId - Tenant ID (for security)
   * @returns {Promise<TenantMediaLibrary|null>}
   */
  static async findById(id, tenantId) {
    const query = `
      SELECT * FROM tenant_media_library
      WHERE id = $1 AND tenant_id_fk = $2
    `;
    const result = await database.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return new TenantMediaLibrary(result.rows[0]);
  }

  /**
   * Count media files for a tenant
   * @param {number} tenantId - Tenant ID
   * @returns {Promise<number>}
   */
  static async countByTenant(tenantId) {
    const query = `SELECT COUNT(*) as count FROM tenant_media_library WHERE tenant_id_fk = $1`;
    const result = await database.query(query, [tenantId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Create a new media file entry
   * @param {number} tenantId - Tenant ID
   * @param {Object} data - Media data
   * @returns {Promise<TenantMediaLibrary>}
   * @throws {MediaLibraryLimitExceededError} If limit is reached
   */
  static async create(tenantId, data) {
    // Check limit
    const currentCount = await this.countByTenant(tenantId);
    if (currentCount >= MAX_MEDIA_FILES) {
      throw new MediaLibraryLimitExceededError(
        `Maximum of ${MAX_MEDIA_FILES} files allowed. Current: ${currentCount}`
      );
    }

    const {
      filename,
      originalFilename,
      storagePath,
      mediaType,
      mimeType,
      fileSize,
      altText,
      uploadedByFk
    } = data;

    const query = `
      INSERT INTO tenant_media_library (
        tenant_id_fk,
        filename,
        original_filename,
        storage_path,
        media_type,
        mime_type,
        file_size,
        alt_text,
        uploaded_by_fk
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await database.query(query, [
      tenantId,
      filename,
      originalFilename,
      storagePath,
      mediaType,
      mimeType,
      fileSize,
      altText || null,
      uploadedByFk || null
    ]);

    return new TenantMediaLibrary(result.rows[0]);
  }

  /**
   * Delete a media file
   * @param {number} id - Media ID
   * @param {number} tenantId - Tenant ID (for security)
   * @returns {Promise<TenantMediaLibrary>}
   * @throws {MediaNotFoundError} If media not found
   */
  static async delete(id, tenantId) {
    const query = `
      DELETE FROM tenant_media_library
      WHERE id = $1 AND tenant_id_fk = $2
      RETURNING *
    `;
    const result = await database.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      throw new MediaNotFoundError(`id: ${id}, tenant: ${tenantId}`);
    }

    return new TenantMediaLibrary(result.rows[0]);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantIdFk,
      filename: this.filename,
      originalFilename: this.originalFilename,
      storagePath: this.storagePath,
      mediaType: this.mediaType,
      mimeType: this.mimeType,
      fileSize: this.fileSize,
      altText: this.altText,
      uploadedBy: this.uploadedByFk,
      createdAt: this.createdAt
    };
  }

  /**
   * Convert to JSON with signed URL
   * @param {string} tenantSubdomain - Tenant subdomain for bucket name
   * @returns {Promise<Object>}
   */
  async toJSONWithSignedUrl(tenantSubdomain) {
    const json = this.toJSON();

    if (!tenantSubdomain) {
      return json;
    }

    const bucketName = `tenant-${tenantSubdomain}`;

    try {
      const storage = new SupabaseStorageService(bucketName);
      // 7 days expiry for media library files
      json.url = await storage.getSignedUrl(this.storagePath, 7 * 24 * 60 * 60);
    } catch (error) {
      console.warn(`[TenantMediaLibrary] Failed to generate signed URL: ${error.message}`);
      json.url = null;
    }

    return json;
  }
}

module.exports = {
  TenantMediaLibrary,
  MediaLibraryLimitExceededError,
  MediaNotFoundError,
  MAX_MEDIA_FILES
};
