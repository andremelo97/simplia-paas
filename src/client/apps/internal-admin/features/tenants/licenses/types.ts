export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'trial'

export interface Application {
  id: number
  name: string
  slug: string
  description?: string
}

export interface PricingSnapshot {
  price: number
  currency: string
  billingCycle: string
  validFrom: string
  validTo: string | null
}

export interface SeatsByUserType {
  userTypeId: number
  userType: string
  used: number
  total: number | null
  available: number | null
  hierarchyLevel: number
  pricing: PricingSnapshot
}

export interface TenantLicense {
  id: number
  application: Application
  status: LicenseStatus
  pricingSnapshot: PricingSnapshot | null
  seatsByUserType: SeatsByUserType[]
  expiryDate: string | null
  activatedAt: string
  userLimit: number | null
  totalSeatsUsed: number
  createdAt: string
  updatedAt: string
}

export interface AdjustLicensePayload {
  status?: LicenseStatus
  userLimit?: number
  expiryDate?: string | null
}

export interface ActivateLicensePayload {
  userLimit?: number
  expiryDate?: string | null
  status?: LicenseStatus
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

export interface ActivateLicenseResponse {
  success: boolean
  meta: {
    code: string
    message: string
  }
  data: {
    license: TenantLicense
  }
}