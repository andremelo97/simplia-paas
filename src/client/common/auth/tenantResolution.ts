import { api } from '@client/config/http'

export interface TenantInfo {
  id: number
  name: string
  slug: string
}

export interface TenantLookupResponse {
  success: boolean
  data?: TenantInfo
  meta?: {
    code: string
    message: string
  }
}

/**
 * Lookup tenant by user email (1:1 relationship)
 * @param email User email address
 * @returns Promise<TenantInfo> Tenant information
 * @throws Error if tenant not found or request fails
 */
export async function tenantLookupByEmail(email: string): Promise<TenantInfo> {
  const response = await api.post<TenantLookupResponse>('/internal/api/v1/public/tenant-lookup', { 
    email: email.toLowerCase().trim() 
  })
  
  if (!response.success || !response.data) {
    throw new Error(response.meta?.message || 'Tenant not found')
  }
  
  return response.data
}