const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireAdmin, createRateLimit } = require('../../../infra/middleware/auth');
const { TenantBranding, TenantBrandingNotFoundError } = require('../../../infra/models/TenantBranding');
const { TenantMediaLibrary, MediaLibraryLimitExceededError, MediaNotFoundError, MAX_MEDIA_FILES } = require('../../../infra/models/TenantMediaLibrary');
const SupabaseStorageService = require('../../../services/supabaseStorage');

const router = express.Router();

// Configure multer for image uploads (logo only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and SVG image files are allowed'), false);
    }
  }
});

// Configure multer for media library uploads (images + videos)
const mediaLibraryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max (for videos)
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      // Additional size check for images (5MB limit)
      if (allowedImageTypes.includes(file.mimetype)) {
        // Note: size check happens after upload, we'll validate in the route
        req.isImage = true;
      }
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, SVG images and MP4 videos are allowed'), false);
    }
  }
});

// Helper function to get tenant subdomain
async function getTenantSubdomain(tenantId) {
  const database = require('../../../infra/db/database');
  const result = await database.query('SELECT subdomain FROM tenants WHERE id = $1', [tenantId]);

  if (result.rows.length === 0) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  return result.rows[0].subdomain;
}

// Helper function to get tenant-specific storage service
async function getTenantStorageService(tenantId) {
  const tenantSubdomain = await getTenantSubdomain(tenantId);
  const bucketName = `tenant-${tenantSubdomain}`;
  return new SupabaseStorageService(bucketName);
}

/**
 * Helper function to extract storage path from Supabase URL
 * Handles both public URLs (permanent) and signed URLs (temporary)
 * @param {string} url - Full Supabase storage URL
 * @returns {string|null} - Storage path or null
 */
const extractStoragePath = (url) => {
  if (!url) return null;
  try {
    // Public URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.ext
    // Signed URL format: https://xxx.supabase.co/storage/v1/object/sign/bucket-name/path/to/file.ext?token=...
    // Extract: path/to/file.ext (everything after bucket-name/)
    const match = url.match(/\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  } catch (error) {
    console.warn('Failed to extract storage path from URL:', url, error);
    return null;
  }
};

// Apply authentication to all internal-admin routes
router.use(requireAuth);

// Apply rate limiting
const internalRateLimit = createRateLimit(15 * 60 * 1000, 200); // 200 requests per 15 minutes
router.use(internalRateLimit);

/**
 * @openapi
 * /configurations/branding:
 *   get:
 *     tags: [Configurations]
 *     summary: Get tenant branding configuration
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Retrieves the visual identity configuration for the user's tenant.
 *       Returns defaults if no configuration exists yet.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding configuration retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const branding = await TenantBranding.findByTenant(tenantId);

    // Get tenant subdomain for generating signed URLs
    const tenantSubdomain = await getTenantSubdomain(tenantId);

    res.json({
      data: await branding.toJSONWithSignedUrls(tenantSubdomain)
    });
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get branding configuration'
    });
  }
});

/**
 * @openapi
 * /configurations/branding:
 *   put:
 *     tags: [Configurations]
 *     summary: Update tenant branding configuration
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Creates or updates the visual identity configuration for the user's tenant.
 *       Uses UPSERT pattern - creates if doesn't exist, updates if exists.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#B725B7'
 *               secondaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#E91E63'
 *               tertiaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#5ED6CE'
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               companyName:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Branding configuration updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const {
      primaryColor,
      secondaryColor,
      tertiaryColor,
      logoUrl,
      companyName,
      // Contact information
      email,
      phone,
      address,
      socialLinks
    } = req.body;

    // Basic validation for color format (hex colors)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'primaryColor must be a valid hex color (#RRGGBB)'
      });
    }

    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'secondaryColor must be a valid hex color (#RRGGBB)'
      });
    }

    if (tertiaryColor && !hexColorRegex.test(tertiaryColor)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'tertiaryColor must be a valid hex color (#RRGGBB)'
      });
    }

    // Ignore logoUrl if it's a full URL (signed URL) — logo is managed via upload endpoint.
    // Only accept storage paths (e.g. "branding/logo.png") to prevent overwriting paths with signed URLs.
    const safeLogoUrl = logoUrl && TenantBranding.isStoragePath(logoUrl) ? logoUrl : undefined;

    const branding = await TenantBranding.upsert(tenantId, {
      primaryColor,
      secondaryColor,
      tertiaryColor,
      logoUrl: safeLogoUrl,
      companyName,
      // Contact information
      email,
      phone,
      address,
      socialLinks
    });

    // Get tenant subdomain for generating signed URLs
    const tenantSubdomain = await getTenantSubdomain(tenantId);

    res.json({
      data: await branding.toJSONWithSignedUrls(tenantSubdomain),
      meta: {
        code: 'BRANDING_UPDATED',
        message: 'Branding configuration updated successfully'
      }
    });
  } catch (error) {
    console.error('Update branding error:', error);

    // Handle database constraint violations (e.g., invalid color format)
    if (error.code === '23514') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Color must be in hex format (#RRGGBB)'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update branding configuration'
    });
  }
});

/**
 * @openapi
 * /configurations/branding:
 *   delete:
 *     tags: [Configurations]
 *     summary: Reset tenant branding to defaults
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Deletes the custom branding configuration, reverting to system defaults.
 *       Also removes all uploaded files (logo, favicon, background video) from Supabase Storage.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding reset to defaults successfully
 *       404:
 *         description: No custom branding configuration found
 */
router.delete('/', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Get existing branding to retrieve file URLs before deleting
    const existingBranding = await TenantBranding.findByTenant(tenantId);

    // Delete files from Supabase Storage
    const filesToDelete = [
      extractStoragePath(existingBranding.logoUrl)
    ].filter(Boolean); // Remove null/undefined values

    // Delete each file (continue even if some deletions fail)
    const deletionResults = await Promise.allSettled(
      filesToDelete.map(async (filePath) => {
        try {
          await brandingStorage.deleteFile(filePath);
          console.log(`Deleted file from storage: ${filePath}`);
          return { success: true, path: filePath };
        } catch (error) {
          console.warn(`Failed to delete file from storage: ${filePath}`, error);
          return { success: false, path: filePath, error: error.message };
        }
      })
    );

    // Log deletion results
    const successCount = deletionResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`Deleted ${successCount}/${filesToDelete.length} files from storage for tenant ${tenantId}`);

    // Delete branding record from database
    await TenantBranding.delete(tenantId);

    res.json({
      meta: {
        code: 'BRANDING_RESET',
        message: 'Branding configuration reset to defaults',
        filesDeleted: successCount
      }
    });
  } catch (error) {
    console.error('Delete branding error:', error);

    if (error instanceof TenantBrandingNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No custom branding configuration found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset branding configuration'
    });
  }
});

