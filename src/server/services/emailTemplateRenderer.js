/**
 * Email Template Renderer Service
 * Renders beautiful HTML emails using branding data and template settings
 */

/**
 * Resolve background color/gradient from color type and branding
 * @param {string} colorType - Color type
 * @param {Object} branding - Tenant branding with colors
 * @returns {string} CSS background value
 */
function resolveBackground(colorType, branding) {
  const primaryColor = branding.primaryColor || '#B725B7';
  const secondaryColor = branding.secondaryColor || '#E91E63';
  const tertiaryColor = branding.tertiaryColor || '#5ED6CE';

  switch (colorType) {
    case 'white':
      return '#ffffff';
    case 'black':
      return '#1f2937';
    case 'primary':
      return primaryColor;
    case 'secondary':
      return secondaryColor;
    case 'tertiary':
      return tertiaryColor;
    case 'primary-gradient':
      return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
    case 'secondary-gradient':
      return `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`;
    case 'tertiary-gradient':
      return `linear-gradient(135deg, ${tertiaryColor}, ${primaryColor})`;
    default:
      return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  }
}

/**
 * Resolve text color from text color type
 * @param {string} textColorType - Text color type ('white' or 'black')
 * @returns {string} CSS color value
 */
function resolveTextColor(textColorType) {
  return textColorType === 'black' ? '#1f2937' : '#ffffff';
}

/**
 * Render email HTML from template, settings, and branding
 * @param {Object} params - Render parameters
 * @param {Object} params.template - Email template with subject, body, settings
 * @param {Object} params.branding - Tenant branding (colors, logo, company name)
 * @param {Object} params.variables - Variable values for substitution
 * @param {string} params.locale - Locale for formatting (pt-BR or en-US)
 * @returns {Object} { subject, html, text }
 */
function renderEmail({ template, branding, variables, locale = 'en-US' }) {
  const settings = template.settings || {};

  // Merge settings variables into variables object
  const allVariables = {
    ...variables,
    ctaButtonText: settings.ctaButtonText || (locale === 'pt-BR' ? 'Ver Cotação' : 'View Quote'),
    clinicName: branding.companyName || variables.clinicName || ''
  };

  // Render subject with variables
  const subject = substituteVariables(template.subject, allVariables);

  // Render body text with variables
  const bodyText = substituteVariables(template.body, allVariables);

  // Generate HTML email
  const html = generateHtmlEmail({
    bodyText,
    branding,
    settings,
    variables: allVariables,
    locale
  });

  // Generate plain text version
  const text = generatePlainTextEmail({
    bodyText,
    variables: allVariables
  });

  return { subject, html, text };
}

/**
 * Substitute template variables in text
 * @param {string} text - Text with $variable$ placeholders
 * @param {Object} variables - Variable values
 * @returns {string} Text with substituted values
 */
function substituteVariables(text, variables) {
  if (!text) return '';

  let result = text;

  // Substitute all $variable$ patterns
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$${key}\\$`, 'g');
    result = result.replace(regex, value || '');
  });

  return result;
}

/**
 * Generate footer contact info HTML
 * @param {Object} settings - Template settings
 * @param {string} locale - Locale for labels
 * @returns {string} Footer contact info HTML
 */
function generateFooterContactInfo(settings, locale) {
  const parts = [];

  // Phone
  if (settings.showPhone && settings.phone) {
    const phoneLabel = locale === 'pt-BR' ? 'Telefone' : 'Phone';
    parts.push(`<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">📞 ${phoneLabel}: ${settings.phone}</p>`);
  }

  // Address
  if (settings.showAddress && settings.address) {
    const addressLabel = locale === 'pt-BR' ? 'Endereço' : 'Address';
    const addressFormatted = settings.address.replace(/\n/g, ', ');
    parts.push(`<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">📍 ${addressLabel}: ${addressFormatted}</p>`);
  }

  // Social Links
  if (settings.showSocialLinks && settings.socialLinks) {
    const socialParts = [];
    const { facebook, instagram, linkedin, website } = settings.socialLinks;

    if (facebook) {
      socialParts.push(`<a href="${facebook}" style="color: #B725B7; text-decoration: none; margin: 0 8px;">Facebook</a>`);
    }
    if (instagram) {
      socialParts.push(`<a href="${instagram}" style="color: #B725B7; text-decoration: none; margin: 0 8px;">Instagram</a>`);
    }
    if (linkedin) {
      socialParts.push(`<a href="${linkedin}" style="color: #B725B7; text-decoration: none; margin: 0 8px;">LinkedIn</a>`);
    }
    if (website) {
      socialParts.push(`<a href="${website}" style="color: #B725B7; text-decoration: none; margin: 0 8px;">Website</a>`);
    }

    if (socialParts.length > 0) {
      parts.push(`<p style="margin: 8px 0 4px 0; font-size: 12px;">${socialParts.join(' • ')}</p>`);
    }
  }

  return parts.length > 0 ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">${parts.join('')}</div>` : '';
}

