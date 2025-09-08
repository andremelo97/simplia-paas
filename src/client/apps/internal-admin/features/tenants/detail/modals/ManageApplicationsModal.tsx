import React, { useState, useEffect } from 'react'
import { Modal, Button, LinkButton, Alert, Table, Badge, StatusBadge, Skeleton, EmptyState, Input } from '@client/common/ui'
import { TenantLicense } from '../../licenses/types'
import { tenantsService } from '../../../../services/tenants'

interface User {
  id: number
  name: string
  email: string
  role: 'operations' | 'manager' | 'admin'
  granted: boolean
  status: 'active' | 'inactive' | 'suspended'
  accessId: number | null
  grantedAt: string | null
}

interface UsageInfo {
  used: number
  total: number | null
  available: number | null
}

interface ManageApplicationsModalProps {
  isOpen: boolean
  onClose: () => void
  license: TenantLicense
  tenantId: number
  onUsersUpdated: (updatedLicense: TenantLicense) => void
}

export const ManageApplicationsModal: React.FC<ManageApplicationsModalProps> = ({
  isOpen,
  onClose,
  license,
  tenantId,
  onUsersUpdated
}) => {
  const [users, setUsers] = useState<User[]>([])
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingUserId, setProcessingUserId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSearchTerm('')
      fetchUsers()
    }
  }, [isOpen, license.application?.slug])

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      fetchUsers()
    }, 300)
    
    setSearchTimeout(timeout)
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTerm])

  const fetchUsers = async () => {
    if (!license.application?.slug) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 [ManageApplicationsModal] Fetching users for tenant:', {
        tenantId,
        appSlug: license.application.slug,
        search: searchTerm
      })
      
      const response = await tenantsService.listAppUsers(
        tenantId,
        license.application.slug,
        {
          q: searchTerm || undefined,
          limit: 50
        }
      )
      
      setUsers(response.data.items)
      setUsage(response.data.usage)
      
      console.log('✅ [ManageApplicationsModal] Users fetched:', {
        count: response.data.items.length,
        usage: response.data.usage
      })
      
    } catch (err: any) {
      console.error('❌ [ManageApplicationsModal] Failed to fetch users:', err)
      
      if (err.response?.data?.details?.reason === 'LICENSE_NOT_FOUND') {
        setError('Application license not found for this tenant.')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to load users. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGrantAccess = async (userId: number) => {
    const currentUsage = usage || { used: 0, total: null, available: null }
    
    if (currentUsage.total && currentUsage.available !== null && currentUsage.available <= 0) {
      setError('Cannot grant access: seat limit reached. Please adjust seats first.')
      return
    }

    try {
      setProcessingUserId(userId)
      setError(null)
      
      console.log('🔄 [ManageApplicationsModal] Granting access:', { 
        tenantId, 
        userId, 
        appSlug: license.application?.slug 
      })

      const response = await tenantsService.grantUserAccess(tenantId, userId, license.application.slug)
      
      console.log('✅ [ManageApplicationsModal] Access granted successfully')

      // Update user list - mark user as having access
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, granted: true, accessId: response.data?.access?.id || null, grantedAt: new Date().toISOString() } : user
      ))

      // Update usage counters
      setUsage(prev => prev ? {
        used: prev.used + 1,
        total: prev.total,
        available: prev.total ? (prev.total - prev.used - 1) : null
      } : null)

      // Create updated license object for parent component
      const updatedLicense: TenantLicense = {
        ...license,
        seatsUsed: currentUsage.used + 1,
        seatsAvailable: currentUsage.available !== null ? currentUsage.available - 1 : null,
        totalSeatsUsed: currentUsage.used + 1
      }

      onUsersUpdated(updatedLicense)
      
    } catch (err: any) {
      console.error('❌ [ManageApplicationsModal] Failed to grant access:', err)
      
      if (err.response?.data?.details?.reason === 'NO_SEATS_AVAILABLE') {
        const adjustSeatsUrl = `/tenants/${tenantId}/licenses?app=${license.application.slug}&action=adjust-seats`
        setError(
          <div>
            No seats available. 
            <LinkButton 
              to={adjustSeatsUrl} 
              variant="tertiary" 
              size="sm" 
              className="ml-2 inline-flex"
            >
              Adjust Seats
            </LinkButton>
          </div>
        )
      } else if (err.response?.data?.details?.reason === 'ALREADY_GRANTED') {
        setError('User already has access to this application.')
        // Refresh data to reflect current state
        fetchUsers()
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to grant access. Please try again.')
      }
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleRevokeAccess = async (userId: number) => {
    const currentUsage = usage || { used: 0, total: null, available: null }
    
    try {
      setProcessingUserId(userId)
      setError(null)
      
      console.log('🔄 [ManageApplicationsModal] Revoking access:', { 
        tenantId, 
        userId, 
        appSlug: license.application?.slug 
      })

      const response = await tenantsService.revokeUserAccess(tenantId, userId, license.application.slug)
      
      console.log('✅ [ManageApplicationsModal] Access revoked successfully')

      // Update user list - mark user as not having access
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, granted: false, accessId: null, grantedAt: null } : user
      ))

      // Update usage counters
      setUsage(prev => prev ? {
        used: Math.max(0, prev.used - 1),
        total: prev.total,
        available: prev.total ? (prev.total - Math.max(0, prev.used - 1)) : null
      } : null)

      // Create updated license object for parent component
      const updatedLicense: TenantLicense = {
        ...license,
        seatsUsed: Math.max(0, currentUsage.used - 1),
        seatsAvailable: currentUsage.available !== null ? currentUsage.available + 1 : null,
        totalSeatsUsed: Math.max(0, currentUsage.used - 1)
      }

      onUsersUpdated(updatedLicense)
      
    } catch (err: any) {
      console.error('❌ [ManageApplicationsModal] Failed to revoke access:', err)
      
      if (err.response?.data?.details?.reason === 'ACCESS_NOT_FOUND') {
        setError('User access not found. It may have already been revoked.')
        // Refresh data to reflect current state
        fetchUsers()
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to revoke access. Please try again.')
      }
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const getRoleBadgeVariant = (role: string): 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (role) {
      case 'admin': return 'error'
      case 'manager': return 'warning' 
      case 'operations': return 'info'
      default: return 'default'
    }
  }

  // Use real usage data from API or fallback to license data
  const currentUsage = usage || { 
    used: license.seatsUsed || 0, 
    total: license.userLimit || null, 
    available: license.seatsAvailable || null 
  }
  const usersWithAccess = users.filter(user => user.granted).length

  return (
    <Modal 
      open={isOpen} 
      onClose={handleClose}
      title="Manage Users"
      description={`Grant or revoke access to ${license.application?.name || 'Application'}`}
      size="lg"
    >
      <div className="px-6 py-4">
        {/* Current Usage Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Current Usage</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Used Seats</div>
              <div className="font-semibold text-gray-900">{currentUsage.used}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Seats</div>
              <div className="font-semibold text-gray-900">{currentUsage.total || 'Unlimited'}</div>
            </div>
            <div>
              <div className="text-gray-500">Available</div>
              <div className={`font-semibold ${currentUsage.available === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {currentUsage.total ? (currentUsage.available || 0) : 'Unlimited'}
              </div>
            </div>
          </div>
          {currentUsage.available === 0 && currentUsage.total && currentUsage.total > 0 && (
            <div className="mt-2 text-xs text-red-600">
              ⚠️ No seats available. Adjust seat limit to grant more access.
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tenant Users</h4>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Tenant Users {users.length > 0 && `(${users.length} found)`}
            </h4>
            
            {users.length === 0 ? (
              <EmptyState
                title="No users found"
                description={searchTerm ? 'Try adjusting your search terms.' : 'No users found for this tenant.'}
                icon={
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th className="text-left">User</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Access</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <StatusBadge status={user.status as 'active' | 'inactive' | 'suspended'} />
                      </td>
                      <td className="text-center">
                        {user.granted ? (
                          <Badge variant="success">Granted</Badge>
                        ) : (
                          <Badge variant="default">Not Granted</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        {user.granted ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRevokeAccess(user.id)}
                            isLoading={processingUserId === user.id}
                            disabled={processingUserId !== null}
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleGrantAccess(user.id)}
                            isLoading={processingUserId === user.id}
                            disabled={processingUserId !== null || (currentUsage.total && currentUsage.total > 0 && (currentUsage.available || 0) === 0)}
                          >
                            Grant
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" role="alert" aria-live="assertive" className="mt-4">
            {error}
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
          <LinkButton
            to={`/tenants/${tenantId}/users?app=${license.application?.slug}`}
            variant="tertiary"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            View All Users
          </LinkButton>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={processingUserId !== null}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}