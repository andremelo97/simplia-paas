/**
 * OPENAI MOCK
 *
 * Mock do serviço OpenAI para testes.
 * Simula respostas do AI Agent sem chamar a API real.
 */

const defaultMockResponse = {
  id: 'mock-response-id',
  object: 'response',
  created_at: Date.now(),
  status: 'completed',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'This is a mock AI response for testing purposes.',
        },
      ],
    },
  ],
};

const mockTemplateFilledResponse = {
  id: 'mock-template-response',
  object: 'response',
  created_at: Date.now(),
  status: 'completed',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '<p>Patient Name: Test Patient</p><p>Date: 2025-01-15</p><p>Clinical notes filled by AI.</p>',
        },
      ],
    },
  ],
};

let mockResponses = [];
let callCount = 0;

/**
 * Setup OpenAI mock for Jest tests
 * @param {Object} options - Mock options
 */
function setupOpenAIMock(options = {}) {
  const { customResponse } = options;

  // Store original fetch
  const originalFetch = global.fetch;

  // Mock fetch for OpenAI calls
  global.fetch = jest.fn((url, options) => {
    // Only mock OpenAI API calls
    if (url && url.toString().includes('api.openai.com')) {
      callCount++;

      // Use custom response if provided, or queued responses
      let response = customResponse || mockResponses.shift() || defaultMockResponse;

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
      });
    }

    // Pass through other requests
    if (originalFetch) {
      return originalFetch(url, options);
    }

    return Promise.reject(new Error('No fetch available'));
  });

  return {
    mockFetch: global.fetch,
    originalFetch,
  };
}

/**
 * Queue a mock response for the next OpenAI call
 * @param {Object} response - Response to queue
 */
function queueMockResponse(response) {
  mockResponses.push(response);
}

/**
 * Queue a mock error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function queueMockError(statusCode = 500, message = 'Internal Server Error') {
  global.fetch = jest.fn((url) => {
    if (url && url.toString().includes('api.openai.com')) {
      return Promise.resolve({
        ok: false,
        status: statusCode,
        json: () => Promise.resolve({ error: { message } }),
        text: () => Promise.resolve(JSON.stringify({ error: { message } })),
      });
    }
    return Promise.reject(new Error('No fetch available'));
  });
}

/**
 * Reset mock state
 */
function resetOpenAIMock() {
  mockResponses = [];
  callCount = 0;
}

/**
 * Get the number of times OpenAI was called
 * @returns {number} Call count
 */
function getCallCount() {
  return callCount;
}

/**
 * Restore original fetch
 * @param {Function} originalFetch - Original fetch function
 */
function restoreOpenAIMock(originalFetch) {
  if (originalFetch) {
    global.fetch = originalFetch;
  }
  resetOpenAIMock();
}

module.exports = {
  defaultMockResponse,
  mockTemplateFilledResponse,
  setupOpenAIMock,
  queueMockResponse,
  queueMockError,
  resetOpenAIMock,
  getCallCount,
  restoreOpenAIMock,
};
