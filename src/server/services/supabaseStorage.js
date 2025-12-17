/**
 * Supabase Storage Service
 *
 * Handles file uploads to Supabase Storage.
 * Manages files with tenant isolation and proper naming conventions.
 * Can be used for audio files, images, documents, videos, etc.
 *
 * **URL Strategy:**
 * - Returns **permanent public URLs** by default (no expiration)
 * - Also provides signed URLs (24h) for temporary access scenarios
 * - Use public URLs for: brand assets (logos, videos), public resources
 * - Use signed URLs for: private/sensitive files when needed
 *
 * **Requirements:**
 * - Bucket must be set as PUBLIC in Supabase Dashboard for public URLs to work
 * - For private files, keep bucket private and use getSignedUrl() method explicitly
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
      throw new Error('Missing required Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
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
   * @param {string} folder - Folder within bucket ('audio-files' or 'branding')
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{url: string, path: string, size: number}>}
   */
  async uploadFile(fileBuffer, fileName, fileIdentifier, folder, mimeType) {
    try {
      // Extract file extension from original filename
      const fileExtension = fileName.split('.').pop().toLowerCase();

      // Generate storage path: folder/identifier.ext (no tenant prefix - bucket IS the tenant)
      const storagePath = `${folder}/${fileIdentifier}.${fileExtension}`;

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

      // Generate public URL (permanent, no expiration)
      const { data: publicData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      // Also generate a signed URL valid for 24 hours (for private/temporary access scenarios)
      const { data: signedData, error: signedError } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 24 * 60 * 60); // 24 hours

      if (signedError) {
        console.warn('Failed to create signed URL, using public URL:', signedError);
      }

      return {
        url: publicData.publicUrl, // Use permanent public URL as default for branding assets
        publicUrl: publicData.publicUrl,
        signedUrl: signedData?.signedUrl, // Available for scenarios requiring temporary access
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
          public: true
          // Note: fileSizeLimit and allowedMimeTypes removed - causes "object exceeded maximum size" error
          // File size limit and MIME validation are done at application level during upload
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
   * Get signed URL for private/temporary access
   *
   * Use this method explicitly when you need:
   * - Temporary access to sensitive files
   * - Time-limited sharing
   * - Files in private buckets
   *
   * Note: Brand assets (logos, videos) should use permanent public URLs instead (default behavior)
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
/**
 * Create tenant-specific bucket during TQ app provisioning
 *
 * @param {string} tenantSlug - Tenant slug (e.g., 'acme-clinic')
 * @param {boolean} isPublic - Whether bucket should be public (default: true)
 * @returns {Promise<{bucketName: string, created: boolean}>}
 */
async function createTenantBucket(tenantSlug, isPublic = true) {
  if (!tenantSlug) {
    throw new Error('tenantSlug is required to create bucket');
  }

  const bucketName = `tenant-${tenantSlug}`;

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase configuration');
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`ℹ️  Bucket already exists: ${bucketName}`);
      return { bucketName, created: false };
    }

    const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: isPublic
      // Note: fileSizeLimit and allowedMimeTypes removed - causes "object exceeded maximum size" error
      // File size limit and MIME validation are done at application level during upload
    });

    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }

    console.log(`✅ Created tenant bucket: ${bucketName} (public: ${isPublic})`);
    return { bucketName, created: true };

  } catch (error) {
    console.error(`❌ Failed to create tenant bucket for ${tenantSlug}:`, error);
    throw error;
  }
}

/**
 * Delete a file from Supabase storage by URL
 *
 * Extracts bucket and file path from the public URL and deletes the file.
 * URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
 *
 * @param {string} fileUrl - Full public URL of the file
 * @returns {Promise<boolean>} - True if deleted successfully, false otherwise
 */
async function deleteFileByUrl(fileUrl) {
  try {
    if (!fileUrl) {
      console.warn('[deleteFileByUrl] No URL provided');
      return false;
    }

    // Extract bucket and file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      console.error('[deleteFileByUrl] Invalid Supabase URL format:', fileUrl);
      return false;
    }

    const [bucket, ...pathParts] = urlParts[1].split('/');
    const filePath = pathParts.join('/');

    if (!bucket || !filePath) {
      console.error('[deleteFileByUrl] Could not extract bucket or path from URL:', fileUrl);
      return false;
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[deleteFileByUrl] Missing Supabase configuration');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Delete file from Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`[deleteFileByUrl] Failed to delete file from Supabase:`, error);
      return false;
    }

    console.log(`✅ Deleted audio file: ${bucket}/${filePath}`);
    return true;
  } catch (error) {
    console.error('[deleteFileByUrl] Error deleting file:', error);
    return false;
  }
}

module.exports.createTenantBucket = createTenantBucket;
module.exports.deleteFileByUrl = deleteFileByUrl;
