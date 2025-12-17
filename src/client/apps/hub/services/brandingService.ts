import { api as http } from '@client/config/http';

export interface BrandingData {
  id?: number;
  tenantId: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  logoUrl: string | null;
  backgroundVideoUrl?: string | null;
  companyName: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const brandingService = {
  /**
   * Get current tenant branding configuration
   */
  getBranding: async (): Promise<BrandingData> => {
    const response = await http.get('/internal/api/v1/configurations/branding');
    console.log('[BrandingService] Response:', response);
    return response.data;
  },

  /**
   * Update branding configuration
   */
  updateBranding: async (branding: Partial<BrandingData>): Promise<BrandingData> => {
    const response = await http.put('/internal/api/v1/configurations/branding', branding);
    return response.data.data;
  },

  /**
   * Reset branding to defaults
   */
  resetBranding: async (): Promise<void> => {
    await http.delete('/internal/api/v1/configurations/branding');
  },

  /**
   * Upload logo image
   */
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await http.post(
      '/internal/api/v1/configurations/branding/upload-logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Handle nested response structure: { data: { logoUrl, ... }, meta: {...} }
    return response.data?.data || response.data;
  },

  /**
   * Upload background video
   */
  uploadVideo: async (file: File): Promise<{ backgroundVideoUrl: string }> => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await http.post(
      '/internal/api/v1/configurations/branding/upload-video',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },
};
