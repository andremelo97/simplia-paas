const nodemailer = require('nodemailer');
const TenantCommunicationSettings = require('../infra/models/TenantCommunicationSettings');

/**
 * Email Service
 * Handles email sending using tenant-specific communication configuration
 */
class EmailService {
  /**
   * Create nodemailer transporter from tenant communication settings
   * @param {Object} settings - TenantCommunicationSettings instance
   * @returns {Object} Nodemailer transporter
   */
  static createTransporter(settings) {
    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUsername,
        pass: settings.smtpPassword
      }
    });
  }

  /**
   * Send email using tenant's communication configuration
   * @param {number} tenantId - Tenant ID
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.text - Plain text content
   * @param {string} emailData.html - HTML content
   * @returns {Promise<Object>} Send result
   */
  static async sendEmail(tenantId, emailData) {
    try {
      // Fetch tenant communication settings
      const settings = await TenantCommunicationSettings.findByTenantId(tenantId);

      if (!settings) {
        throw new Error('Communication settings not configured for this tenant');
      }

      // Create transporter
      const transporter = this.createTransporter(settings);

      // Prepare email options
      const mailOptions = {
        from: settings.smtpFromName
          ? `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`
          : settings.smtpFromEmail,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      console.log(`📧 Email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send public quote email using tenant's customizable template
   * Best effort: does not throw errors, logs failures instead
   *
   * @param {Object} params - Email parameters
   * @param {number} params.tenantId - Tenant ID
   * @param {string} params.tenantSchema - Tenant schema name
   * @param {string} params.tenantTimezone - Tenant timezone (IANA format)
   * @param {string} params.recipientEmail - Patient email
   * @param {string} params.quoteNumber - Quote number (e.g., 'QUO000001')
   * @param {string} params.patientName - Patient full name
   * @param {string} params.clinicName - Clinic/company name from branding
   * @param {string} params.publicLink - Full public quote URL
   * @param {string|null} [params.password=null] - Optional password
   * @param {string} [params.patientId] - Patient ID for metadata
   * @param {string} [params.quoteId] - Quote ID for metadata
   * @param {string} [params.publicQuoteId] - Public quote ID for metadata
   * @returns {Promise<void>}
   */
  static async sendPublicQuoteEmail(params) {
    try {
      const {
        tenantId,
        tenantSchema,
        tenantTimezone,
        recipientEmail,
        quoteNumber,
        patientName,
        clinicName,
        publicLink,
        password = null,
        patientId,
        quoteId,
        publicQuoteId
      } = params;

      // Load dependencies
      const TQEmailTemplate = require('../infra/models/TQEmailTemplate');
      const { resolveEmailTemplate } = require('./emailTemplateResolver');
      const Email = require('../infra/models/Email');

      // 1. Fetch email template
      const template = await TQEmailTemplate.find(tenantSchema);

      if (!template) {
        throw new Error(`Email template not found for tenant schema: ${tenantSchema}`);
      }

      // 2. Resolve template variables
      const { subject, html } = resolveEmailTemplate(template, {
        quoteNumber,
        patientName,
        clinicName,
        publicLink,
        password,
        timezone: tenantTimezone
      });

      // 3. Send email
      await this.sendEmail(tenantId, {
        to: recipientEmail,
        subject,
        html
      });

      // 4. Log success
      await Email.log({
        tenantId,
        appName: 'tq',
        recipientEmail,
        subject,
        body: html,
        status: 'sent',
        metadata: {
          patientId,
          quoteId,
          publicQuoteId,
          quoteNumber
        }
      });

      console.log(`Public quote email sent successfully to ${recipientEmail}`);
    } catch (error) {
      console.error('Failed to send public quote email:', error);

      // Log failure but still propagate the error
      try {
        const Email = require('../infra/models/Email');
        await Email.log({
          tenantId: params.tenantId,
          appName: 'tq',
          recipientEmail: params.recipientEmail,
          subject: `Quote ${params.quoteNumber}`,
          body: 'Email send failed',
          status: 'failed',
          errorMessage: error.message,
          metadata: {
            patientId: params.patientId,
            quoteId: params.quoteId,
            publicQuoteId: params.publicQuoteId
          }
        });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }

      error.code = error.code || 'PUBLIC_QUOTE_EMAIL_FAILED';
      throw error;
    }
  }
}

module.exports = EmailService;



