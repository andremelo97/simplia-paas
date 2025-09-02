import { api } from '@client/config/http';

export interface TenantAddress {
  id: number;
  tenantId: number;
  type: 'HQ' | 'BILLING' | 'SHIPPING' | 'BRANCH' | 'OTHER';
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  type: 'HQ' | 'BILLING' | 'SHIPPING' | 'BRANCH' | 'OTHER';
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

export interface AddressListResponse {
  success: boolean;
  data: {
    addresses: TenantAddress[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface AddressResponse {
  meta: {
    code: string;
    message: string;
  };
  data: {
    address: TenantAddress;
  };
}

export interface AddressListOptions {
  type?: 'HQ' | 'BILLING' | 'SHIPPING' | 'BRANCH' | 'OTHER';
  limit?: number;
  offset?: number;
}

/**
 * Service for managing tenant addresses
 */
class AddressService {
  private readonly baseUrl = '/internal/api/v1/tenants';

  /**
   * Get all addresses for a tenant
   */
  async getAddresses(tenantId: number, options: AddressListOptions = {}): Promise<AddressListResponse> {
    const params = new URLSearchParams();
    
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = `${this.baseUrl}/${tenantId}/addresses${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response;
  }

  /**
   * Create a new address for a tenant
   */
  async createAddress(tenantId: number, addressData: CreateAddressData): Promise<AddressResponse> {
    const response = await api.post(
      `${this.baseUrl}/${tenantId}/addresses`,
      addressData
    );
    return response;
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    tenantId: number, 
    addressId: number, 
    addressData: UpdateAddressData
  ): Promise<AddressResponse> {
    const response = await api.put(
      `${this.baseUrl}/${tenantId}/addresses/${addressId}`,
      addressData
    );
    return response;
  }

  /**
   * Delete (soft delete) an address
   */
  async deleteAddress(tenantId: number, addressId: number): Promise<{ meta: { code: string; message: string } }> {
    const response = await api.delete(
      `${this.baseUrl}/${tenantId}/addresses/${addressId}`
    );
    return response;
  }
}

export const addressService = new AddressService();