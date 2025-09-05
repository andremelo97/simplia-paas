import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Select, Modal, Checkbox, StatusBadge, Status } from '@client/common/ui'
import { usersService } from '../../services/users'
import { ApplicationsService, Application } from '../../services/applications'
import { publishFeedback } from '@client/common/feedback/store'
import { UserDto, UserStatus, USER_STATUS_FILTER_OPTIONS, getDisplayRole } from './types'

// Debounce hook for search input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface UserAppAccess {
  applicationSlug: string
  applicationName: string
  hasAccess: boolean
  roleInApp?: string
  grantedAt?: string
}

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
  // Manage Apps Dialog State
  const [isManageAppsOpen, setIsManageAppsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [userApps, setUserApps] = useState<UserAppAccess[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [searchParams, setSearchParams] = useSearchParams()
  const { tenantId: routeTenantId } = useParams<{ tenantId: string }>()
  const usersPerPage = 10

  // Get tenantId from route parameter first, then search params
  const tenantId = routeTenantId 
    ? parseInt(routeTenantId) 
    : searchParams.get('tenantId') 
      ? parseInt(searchParams.get('tenantId')!) 
      : undefined

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchUsers = useCallback(async () => {
    try {
      console.log('👥 [UsersList] Starting fetch users...')
      setLoading(true)
      
      const params = {
        tenantId,
        page: currentPage,
        limit: usersPerPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      }
      console.log('📋 [UsersList] Request params:', params)
      
      const response = await usersService.list(params)
      const data = response.data // Backend returns { success, data: { users, pagination } }
      
      console.log('✅ [UsersList] Users fetched successfully:', {
        usersCount: data.users?.length || 0,
        total: data.pagination?.total,
        tenantFiltered: !!tenantId
      })
      
      setUsers(data.users || [])
      setTotalUsers(data.pagination?.total || 0)
      setTotalPages(Math.ceil((data.pagination?.total || 0) / usersPerPage))
    } catch (error) {
      console.error('❌ [UsersList] Failed to fetch users:', error)
      console.error('🔍 [UsersList] Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        status: (error as any)?.status
      })
      
      // Fallback data for development
      setUsers([
        {
          id: 1,
          email: 'admin@clinic.com',
          firstName: 'João',
          lastName: 'Silva',
          name: 'João Silva',
          tenantId: 1,
          tenantName: 'Default Clinic',
          role: 'admin',
          status: 'active',
          active: true,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-09-02T14:22:00Z'
        },
        {
          id: 2,
          email: 'manager@clinic.com',
          firstName: 'Maria',
          lastName: 'Santos',
          name: 'Maria Santos',
          tenantId: 1,
          tenantName: 'Default Clinic',
          role: 'manager',
          status: 'active',
          active: true,
          createdAt: '2024-02-20T14:15:00Z',
          updatedAt: '2024-02-20T14:15:00Z',
          lastLogin: '2024-09-01T09:45:00Z'
        },
        {
          id: 3,
          email: 'user@clinic.com',
          firstName: 'Carlos',
          lastName: 'Oliveira',
          name: 'Carlos Oliveira',
          tenantId: 1,
          tenantName: 'Default Clinic',
          role: 'operations',
          status: 'inactive',
          active: false,
          createdAt: '2024-03-10T09:45:00Z',
          updatedAt: '2024-03-10T09:45:00Z',
          lastLogin: '2024-08-15T16:30:00Z'
        }
      ])
      setTotalUsers(3)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [tenantId, currentPage, debouncedSearchTerm, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(dateString)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as UserStatus | 'all')
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleManageApps = async (user: UserDto) => {
    setSelectedUser(user)
    setIsManageAppsOpen(true)
    setLoadingApps(true)
    
    try {
      // Load all applications
      const allApps = await ApplicationsService.getApplications()
      setApplications(allApps)
      
      // Mock user app access (would come from backend in real implementation)
      const mockUserApps: UserAppAccess[] = allApps.map(app => ({
        applicationSlug: app.slug,
        applicationName: app.name,
        hasAccess: Math.random() > 0.6, // Random for demo
        roleInApp: 'user',
        grantedAt: '2024-09-01T10:00:00Z'
      }))
      
      setUserApps(mockUserApps)
      
    } catch (error) {
      console.error('❌ [UsersList] Failed to load user applications:', error)
      publishFeedback({
        kind: 'error',
        message: 'Failed to load user application access'
      })
    } finally {
      setLoadingApps(false)
    }
  }

  const handleToggleAppAccess = async (applicationSlug: string, hasAccess: boolean) => {
    if (!selectedUser) return
    
    setSubmitting(true)
    
    try {
      if (hasAccess) {
        // Grant access
        await usersService.grantAppAccess(selectedUser.id, {
          applicationSlug,
          roleInApp: 'user'
        })
        publishFeedback({
          kind: 'success',
          message: `Access granted to ${applicationSlug.toUpperCase()}`
        })
      } else {
        // Revoke access
        await usersService.revokeAppAccess(selectedUser.id, {
          applicationSlug
        })
        publishFeedback({
          kind: 'success',
          message: `Access revoked from ${applicationSlug.toUpperCase()}`
        })
      }
      
      // Update local state
      setUserApps(prev => prev.map(app => 
        app.applicationSlug === applicationSlug 
          ? { ...app, hasAccess, grantedAt: hasAccess ? new Date().toISOString() : undefined }
          : app
      ))
      
    } catch (error: any) {
      console.error('❌ [UsersList] Failed to toggle app access:', error)
      
      // Handle specific error cases
      if (error.status === 403 && error.message?.includes('seat limit')) {
        publishFeedback({
          kind: 'error',
          message: 'Cannot grant access: Seat limit reached for this application'
        })
      } else if (error.status === 422 && error.message?.includes('pricing')) {
        publishFeedback({
          kind: 'error',
          message: 'Cannot grant access: No pricing configured for this application'
        })
      } else {
        publishFeedback({
          kind: 'error',
          message: hasAccess ? 'Failed to grant application access' : 'Failed to revoke application access'
        })
      }
    } finally {
      setSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getPageTitle = () => {
    if (tenantId) {
      return `Tenant Users`
    }
    return `All Users`
  }


  const getEditUserPath = (user: UserDto) => {
    // Always use tenant-scoped route - get tenantId from route param, query param, or user data
    const userTenantId = tenantId || user.tenantId || user.tenantIdFk
    return `/tenants/${userTenantId}/users/${user.id}/edit`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            {tenantId ? 'Manage users for this tenant organization' : 'Manage user accounts across all tenants'}
          </p>
        </div>
        <Link to="/users/create">
          <Button 
            variant="default"
            style={{ width: '120px' }}
            aria-label="Create user"
          >
            + Create
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
            <div className="flex items-center space-x-4">
              {/* Status Filter */}
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e as React.ChangeEvent<HTMLSelectElement>)}
                  options={USER_STATUS_FILTER_OPTIONS}
                />
              </div>
              {/* Search Input */}
              <div className="w-64">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No users found. Use the + Create button above to add your first user.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last login: {formatRelativeTime(user.lastLogin)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {user.tenantName || `Tenant ${user.tenantId}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getDisplayRole(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status as Status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleManageApps(user)}
                            className="action-link"
                            aria-label={`Manage applications for ${user.name}`}
                          >
                            Manage Apps
                          </button>
                          <Link
                            to={getEditUserPath(user)}
                            className="action-link"
                            aria-label={`Edit user ${user.name}`}
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{Math.min((currentPage - 1) * usersPerPage + 1, totalUsers)}</span>
                    {' '}to{' '}
                    <span className="font-medium">{Math.min(currentPage * usersPerPage, totalUsers)}</span>
                    {' '}of{' '}
                    <span className="font-medium">{totalUsers}</span>
                    {' '}results
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Apps Modal */}
      <Modal 
        open={isManageAppsOpen} 
        onClose={() => setIsManageAppsOpen(false)}
        title={`Manage Applications - ${selectedUser?.name}`}
        description="Grant or revoke access to applications"
        size="xl"
        showCloseButton={false}
      >
        <div className="px-6 py-4">
            {loadingApps ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading applications...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {userApps.map((userApp) => (
                  <div key={userApp.applicationSlug} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {userApp.applicationName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Slug: {userApp.applicationSlug}
                          </p>
                          {userApp.hasAccess && userApp.grantedAt && (
                            <p className="text-xs" style={{color: 'var(--brand-tertiary)'}}>
                              Granted on {new Date(userApp.grantedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${userApp.applicationSlug}`}
                        checked={userApp.hasAccess}
                        onChange={(e) => handleToggleAppAccess(userApp.applicationSlug, e.target.checked)}
                        disabled={submitting}
                        label={userApp.hasAccess ? 'Access Granted' : 'Grant Access'}
                      />
                    </div>
                  </div>
                ))}
                
                {userApps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No applications available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsManageAppsOpen(false)}
              disabled={submitting}
            >
              Close
            </Button>
          </div>
      </Modal>
    </div>
  )
}