import { api as http } from '@client/config/http'

export interface BrandingData {
  id?: number
  tenantId: number
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  logoUrl: string | null
  faviconUrl: string | null
  companyName: string | null
  createdAt?: string
  updatedAt?: string
}

export const brandingService = {
  /**
   * Get current tenant branding configuration
   */
  getBranding: async (): Promise<BrandingData> => {
    const response = await http.get('/internal/api/v1/configurations/branding')
    return response.data
  },
}
