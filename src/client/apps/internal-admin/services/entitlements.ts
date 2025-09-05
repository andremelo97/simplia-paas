import { api } from '@client/config/http'
import { TenantLicensesResponse, TenantLicense, AdjustLicensePayload } from '../features/tenants/licenses/types'
import { tenantsService } from './tenants'

export class EntitlementsService {
  // Helper method to get tenant string ID from numeric ID
  private static async getTenantStringId(tenantId: number): Promise<string> {
    try {
      const tenantResponse = await tenantsService.getTenant(tenantId)
      // Use the subdomain as tenant string ID (this matches the data structure)
      return tenantResponse.data.subdomain
    } catch (error) {
      console.error('Failed to resolve tenant string ID:', error)
      throw new Error(`Invalid tenant ID: ${tenantId}`)
    }
  }

  static async getTenantLicenses(tenantId: number): Promise<TenantLicensesResponse> {
    const tenantStringId = await this.getTenantStringId(tenantId)
    const response = await api.get('/internal/api/v1/entitlements', {
      'x-tenant-id': tenantStringId
    })
    return response
  }

  static async adjustLicense(
    tenantId: number, 
    slug: string, 
    payload: AdjustLicensePayload
  ): Promise<{ success: boolean; data: TenantLicense }> {
    const tenantStringId = await this.getTenantStringId(tenantId)
    const response = await api.put(`/internal/api/v1/entitlements/${slug}/adjust`, payload, {
      'x-tenant-id': tenantStringId
    })
    return response
  }

  static async activateLicense(
    tenantId: number, 
    slug: string
  ): Promise<{ success: boolean; data: TenantLicense }> {
    const tenantStringId = await this.getTenantStringId(tenantId)
    const response = await api.post(`/internal/api/v1/entitlements/${slug}/activate`, {}, {
      'x-tenant-id': tenantStringId
    })
    return response
  }

  static async suspendLicense(tenantId: number, slug: string): Promise<{ success: boolean; data: TenantLicense }> {
    return this.adjustLicense(tenantId, slug, { status: 'suspended' })
  }

  static async resumeLicense(tenantId: number, slug: string): Promise<{ success: boolean; data: TenantLicense }> {
    return this.adjustLicense(tenantId, slug, { status: 'active' })
  }
}

export const entitlementsService = EntitlementsService