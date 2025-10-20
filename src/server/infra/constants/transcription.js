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
 */
const MODEL_COSTS = {
  'nova-3': 0.0043,       // Nova-3 (SYSTEM DEFAULT - multilingual)
  'nova-2': 0.0043,       // Nova-2 (legacy)
  'nova': 0.0043,         // Nova-1 (legacy)
  'enhanced': 0.0059,     // Enhanced model
  'base': 0.0043          // Base model
};

/**
 * Default cost per minute for transcription.
 * Based on Nova-3 model (system default).
 */
const DEFAULT_COST_PER_MINUTE = MODEL_COSTS[DEFAULT_STT_MODEL] || 0.0043;

/**
 * Language mapping for Deepgram API based on tenant locale.
 * Supports Brazilian Portuguese and US English.
 */
const LOCALE_TO_DEEPGRAM_LANGUAGE = {
  'pt-BR': 'pt-BR',  // Brazilian Portuguese
  'en-US': 'en-US'   // US English (fallback for en-AU, etc.)
};

/**
 * Default language for transcription if tenant locale not found.
 */
const DEFAULT_LANGUAGE = 'pt-BR';

module.exports = {
  TRANSCRIPTION_BASIC_MONTHLY_LIMIT,
  TRANSCRIPTION_MAX_MONTHLY_LIMIT,
  DEFAULT_STT_MODEL,
  MODEL_COSTS,
  DEFAULT_COST_PER_MINUTE,
  LOCALE_TO_DEEPGRAM_LANGUAGE,
  DEFAULT_LANGUAGE
};
