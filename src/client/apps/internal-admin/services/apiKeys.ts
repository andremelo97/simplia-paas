import { api } from '@client/config/http';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: string;
  createdByFk: number | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  key?: string; // Only present on creation
}

export interface CreateApiKeyPayload {
  name: string;
  scope?: string;
  expiresAt?: string | null;
}

export interface UpdateApiKeyPayload {
  name?: string;
  expiresAt?: string | null;
}

export const ApiKeysService = {
  /**
   * Get all API keys
   */
  async getApiKeys(options?: { scope?: string; includeInactive?: boolean }): Promise<ApiKey[]> {
    const params = new URLSearchParams();
    if (options?.scope) params.append('scope', options.scope);
    if (options?.includeInactive) params.append('includeInactive', 'true');

    const queryString = params.toString();
    const url = `/internal/api/v1/api-keys${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);

    if (!response || !response.data) {
      throw new Error('Invalid API response structure');
    }

    return response.data;
  },

  /**
   * Create a new API key
   * Returns the key with the plain key value (only time it's available)
   */
  async createApiKey(payload: CreateApiKeyPayload): Promise<ApiKey> {
    const response = await api.post('/internal/api/v1/api-keys', payload);

    if (!response || !response.data) {
      throw new Error('Invalid API response structure');
    }

    return response.data;
  },

  /**
   * Update API key metadata
   */
  async updateApiKey(id: string, payload: UpdateApiKeyPayload): Promise<ApiKey> {
    const response = await api.put(`/internal/api/v1/api-keys/${id}`, payload);

    if (!response || !response.data) {
      throw new Error('Invalid API response structure');
    }

    return response.data;
  },

  /**
   * Revoke (delete) an API key
   */
  async revokeApiKey(id: string): Promise<ApiKey> {
    const response = await api.delete(`/internal/api/v1/api-keys/${id}`);

    if (!response || !response.data) {
      throw new Error('Invalid API response structure');
    }

    return response.data;
  }
};
