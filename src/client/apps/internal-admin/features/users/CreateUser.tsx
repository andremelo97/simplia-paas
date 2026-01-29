import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Label, FieldError, Checkbox, Select } from '@client/common/ui'
import { UserRoleSelect } from './UserRoleSelect'
import { usersService } from '../../services/users'
import { tenantsService } from '../../services/tenants'
import { CreateUserDto, UserRole } from './types'
import { generateRandomPassword } from '@client/common/utils/passwordGenerator'

interface UserFormData extends CreateUserDto {
  // All fields are inherited from CreateUserDto
}

interface TenantOption {
  value: string
  label: string
}

export const CreateUser: React.FC = () => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'operations',
    status: 'active',
    password: ''
  })
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInternalAdmin, setIsInternalAdmin] = useState(false)
  const [livocareTenanId, setLivocareTenanId] = useState<string>('')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preSelectedTenantId = searchParams.get('tenantId')

  // Fetch tenants list and handle preselection
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoadingTenants(true)
        const response = await tenantsService.list({})
        const tenantOptions: TenantOption[] = response.data.tenants.map(tenant => ({
          value: tenant.id.toString(),
          label: `${tenant.name} (${tenant.subdomain})`
        }))

        setTenants(tenantOptions)

        // Find LivoCare Demo tenant for internal admin creation
        const livocareTenant = response.data.tenants.find(t => t.subdomain === 'livocare')
        if (livocareTenant) {
          setLivocareTenanId(livocareTenant.id.toString())
        }

        // Pre-select tenant if provided via URL parameter
        if (preSelectedTenantId) {
          setSelectedTenantId(preSelectedTenantId)
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoadingTenants(false)
      }
    }

    fetchTenants()
  }, [preSelectedTenantId])

  const handleInputChange = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }))
    if (validationErrors.role) {
      setValidationErrors(prev => ({ ...prev, role: '' }))
    }
  }

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTenantId(e.target.value)
    if (validationErrors.tenant) {
      setValidationErrors(prev => ({ ...prev, tenant: '' }))
    }
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.checked ? 'active' : 'inactive'
    }))
  }

  const handleInternalAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsInternalAdmin(checked)

    if (checked && livocareTenanId) {
      // Set tenant to LivoCare Demo and role to admin
      setSelectedTenantId(livocareTenanId)
      setFormData(prev => ({ ...prev, role: 'admin' }))
    }
  }

  const handleGeneratePassword = () => {
    const password = generateRandomPassword(12)
    setFormData(prev => ({ ...prev, password }))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!selectedTenantId) {
      errors.tenant = 'Tenant is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
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
      const numericTenantId = parseInt(selectedTenantId)

      // Include platformRole if creating internal admin
      const userData = isInternalAdmin
        ? { ...formData, platformRole: 'internal_admin' }
        : formData

      await usersService.create(numericTenantId, userData)

      // Navigate back to users list with tenant filter
      navigate(`/users?tenantId=${selectedTenantId}`)
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.status === 422 && error.details?.validationErrors) {
        setValidationErrors(error.details.validationErrors)
      } else if (error.status === 409) {
        setValidationErrors({ email: 'A user with this email already exists' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Navigate back to users list, preserving tenant filter if it was pre-selected
    if (preSelectedTenantId) {
      navigate(`/users?tenantId=${preSelectedTenantId}`)
    } else {
      navigate('/users')
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
        <p className="text-gray-600 mt-1">
          Create a new user account for a tenant organization
        </p>
      </div>

      <Card>
        <CardHeader className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          <p className="text-sm text-gray-600">
            Fill in the user information. A temporary password will be generated.
          </p>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Selection + Internal Admin Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tenant" required>Tenant</Label>
                <div className="mt-1">
                  <Select
                    id="tenant"
                    value={selectedTenantId}
                    onChange={handleTenantChange}
                    options={tenants}
                    placeholder="Select a tenant..."
                    required
                    disabled={isSubmitting || loadingTenants || isInternalAdmin}
                    error={validationErrors.tenant}
                  />
                </div>
                {loadingTenants && (
                  <p className="mt-1 text-xs text-gray-500">Loading tenants...</p>
                )}
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="isInternalAdmin"
                  checked={isInternalAdmin}
                  onChange={handleInternalAdminChange}
                  disabled={isSubmitting || !livocareTenanId}
                  label="Internal Admin"
                  description="Platform administrator (LivoCare Demo)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <Label htmlFor="email" required>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="user@company.com"
                  required
                  disabled={isSubmitting}
                  error={!!validationErrors.email}
                  className="mt-1"
                />
                <FieldError error={validationErrors.email} />
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role" required>Role</Label>
                <div className="mt-1">
                  <UserRoleSelect
                    id="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                    disabled={isSubmitting || isInternalAdmin}
                    error={validationErrors.role}
                    required
                  />
                </div>
              </div>

              {/* First Name */}
              <div>
                <Label htmlFor="firstName" required>First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  placeholder="John"
                  required
                  disabled={isSubmitting}
                  error={!!validationErrors.firstName}
                  className="mt-1"
                />
                <FieldError error={validationErrors.firstName} />
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  placeholder="Doe"
                  disabled={isSubmitting}
                  error={!!validationErrors.lastName}
                  className="mt-1"
                />
                <FieldError error={validationErrors.lastName} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>Temporary Password</Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGeneratePassword}
                  disabled={isSubmitting}
                >
                  Generate Password
                </Button>
              </div>
              <Input
                id="password"
                type="text"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Enter temporary password"
                required
                disabled={isSubmitting}
                error={!!validationErrors.password}
                className="mt-1 font-mono text-sm"
              />
              <FieldError error={validationErrors.password} />
              <p className="mt-1 text-xs text-gray-500">
                User will be prompted to change password on first login
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="status"
                checked={formData.status === 'active'}
                onChange={handleStatusChange}
                disabled={isSubmitting}
              />
              <Label htmlFor="status" className="text-sm font-medium">
                User is active
              </Label>
              <p className="text-xs text-gray-500">
                Inactive users cannot log in to the system
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating User...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}