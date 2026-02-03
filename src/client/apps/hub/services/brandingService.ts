import { api as http } from '@client/config/http';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  pinterest?: string;
  whatsapp?: string;
  website?: string;
  [key: string]: string | undefined; // Allow additional social networks
}

export interface MediaLibraryItem {
  id: number;
  url: string;
  filename: string;
  originalFilename: string;
  mediaType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  altText?: string;
  createdAt: string;
}

export interface MediaLibraryResponse {
  data: MediaLibraryItem[];
  meta: {
    count: number;
    limit: number;
    remaining: number;
  };
}

export interface BrandingData {
  id?: number;
  tenantId: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  logoUrl: string | null;
  companyName: string | null;
  // Contact information
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  socialLinks?: SocialLinks;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export const brandingService = {
  /**
   * Get current tenant branding configuration
   */
  getBranding: async (): Promise<BrandingData> => {
    const response = await http.get('/internal/api/v1/configurations/branding');
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

  // =============================================
  // MEDIA LIBRARY
  // =============================================

  /**
   * Get media library files
   * @param type - Optional filter: 'image' or 'video'
   */
  getMediaLibrary: async (type?: 'image' | 'video'): Promise<MediaLibraryResponse> => {
    const params = type ? `?type=${type}` : '';
    const response = await http.get(`/internal/api/v1/configurations/branding/media-library${params}`);
    return response.data;
  },

  /**
   * Upload file to media library
   * @param file - File to upload (image or video)
   * @param altText - Optional alt text for images
   */
  uploadMediaLibraryItem: async (file: File, altText?: string): Promise<{ data: MediaLibraryItem; meta: { count: number; limit: number; remaining: number } }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }

    const response = await http.post(
      '/internal/api/v1/configurations/branding/media-library',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Delete file from media library
   * @param id - Media file ID
   */
  deleteMediaLibraryItem: async (id: number): Promise<void> => {
    await http.delete(`/internal/api/v1/configurations/branding/media-library/${id}`);
  },
};
