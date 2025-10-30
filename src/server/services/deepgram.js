/**
 * Deepgram Batch Transcription Service
 *
 * This service handles Deepgram pre-recorded audio transcription using batch processing.
 * It uses HTTP POST requests to Deepgram's /v1/listen endpoint with webhook callbacks.
 *
 * IMPORTANT: This service does NOT use token-based authentication, streaming, or real-time features.
 * It only implements batch processing for .webm audio files.
 */

const crypto = require('crypto');

// Import fetch with fallback for different Node.js versions
let fetch;
try {
  // Try native fetch first (Node.js 18+)
  fetch = globalThis.fetch;
  if (!fetch) {
    // Fallback to node-fetch
    fetch = require('node-fetch');
  }
} catch (error) {
  // Last resort fallback
  const { default: nodeFetch } = require('node-fetch');
  fetch = nodeFetch;
}

class DeepgramService {
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.adminApiKey = process.env.DEEPGRAM_API_KEY_ADMIN || this.apiKey; // Fallback to regular key if admin key not set
    this.baseUrl = 'https://api.deepgram.com/v1';

    if (!this.apiKey) {
      console.warn('DEEPGRAM_API_KEY environment variable not found. Deepgram features will be disabled.');
    }
  }

  /**
   * Transcribe audio file using Deepgram's batch processing API
   *
   * @param {string} audioUrl - Signed URL to the audio file (.webm)
   * @param {string} callbackUrl - Webhook URL for receiving transcription results
   * @param {Object} options - Additional transcription options
   * @param {boolean} options.detectLanguage - Enable language detection (multilingual)
   * @param {string} options.language - Target language (only if detectLanguage=false)
   * @returns {Promise<Object>} Deepgram response with request_id
   */
  async transcribeByUrl(audioUrl, callbackUrl, options = {}) {
    if (!this.apiKey) {
      throw new Error('Deepgram API key not configured');
    }

    try {
      const requestBody = {
        url: audioUrl
      };

      // Build query parameters
      const baseParams = {
        model: options.model || 'nova-3',
        smart_format: 'true',
        punctuate: 'true',
        diarize: 'false',
        callback: callbackUrl,
        ...options.additionalParams
      };

      // Language strategy: either detect_language OR language parameter
      if (options.detectLanguage) {
        // Multilingual mode: use language detection
        baseParams.detect_language = 'true';
      } else {
        // Monolingual mode: use specific language parameter
        baseParams.language = options.language || 'pt-BR';
      }

      const queryParams = new URLSearchParams(baseParams);

      // Add extra metadata for webhook correlation (tenantId, schema, transcriptionId)
      if (options.extra) {
        Object.entries(options.extra).forEach(([key, value]) => {
          queryParams.append('extra', `${key}:${value}`);
        });
      }

      const url = `${this.baseUrl}/listen?${queryParams.toString()}`;

      // Debug logging for Deepgram request
      console.log('[Deepgram] 🚀 Starting transcription request');
      console.log('[Deepgram] 📍 Audio URL:', audioUrl);
      console.log('[Deepgram] 🔧 Model:', options.model || 'nova-3');
      if (options.detectLanguage) {
        console.log('[Deepgram] 🌐 Language Strategy: Multilingual (detect_language=true)');
      } else {
        console.log('[Deepgram] 🌐 Language Strategy: Monolingual (language=' + (options.language || 'pt-BR') + ')');
      }
      console.log('[Deepgram] 🔗 Callback URL:', callbackUrl);
      if (options.extra) {
        console.log('[Deepgram] 📦 Extra metadata:', options.extra);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Deepgram] ❌ API error:', response.status, response.statusText);
        console.error('[Deepgram] ❌ Error details:', errorText);
        throw new Error(`Deepgram API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      // Log the request for debugging
      console.log('[Deepgram] ✅ Transcription started successfully');
      console.log('[Deepgram] 🆔 Request ID:', result.request_id);

      return {
        success: true,
        request_id: result.request_id,
        raw_response: result
      };

    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error(`Failed to start transcription: ${error.message}`);
    }
  }

  /**
   * Validate webhook signature using HMAC-SHA256
   *
   * @deprecated This method is no longer used. Deepgram webhooks use Basic Auth instead.
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Signature from X-Deepgram-Signature header
   * @returns {boolean} True if signature is valid
   */
  validateWebhookSignature(payload, signature) {
    console.warn('[Deprecated] validateWebhookSignature called - use Basic Auth instead');
    return true;
  }

  /**
   * Extract transcription data from webhook payload
   *
   * @param {Object} webhookPayload - Deepgram webhook payload
   * @returns {Object} Processed transcription data
   */
  processWebhookPayload(webhookPayload) {
    try {
      const { results, metadata } = webhookPayload;

      if (!results || !results.channels || results.channels.length === 0) {
        throw new Error('No transcription results found in webhook payload');
      }

      const channel = results.channels[0];
      const alternatives = channel.alternatives || [];

      if (alternatives.length === 0) {
        throw new Error('No transcription alternatives found');
      }

      const bestAlternative = alternatives[0];
      const transcript = bestAlternative.transcript || '';
      const confidence = bestAlternative.confidence || 0;
      const words = bestAlternative.words || [];

      // Extract detected language (only present when detect_language=true)
      const detectedLanguage = channel.detected_language || null;
      const languageConfidence = channel.language_confidence || null;

      return {
        transcript: transcript.trim(),
        confidence_score: Math.round(confidence * 10000) / 10000, // Round to 4 decimal places
        word_timestamps: words.length > 0 ? words : null,
        processing_duration_seconds: metadata?.duration ? Math.ceil(metadata.duration) : null, // Round up to integer
        request_id: metadata?.request_id || null,
        model_used: metadata?.model_info?.name || null,
        language: metadata?.language || null,
        detected_language: detectedLanguage, // BCP-47 language tag (e.g., 'pt', 'en', 'es')
        language_confidence: languageConfidence // Confidence score for detected language
      };

    } catch (error) {
      console.error('Error processing webhook payload:', error);
      throw new Error(`Failed to process transcription results: ${error.message}`);
    }
  }

  /**
   * Get supported models for transcription
   *
   * @returns {Array<string>} List of available model names
   */
  getSupportedModels() {
    return [
      'nova-2',
      'nova',
      'enhanced',
      'base'
    ];
  }

  /**
   * Estimate processing time based on audio duration
   *
   * @param {number} durationSeconds - Audio duration in seconds
   * @returns {number} Estimated processing time in seconds
   */
  estimateProcessingTime(durationSeconds) {
    // Based on Deepgram documentation: typically 20-60 seconds for 1 hour of audio
    // Using conservative estimate of 1:30 ratio (90 seconds processing per hour of audio)
    const estimateSeconds = Math.ceil((durationSeconds / 3600) * 90);

    // Minimum 5 seconds, maximum 10 minutes (Deepgram limit)
    return Math.min(Math.max(estimateSeconds, 5), 600);
  }

  /**
   * Get request cost from Deepgram Management API
   *
   * @param {string} projectId - Deepgram project ID
   * @param {string} requestId - Request ID from transcription
   * @returns {Promise<{usd: number, details: object}>} Cost in USD and details
   */
  async getRequestCost(projectId, requestId) {
    try {
      const url = `https://api.deepgram.com/v1/projects/${projectId}/requests/${requestId}`;

      console.log(`[Deepgram] 📊 Fetching cost for request: ${requestId}`);
      console.log(`[Deepgram] 🔗 URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.adminApiKey}`, // Use admin key for Management API
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Deepgram] ❌ Management API error:', response.status, response.statusText);
        console.error('[Deepgram] ❌ Error details:', errorText);
        throw new Error(`Deepgram Management API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Extract cost from response.details.usd
      const costUsd = result.response?.details?.usd || null;

      if (costUsd === null) {
        console.warn('[Deepgram] ⚠️ Cost not available in Management API response');
        return { usd: null, details: result.response?.details || {} };
      }

      console.log(`[Deepgram] 💰 Request cost: $${costUsd}`);

      return {
        usd: costUsd,
        details: result.response?.details || {}
      };

    } catch (error) {
      console.error('[Deepgram] ❌ Failed to fetch request cost:', error.message);
      throw error;
    }
  }
}

module.exports = DeepgramService;