/**
 * DEEPGRAM MOCK
 *
 * Mock do serviço Deepgram para testes.
 * Simula transcrição de áudio sem chamar a API real.
 */

class MockDeepgramService {
  constructor() {
    this.transcriptions = new Map();
  }

  /**
   * Mock transcription by URL
   * @param {string} audioUrl - URL do áudio
   * @param {string} callbackUrl - URL de callback
   * @param {Object} options - Opções de transcrição
   * @returns {Object} Resultado da transcrição
   */
  async transcribeByUrl(audioUrl, callbackUrl, options = {}) {
    const requestId = 'mock-request-' + Date.now();

    // Store mock transcription for later webhook simulation
    this.transcriptions.set(requestId, {
      audioUrl,
      callbackUrl,
      options,
      status: 'pending',
    });

    return {
      success: true,
      request_id: requestId,
      raw_response: { request_id: requestId },
    };
  }

  /**
   * Process webhook payload (simulates Deepgram callback)
   * @param {Object} payload - Webhook payload
   * @returns {Object} Processed transcription data
   */
  processWebhookPayload(payload) {
    return {
      transcript: payload.mockTranscript || 'This is a mock transcription text for testing purposes.',
      confidence_score: 0.95,
      word_timestamps: null,
      processing_duration_seconds: 10,
      request_id: payload.request_id || 'mock-request-id',
    };
  }

  /**
   * Simulate webhook callback
   * @param {string} requestId - Request ID
   * @returns {Object} Mock webhook payload
   */
  simulateWebhook(requestId) {
    const transcription = this.transcriptions.get(requestId);

    return {
      request_id: requestId,
      metadata: {
        request_id: requestId,
        duration: 120,
        channels: 1,
      },
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript: 'This is a mock transcription text for testing purposes.',
                confidence: 0.95,
                words: [],
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Clear all stored transcriptions
   */
  clear() {
    this.transcriptions.clear();
  }
}

/**
 * Setup Deepgram mock in Jest
 * @param {Object} options - Mock options
 */
function setupDeepgramMock(options = {}) {
  const mockService = new MockDeepgramService();

  // Mock the Deepgram service module
  jest.mock('@server/services/deepgram', () => ({
    __esModule: true,
    default: MockDeepgramService,
    MockDeepgramService,
  }));

  return mockService;
}

module.exports = {
  MockDeepgramService,
  setupDeepgramMock,
};
