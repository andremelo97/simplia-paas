/**
 * Transcription Quota System Constants
 *
 * Defines system-wide constants for the transcription quota management system.
 */

/**
 * Basic monthly transcription limit in minutes.
 * This is the minimum limit for VIP plans - VIP users cannot set a limit below this value.
 *
 * Default: 2400 minutes (40 hours)
 *
 * Can be configured via environment variable:
 * TRANSCRIPTION_BASIC_MONTHLY_LIMIT=2400
 */
const TRANSCRIPTION_BASIC_MONTHLY_LIMIT = parseInt(
  process.env.TRANSCRIPTION_BASIC_MONTHLY_LIMIT || '2400'
);

/**
 * Maximum allowed monthly transcription limit for VIP plans.
 * This prevents unrealistic quota configurations.
 *
 * Default: 50000 minutes (~833 hours)
 */
const TRANSCRIPTION_MAX_MONTHLY_LIMIT = 50000;

/**
 * Default Deepgram model to use for all transcriptions.
 * System-wide standard: Nova-3 (best accuracy, multilingual support).
 */
const DEFAULT_STT_MODEL = process.env.DEEPGRAM_MODEL || 'nova-3';

/**
 * Model costs per minute in USD.
 * Updated based on current Deepgram pricing (as of January 2025).
 * Source: https://deepgram.com/pricing
 *
 * IMPORTANT: Deepgram model is always 'nova-3' in API calls.
 * The cost difference comes from the language strategy:
 * 1. Monolingual (language=pt-BR or en-US): $0.0043/min
 * 2. Multilingual (detect_language=true): $0.0052/min
 */
const MODEL_COSTS = {
  'nova-3': 0.0043,       // Nova-3 with language parameter (Monolingual)
  'nova-2': 0.0043,       // Nova-2 (legacy)
  'nova': 0.0043,         // Nova-1 (legacy)
  'enhanced': 0.0059,     // Enhanced model
  'base': 0.0043          // Base model
};

/**
 * Default cost per minute for transcription.
 * Based on Nova-3 Monolingual (system default).
 */
const DEFAULT_COST_PER_MINUTE = MODEL_COSTS[DEFAULT_STT_MODEL] || 0.0043;

/**
 * Cost per minute for multilingual transcription with language detection.
 * Uses same nova-3 model but with detect_language=true parameter.
 */
const MULTILINGUAL_COST_PER_MINUTE = 0.0052;

/**
 * Language mapping for Deepgram API based on tenant locale.
 * NOTE: Not currently used - language determined by timezone in transcription.js
 * (pt-BR for America/Sao_Paulo, en-US for everything else)
 */
const LOCALE_TO_DEEPGRAM_LANGUAGE = {
  'pt-BR': 'pt-BR',  // Brazilian Portuguese
  'en-US': 'en-US',  // US English
  'en-AU': 'en-US'   // Australian English → use en-US for Deepgram
};

/**
 * Default language for transcription if tenant timezone not found.
 * Changed to en-US as global default (pt-BR only for Brazil timezone).
 */
const DEFAULT_LANGUAGE = 'en-US';

module.exports = {
  TRANSCRIPTION_BASIC_MONTHLY_LIMIT,
  TRANSCRIPTION_MAX_MONTHLY_LIMIT,
  DEFAULT_STT_MODEL,
  MODEL_COSTS,
  DEFAULT_COST_PER_MINUTE,
  MULTILINGUAL_COST_PER_MINUTE,
  LOCALE_TO_DEEPGRAM_LANGUAGE,
  DEFAULT_LANGUAGE
};
