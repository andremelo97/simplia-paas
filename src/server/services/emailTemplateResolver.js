const { getLocaleFromTimezone } = require('../infra/utils/localeMapping');
const { renderEmail } = require('./emailTemplateRenderer');

/**
 * Resolves email template variables and renders full HTML email with branding
 * @param {Object} template - TQEmailTemplate instance with subject, body, and settings
 * @param {Object} context - Variable context
 * @param {string} context.quoteNumber - Quote number (e.g., 'QUO000001')
 * @param {string} context.patientName - Patient full name
 * @param {string} context.clinicName - Clinic/company name from branding
 * @param {string} context.publicLink - Full public quote URL
 * @param {string|null} context.password - Password (null if no password)
 * @param {string} context.timezone - Tenant timezone (e.g., 'America/Sao_Paulo')
 * @param {Object} context.branding - Tenant branding (colors, logo, etc.)
 * @returns {Object} { subject: string, html: string }
 */
function resolveEmailTemplate(template, context) {
  const { quoteNumber, patientName, clinicName, publicLink, password, timezone, branding } = context;

  // Determine locale from timezone
  const locale = getLocaleFromTimezone(timezone);

  // Use the full email renderer with branding support
  // Both quoteNumber and preventionNumber resolve to the same document number
  const variables = {
    quoteNumber: quoteNumber || '',
    preventionNumber: quoteNumber || '',
    patientName: patientName || '',
    clinicName: clinicName || '',
    publicLink: publicLink || '#',
    password: password || null
  };

  // If branding is provided, use the full renderer
  if (branding) {
    const result = renderEmail({
      template: {
        subject: template.subject,
        body: template.body,
        settings: template.settings || {}
      },
      branding,
      variables,
      locale
    });

    return {
      subject: result.subject,
      html: result.html
    };
  }

  // Fallback: Simple rendering without branding (for backwards compatibility)
  return renderSimpleEmail(template, variables, locale);
}

/**
 * Simple email rendering fallback (without branding)
 * Used when branding data is not available
 */
function renderSimpleEmail(template, variables, locale) {
  const isPtBr = locale === 'pt-BR';
  const { quoteNumber, preventionNumber, patientName, clinicName, publicLink, password } = variables;

  // Build password block HTML
  const passwordBlockHtml = password
    ? `<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px;">
          ${isPtBr ? '🔒 Senha de Acesso' : '🔒 Access Password'}
        </p>
        <p style="margin: 0; font-size: 20px; font-weight: 600; color: #212529; letter-spacing: 2px;">
          ${password}
        </p>
      </div>`
    : '';

  // Build public link HTML
  const publicLinkHtml = `<div style="text-align: center; margin: 24px 0;">
    <a href="${publicLink}" style="display: inline-block; background: #B725B7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      ${isPtBr ? 'Ver Cotação' : 'View Quote'}
    </a>
  </div>`;

  // Replace variables in subject
  let resolvedSubject = template.subject
    .replace(/\$quoteNumber\$/g, quoteNumber)
    .replace(/\$preventionNumber\$/g, preventionNumber)
    .replace(/\$patientName\$/g, patientName)
    .replace(/\$clinicName\$/g, clinicName)
    .replace(/\$greeting\$/g, isPtBr ? 'Olá' : 'Hello')
    .replace(/\$footerText\$/g, '');

  // Replace variables in body
  let resolvedBody = template.body
    .replace(/\$quoteNumber\$/g, quoteNumber)
    .replace(/\$preventionNumber\$/g, preventionNumber)
    .replace(/\$patientName\$/g, patientName)
    .replace(/\$clinicName\$/g, clinicName)
    .replace(/\$greeting\$/g, isPtBr ? 'Olá' : 'Hello')
    .replace(/\$footerText\$/g, '')
    .replace(/\$PUBLIC_LINK\$/g, publicLinkHtml)
    .replace(/\$PASSWORD_BLOCK\$/g, passwordBlockHtml)
    .replace(/\n/g, '<br>');

  // Wrap in simple container
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${resolvedBody}
    </div>
  `.trim();

  return {
    subject: resolvedSubject.trim(),
    html
  };
}

module.exports = {
  resolveEmailTemplate
};
