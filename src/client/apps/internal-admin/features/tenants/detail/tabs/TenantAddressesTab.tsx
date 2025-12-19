import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Badge } from '@client/common/ui'
import { publishFeedback } from '@client/common/feedback/store'
import { tenantsService, TenantAddress } from '../../../../services/tenants'

export const TenantAddressesTab: React.FC = () => {
  const [addresses, setAddresses] = useState<TenantAddress[]>([])
  const [loading, setLoading] = useState(true)
  const { tenantId } = useParams<{ tenantId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) return

    const fetchAddresses = async () => {
      try {
        setLoading(true)

        const response = await tenantsService.listAddresses(numericTenantId, {
          active: true,
          limit: 50
        })

        setAddresses(response.data.addresses)
      } catch (error) {
        publishFeedback({
          kind: 'error',
          message: 'Failed to load addresses. Please try again.'
        })
        setAddresses([])
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [numericTenantId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'HQ': 'Headquarters',
      'BILLING': 'Billing',
      'SHIPPING': 'Shipping',
      'BRANCH': 'Branch',
      'OTHER': 'Other'
    }
    return labels[type] || type
  }

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'HQ':
        return 'info'
      case 'BILLING':
        return 'success'
      case 'SHIPPING':
        return 'secondary'
      case 'BRANCH':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatFullAddress = (address: TenantAddress) => {
    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.countryCode
    ].filter(Boolean)
    return parts.join(', ')
  }

  const displayAddresses = addresses

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
          <h2 className="text-lg font-semibold text-gray-900">Tenant Addresses</h2>
          <div className="flex items-center space-x-3">
            <Link to={`/tenants/${tenantId}/edit`}>
              <Button variant="default">
                Manage Addresses
              </Button>
            </Link>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {displayAddresses.length} {displayAddresses.length === 1 ? 'address' : 'addresses'}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayAddresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-500 mb-4">
              Add addresses when editing this tenant.
            </p>
            <Link to={`/tenants/${tenantId}/edit`}>
              <Button variant="default">
                Edit Tenant
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary
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
                {displayAddresses.map((address) => (
                  <tr key={address.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getTypeVariant(address.type)}>
                        {getTypeLabel(address.type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {address.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate">
                        {formatFullAddress(address)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {address.isPrimary && (
                        <Badge variant="primary">
                          Primary
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(address.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/tenants/${tenantId}/edit`}
                          className="action-link"
                          aria-label={`Edit ${address.label}`}
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