/**
 * @openapi
 * /configurations/branding/upload-logo:
 *   post:
 *     tags: [Configurations]
 *     summary: Upload tenant logo
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Upload the tenant logo.
 *       Images are stored in a tenant-specific folder: `tenant_{subdomain}/branding/logo.ext`
 *       Automatically updates the branding configuration with the new logo URL.
 *       Supported formats: PNG, JPEG, SVG (max 5MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (PNG, JPEG, or SVG)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: Invalid file format or missing file
 *       413:
 *         description: File too large (max 5MB)
 */
router.post('/upload-logo', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Image file is required'
      });
    }

    // Get tenant-specific storage service
    const brandingStorage = await getTenantStorageService(tenantId);
    await brandingStorage.ensureBucketExists();

    // Get existing branding FIRST to check for old files
    const existingBranding = await TenantBranding.findByTenant(tenantId);

    // Extract file extension from new file
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const newPath = `branding/logo.${fileExtension}`;

    // Delete old file ONLY if it's different from the new one
    const oldPath = extractStoragePath(existingBranding.logoUrl);
    if (oldPath && oldPath !== newPath) {
      try {
        await brandingStorage.deleteFile(oldPath);
        console.log(`Deleted old logo from storage: ${oldPath}`);
      } catch (error) {
        console.warn('Failed to delete old logo from storage:', error);
        // Continue even if deletion fails
      }
    }

    // NOW upload the new file (upsert will replace if same name)
    const uploadResult = await brandingStorage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      'logo',
      'branding', // Folder within tenant bucket
      req.file.mimetype
    );

    // Update branding configuration with new logo PATH (preserve all existing fields)
    const updateData = {
      primaryColor: existingBranding.primaryColor,
      secondaryColor: existingBranding.secondaryColor,
      tertiaryColor: existingBranding.tertiaryColor,
      logoUrl: uploadResult.path, // Store path, not URL
      companyName: existingBranding.companyName,
      // Preserve contact information
      email: existingBranding.email,
      phone: existingBranding.phone,
      address: existingBranding.address,
      socialLinks: existingBranding.socialLinks
    };

    await TenantBranding.upsert(tenantId, updateData);

    res.json({
      data: {
        logoUrl: uploadResult.signedUrl, // Return signed URL for immediate use
        storagePath: uploadResult.path,
        size: uploadResult.size
      },
      meta: {
        code: 'LOGO_UPLOADED',
        message: 'Logo uploaded successfully'
      }
    });

  } catch (error) {
    console.error('Logo upload error:', error);

    if (error.message.includes('Only PNG, JPEG')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload logo'
    });
  }
});

// =============================================
// MEDIA LIBRARY ENDPOINTS
// =============================================

/**
 * @openapi
 * /configurations/branding/media-library:
 *   get:
 *     tags: [Configurations]
 *     summary: List media library files
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Returns all media files in the tenant's library with signed URLs.
 *       Optionally filter by media type (image or video).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video]
 *         description: Filter by media type
 *     responses:
 *       200:
 *         description: Media library retrieved successfully
 */
