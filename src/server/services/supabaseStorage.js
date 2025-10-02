/**
 * Supabase Storage Service
 *
 * Handles file uploads to Supabase Storage.
 * Manages files with tenant isolation and proper naming conventions.
 * Can be used for audio files, images, documents, etc.
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseStorageService {
  constructor(bucketName) {
    if (!bucketName) {
      throw new Error('bucketName is required for SupabaseStorageService');
    }

    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucketName = bucketName;
    this.publicUrl = process.env.SUPABASE_STORAGE_PUBLIC_URL;

    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing required Supabase configuration');
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Upload file to Supabase Storage
   *
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original filename
   * @param {string} fileIdentifier - Unique identifier for the file (e.g., sessionId, userId, etc.)
   * @param {string} tenantId - Tenant ID for isolation
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{url: string, path: string, size: number}>}
   */
  async uploadFile(fileBuffer, fileName, fileIdentifier, tenantId, mimeType) {
    try {
      // Extract file extension from original filename
      const fileExtension = fileName.split('.').pop().toLowerCase();

      // Generate storage path with tenant isolation
      const storagePath = `tenant_${tenantId}/${fileIdentifier}.${fileExtension}`;

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true // Allow overwrite if file exists
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Generate public URL using Supabase's built-in method
      const { data: publicData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      // Also generate a signed URL valid for 24 hours for external APIs like Deepgram
      const { data: signedData, error: signedError } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 24 * 60 * 60); // 24 hours

      if (signedError) {
        console.warn('Failed to create signed URL, using public URL:', signedError);
      }

      return {
        url: signedData?.signedUrl || publicData.publicUrl,
        publicUrl: publicData.publicUrl,
        signedUrl: signedData?.signedUrl,
        path: storagePath,
        size: fileBuffer.length
      };

    } catch (error) {
      console.error('Storage service error:', error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   *
   * @param {string} filePath - Storage file path
   * @returns {Promise<boolean>}
   */
  async deleteFile(filePath) {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }

  /**
   * Get file info from storage
   *
   * @param {string} filePath - Storage file path
   * @returns {Promise<Object>}
   */
  async getFileInfo(filePath) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });

      if (error) {
        throw new Error(`Failed to get file info: ${error.message}`);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Storage info error:', error);
      throw error;
    }
  }

  /**
   * Check if bucket exists and create if necessary
   *
   * @returns {Promise<boolean>}
   */
  async ensureBucketExists() {
    try {
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['audio/webm', 'audio/mpeg', 'audio/mp4', 'video/mp4', 'audio/wav', 'audio/wave', 'audio/x-wav']
        });

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }

        console.log(`Created Supabase storage bucket: ${this.bucketName}`);
      }

      return true;
    } catch (error) {
      console.error('Bucket setup error:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for private files (if needed in future)
   *
   * @param {string} filePath - Storage file path
   * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns {Promise<string>}
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw error;
    }
  }
}

module.exports = SupabaseStorageService;