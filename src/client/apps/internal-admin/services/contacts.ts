import { api } from '@client/config/http';

export interface TenantContact {
  id: number;
  tenantId: number;
  type: 'ADMIN' | 'BILLING' | 'TECH' | 'LEGAL' | 'OTHER';
  fullName: string;
  email?: string;
  phoneE164?: string;
  title?: string;
  notes?: string;
  preferences?: Record<string, any>;
  isPrimary: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  type: 'ADMIN' | 'BILLING' | 'TECH' | 'LEGAL' | 'OTHER';
  fullName: string;
  email?: string;
  phoneE164?: string;
  title?: string;
  notes?: string;
  preferences?: Record<string, any>;
  isPrimary?: boolean;
}

export interface UpdateContactData extends Partial<CreateContactData> {}

export interface ContactListResponse {
  success: boolean;
  data: {
    contacts: TenantContact[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface ContactResponse {
  meta: {
    code: string;
    message: string;
  };
  data: {
    contact: TenantContact;
  };
}

export interface ContactListOptions {
  type?: 'ADMIN' | 'BILLING' | 'TECH' | 'LEGAL' | 'OTHER';
  limit?: number;
  offset?: number;
}

/**
 * Service for managing tenant contacts
 */
class ContactService {
  private readonly baseUrl = '/internal/api/v1/tenants';

  /**
   * Get all contacts for a tenant
   */
  async getContacts(tenantId: number, options: ContactListOptions = {}): Promise<ContactListResponse> {
    const params = new URLSearchParams();
    
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = `${this.baseUrl}/${tenantId}/contacts${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response;
  }

  /**
   * Create a new contact for a tenant
   */
  async createContact(tenantId: number, contactData: CreateContactData): Promise<ContactResponse> {
    const response = await api.post(
      `${this.baseUrl}/${tenantId}/contacts`,
      contactData
    );
    return response;
  }

  /**
   * Update an existing contact
   */
  async updateContact(
    tenantId: number, 
    contactId: number, 
    contactData: UpdateContactData
  ): Promise<ContactResponse> {
    const response = await api.put(
      `${this.baseUrl}/${tenantId}/contacts/${contactId}`,
      contactData
    );
    return response;
  }

  /**
   * Delete (soft delete) a contact
   */
  async deleteContact(tenantId: number, contactId: number): Promise<{ meta: { code: string; message: string } }> {
    const response = await api.delete(
      `${this.baseUrl}/${tenantId}/contacts/${contactId}`
    );
    return response;
  }
}

export const contactService = new ContactService();