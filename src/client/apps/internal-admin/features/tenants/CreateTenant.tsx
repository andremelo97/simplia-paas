import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export const CreateTenant: React.FC = () => {
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    description: ''
  })
  const [addresses, setAddresses] = useState<AddressFormValues[]>([])
  const [contacts, setContacts] = useState<ContactFormValues[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [addressErrors, setAddressErrors] = useState<Record<string, Partial<Record<keyof AddressFormValues, string>>>>({})
  const [contactErrors, setContactErrors] = useState<Record<string, Partial<Record<keyof ContactFormValues, string>>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const navigate = useNavigate()
  const { addNotification } = useUIStore()

  const generateSchemaName = (name: string) => {
    return `tenant_${name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)}`
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      schema: name ? generateSchemaName(name) : ''
    }))
    
    if (validationErrors.name) {
      setValidationErrors(prev => ({ ...prev, name: '' }))
    }
  }

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
    // Clear address errors when addresses change
    setAddressErrors({})
  }

  const handleContactsChange = (newContacts: ContactFormValues[]) => {
    setContacts(newContacts)
    // Clear contact errors when contacts change
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

    // Validate contacts - at least one recommended (not required)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Generate subdomain from tenant name
      const subdomain = formData.name.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      
      console.log('🏢 [CreateTenant] Submitting tenant creation:', {
        name: formData.name.trim(),
        subdomain,
        hasDescription: !!formData.description.trim(),
        addressCount: addresses.length,
        contactCount: contacts.length
      })

      // Step 1: Create the tenant
      const tenantResponse = await tenantsService.create({
        name: formData.name.trim(),
        subdomain,
        status: 'trial'
      })
      
      const tenant = tenantResponse.data.tenant
      console.log('✅ [CreateTenant] Tenant created successfully, ID:', tenant.id)
      
      // Step 2: Create addresses for the tenant
      if (addresses.length > 0) {
        console.log('📍 [CreateTenant] Creating addresses...')
        for (const address of addresses) {
          await addressService.createAddress(tenant.id, {
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
        console.log('✅ [CreateTenant] Addresses created successfully')
      }
      
      // Step 3: Create contacts for the tenant
      if (contacts.length > 0) {
        console.log('👥 [CreateTenant] Creating contacts...')
        for (const contact of contacts) {
          await contactService.createContact(tenant.id, {
            type: contact.type,
            fullName: contact.name,
            title: contact.title,
            department: contact.department,
            email: contact.email,
            phoneE164: contact.phone_number ? `+${contact.phone_number}` : undefined,
            notes: contact.notes,
            isPrimary: contact.is_primary
          })
        }
        console.log('✅ [CreateTenant] Contacts created successfully')
      }
      
      // Success feedback is now handled automatically by the HTTP interceptor
      // based on the meta.code from the backend response
      
      // Navigate immediately - toast will show on the tenants list page
      navigate('/tenants')
      
    } catch (error: any) {
      console.error('❌ [CreateTenant] Failed to create tenant:', error)
      
      // Map backend errors to user-friendly messages
      let errorMessage = 'Failed to create tenant. Please try again.'
      
      // Handle specific error cases based on backend responses
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        errorMessage = 'A tenant with this subdomain already exists. Please use a different subdomain.'
      } else if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.message?.includes('Subdomain must contain only lowercase')) {
        errorMessage = 'Subdomain must contain only lowercase letters, numbers, and hyphens.'
      } else if (error.status === 409) {
        errorMessage = 'Subdomain already exists. Please choose a different subdomain.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to create tenants.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Tenant</h1>
        <p className="text-gray-600 mt-1">
          Add a new tenant organization to the platform
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
                  onChange={handleNameChange}
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
            {isSubmitting ? 'Creating Tenant...' : 'Create Tenant'}
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