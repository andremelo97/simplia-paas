const express = require('express');
const multer = require('multer');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { TenantBranding, TenantBrandingNotFoundError } = require('../../../infra/models/TenantBranding');
const SupabaseStorageService = require('../../../services/supabaseStorage');

const router = express.Router();

// Configure multer for image uploads
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
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, SVG, and ICO image files are allowed'), false);
    }
  }
});

// Configure multer for video uploads
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 video files are allowed'), false);
    }
  }
});

// Helper function to get tenant-specific storage service
async function getTenantStorageService(tenantId) {
  const database = require('../../../infra/db/database');
  const result = await database.query('SELECT subdomain FROM tenants WHERE id = $1', [tenantId]);

  if (result.rows.length === 0) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const tenantSubdomain = result.rows[0].subdomain;
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
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const branding = await TenantBranding.findByTenant(tenantId);

    res.json({
      data: branding.toJSON()
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
 *               faviconUrl:
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
router.put('/', async (req, res) => {
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
      faviconUrl,
      backgroundVideoUrl,
      companyName
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

    const branding = await TenantBranding.upsert(tenantId, {
      primaryColor,
      secondaryColor,
      tertiaryColor,
      logoUrl,
      faviconUrl,
      backgroundVideoUrl,
      companyName
    });

    res.json({
      data: branding.toJSON(),
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
router.delete('/', async (req, res) => {
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
      extractStoragePath(existingBranding.logoUrl),
      extractStoragePath(existingBranding.faviconUrl),
      extractStoragePath(existingBranding.backgroundVideoUrl)
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
 * /configurations/branding/upload-image:
 *   post:
 *     tags: [Configurations]
 *     summary: Upload tenant branding image (logo or favicon)
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Upload a branding image (logo or favicon) for the tenant.
 *       Images are stored in a tenant-specific folder: `tenant_{tenantId}/{type}.ext`
 *       Automatically updates the branding configuration with the new image URL.
 *       Supported formats: PNG, JPEG, SVG, ICO (max 5MB)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [logo, favicon]
 *         description: Type of image to upload (logo or favicon)
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
 *                 description: Image file (PNG, JPEG, SVG, or ICO)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file format, missing file, or invalid type parameter
 *       413:
 *         description: File too large (max 5MB)
 */
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { type } = req.query;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Validate type parameter
    if (!type || !['logo', 'favicon'].includes(type)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid or missing type parameter. Must be "logo" or "favicon"'
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
    const newPath = `branding/${type}.${fileExtension}`;

    // Delete old file ONLY if it's different from the new one
    const oldUrl = type === 'logo' ? existingBranding.logoUrl : existingBranding.faviconUrl;
    const oldPath = extractStoragePath(oldUrl);
    if (oldPath && oldPath !== newPath) {
      try {
        await brandingStorage.deleteFile(oldPath);
        console.log(`Deleted old ${type} from storage: ${oldPath}`);
      } catch (error) {
        console.warn(`Failed to delete old ${type} from storage:`, error);
        // Continue even if deletion fails
      }
    }

    // NOW upload the new file (upsert will replace if same name)
    const uploadResult = await brandingStorage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      type, // Just the type (logo/favicon), service will add extension from originalname
      'branding', // Folder within tenant bucket
      req.file.mimetype
    );

    // Update branding configuration with new image URL
    const updateData = {
      primaryColor: existingBranding.primaryColor,
      secondaryColor: existingBranding.secondaryColor,
      tertiaryColor: existingBranding.tertiaryColor,
      logoUrl: type === 'logo' ? uploadResult.url : existingBranding.logoUrl,
      faviconUrl: type === 'favicon' ? uploadResult.url : existingBranding.faviconUrl,
      backgroundVideoUrl: existingBranding.backgroundVideoUrl,
      companyName: existingBranding.companyName
    };

    const branding = await TenantBranding.upsert(tenantId, updateData);

    const responseKey = type === 'logo' ? 'logoUrl' : 'faviconUrl';
    const metaCode = type === 'logo' ? 'LOGO_UPLOADED' : 'FAVICON_UPLOADED';

    res.json({
      data: {
        [responseKey]: uploadResult.url,
        storagePath: uploadResult.path,
        size: uploadResult.size
      },
      meta: {
        code: metaCode,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);

    if (error.message.includes('Only PNG, JPEG')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload image'
    });
  }
});

/**
 * @openapi
 * /configurations/branding/upload-video:
 *   post:
 *     tags: [Configurations]
 *     summary: Upload tenant background video
 *     description: |
 *       **Scope:** Platform (uses authenticated user's tenant)
 *
 *       Upload a background video for the tenant to use in Hero sections.
 *       Videos are stored in a tenant-specific folder: `tenant_{tenantId}/background-video.mp4`
 *       Automatically updates the branding configuration with the new video URL.
 *       Supported format: MP4 only (max 20MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (MP4 format only, max 20MB)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *       400:
 *         description: Invalid file format or missing file
 *       413:
 *         description: File too large (max 20MB)
 */
router.post('/upload-video', videoUpload.single('video'), async (req, res) => {
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
        message: 'Video file is required'
      });
    }

    // Get existing branding FIRST to check for old files
    const existingBranding = await TenantBranding.findByTenant(tenantId);

    // Get tenant-specific storage service
    const brandingStorage = await getTenantStorageService(tenantId);
    await brandingStorage.ensureBucketExists();

    // Extract file extension from new file
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const newPath = `branding/background-video.${fileExtension}`;

    // Delete old video ONLY if it's different from the new one
    const oldPath = extractStoragePath(existingBranding.backgroundVideoUrl);
    if (oldPath && oldPath !== newPath) {
      try {
        await brandingStorage.deleteFile(oldPath);
        console.log(`Deleted old video from storage: ${oldPath}`);
      } catch (error) {
        console.warn('Failed to delete old video from storage:', error);
        // Continue even if deletion fails
      }
    }

    // NOW upload the new file (upsert will replace if same name)
    const uploadResult = await brandingStorage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      'background-video',
      'branding', // Folder within tenant bucket
      req.file.mimetype
    );

    // Update branding configuration with new video URL
    const updateData = {
      primaryColor: existingBranding.primaryColor,
      secondaryColor: existingBranding.secondaryColor,
      tertiaryColor: existingBranding.tertiaryColor,
      logoUrl: existingBranding.logoUrl,
      faviconUrl: existingBranding.faviconUrl,
      backgroundVideoUrl: uploadResult.url,
      companyName: existingBranding.companyName
    };

    const branding = await TenantBranding.upsert(tenantId, updateData);

    res.json({
      data: {
        backgroundVideoUrl: uploadResult.url,
        storagePath: uploadResult.path,
        size: uploadResult.size
      },
      meta: {
        code: 'VIDEO_UPLOADED',
        message: 'Background video uploaded successfully'
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);

    if (error.message.includes('Only MP4')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload video'
    });
  }
});

module.exports = router;
