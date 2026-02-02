const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const SupabaseStorageService = require('../../../services/supabaseStorage');
const { ensureFolderExists } = require('../../../services/supabaseStorage');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for memory storage (files go to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

/**
 * @openapi
 * /internal/api/v1/bug-reports:
 *   post:
 *     tags: [Bug Reports]
 *     summary: Submit a bug report
 *     description: |
 *       Submit a bug report with optional image/video attachments.
 *       The report is sent via email to admin@livocare.ai and attachments
 *       are stored in Supabase storage under the tenant's bug-reports folder.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Bug description
 *                 example: "The button doesn't work when I click on it"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional attachments (images/videos, max 5 files, 50MB each)
 *     responses:
 *       200:
 *         description: Bug report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: BUG_REPORT_SUBMITTED
 *       400:
 *         description: Description is required
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to submit bug report
 */
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files || [];

    // Get user info from JWT
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: { code: 401, message: 'Authentication required' }
      });
    }

    // Validate description
    if (!description || !description.trim()) {
      return res.status(400).json({
        error: { code: 400, message: 'Description is required' }
      });
    }

    // Upload attachments to Supabase if any
    const attachmentUrls = [];
    if (files.length > 0) {
      // Tenant slug is required - no fallback to avoid creating wrong buckets
      // Note: req.tenant.slug contains the subdomain value (see tenant middleware)
      const tenantSlug = req.tenant?.slug;

      if (!tenantSlug) {
        console.error('[BugReport] Missing tenant subdomain - cannot upload attachments');
        // Continue without attachments rather than create wrong bucket
      } else {
        const bucketName = `tenant-${tenantSlug}`;

        try {
          const storageService = new SupabaseStorageService(bucketName);

          // Ensure bucket exists before uploading (defensive check)
          await storageService.ensureBucketExists();

          // Ensure bug-reports folder exists
          await ensureFolderExists(bucketName, 'bug-reports');

          console.log(`[BugReport] Uploading ${files.length} files to bucket: ${bucketName}/bug-reports/`);

          for (const file of files) {
            const fileId = uuidv4();
            console.log(`[BugReport] Uploading file: ${file.originalname} as ${fileId}`);

            const result = await storageService.uploadFile(
              file.buffer,
              file.originalname,
              fileId,
              'bug-reports', // folder
              file.mimetype
            );

            console.log(`[BugReport] Upload success: ${result.path}`);

            attachmentUrls.push({
              url: result.signedUrl, // Use signed URL (7 days expiry for private bucket)
              name: file.originalname,
              type: file.mimetype,
              size: file.size
            });
          }
        } catch (uploadError) {
          console.error('Bug report attachment upload error:', uploadError);
          // Continue without attachments if upload fails
        }
      }
    }

    // Format date
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Build email content
    const subject = `[Bug Report] ${req.tenant?.name || 'Unknown Tenant'} - ${formattedDate}`;

    const attachmentsHtml = attachmentUrls.length > 0
      ? `
        <div class="field">
          <div class="field-label">Anexos (${attachmentUrls.length})</div>
          <div class="field-value">
            ${attachmentUrls.map(att => `
              <div style="margin-bottom: 8px;">
                <a href="${att.url}" target="_blank" style="color: #B725B7;">
                  ${escapeHtml(att.name)}
                </a>
                <span style="color: #666; font-size: 12px; margin-left: 8px;">
                  (${att.type}, ${formatFileSize(att.size)})
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #B725B7, #E91E63); padding: 30px; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 20px; }
          .field-label { font-weight: bold; color: #B725B7; margin-bottom: 5px; }
          .field-value { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #B725B7; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #E91E63; white-space: pre-wrap; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bug Report - LivoCare Hub</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Tenant</div>
              <div class="field-value">${escapeHtml(req.tenant?.name || 'N/A')} (${escapeHtml(req.tenant?.slug || 'N/A')})</div>
            </div>
            <div class="field">
              <div class="field-label">Reportado por</div>
              <div class="field-value">
                ${escapeHtml(user.name || 'N/A')}<br>
                <a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>
              </div>
            </div>
            <div class="field">
              <div class="field-label">Data/Hora</div>
              <div class="field-value">${formattedDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Descricao do Bug</div>
              <div class="message-box">${escapeHtml(description)}</div>
            </div>
            ${attachmentsHtml}
          </div>
          <div class="footer">
            Este e-mail foi enviado automaticamente pelo sistema de Bug Report do Hub LivoCare
          </div>
        </div>
      </body>
      </html>
    `;

    const plainText = `
Bug Report - LivoCare Hub
=========================

Tenant: ${req.tenant?.name || 'N/A'} (${req.tenant?.slug || 'N/A'})
Reportado por: ${user.name || 'N/A'} (${user.email})
Data/Hora: ${formattedDate}

Descricao do Bug:
${description}

${attachmentUrls.length > 0 ? `Anexos:\n${attachmentUrls.map(a => `- ${a.name}: ${a.url}`).join('\n')}` : ''}

---
Este e-mail foi enviado automaticamente pelo sistema de Bug Report do Hub LivoCare
    `.trim();

    // Create transporter using default SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.DEFAULT_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.DEFAULT_SMTP_PORT || '465'),
      secure: process.env.DEFAULT_SMTP_SECURE === 'true',
      auth: {
        user: process.env.DEFAULT_SMTP_USERNAME,
        pass: process.env.DEFAULT_SMTP_PASSWORD
      }
    });

    // Send email
    const mailOptions = {
      from: `"LivoCare Hub" <${process.env.DEFAULT_SMTP_FROM_EMAIL || 'admin@livocare.ai'}>`,
      to: 'admin@livocare.ai',
      replyTo: user.email,
      subject,
      text: plainText,
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);

    console.log(`Bug report submitted by ${user.email} from tenant ${req.tenant?.name}`);

    res.json({
      data: { success: true },
      meta: { code: 'BUG_REPORT_SUBMITTED' }
    });

  } catch (error) {
    console.error('Bug report submission error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to submit bug report. Please try again later.'
      }
    });
  }
});

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format file size to human readable
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = router;
