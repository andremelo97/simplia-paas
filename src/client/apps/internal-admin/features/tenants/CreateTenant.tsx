import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input } from '@client/common/ui'
import { api } from '@client/config/http'
import { useUIStore } from '../../store'

interface TenantFormData {
  name: string
  schema: string
  description: string
}

export const CreateTenant: React.FC = () => {
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    schema: '',
    description: ''
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

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Tenant Information</h2>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description')(e as any)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
              <Button
                type="submit"
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
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl bg-blue-50 border-blue-200">
        <CardContent>
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Important Notes
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Each tenant gets its own isolated database schema</li>
            <li>• Schema names must be unique and follow PostgreSQL naming conventions</li>
            <li>• Tenant creation will automatically set up the required database structure</li>
            <li>• You can configure applications and users after the tenant is created</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}