import React, { useState, useEffect } from 'react'
import { Modal, Button, LinkButton, Alert, Table, Badge, StatusBadge } from '@client/common/ui'
import { TenantLicense } from '../../licenses/types'
import { tenantsService } from '../../../../services/tenants'

interface User {
  id: number
  name: string
  email: string
  role: 'operations' | 'manager' | 'admin'
  hasAccess: boolean
  status: 'active' | 'inactive'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingUserId, setProcessingUserId] = useState<number | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null)
      fetchUsers()
    }
  }, [isOpen, license.application.slug])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 [ManageApplicationsModal] Fetching users for tenant:', tenantId)
      
      // TODO: Implement users endpoint with application access info
      // For now, mock some data
      const mockUsers: User[] = [
        { id: 1, name: 'João Silva', email: 'joao@simplia.com', role: 'admin', hasAccess: true, status: 'active' },
        { id: 2, name: 'Maria Santos', email: 'maria@simplia.com', role: 'manager', hasAccess: false, status: 'active' },
        { id: 3, name: 'Pedro Costa', email: 'pedro@simplia.com', role: 'operations', hasAccess: false, status: 'inactive' }
      ]
      
      setUsers(mockUsers)
    } catch (err: any) {
      console.error('❌ [ManageApplicationsModal] Failed to fetch users:', err)
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGrantAccess = async (userId: number) => {
    if (!license.userLimit || license.seatsUsed >= license.userLimit) {
      setError('Cannot grant access: seat limit reached. Please adjust seats first.')
      return
    }

    try {
      setProcessingUserId(userId)
      setError(null)
      
      console.log('🔄 [ManageApplicationsModal] Granting access:', { 
        tenantId, 
        userId, 
        appSlug: license.application.slug 
      })

      // TODO: Replace with actual grant endpoint
      const response = await tenantsService.grantUserAccess(tenantId, userId, license.application.slug)
      
      console.log('✅ [ManageApplicationsModal] Access granted successfully')

      // Update user list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, hasAccess: true } : user
      ))

      // Create updated license object
      const updatedLicense: TenantLicense = {
        ...license,
        seatsUsed: license.seatsUsed + 1,
        seatsAvailable: license.seatsAvailable ? license.seatsAvailable - 1 : null
      }

      onUsersUpdated(updatedLicense)
      
    } catch (err: any) {
      console.error('❌ [ManageApplicationsModal] Failed to grant access:', err)
      
      if (err.response?.data?.details?.reason === 'NO_SEATS_AVAILABLE') {
        setError('No seats available. Please adjust seat limit first.')
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
    try {
      setProcessingUserId(userId)
      setError(null)
      
      console.log('🔄 [ManageApplicationsModal] Revoking access:', { 
        tenantId, 
        userId, 
        appSlug: license.application.slug 
      })

      // TODO: Replace with actual revoke endpoint
      const response = await tenantsService.revokeUserAccess(tenantId, userId, license.application.slug)
      
      console.log('✅ [ManageApplicationsModal] Access revoked successfully')

      // Update user list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, hasAccess: false } : user
      ))

      // Create updated license object
      const updatedLicense: TenantLicense = {
        ...license,
        seatsUsed: Math.max(0, license.seatsUsed - 1),
        seatsAvailable: license.seatsAvailable ? license.seatsAvailable + 1 : null
      }

      onUsersUpdated(updatedLicense)
      
    } catch (err: any) {
      console.error('❌ [ManageApplicationsModal] Failed to revoke access:', err)
      
      if (err.response?.data?.message) {
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

  const currentSeatsUsed = license.seatsUsed || 0
  const currentTotal = license.userLimit || 0
  const currentAvailable = Math.max(0, currentTotal - currentSeatsUsed)
  const usersWithAccess = users.filter(user => user.hasAccess).length

  return (
    <Modal 
      open={isOpen} 
      onClose={handleClose}
      title="Manage Users"
      description={`Grant or revoke access to ${license.application.name}`}
      size="lg"
    >
      <div className="px-6 py-4">
        {/* Current Usage Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Current Usage</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Used Seats</div>
              <div className="font-semibold text-gray-900">{currentSeatsUsed}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Seats</div>
              <div className="font-semibold text-gray-900">{currentTotal || 'Unlimited'}</div>
            </div>
            <div>
              <div className="text-gray-500">Available</div>
              <div className={`font-semibold ${currentAvailable === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {currentTotal ? currentAvailable : 'Unlimited'}
              </div>
            </div>
          </div>
          {currentAvailable === 0 && currentTotal > 0 && (
            <div className="mt-2 text-xs text-red-600">
              ⚠️ No seats available. Adjust seat limit to grant more access.
            </div>
          )}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading users...</div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tenant Users</h4>
            
            {users.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No users found for this tenant.
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th className="text-left">User</th>
                    <th className="text-left">Role</th>
                    <th className="text-center">Access Status</th>
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
                      <td className="text-center">
                        <StatusBadge status={user.hasAccess ? 'active' : 'inactive'} />
                      </td>
                      <td className="text-center">
                        {user.hasAccess ? (
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
                            disabled={processingUserId !== null || (currentTotal > 0 && currentAvailable === 0)}
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
            to={`/tenants/${tenantId}/users?app=${license.application.slug}`}
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