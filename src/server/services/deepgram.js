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
    this.webhookSecret = process.env.DEEPGRAM_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.deepgram.com/v1';

    if (!this.apiKey) {
      console.warn('DEEPGRAM_API_KEY environment variable not found. Deepgram features will be disabled.');
    }

    if (!this.webhookSecret) {
      console.warn('DEEPGRAM_WEBHOOK_SECRET environment variable not found. Webhook validation will be disabled.');
    }
  }

  /**
   * Transcribe audio file using Deepgram's batch processing API
   *
   * @param {string} audioUrl - Signed URL to the audio file (.webm)
   * @param {string} callbackUrl - Webhook URL for receiving transcription results
   * @param {Object} options - Additional transcription options
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
      const queryParams = new URLSearchParams({
        model: options.model || 'nova-2',
        smart_format: 'true',
        punctuate: 'true',
        diarize: 'false',
        callback: callbackUrl,
        ...options.additionalParams
      });

      const url = `${this.baseUrl}/listen?${queryParams.toString()}`;

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
        throw new Error(`Deepgram API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      // Log the request for debugging
      console.log(`Deepgram transcription started - Request ID: ${result.request_id}`);

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
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Signature from X-Deepgram-Signature header
   * @returns {boolean} True if signature is valid
   */
  validateWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn('Webhook signature validation skipped - no webhook secret configured');
      return true; // Allow webhook processing when secret is not configured
    }

    try {
      if (!signature || !payload) {
        return false;
      }

      // Remove 'sha256=' prefix if present
      const cleanSignature = signature.replace('sha256=', '');

      // Calculate HMAC
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // Compare signatures using crypto.timingSafeEqual to prevent timing attacks
      const sigBuffer = Buffer.from(cleanSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    } catch (error) {
      console.error('Webhook signature validation error:', error);
      return false;
    }
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

      return {
        transcript: transcript.trim(),
        confidence_score: Math.round(confidence * 10000) / 10000, // Round to 4 decimal places
        word_timestamps: words.length > 0 ? words : null,
        processing_duration_seconds: metadata?.duration || null,
        request_id: metadata?.request_id || null,
        model_used: metadata?.model_info?.name || null,
        language: metadata?.language || null
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
}

module.exports = DeepgramService;