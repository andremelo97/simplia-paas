export const ADDRESS_TYPES = ['HQ', 'BILLING', 'SHIPPING', 'BRANCH', 'OTHER'] as const;
export type AddressType = typeof ADDRESS_TYPES[number];

export const CONTACT_TYPES = ['ADMIN', 'BILLING', 'TECH', 'LEGAL', 'OTHER'] as const;
export type ContactType = typeof CONTACT_TYPES[number];

export interface AddressFormValues {
  id?: string; // Local temp ID until backend returns real ID
  type: AddressType;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code: string; // ISO-2 uppercase
  is_primary: boolean;
}

export interface ContactFormValues {
  id?: string; // Local temp ID until backend returns real ID
  type: ContactType;
  label?: string;
  name: string;
  email?: string;
  phone_number?: string;
  title?: string;
  department?: string;
  language?: string;
  notes?: string;
  is_primary: boolean;
}

// Address type display labels
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  HQ: 'Headquarters',
  BILLING: 'Billing Address',
  SHIPPING: 'Shipping Address',
  BRANCH: 'Branch Office',
  OTHER: 'Other'
};

// Contact type display labels
export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  ADMIN: 'Administrative Contact',
  BILLING: 'Billing Contact',
  TECH: 'Technical Contact',
  LEGAL: 'Legal Contact',
  OTHER: 'Other Contact'
};

// Address type options for select dropdowns
export const ADDRESS_TYPE_OPTIONS = ADDRESS_TYPES.map(type => ({
  value: type,
  label: ADDRESS_TYPE_LABELS[type]
}));

// Contact type options for select dropdowns
export const CONTACT_TYPE_OPTIONS = CONTACT_TYPES.map(type => ({
  value: type,
  label: CONTACT_TYPE_LABELS[type]
}));