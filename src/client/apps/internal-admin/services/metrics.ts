import { api } from '@client/config/http';

export interface PlatformMetrics {
  tenants: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  users: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  applications: {
    active: number;
  };
  licenses: {
    active: number;
  };
}

export interface MetricsResponse {
  success: boolean;
  data: PlatformMetrics;
  meta: {
    cachedAt: string;
    executionTime: string;
  };
}

export const metricsService = {
  /**
   * Get platform overview metrics for dashboard
   */
  async getPlatformOverview(): Promise<PlatformMetrics> {
    try {
      const response = await api.get<MetricsResponse>('/internal/api/v1/metrics/overview');
      
      // Defensive check for response structure
      if (!response || !response.data) {
        throw new Error('Invalid metrics API response structure');
      }
      
      // Handle different possible response structures
      if (response.data.data) {
        // Nested structure: { data: { data: { ... } } }
        return response.data.data;
      } else if (response.data.tenants && response.data.users) {
        // Direct structure: { data: { tenants: {...}, users: {...}, ... } }
        return response.data as PlatformMetrics;
      } else {
        throw new Error('Metrics data not found in response');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if metrics data is cached (based on meta information)
   */
  async getMetricsMeta(): Promise<MetricsResponse['meta'] | null> {
    try {
      const response = await api.get<MetricsResponse>('/internal/api/v1/metrics/overview');
      return response.data?.meta || null;
    } catch (error) {
      return null;
    }
  }
};