router.get('/media-library', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { type } = req.query;
    const validTypes = ['image', 'video'];

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Type must be "image" or "video"'
      });
    }

    const mediaFiles = await TenantMediaLibrary.findByTenant(tenantId, type || null);
    const tenantSubdomain = await getTenantSubdomain(tenantId);

    // Convert to JSON with signed URLs
    const mediaWithUrls = await Promise.all(
      mediaFiles.map(media => media.toJSONWithSignedUrl(tenantSubdomain))
    );

    const count = await TenantMediaLibrary.countByTenant(tenantId);

    res.json({
      data: mediaWithUrls,
      meta: {
        count: count,
        limit: MAX_MEDIA_FILES,
        remaining: MAX_MEDIA_FILES - count
      }
    });
  } catch (error) {
    console.error('Get media library error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get media library'
    });
  }
});

/**
 * @openapi
 * /configurations/branding/media-library:
 *   post:
 *     tags: [Configurations]
 *     summary: Upload file to media library
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Upload an image or video to the tenant's media library.
 *       Limit: 15 files per tenant.
 *       Images: PNG, JPEG, SVG (max 5MB)
 *       Videos: MP4 (max 20MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               altText:
 *                 type: string
 *                 description: Alt text for images (accessibility)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or limit reached
 */
router.post('/media-library', requireAdmin, mediaLibraryUpload.single('file'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'File is required'
      });
    }

    // Check image size limit (5MB)
    const isImage = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(req.file.mimetype);
    if (isImage && req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Image files must be less than 5MB'
      });
    }

    // Determine media type
    const mediaType = isImage ? 'image' : 'video';

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const storagePath = `media-library/${uniqueFilename}`;

    // Get tenant storage service
    const tenantSubdomain = await getTenantSubdomain(tenantId);
    const storageService = new SupabaseStorageService(`tenant-${tenantSubdomain}`);
    await storageService.ensureBucketExists();

    // Upload file
    const uploadResult = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      uuidv4(), // Use UUID as identifier
      'media-library',
      req.file.mimetype
    );

    // Create database record
    const media = await TenantMediaLibrary.create(tenantId, {
      filename: uniqueFilename,
      originalFilename: req.file.originalname,
      storagePath: uploadResult.path,
      mediaType: mediaType,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      altText: req.body.altText || null,
      uploadedByFk: userId
    });

    const mediaWithUrl = await media.toJSONWithSignedUrl(tenantSubdomain);
    const count = await TenantMediaLibrary.countByTenant(tenantId);

    res.status(201).json({
      data: mediaWithUrl,
      meta: {
        code: 'MEDIA_UPLOADED',
        message: 'File uploaded successfully',
        count: count,
        limit: MAX_MEDIA_FILES,
        remaining: MAX_MEDIA_FILES - count
      }
    });
  } catch (error) {
    console.error('Media upload error:', error);

    if (error instanceof MediaLibraryLimitExceededError) {
      return res.status(400).json({
        error: 'Limit Exceeded',
        message: `Maximum of ${MAX_MEDIA_FILES} files allowed in media library`
      });
    }

    if (error.message.includes('Only PNG, JPEG, SVG')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload file'
    });
  }
});

/**
 * @openapi
 * /configurations/branding/media-library/{id}:
 *   delete:
 *     tags: [Configurations]
 *     summary: Delete file from media library
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Remove a file from the tenant's media library.
 *       This also deletes the file from Supabase storage.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media file ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete('/media-library/:id', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const mediaId = parseInt(req.params.id, 10);

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (isNaN(mediaId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid media ID'
      });
    }

    // Get media to retrieve storage path
    const media = await TenantMediaLibrary.findById(mediaId, tenantId);

    if (!media) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Media file not found'
      });
    }

    // Delete from storage
    const tenantSubdomain = await getTenantSubdomain(tenantId);
    const storageService = new SupabaseStorageService(`tenant-${tenantSubdomain}`);

    try {
      await storageService.deleteFile(media.storagePath);
      console.log(`Deleted media file from storage: ${media.storagePath}`);
    } catch (storageError) {
      console.warn(`Failed to delete media file from storage: ${storageError.message}`);
      // Continue with database deletion even if storage delete fails
    }

    // Delete from database
    await TenantMediaLibrary.delete(mediaId, tenantId);

    const count = await TenantMediaLibrary.countByTenant(tenantId);

    res.json({
      meta: {
        code: 'MEDIA_DELETED',
        message: 'File deleted successfully',
        count: count,
        limit: MAX_MEDIA_FILES,
        remaining: MAX_MEDIA_FILES - count
      }
    });
  } catch (error) {
    console.error('Media delete error:', error);

    if (error instanceof MediaNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Media file not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete file'
    });
  }
});

module.exports = router;
