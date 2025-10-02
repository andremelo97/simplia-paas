import { api as http } from '@client/config/http';

export interface BrandingData {
  id?: number;
  tenantId: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
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
   * Upload image (logo or favicon)
   */
  uploadImage: async (file: File, type: 'logo' | 'favicon'): Promise<{ logoUrl?: string; faviconUrl?: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await http.post(
      `/internal/api/v1/configurations/branding/upload-image?type=${type}`,
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
