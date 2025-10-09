import { api as http } from '@client/config/http';

export interface AIAgentConfigurationData {
  id: number;
  systemMessage: string;
  createdAt: string;
  updatedAt: string;
}

export const aiAgentConfigurationService = {
  /**
   * Get current AI Agent configuration
   */
  async getConfiguration(): Promise<AIAgentConfigurationData> {
    const response = await http.get('/api/tq/v1/configurations/ai-agent');
    return response.data;
  },

  /**
   * Update AI Agent configuration
   */
  async updateConfiguration(systemMessage: string): Promise<AIAgentConfigurationData> {
    const response = await http.put('/api/tq/v1/configurations/ai-agent', { systemMessage });
    return response.data;
  },

  /**
   * Reset AI Agent configuration to default
   */
  async resetConfiguration(): Promise<AIAgentConfigurationData> {
    const response = await http.post('/api/tq/v1/configurations/ai-agent/reset');
    return response.data;
  }
};

