/**
 * Timezone to Locale Mapping Utility
 *
 * Maps IANA timezone identifiers to appropriate locale codes
 * for date/time formatting and internationalization.
 *
 * Language Rules:
 * - Brazil timezones → pt-BR (Brazilian Portuguese)
 * - All other countries → en-US (English)
 */

/**
 * Map timezone to locale (used for date/time formatting with correct timezone)
 * Rule: Brazil → pt-BR, Everything else → en-US
 * @param {string} timezone - IANA timezone identifier (e.g., 'America/Sao_Paulo')
 * @returns {string} Locale code ('pt-BR' or 'en-US')
 */
function getLocaleFromTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return 'pt-BR'; // Default to Brazilian Portuguese
  }

  const tz = timezone.trim();

  // Brazil timezones → pt-BR (Brazilian Portuguese)
  if (
    tz === 'America/Sao_Paulo' ||
    tz === 'America/Bahia' ||
    tz === 'America/Fortaleza' ||
    tz === 'America/Recife' ||
    tz === 'America/Manaus' ||
    tz === 'America/Belem' ||
    tz === 'America/Rio_Branco' ||
    tz === 'America/Campo_Grande' ||
    tz === 'America/Cuiaba' ||
    tz === 'America/Boa_Vista' ||
    tz === 'America/Porto_Velho' ||
    tz === 'America/Eirunepe' ||
    tz === 'America/Maceio' ||
    tz === 'America/Araguaina' ||
    tz === 'America/Santarem' ||
    tz === 'America/Noronha'
  ) {
    return 'pt-BR';
  }

  // Everything else → en-US (including Australia, USA, Europe, etc.)
  return 'en-US';
}

/**
 * Get i18n language code from locale (for UI translations)
 * Rule: pt-BR → pt-BR, everything else → en-US
 * @param {string} locale - Locale code (e.g., 'pt-BR', 'en-AU')
 * @returns {string} i18n language code ('pt-BR' or 'en-US')
 */
function getLanguageFromLocale(locale) {
  if (!locale || typeof locale !== 'string') {
    return 'en-US';
  }

  // Brazilian Portuguese → pt-BR
  if (locale === 'pt-BR') {
    return 'pt-BR';
  }

  // Everything else → en-US (including en-AU, en-GB, etc.)
  return 'en-US';
}


/**
 * Validate if timezone is supported
 * @param {string} timezone - IANA timezone identifier
 * @returns {boolean} True if timezone is supported
 */
function isSupportedTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }

  const supportedTimezones = [
    // Brazil (pt-BR)
    'America/Sao_Paulo',
    'America/Bahia',
    'America/Fortaleza',
    'America/Recife',
    'America/Manaus',
    'America/Belem',
    'America/Rio_Branco',
    'America/Campo_Grande',
    'America/Cuiaba',
    'America/Boa_Vista',
    'America/Porto_Velho',
    'America/Eirunepe',
    'America/Maceio',
    'America/Araguaina',
    'America/Santarem',
    'America/Noronha',
    // Australia (en-US for language, but with Australia timezone)
    'Australia/Gold_Coast',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Australia/Adelaide',
    'Australia/Darwin',
    'Australia/Hobart',
    'Australia/Canberra',
    'Australia/Lord_Howe',
    'Australia/Eucla',
    'Australia/Broken_Hill',
    'Australia/Currie',
    'Australia/Lindeman'
  ];

  return supportedTimezones.includes(timezone.trim());
}

/**
 * Get locale metadata
 * Only 2 locales supported: pt-BR and en-US
 * @param {string} locale - Locale code
 * @returns {Object} Locale metadata (name, language, country)
 */
function getLocaleMetadata(locale) {
  const metadata = {
    'pt-BR': {
      name: 'Português (Brasil)',
      language: 'pt',
      country: 'BR',
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm'
    },
    'en-US': {
      name: 'English',
      language: 'en',
      country: 'US',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'hh:mm A'
    }
  };

  return metadata[locale] || metadata['en-US'];
}

module.exports = {
  getLocaleFromTimezone,
  getLanguageFromLocale,
  isSupportedTimezone,
  getLocaleMetadata
};
