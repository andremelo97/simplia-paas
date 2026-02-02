/**
 * Supabase Storage Service
 *
 * Handles file uploads to Supabase Storage.
 * Manages files with tenant isolation and proper naming conventions.
 * Can be used for audio files, images, documents, videos, etc.
 *
 * **URL Strategy:**
 * - All buckets are PRIVATE by default (more secure)
 * - Returns **signed URLs** for all files (with configurable expiration)
 * - Backend uses service role key to bypass RLS for uploads/management
 * - Default expiration: 7 days for branding, 24h for other files
 *
 * **Security:**
 * - Buckets are private, requiring signed URLs for access
 * - Service role key bypasses RLS for backend operations
 * - Signed URLs provide time-limited access to files
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
   * @returns {Promise<{path: string, signedUrl: string, size: number}>} path for DB storage, signedUrl for immediate use
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

      // Generate signed URL (7 days for branding assets)
      const expiresIn = folder === 'branding' ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 24 hours
      const { data: signedData, error: signedError } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresIn);

      if (signedError) {
        console.error('Failed to create signed URL:', signedError);
        throw new Error(`Failed to create signed URL: ${signedError.message}`);
      }

      return {
        path: storagePath, // Primary identifier - store this in database
        signedUrl: signedData.signedUrl, // Temporary URL for immediate use
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

      if (bucketExists) {
        console.log(`[Storage] Bucket already exists: ${this.bucketName}`);
        return true;
      }

      // Bucket doesn't exist, create it as PRIVATE
      console.log(`[Storage] Creating new PRIVATE bucket: ${this.bucketName}`);
      const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
        public: false
        // Note: fileSizeLimit and allowedMimeTypes removed - causes "object exceeded maximum size" error
        // File size limit and MIME validation are done at application level during upload
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log(`[Storage] Created Supabase storage bucket: ${this.bucketName}`);
      return true;
    } catch (error) {
      console.error('[Storage] Bucket setup error:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for file access
   *
   * All buckets are private, so signed URLs are required for access.
   * Default expiration: 7 days for branding assets, 1 hour for others.
   *
   * @param {string} filePath - Storage file path (e.g., 'branding/logo.png')
   * @param {number} expiresIn - URL expiration in seconds (default: 7 days)
   * @returns {Promise<string>}
   */
  async getSignedUrl(filePath, expiresIn = 7 * 24 * 60 * 60) {
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
 * Default folders to create in each tenant bucket
 */
const DEFAULT_TENANT_FOLDERS = ['audio-files', 'branding', 'bug-reports'];

/**
 * Create tenant-specific bucket during TQ app provisioning
 * Also creates default folders (audio-files, branding, bug-reports)
 *
 * Buckets are PRIVATE by default for security. Use signed URLs for access.
 *
 * @param {string} tenantSlug - Tenant slug (e.g., 'acme-clinic')
 * @param {boolean} isPublic - Whether bucket should be public (default: false)
 * @returns {Promise<{bucketName: string, created: boolean, folders: string[]}>}
 */
async function createTenantBucket(tenantSlug, isPublic = false) {
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
    let bucketCreated = false;

    if (bucketExists) {
      console.log(`ℹ️  Bucket already exists: ${bucketName}`);
    } else {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: isPublic
        // Note: fileSizeLimit and allowedMimeTypes removed - causes "object exceeded maximum size" error
        // File size limit and MIME validation are done at application level during upload
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log(`✅ Created tenant bucket: ${bucketName} (public: ${isPublic})`);
      bucketCreated = true;
    }

    // Create default folders by uploading .gitkeep placeholder files
    const createdFolders = [];
    for (const folder of DEFAULT_TENANT_FOLDERS) {
      try {
        const placeholderPath = `${folder}/.gitkeep`;

        // Check if folder already has content
        const { data: existingFiles } = await supabase.storage
          .from(bucketName)
          .list(folder, { limit: 1 });

        if (existingFiles && existingFiles.length > 0) {
          console.log(`ℹ️  Folder already exists with content: ${bucketName}/${folder}/`);
          continue;
        }

        // Create placeholder file to ensure folder exists
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(placeholderPath, Buffer.from(''), {
            contentType: 'text/plain',
            upsert: true
          });

        if (uploadError) {
          console.warn(`⚠️  Failed to create folder ${folder}: ${uploadError.message}`);
        } else {
          console.log(`✅ Created folder: ${bucketName}/${folder}/`);
          createdFolders.push(folder);
        }
      } catch (folderError) {
        console.warn(`⚠️  Error creating folder ${folder}:`, folderError.message);
      }
    }

    return { bucketName, created: bucketCreated, folders: createdFolders };

  } catch (error) {
    console.error(`❌ Failed to create tenant bucket for ${tenantSlug}:`, error);
    throw error;
  }
}

/**
 * Ensure a specific folder exists in a bucket
 *
 * @param {string} bucketName - Bucket name
 * @param {string} folder - Folder name
 * @returns {Promise<boolean>}
 */
async function ensureFolderExists(bucketName, folder) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ensureFolderExists] Missing Supabase configuration');
      return false;
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if folder has content
    const { data: existingFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folder, { limit: 1 });

    if (listError) {
      console.warn(`[ensureFolderExists] Error listing folder ${folder}: ${listError.message}`);
    }

    if (existingFiles && existingFiles.length > 0) {
      return true; // Folder exists with content
    }

    // Create placeholder to ensure folder exists
    const placeholderPath = `${folder}/.gitkeep`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(placeholderPath, Buffer.from(''), {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.warn(`[ensureFolderExists] Failed to create folder ${folder}: ${uploadError.message}`);
      return false;
    }

    console.log(`[ensureFolderExists] Created folder: ${bucketName}/${folder}/`);
    return true;
  } catch (error) {
    console.error(`[ensureFolderExists] Error:`, error);
    return false;
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
module.exports.ensureFolderExists = ensureFolderExists;
module.exports.DEFAULT_TENANT_FOLDERS = DEFAULT_TENANT_FOLDERS;
