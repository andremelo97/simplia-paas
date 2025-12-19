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
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingPayload {
  userTypeId: number;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  active: boolean;
}

export interface UpdatePricingPayload {
  price?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly';
  active?: boolean;
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

export interface TenantLicensedApp {
  slug: string;
  name: string;
  status: string;
  userLimit: number | null;
  seatsUsed: number;
  expiresAt: string | null;
}

export const ApplicationsService = {
  /**
   * Get applications licensed to a specific tenant
   */
  async getTenantLicensedApps(tenantId: number): Promise<TenantLicensedApp[]> {
    const response = await api.get(`/internal/api/v1/tenants/${tenantId}/applications`);

    // Defensive check for response structure
    if (!response) {
      throw new Error('Invalid tenant apps API response structure');
    }

    // Handle different possible response structures
    if (response.applications) {
      // Direct structure: { applications: [...] }
      return response.applications;
    } else if (response.data?.applications) {
      // Nested structure: { data: { applications: [...] } }
      return response.data.applications;
    } else if (Array.isArray(response.data)) {
      // Array directly: { data: [...] }
      return response.data;
    } else {
      throw new Error('Tenant applications data not found in response');
    }
  },

  /**
   * Get all applications
   */
  async getApplications(): Promise<Application[]> {
    const response = await api.get('/internal/api/v1/applications');
    
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
      throw new Error('Applications data not found in response');
    }
  },

  /**
   * Get application by ID
   */
  async getApplication(id: number): Promise<Application> {
    const response = await api.get(`/internal/api/v1/applications/${id}`);
    
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
      throw new Error('Application data not found in response');
    }
  },

  /**
   * Get pricing matrix for an application
   */
  async getPricing(applicationId: number, current?: boolean): Promise<ApplicationPricing[]> {
    const params = current === false ? '?current=false' : current === true ? '?current=true' : '';
    const response = await api.get<PricingResponse>(
      `/internal/api/v1/applications/${applicationId}/pricing${params}`
    );
    
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
    
    // Defensive check for response structure
    if (!response || !response.data) {
      throw new Error('Invalid create pricing API response structure');
    }
    
    // Handle different possible response structures
    if (response.data.pricing) {
      // Direct structure: { data: { pricing: {...} } }
      return response.data.pricing;
    } else if (response.data.data?.pricing) {
      // Nested structure: { data: { data: { pricing: {...} } } }
      return response.data.data.pricing;
    } else {
      throw new Error('Pricing data not found in create response');
    }
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
    
    // Defensive check for response structure
    if (!response || !response.data) {
      throw new Error('Invalid update pricing API response structure');
    }
    
    // Handle different possible response structures
    if (response.data.pricing) {
      // Direct structure: { data: { pricing: {...} } }
      return response.data.pricing;
    } else if (response.data.data?.pricing) {
      // Nested structure: { data: { data: { pricing: {...} } } }
      return response.data.data.pricing;
    } else {
      throw new Error('Pricing data not found in update response');
    }
  },

};