/**
 * Generate HTML email with branding
 * @param {Object} params - Generation parameters
 * @returns {string} HTML email content
 */
function generateHtmlEmail({ bodyText, branding, settings, variables, locale }) {
  const logoUrl = branding.logoUrl;
  const companyName = branding.companyName || variables.clinicName || '';
  const showLogo = settings.showLogo !== false && logoUrl;

  // Resolve colors from settings
  const headerColorType = settings.headerColor || 'primary-gradient';
  const buttonColorType = settings.buttonColor || 'primary-gradient';

  const headerBackground = resolveBackground(headerColorType, branding);
  const headerTextColor = resolveTextColor(settings.headerTextColor || 'white');
  const buttonBackground = resolveBackground(buttonColorType, branding);
  const buttonTextColor = resolveTextColor(settings.buttonTextColor || 'white');

  // Generate footer contact info
  const footerContactInfo = generateFooterContactInfo(settings, locale);

  // Process body text - replace $PUBLIC_LINK$ and $PASSWORD_BLOCK$ with styled versions
  let processedBody = bodyText
    .replace(/\n/g, '<br>')
    .replace(
      /\$PUBLIC_LINK\$/g,
      `<div style="text-align: center; margin: 24px 0;">
        <a href="${variables.publicLink || '#'}"
           style="display: inline-block; background: ${buttonBackground};
                  color: ${buttonTextColor}; padding: 14px 32px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);${buttonColorType === 'white' ? ' border: 1px solid #e5e7eb;' : ''}">
          ${variables.ctaButtonText}
        </a>
      </div>`
    )
    .replace(
      /\$PASSWORD_BLOCK\$/g,
      variables.password
        ? `<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px;">
              ${locale === 'pt-BR' ? '🔒 Senha de Acesso' : '🔒 Access Password'}
            </p>
            <p style="margin: 0; font-size: 20px; font-weight: 600; color: #212529; letter-spacing: 2px;">
              ${variables.password}
            </p>
          </div>`
        : ''
    );

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${variables.subject || ''}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td style="background: ${headerBackground}; padding: 32px 40px; border-radius: 16px 16px 0 0;${headerColorType === 'white' ? ' border: 1px solid #e5e7eb; border-bottom: none;' : ''}">
              ${showLogo ? `
              <div style="text-align: center; margin-bottom: 16px;">
                <img src="${logoUrl}" alt="${companyName}" style="max-height: 60px; max-width: 200px;">
              </div>
              ` : `
              <div style="text-align: center;">
                <h1 style="color: ${headerTextColor}; margin: 0; font-size: 24px; font-weight: 600;">${companyName}</h1>
              </div>
              `}
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="background-color: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${processedBody}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              ${footerContactInfo}
              <p style="margin: ${footerContactInfo ? '16px' : '0'} 0 0 0; color: #9ca3af; font-size: 12px;">
                ${locale === 'pt-BR'
                  ? `Este e-mail foi enviado por ${companyName} | <a href="https://www.livocare.ai" style="color: #B725B7; text-decoration: none;">www.livocare.ai</a>`
                  : `This email was sent by ${companyName} | <a href="https://www.livocare.ai" style="color: #B725B7; text-decoration: none;">www.livocare.ai</a>`}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate plain text version of email
 * @param {Object} params - Generation parameters
 * @returns {string} Plain text email content
 */
function generatePlainTextEmail({ bodyText, variables }) {
  let text = bodyText
    .replace(/\$PUBLIC_LINK\$/g, variables.publicLink || '')
    .replace(/\$PASSWORD_BLOCK\$/g, variables.password ? `\n🔒 Senha: ${variables.password}\n` : '');

  return text;
}

/**
 * Generate preview HTML for the configuration page
 * Uses sample data to show how the email will look
 * @param {Object} params - Preview parameters
 * @returns {string} Preview HTML
 */
function renderPreview({ template, branding, locale = 'en-US' }) {
  const sampleVariables = {
    quoteNumber: 'QUO000123',
    patientName: locale === 'pt-BR' ? 'Maria Silva' : 'John Doe',
    clinicName: branding.companyName || (locale === 'pt-BR' ? 'Clínica Exemplo' : 'Example Clinic'),
    publicLink: 'https://example.com/quote/abc123',
    password: 'ABC123'
  };

  return renderEmail({
    template,
    branding,
    variables: sampleVariables,
    locale
  });
}

module.exports = {
  renderEmail,
  renderPreview,
  substituteVariables
};
