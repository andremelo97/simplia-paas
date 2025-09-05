export type LicenseStatus = 'active' | 'suspended' | 'expired'

export interface TenantLicense {
  id: number
  tenantId: number
  applicationId: number
  applicationName: string
  applicationSlug: string
  status: LicenseStatus
  seatsUsed: number
  userLimit: number
  activatedAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdjustLicensePayload {
  status?: LicenseStatus
  userLimit?: number
  activatedAt?: string
  expiresAt?: string | null
}

export interface TenantLicensesResponse {
  success: boolean
  data: {
    tenantId: number
    tenantName: string
    licenses: TenantLicense[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}