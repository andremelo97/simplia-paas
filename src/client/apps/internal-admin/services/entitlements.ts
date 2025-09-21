import { api } from '@client/config/http'
import {
  TenantLicense,
  AdjustLicensePayload,
  ActivateLicensePayload,
  ActivateLicenseResponse
} from '../features/tenants/licenses/types'

export class EntitlementsService {

  /**
   * Adjust existing license settings (using Global Platform route)
   */
  static async adjustLicense(
    tenantId: number,
    slug: string,
    payload: AdjustLicensePayload
  ): Promise<{ success: boolean; data: { license: TenantLicense } }> {
    const response = await api.put(`/internal/api/v1/tenants/${tenantId}/applications/${slug}/adjust`, payload)
    return response
  }

  /**
   * Activate license for an application (using Global Platform route)
   */
  static async activateLicense(
    tenantId: number,
    slug: string,
    payload?: ActivateLicensePayload
  ): Promise<ActivateLicenseResponse> {
    const response = await api.post(`/internal/api/v1/tenants/${tenantId}/applications/${slug}/activate`, payload || {})
    return response
  }

  /**
   * Suspend a license
   */
  static async suspendLicense(tenantId: number, slug: string): Promise<{ success: boolean; data: { license: TenantLicense } }> {
    return this.adjustLicense(tenantId, slug, { status: 'suspended' })
  }

  /**
   * Resume/reactivate a license
   */
  static async resumeLicense(tenantId: number, slug: string): Promise<{ success: boolean; data: { license: TenantLicense } }> {
    return this.adjustLicense(tenantId, slug, { status: 'active' })
  }

  /**
   * Get specific license details (using Global Platform route)
   */
  static async getLicense(tenantId: number, slug: string): Promise<{ success: boolean; data: { license: TenantLicense } }> {
    const response = await api.get(`/internal/api/v1/tenants/${tenantId}/applications/${slug}`)
    return response
  }
}

export const entitlementsService = EntitlementsService