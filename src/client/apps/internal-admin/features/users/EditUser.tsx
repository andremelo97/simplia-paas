import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Label, FieldError, Checkbox } from '@client/common/ui'
import { UserRoleSelect } from './UserRoleSelect'
import { UserStatusBadge } from './UserStatusBadge'
import { usersService } from '../../services/users'
import { tenantsService } from '../../services/tenants'
import { UpdateUserDto, UserDto, UserRole, UserStatus } from './types'

interface UserFormData extends UpdateUserDto {
  // All fields are inherited from UpdateUserDto
}

export const EditUser: React.FC = () => {
  const [user, setUser] = useState<UserDto | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    role: 'operations',
    status: 'active'
  })
  const [tenantName, setTenantName] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  const navigate = useNavigate()
  const { tenantId, userId } = useParams<{ tenantId: string; userId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined
  const numericUserId = userId ? parseInt(userId) : undefined

  // Load existing user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!numericTenantId || !numericUserId) {
        setLoadError('Tenant ID and User ID are required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('🔄 [EditUser] Loading user data for ID:', numericUserId)

        // Load user data
        const userResponse = await usersService.getUser(numericUserId, numericTenantId)
        const userData = userResponse.data
        
        console.log('✅ [EditUser] User loaded:', userData.email)

        // Load tenant name for display
        const tenantResponse = await tenantsService.getTenant(numericTenantId)
        setTenantName(tenantResponse.data.name)

        setUser(userData)
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role,
          status: userData.status
        })
      } catch (error: any) {
        console.error('❌ [EditUser] Failed to load user data:', error)
        setLoadError(error.message || 'Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [numericTenantId, numericUserId])

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

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.checked ? 'active' : 'inactive'
    }))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!numericTenantId || !numericUserId) {
      console.error('Missing tenant ID or user ID')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await usersService.update(numericTenantId, numericUserId, formData)
      
      // Navigate back to users list with tenant filter
      navigate(`/users?tenantId=${numericTenantId}`)
    } catch (error: any) {
      console.error('Failed to update user:', error)
      
      // Handle validation errors from backend
      if (error.status === 422 && error.details?.validationErrors) {
        setValidationErrors(error.details.validationErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async () => {
    if (!numericTenantId || !numericUserId || !user) return
    
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${user.name}? They will no longer be able to access the system.`
    )
    if (!confirmed) return

    setIsSubmitting(true)
    
    try {
      await usersService.deactivate(numericTenantId, numericUserId)
      navigate(`/users?tenantId=${numericTenantId}`)
    } catch (error) {
      console.error('Failed to deactivate user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActivate = async () => {
    if (!numericTenantId || !numericUserId) return

    setIsSubmitting(true)
    
    try {
      await usersService.activate(numericTenantId, numericUserId)
      navigate(`/users?tenantId=${numericTenantId}`)
    } catch (error) {
      console.error('Failed to activate user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
  }

  const handlePasswordReset = async () => {
    if (!numericTenantId || !numericUserId || !newPassword.trim()) return

    if (newPassword.length < 8) {
      setValidationErrors(prev => ({ ...prev, newPassword: 'Password must be at least 8 characters' }))
      return
    }

    setIsSubmitting(true)
    
    try {
      await usersService.resetPassword(numericTenantId, numericUserId, newPassword)
      setShowPasswordReset(false)
      setNewPassword('')
    } catch (error) {
      console.error('Failed to reset password:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/users?tenantId=${numericTenantId}`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loadError || !user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load User</h2>
          <p className="text-gray-600 mb-4">{loadError || 'User not found'}</p>
          <Button onClick={() => navigate('/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          {tenantName && (
            <p className="text-gray-600 mt-1">
              Edit user details for <span className="font-medium">{tenantName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <UserStatusBadge status={user.status} />
          {user.status === 'active' ? (
            <Button
              variant="secondary"
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Deactivate User
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleActivate}
              disabled={isSubmitting}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              Activate User
            </Button>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Created: {formatDate(user.createdAt)}</div>
              <div>Last Login: {formatDate(user.lastLogin)}</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email (Read-only) */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role" required>Role</Label>
                <div className="mt-1">
                  <UserRoleSelect
                    id="role"
                    value={formData.role || 'operations'}
                    onChange={handleRoleChange}
                    disabled={isSubmitting}
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
                  value={formData.firstName || ''}
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
                  value={formData.lastName || ''}
                  onChange={handleInputChange('lastName')}
                  placeholder="Doe"
                  disabled={isSubmitting}
                  error={!!validationErrors.lastName}
                  className="mt-1"
                />
                <FieldError error={validationErrors.lastName} />
              </div>
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

            {/* Password Reset Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Password Management</h3>
                  <p className="text-xs text-gray-500 mt-1">Reset user's password if needed</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  disabled={isSubmitting}
                >
                  {showPasswordReset ? 'Cancel Reset' : 'Reset Password'}
                </Button>
              </div>

              {showPasswordReset && (
                <div className="bg-gray-50 p-4 rounded-md space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={generatePassword}
                        disabled={isSubmitting}
                      >
                        Generate Password
                      </Button>
                    </div>
                    <Input
                      id="newPassword"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={isSubmitting}
                      error={!!validationErrors.newPassword}
                      className="font-mono text-sm"
                    />
                    <FieldError error={validationErrors.newPassword} />
                    <p className="mt-1 text-xs text-gray-500">
                      User will be prompted to change password on next login
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handlePasswordReset}
                    disabled={isSubmitting || !newPassword.trim()}
                  >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              )}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}