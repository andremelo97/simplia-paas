import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Label } from '@client/common/ui'
import { useUIStore } from '../../store'
import { tenantsService } from '../../services/tenants'
import { addressService } from '../../services/addresses'
import { contactService } from '../../services/contacts'
import { AddressesRepeater } from './AddressesRepeater'
import { ContactsRepeater } from './ContactsRepeater'
import { AddressFormValues, ContactFormValues } from './types'

interface TenantFormData {
  name: string
  description: string
}

interface TenantSnapshot {
  core: TenantFormData
  addresses: AddressFormValues[]
  contacts: ContactFormValues[]
}

export const EditTenantPage: React.FC = () => {
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    description: ''
  })
  const [addresses, setAddresses] = useState<AddressFormValues[]>([])
  const [contacts, setContacts] = useState<ContactFormValues[]>([])
  const [snapshot, setSnapshot] = useState<TenantSnapshot | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [addressErrors, setAddressErrors] = useState<Record<string, Partial<Record<keyof AddressFormValues, string>>>>({})
  const [contactErrors, setContactErrors] = useState<Record<string, Partial<Record<keyof ContactFormValues, string>>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addNotification } = useUIStore()

  // Load existing tenant data
  useEffect(() => {
    const loadTenantData = async () => {
      if (!id) {
        setLoadError('Tenant ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('🔄 [EditTenant] Loading tenant data for ID:', id)

        // Load core tenant data
        const tenantResponse = await tenantsService.getTenant(parseInt(id))
        const tenant = tenantResponse.data

        console.log('✅ [EditTenant] Tenant loaded:', tenant.name)

        // Load addresses
        const addressesResponse = await addressService.getAddresses(parseInt(id), { active: true })
        const addressesData = addressesResponse.data.addresses || []

        // Load contacts
        const contactsResponse = await contactService.getContacts(parseInt(id), { active: true })
        const contactsData = contactsResponse.data.contacts || []

        // Map to form values
        const mappedAddresses: AddressFormValues[] = addressesData.map((addr: any) => ({
          id: addr.id,
          type: addr.type,
          label: addr.label || '',
          line1: addr.line1 || '',
          line2: addr.line2 || '',
          city: addr.city || '',
          state: addr.state || '',
          postal_code: addr.postalCode || '',
          country_code: addr.countryCode?.toUpperCase() || '',
          is_primary: addr.isPrimary || false
        }))

        const mappedContacts: ContactFormValues[] = contactsData.map((contact: any) => ({
          id: contact.id,
          type: contact.type,
          label: contact.label || '',
          name: contact.fullName || '',
          title: contact.title || '',
          department: contact.department || '',
          email: contact.email?.toLowerCase() || '',
          phone_number: contact.phoneE164?.trim() || '',
          notes: contact.notes || '',
          is_primary: contact.isPrimary || false
        }))

        // Initialize form data
        const coreData: TenantFormData = {
          name: tenant.name || '',
          description: tenant.description || ''
        }

        // If no addresses/contacts exist, start with default primary items
        const finalAddresses = mappedAddresses.length > 0 ? mappedAddresses : [{
          id: undefined,
          type: 'HQ' as const,
          label: 'Headquarters',
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country_code: '',
          is_primary: true
        }]

        const finalContacts = mappedContacts.length > 0 ? mappedContacts : [{
          id: undefined,
          type: 'ADMIN' as const,
          name: '',
          title: '',
          email: '',
          phone_number: '',
          notes: '',
          is_primary: true
        }]

        setFormData(coreData)
        setAddresses(finalAddresses)
        setContacts(finalContacts)

        // Create immutable snapshot for diff calculation
        setSnapshot({
          core: { ...coreData },
          addresses: JSON.parse(JSON.stringify(finalAddresses)),
          contacts: JSON.parse(JSON.stringify(finalContacts))
        })

        console.log('✅ [EditTenant] Data loaded successfully:', {
          addresses: finalAddresses.length,
          contacts: finalContacts.length
        })

      } catch (error: any) {
        console.error('❌ [EditTenant] Failed to load tenant:', error)
        
        if (error.status === 404) {
          setLoadError('Tenant not found')
        } else if (error.status >= 500) {
          setLoadError('Server error. Please try again later.')
        } else {
          setLoadError('Failed to load tenant data. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTenantData()
  }, [id])

  const handleInputChange = (field: keyof TenantFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddressesChange = (newAddresses: AddressFormValues[]) => {
    setAddresses(newAddresses)
    setAddressErrors({})
  }

  const handleContactsChange = (newContacts: ContactFormValues[]) => {
    setContacts(newContacts)
    setContactErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    const addrErrors: Record<string, Partial<Record<keyof AddressFormValues, string>>> = {}
    const contErrors: Record<string, Partial<Record<keyof ContactFormValues, string>>> = {}
    
    // Validate tenant basic info
    if (!formData.name.trim()) {
      errors.name = 'Tenant name is required'
    } else if (formData.name.length < 3) {
      errors.name = 'Tenant name must be at least 3 characters'
    } else if (formData.name.length > 100) {
      errors.name = 'Tenant name must be less than 100 characters'
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    // Validate addresses - at least one required
    if (addresses.length === 0) {
      errors.addresses = 'At least one address is required'
    } else {
      addresses.forEach((address, index) => {
        const addressErrors: Partial<Record<keyof AddressFormValues, string>> = {}
        
        if (!address.line1?.trim()) {
          addressErrors.line1 = 'Address line 1 is required'
        }
        if (!address.city?.trim()) {
          addressErrors.city = 'City is required'
        }
        if (!address.country_code?.trim()) {
          addressErrors.country_code = 'Country is required'
        }
        
        if (Object.keys(addressErrors).length > 0) {
          addrErrors[address.id || `temp-${index}`] = addressErrors
        }
      })
    }

    // Validate contacts
    contacts.forEach((contact, index) => {
      const contactErrors: Partial<Record<keyof ContactFormValues, string>> = {}
      
      if (!contact.name?.trim()) {
        contactErrors.name = 'Contact name is required'
      }
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        contactErrors.email = 'Invalid email format'
      }
      
      if (Object.keys(contactErrors).length > 0) {
        contErrors[contact.id || `temp-${index}`] = contactErrors
      }
    })
    
    setValidationErrors(errors)
    setAddressErrors(addrErrors)
    setContactErrors(contErrors)
    
    return Object.keys(errors).length === 0 && 
           Object.keys(addrErrors).length === 0 && 
           Object.keys(contErrors).length === 0
  }

  const calculateDiff = () => {
    if (!snapshot || !id) return null

    // Core tenant changes
    const coreChanged = JSON.stringify(formData) !== JSON.stringify(snapshot.core)

    // Address changes
    const addressesNew = addresses.filter(addr => !addr.id)
    const addressesUpdated = addresses.filter(addr => {
      if (!addr.id) return false
      const original = snapshot.addresses.find(s => s.id === addr.id)
      return original && JSON.stringify(addr) !== JSON.stringify(original)
    })
    const addressesDeleted = snapshot.addresses
      .filter(original => original.id && !addresses.find(curr => curr.id === original.id))
      .map(addr => addr.id!)

    // Contact changes
    const contactsNew = contacts.filter(contact => !contact.id)
    const contactsUpdated = contacts.filter(contact => {
      if (!contact.id) return false
      const original = snapshot.contacts.find(s => s.id === contact.id)
      return original && JSON.stringify(contact) !== JSON.stringify(original)
    })
    const contactsDeleted = snapshot.contacts
      .filter(original => original.id && !contacts.find(curr => curr.id === original.id))
      .map(contact => contact.id!)

    return {
      tenantId: parseInt(id),
      coreChanged,
      addressesNew,
      addressesUpdated,
      addressesDeleted,
      contactsNew,
      contactsUpdated,
      contactsDeleted
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const diff = calculateDiff()
    if (!diff) {
      console.error('❌ [EditTenant] Cannot calculate diff - missing data')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🔄 [EditTenant] Submitting changes:', diff)

      // Update core tenant if changed
      if (diff.coreChanged) {
        console.log('🏢 [EditTenant] Updating core tenant data')
        await tenantsService.updateTenant(diff.tenantId, {
          name: formData.name.trim(),
          description: formData.description.trim()
        })
      }

      // Create new addresses
      for (const address of diff.addressesNew) {
        console.log('📍 [EditTenant] Creating new address:', address.type)
        await addressService.createAddress(diff.tenantId, {
          type: address.type,
          label: address.label,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postal_code,
          countryCode: address.country_code,
          isPrimary: address.is_primary
        })
      }

      // Update existing addresses
      for (const address of diff.addressesUpdated) {
        console.log('📍 [EditTenant] Updating address:', address.id)
        await addressService.updateAddress(diff.tenantId, address.id!, {
          type: address.type,
          label: address.label,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postal_code,
          countryCode: address.country_code,
          isPrimary: address.is_primary
        })
      }

      // Delete removed addresses
      for (const addressId of diff.addressesDeleted) {
        console.log('📍 [EditTenant] Deleting address:', addressId)
        await addressService.deleteAddress(diff.tenantId, addressId)
      }

      // Create new contacts
      for (const contact of diff.contactsNew) {
        console.log('👥 [EditTenant] Creating new contact:', contact.name)
        const contactData = {
          type: contact.type,
          fullName: contact.name,
          title: contact.title,
          department: contact.department,
          email: contact.email,
          phoneE164: contact.phone_number,
          notes: contact.notes,
          isPrimary: contact.is_primary
        };
        
        await contactService.createContact(diff.tenantId, contactData)
      }

      // Update existing contacts
      for (const contact of diff.contactsUpdated) {
        console.log('👥 [EditTenant] Updating contact:', contact.id)
        const contactData = {
          type: contact.type,
          fullName: contact.name,
          title: contact.title,
          department: contact.department,
          email: contact.email,
          phoneE164: contact.phone_number,
          notes: contact.notes,
          isPrimary: contact.is_primary
        };
        
        await contactService.updateContact(diff.tenantId, contact.id!, contactData)
      }

      // Delete removed contacts
      for (const contactId of diff.contactsDeleted) {
        console.log('👥 [EditTenant] Deleting contact:', contactId)
        await contactService.deleteContact(diff.tenantId, contactId)
      }

      console.log('✅ [EditTenant] All changes saved successfully')

      // Success feedback is handled automatically by HTTP interceptor
      // Stay on edit page (don't navigate away)
      
    } catch (error: any) {
      console.error('❌ [EditTenant] Failed to update tenant:', error)
      
      // Handle specific error cases
      let errorMessage = 'Failed to update tenant. Please try again.'
      
      if (error.status === 409) {
        errorMessage = 'Conflict detected. Please refresh and try again.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to edit this tenant.'
      } else if (error.status === 404) {
        errorMessage = 'Tenant not found. It may have been deleted.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }
      
      addNotification({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/tenants')
  }

  const handleBackToList = () => {
    navigate('/tenants')
  }

  const handleRetry = () => {
    window.location.reload()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
          <p className="text-gray-600 mt-1">Loading tenant data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)]"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert" aria-live="assertive">
          <div className="flex items-center">
            <div className="text-red-800">
              <h3 className="font-medium">Error Loading Tenant</h3>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <Button variant="secondary" onClick={handleBackToList}>
              Back to List
            </Button>
            <Button variant="default" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
        <p className="text-gray-600 mt-1">
          Update tenant organization information
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Tenant Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tenant Information</h2>
            </CardHeader>
            
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Tenant Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={validationErrors.name}
                  placeholder="e.g., Clinic ABC, Hospital XYZ"
                  helperText="A descriptive name for the tenant organization"
                  required
                  disabled={isSubmitting}
                />

                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description')(e as any)}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] ${isSubmitting ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                    placeholder="Optional description of the tenant organization"
                    disabled={isSubmitting}
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Brief description of the tenant organization (optional)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Addresses Section */}
          <Card>
            <CardContent className="p-6">
              <AddressesRepeater 
                addresses={addresses}
                onChange={handleAddressesChange}
                errors={addressErrors}
              />
              {validationErrors.addresses && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.addresses}</p>
              )}
            </CardContent>
          </Card>
          
          {/* Contacts Section */}
          <Card>
            <CardContent className="p-6">
              <ContactsRepeater 
                contacts={contacts}
                onChange={handleContactsChange}
                errors={contactErrors}
              />
            </CardContent>
          </Card>
        </div>

        
        <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ height: '32px', minHeight: '32px' }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}