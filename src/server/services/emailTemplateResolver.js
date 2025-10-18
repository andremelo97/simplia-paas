const { getLocaleFromTimezone } = require('../infra/utils/localeMapping');

/**
 * Resolves email template variables and converts to HTML format
 * @param {Object} template - TQEmailTemplate instance with subject and body
 * @param {Object} context - Variable context
 * @param {string} context.quoteNumber - Quote number (e.g., 'QUO000001')
 * @param {string} context.patientName - Patient full name
 * @param {string} context.clinicName - Clinic/company name from branding
 * @param {string} context.publicLink - Full public quote URL
 * @param {string|null} context.password - Password (null if no password)
 * @param {string} context.timezone - Tenant timezone (e.g., 'America/Sao_Paulo')
 * @returns {Object} { subject: string, html: string }
 */
function resolveEmailTemplate(template, context) {
  const { quoteNumber, patientName, clinicName, publicLink, password, timezone } = context;

  // Determine locale from timezone
  const locale = getLocaleFromTimezone(timezone);
  const isPtBr = locale === 'pt-BR';

  // Template has direct subject and body (no locale separation)
  const subject = template.subject;
  const body = template.body;

  // Build password block HTML (or empty string if no password)
  const passwordBlockHtml = password
    ? `<p style="margin: 1rem 0;"><strong>${isPtBr ? 'Senha de acesso:' : 'Access password:'}</strong> <code style="background: #f4f4f4; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">${password}</code></p>`
    : '';

  const passwordBlockText = password
    ? `${isPtBr ? 'Senha de acesso:' : 'Access password:'} ${password}\n\n`
    : '';

  // Build public link HTML (styled anchor)
  const publicLinkHtml = `<a href="${publicLink}" style="display: inline-block; background: #B725B7; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 1rem 0;">${isPtBr ? 'Acessar Cotação' : 'Access Quote'}</a>`;
  const publicLinkText = `${isPtBr ? 'Link de acesso:' : 'Access link:'} ${publicLink}`;

  // Replace variables in subject
  let resolvedSubject = subject
    .replace(/\$quoteNumber\$/g, quoteNumber || '')
    .replace(/\$patientName\$/g, patientName || '')
    .replace(/\$clinicName\$/g, clinicName || '');

  // Replace variables in body
  let resolvedBodyHtml = body
    .replace(/\$quoteNumber\$/g, quoteNumber || '')
    .replace(/\$patientName\$/g, patientName || '')
    .replace(/\$clinicName\$/g, clinicName || '')
    .replace(/\$PUBLIC_LINK\$/g, publicLinkHtml)
    .replace(/\$PASSWORD_BLOCK\$/g, passwordBlockHtml);

  // Convert plain text line breaks to HTML paragraphs
  const htmlBody = convertTextToHtml(resolvedBodyHtml);

  return {
    subject: resolvedSubject.trim(),
    html: htmlBody
  };
}

/**
 * Converts plain text with line breaks to HTML paragraphs
 * Single \n → separate <p> tags
 * Double \n\n → <p></p> empty spacer
 * @param {string} text - Plain text with line breaks
 * @returns {string} HTML string
 */
function convertTextToHtml(text) {
  if (!text) return '';

  // Split by double line breaks (paragraph boundaries)
  const paragraphs = text.split(/\n\n+/);

  const htmlParagraphs = paragraphs.map(para => {
    const trimmed = para.trim();
    if (!trimmed) {
      return '<p style="margin: 1rem 0;"></p>'; // Empty spacer
    }

    // Split single line breaks within paragraph
    const lines = trimmed.split(/\n/);
    const content = lines.map(line => line.trim()).join('</p><p style="margin: 0.5rem 0;">');

    return `<p style="margin: 0.5rem 0;">${content}</p>`;
  });

  // Wrap in email container
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      ${htmlParagraphs.join('\n')}
    </div>
  `.trim();
}

module.exports = {
  resolveEmailTemplate
};
