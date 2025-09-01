import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Label } from '@client/common/ui'
import { api } from '@client/config/http'
import { useUIStore } from '../../store'

interface TenantFormData {
  name: string
  schema: string
  description: string
}

interface AddressData {
  country: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
}

interface ContactData {
  name: string
  email: string
  phone: string
  other_contact_information: string
}

export const CreateTenant: React.FC = () => {
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    schema: '',
    description: ''
  })
  const [addressData, setAddressData] = useState<AddressData>({
    country: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: ''
  })
  const [contactData, setContactData] = useState<ContactData>({
    name: '',
    email: '',
    phone: '',
    other_contact_information: '',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
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

  const handleAddressChange = (field: keyof AddressData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAddressData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleContactChange = (field: keyof ContactData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContactData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Tenant name is required'
    } else if (formData.name.length < 3) {
      errors.name = 'Tenant name must be at least 3 characters'
    } else if (formData.name.length > 100) {
      errors.name = 'Tenant name must be less than 100 characters'
    }
    
    if (!formData.schema.trim()) {
      errors.schema = 'Schema name is required'
    } else if (!/^tenant_[a-z0-9_]+$/.test(formData.schema)) {
      errors.schema = 'Schema name must follow the format: tenant_name_format'
    } else if (formData.schema.length > 63) {
      errors.schema = 'Schema name must be less than 63 characters (PostgreSQL limit)'
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await api.tenants.create({
        name: formData.name.trim(),
        schema: formData.schema.trim(),
        description: formData.description.trim() || undefined
      })
      
      addNotification({
        type: 'success',
        message: `Tenant "${formData.name}" created successfully`
      })
      
      navigate('/tenants')
    } catch (error: any) {
      console.error('Failed to create tenant:', error)
      
      let errorMessage = 'Failed to create tenant. Please try again.'
      
      if (error.message.includes('already exists')) {
        errorMessage = 'A tenant with this name or schema already exists.'
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid tenant data provided. Please check your input.'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Tenant Information + Contact */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Tenant Information</h2>
              </CardHeader>
              
              <CardContent className="space-y-6">
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

            <Input
              label="Schema Name"
              value={formData.schema}
              onChange={handleInputChange('schema')}
              error={validationErrors.schema}
              placeholder="tenant_clinic_abc"
              helperText="Database schema name (auto-generated from tenant name)"
              required
              disabled
              readOnly
            />

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description')(e as any)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
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
              </CardContent>
            </Card>
            
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Contact information</h2>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Input
                  label="Full name"
                  value={contactData.name}
                  onChange={handleContactChange('name')}
                  placeholder="Full name"
                  disabled={isSubmitting}
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={contactData.email}
                  onChange={handleContactChange('email')}
                  placeholder="Email"
                  disabled={isSubmitting}
                />
                
                <Input
                  label="Phone"
                  type="tel"
                  value={contactData.phone}
                  onChange={handleContactChange('phone')}
                  placeholder="Phone"
                  disabled={isSubmitting}
                />

<Input
                  label="Other contact information"
                  type="text"
                  value={contactData.other_contact_information}
                  onChange={handleContactChange('other_contact_information')}
                  placeholder="More info (optional)"
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Address (placeholder) */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Address (placeholder)</h2>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Input
                label="Country"
                value={addressData.country}
                onChange={handleAddressChange('country')}
                placeholder="Country"
                disabled={isSubmitting}
              />
              
              <Input
                label="Address line 1"
                value={addressData.address_line_1}
                onChange={handleAddressChange('address_line_1')}
                placeholder="Address line 1"
                disabled={isSubmitting}
              />
              
              <Input
                label="Address line 2 (optional)"
                value={addressData.address_line_2}
                onChange={handleAddressChange('address_line_2')}
                placeholder="Address line 2 (optional)"
                disabled={isSubmitting}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={addressData.city}
                  onChange={handleAddressChange('city')}
                  placeholder="City"
                  disabled={isSubmitting}
                />
                
                <Input
                  label="State/Province"
                  value={addressData.state}
                  onChange={handleAddressChange('state')}
                  placeholder="State/Province"
                  disabled={isSubmitting}
                />
              </div>
              
              <Input
                label="Postal code"
                value={addressData.postal_code}
                onChange={handleAddressChange('postal_code')}
                placeholder="Postal code"
                disabled={isSubmitting}
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
            Create Tenant
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