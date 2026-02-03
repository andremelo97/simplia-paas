import { api as http } from '@client/config/http'

export interface SocialLinks {
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  whatsapp?: string
  website?: string
  [key: string]: string | undefined
}

export interface BrandingData {
  id?: number
  tenantId: number
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  logoUrl: string | null
  companyName: string | null
  // Contact information
  email?: string | null
  phone?: string | null
  address?: string | null
  socialLinks?: SocialLinks
  // Metadata
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
