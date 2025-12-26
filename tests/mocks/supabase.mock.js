/**
 * SUPABASE STORAGE MOCK
 *
 * Mock do serviço Supabase Storage para testes.
 * Simula upload/download de arquivos sem usar storage real.
 */

const mockFiles = new Map();

class MockSupabaseStorageService {
  constructor(bucketName) {
    this.bucketName = bucketName;
  }

  /**
   * Mock file upload
   * @param {Buffer} fileBuffer - File content
   * @param {string} fileName - Original filename
   * @param {string} fileIdentifier - Unique file identifier
   * @param {string} folder - Destination folder
   * @param {string} mimeType - File MIME type
   * @returns {Object} Upload result
   */
  async uploadFile(fileBuffer, fileName, fileIdentifier, folder, mimeType) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const storagePath = `${folder}/${fileIdentifier}.${fileExtension}`;
    const publicUrl = `https://mock-supabase.co/storage/v1/object/public/${this.bucketName}/${storagePath}`;

    // Store file in memory
    mockFiles.set(storagePath, {
      buffer: fileBuffer,
      fileName,
      mimeType,
      size: fileBuffer.length,
      uploadedAt: new Date(),
    });

    return {
      url: publicUrl,
      publicUrl,
      signedUrl: publicUrl + '?token=mock-signed-token',
      path: storagePath,
      size: fileBuffer.length,
    };
  }

  /**
   * Mock file deletion
   * @param {string} filePath - Path to delete
   * @returns {boolean} Success status
   */
  async deleteFile(filePath) {
    mockFiles.delete(filePath);
    return true;
  }

  /**
   * Mock file info retrieval
   * @param {string} filePath - Path to get info for
   * @returns {Object|null} File info or null
   */
  async getFileInfo(filePath) {
    const file = mockFiles.get(filePath);
    if (!file) return null;

    return {
      name: filePath.split('/').pop(),
      id: 'mock-id-' + Date.now(),
      size: file.size,
      created_at: file.uploadedAt.toISOString(),
      updated_at: file.uploadedAt.toISOString(),
      metadata: { mimetype: file.mimeType },
    };
  }

  /**
   * Mock bucket existence check
   * @returns {boolean} Always returns true
   */
  async ensureBucketExists() {
    return true;
  }

  /**
   * Mock signed URL generation
   * @param {string} filePath - Path to file
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string} Mock signed URL
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    return `https://mock-supabase.co/storage/v1/object/sign/${this.bucketName}/${filePath}?token=mock-token&expires=${expiresIn}`;
  }
}

/**
 * Mock createTenantBucket function
 * @param {string} tenantSlug - Tenant slug
 * @param {boolean} isPublic - Whether bucket should be public
 * @returns {Object} Bucket creation result
 */
async function createTenantBucket(tenantSlug, isPublic = true) {
  const bucketName = `tenant-${tenantSlug}`;

  return {
    bucketName,
    created: true,
    folders: ['audio-files', 'branding', 'bug-reports'],
  };
}

/**
 * Mock ensureFolderExists function
 * @param {string} bucketName - Bucket name
 * @param {string} folder - Folder name
 * @returns {boolean} Always returns true
 */
async function ensureFolderExists(bucketName, folder) {
  return true;
}

/**
 * Mock deleteFileByUrl function
 * @param {string} fileUrl - File URL to delete
 * @returns {boolean} Always returns true
 */
async function deleteFileByUrl(fileUrl) {
  // Extract path from URL and delete from mock storage
  const match = fileUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
  if (match) {
    mockFiles.delete(match[1]);
  }
  return true;
}

/**
 * Setup Supabase mock for Jest tests
 */
function setupSupabaseMock() {
  jest.mock('@server/services/supabaseStorage', () => ({
    __esModule: true,
    default: MockSupabaseStorageService,
    createTenantBucket,
    ensureFolderExists,
    deleteFileByUrl,
    DEFAULT_TENANT_FOLDERS: ['audio-files', 'branding', 'bug-reports'],
  }));

  return new MockSupabaseStorageService('test-bucket');
}

/**
 * Get a file from mock storage
 * @param {string} path - File path
 * @returns {Object|null} File data or null
 */
function getMockFile(path) {
  return mockFiles.get(path);
}

/**
 * Clear all mock files
 */
function clearMockFiles() {
  mockFiles.clear();
}

/**
 * Get count of mock files
 * @returns {number} Number of files in mock storage
 */
function getMockFileCount() {
  return mockFiles.size;
}

module.exports = {
  MockSupabaseStorageService,
  createTenantBucket,
  ensureFolderExists,
  deleteFileByUrl,
  setupSupabaseMock,
  getMockFile,
  clearMockFiles,
  getMockFileCount,
};
