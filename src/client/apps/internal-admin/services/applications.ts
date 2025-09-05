import { api } from '@client/config/http';

export interface Application {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive' | 'deprecated';
  version: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationPricing {
  id: string;
  applicationId: number;
  userTypeId: number;
  userTypeName: string;
  userTypeSlug: 'operations' | 'manager' | 'admin';
  price: string;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  validFrom: string;
  validTo: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingPayload {
  userTypeId: number;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  validFrom?: string;
  validTo?: string;
}

export interface UpdatePricingPayload {
  price?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly';
  validFrom?: string;
  validTo?: string;
}

export interface PricingResponse {
  success: boolean;
  data: {
    applicationId: number;
    pricing: ApplicationPricing[];
  };
}

export interface CreatePricingResponse {
  success: boolean;
  meta: {
    code: string;
    message: string;
  };
  data: {
    pricing: ApplicationPricing;
  };
}

export const ApplicationsService = {
  /**
   * Get all applications
   */
  async getApplications(): Promise<Application[]> {
    console.log('🔍 [ApplicationsService] Making API call to /internal/api/v1/applications');
    const response = await api.get('/internal/api/v1/applications');
    console.log('📡 [ApplicationsService] API Response:', response);
    
    // Defensive check for response structure
    if (!response || !response.data) {
      throw new Error('Invalid API response structure');
    }
    
    // Handle different possible response structures
    if (response.data.applications) {
      // Direct structure: { data: { applications: [...] } }
      return response.data.applications;
    } else if (response.data.data?.applications) {
      // Nested structure: { data: { data: { applications: [...] } } }
      return response.data.data.applications;
    } else if (Array.isArray(response.data)) {
      // Array directly: { data: [...] }
      return response.data;
    } else {
      console.error('❌ [ApplicationsService] Unexpected response structure:', response);
      throw new Error('Applications data not found in response');
    }
  },

  /**
   * Get application by ID
   */
  async getApplication(id: number): Promise<Application> {
    console.log('🔍 [ApplicationsService] Getting application:', id);
    const response = await api.get(`/internal/api/v1/applications/${id}`);
    console.log('📡 [ApplicationsService] Application API Response:', response);
    
    // Defensive check for response structure
    if (!response || !response.data) {
      throw new Error('Invalid application API response structure');
    }
    
    // Handle different possible response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      // Direct application object
      return response.data;
    } else {
      console.error('❌ [ApplicationsService] Unexpected application response structure:', response);
      throw new Error('Application data not found in response');
    }
  },

  /**
   * Get pricing matrix for an application
   */
  async getPricing(applicationId: number, current?: boolean): Promise<ApplicationPricing[]> {
    const params = current ? '?current=true' : '';
    console.log('🔍 [ApplicationsService] Making pricing API call:', `/internal/api/v1/applications/${applicationId}/pricing${params}`);
    const response = await api.get<PricingResponse>(
      `/internal/api/v1/applications/${applicationId}/pricing${params}`
    );
    console.log('📡 [ApplicationsService] Pricing API Response:', response);
    
    // Defensive check for response structure
    if (!response || !response.data) {
      throw new Error('Invalid pricing API response structure');
    }
    
    // Handle different possible response structures
    if (response.data.pricing) {
      // Direct structure: { data: { pricing: [...] } }
      return response.data.pricing;
    } else if (response.data.data?.pricing) {
      // Nested structure: { data: { data: { pricing: [...] } } }
      return response.data.data.pricing;
    } else if (Array.isArray(response.data)) {
      // Array directly: { data: [...] }
      return response.data;
    } else {
      console.error('❌ [ApplicationsService] Unexpected pricing response structure:', response);
      throw new Error('Pricing data not found in response');
    }
  },

  /**
   * Create new pricing entry
   */
  async createPricing(applicationId: number, payload: CreatePricingPayload): Promise<ApplicationPricing> {
    const response = await api.post<CreatePricingResponse>(
      `/internal/api/v1/applications/${applicationId}/pricing`,
      payload
    );
    return response.data.data.pricing;
  },

  /**
   * Update pricing entry
   */
  async updatePricing(
    applicationId: number, 
    pricingId: string, 
    payload: UpdatePricingPayload
  ): Promise<ApplicationPricing> {
    const response = await api.put<CreatePricingResponse>(
      `/internal/api/v1/applications/${applicationId}/pricing/${pricingId}`,
      payload
    );
    return response.data.data.pricing;
  }
};