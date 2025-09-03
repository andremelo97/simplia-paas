import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Select } from '@client/common/ui'
import { UserStatusBadge } from './UserStatusBadge'
import { usersService } from '../../services/users'
import { UserDto, UserStatus, USER_STATUS_FILTER_OPTIONS, USER_ROLE_LABELS } from './types'

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

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
  const [searchParams, setSearchParams] = useSearchParams()
  const usersPerPage = 10

  // Get tenantId from URL search params
  const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : undefined

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

  const handleDeactivateUser = async (userId: number, userName: string) => {
    if (!tenantId) return
    
    const confirmed = window.confirm(`Are you sure you want to deactivate ${userName}? They will no longer be able to access the system.`)
    if (!confirmed) return

    try {
      await usersService.deactivate(tenantId, userId)
      // Refetch users to update the list
      fetchUsers()
    } catch (error) {
      console.error('Failed to deactivate user:', error)
    }
  }

  const handleActivateUser = async (userId: number, userName: string) => {
    if (!tenantId) return
    
    try {
      await usersService.activate(tenantId, userId)
      // Refetch users to update the list  
      fetchUsers()
    } catch (error) {
      console.error('Failed to activate user:', error)
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
      return `Tenant Users (${totalUsers})`
    }
    return `All Users (${totalUsers})`
  }


  const getEditUserPath = (userId: number) => {
    if (tenantId) {
      return `/tenants/${tenantId}/users/${userId}/edit`
    }
    return `/users/${userId}/edit`
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
                          <Link
                            to={getEditUserPath(user.id)}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                          >
                            {user.name}
                          </Link>
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
                          {USER_ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={getEditUserPath(user.id)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                            aria-label={`Edit user ${user.name}`}
                          >
                            Edit
                          </Link>
                          {tenantId && (
                            user.status === 'active' ? (
                              <button
                                onClick={() => handleDeactivateUser(user.id, user.name)}
                                className="text-red-600 hover:text-red-900 font-medium"
                                aria-label={`Deactivate user ${user.name}`}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id, user.name)}
                                className="text-green-600 hover:text-green-900 font-medium"
                                aria-label={`Activate user ${user.name}`}
                              >
                                Activate
                              </button>
                            )
                          )}
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
    </div>
  )
}