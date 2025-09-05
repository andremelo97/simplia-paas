import { api } from '@client/config/http'
import { TenantLicensesResponse, TenantLicense, AdjustLicensePayload } from '../features/tenants/licenses/types'

export class EntitlementsService {
  static async getTenantLicenses(tenantId: number): Promise<TenantLicensesResponse> {
    const response = await api.get('/internal/api/v1/entitlements', {
      'x-tenant-id': String(tenantId) // Always send numeric ID as string
    })
    return response
  }

  static async adjustLicense(
    tenantId: number, 
    slug: string, 
    payload: AdjustLicensePayload
  ): Promise<{ success: boolean; data: TenantLicense }> {
    const response = await api.put(`/internal/api/v1/entitlements/${slug}/adjust`, payload, {
      'x-tenant-id': String(tenantId) // Always send numeric ID as string
    })
    return response
  }

  static async activateLicense(
    tenantId: number, 
    slug: string
  ): Promise<{ success: boolean; data: TenantLicense }> {
    const response = await api.post(`/internal/api/v1/entitlements/${slug}/activate`, {}, {
      'x-tenant-id': String(tenantId) // Always send numeric ID as string
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