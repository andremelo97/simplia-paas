import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Badge, StatusBadge, type Status } from '@client/common/ui'
import { usersService } from '../../../../services/users'
import { publishFeedback } from '@client/common/feedback/store'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
}

export const TenantUsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { tenantId } = useParams<{ tenantId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) return

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await usersService.list({ tenantId: numericTenantId })
        setUsers(response.data.users || [])
      } catch (error) {
        publishFeedback({
          kind: 'error',
          message: 'Failed to load users. Please try again.'
        })
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [numericTenantId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const displayUsers = users


  const getRoleVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'secondary'
      case 'manager':
        return 'info'
      case 'operations':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-6 pb-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tenant Users</h2>
          <div className="flex items-center space-x-3">
            <Link to={`/tenants/${tenantId}/users/create`}>
              <Button variant="default">
                + Create User
              </Button>
            </Link>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {displayUsers.length} {displayUsers.length === 1 ? 'user' : 'users'}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
            <p className="text-gray-500 mb-4">
              Create the first user for this tenant to get started.
            </p>
            <Link to={`/tenants/${tenantId}/users/create`}>
              <Button variant="default">
                Create First User
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
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
                {displayUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleVariant(user.role)}>
                        {user.role}
                      </Badge>
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
                          to={`/tenants/${tenantId}/users/${user.id}/edit`}
                          className="action-link"
                          aria-label={`Edit ${user.firstName} ${user.lastName}`}
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
      </CardContent>
    </Card>
  )
}