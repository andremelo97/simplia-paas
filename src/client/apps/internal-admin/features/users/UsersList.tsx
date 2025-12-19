import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Input, Select, StatusBadge, Status } from '@client/common/ui'
import { usersService } from '../../services/users'
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


export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
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
      setLoading(true)

      const params = {
        tenantId,
        page: currentPage,
        limit: usersPerPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      }

      const response = await usersService.list(params)
      const data = response.data // Backend returns { success, data: { users, pagination } }

      setUsers(data.users || [])
      setTotalUsers(data.pagination?.total || 0)
      setTotalPages(Math.ceil((data.pagination?.total || 0) / usersPerPage))
    } catch (error) {
      // Show empty state when API fails
      setUsers([])
      setTotalUsers(0)
      setTotalPages(0)
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



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getPageTitle = () => {
    const appSlug = searchParams.get('app')
    if (tenantId && appSlug) {
      return `Tenant Users - ${appSlug.toUpperCase()} App Context`
    }
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

  const appSlug = searchParams.get('app')
  const showAppContext = !!appSlug

  return (
    <div className="space-y-6">
      {/* App Context Banner */}
      {showAppContext && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Viewing from Application Context
                </h3>
                <p className="text-sm text-blue-600">
                  Showing users for application: <strong>{appSlug?.toUpperCase()}</strong>. Use "Manage Apps" to grant or revoke access for individual users.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Remove app parameter from URL
                const newSearchParams = new URLSearchParams(searchParams)
                newSearchParams.delete('app')
                setSearchParams(newSearchParams)
              }}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              aria-label="Close application context banner"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

    </div>
  )
}