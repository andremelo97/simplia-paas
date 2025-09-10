import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Badge } from '@client/common/ui'
import { publishFeedback } from '@client/common/feedback/store'
import { tenantsService, TenantContact } from '../../../../services/tenants'

export const TenantContactsTab: React.FC = () => {
  const [contacts, setContacts] = useState<TenantContact[]>([])
  const [loading, setLoading] = useState(true)
  const { tenantId } = useParams<{ tenantId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) return

    const fetchContacts = async () => {
      try {
        setLoading(true)
        console.log('👥 [TenantContactsTab] Fetching contacts for tenant:', numericTenantId)
        
        const response = await tenantsService.listContacts(numericTenantId, {
          active: true,
          limit: 50
        })
        
        console.log('✅ [TenantContactsTab] Contacts loaded:', response.data.contacts.length)
        setContacts(response.data.contacts)
      } catch (error) {
        console.error('❌ [TenantContactsTab] Failed to load contacts:', error)
        publishFeedback({
          kind: 'error',
          message: 'Failed to load contacts. Please try again.'
        })
        setContacts([])
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [numericTenantId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A'
    // Display phone as-is (no formatting)
    return phone
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrator',
      'BILLING': 'Billing',
      'TECH': 'Technical',
      'LEGAL': 'Legal',
      'OTHER': 'Other'
    }
    return labels[type] || type
  }

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'ADMIN':
        return 'info'
      case 'BILLING':
        return 'success'
      case 'TECH':
        return 'secondary'
      case 'LEGAL':
        return 'error'
      default:
        return 'default'
    }
  }

  const displayContacts = contacts

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
          <h2 className="text-lg font-semibold text-gray-900">Tenant Contacts</h2>
          <div className="flex items-center space-x-3">
            <Link to={`/tenants/${tenantId}/edit`}>
              <Button variant="default">
                Manage Contacts
              </Button>
            </Link>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {displayContacts.length} {displayContacts.length === 1 ? 'contact' : 'contacts'}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayContacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-500 mb-4">
              Add contacts when editing this tenant.
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title/Department
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
                {displayContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contact.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getTypeVariant(contact.type)}>
                        {getTypeLabel(contact.type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPhone(contact.phone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {contact.title && (
                          <div className="font-medium">{contact.title}</div>
                        )}
                        {contact.department && (
                          <div className="text-gray-500">{contact.department}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.isPrimary && (
                        <Badge variant="primary">
                          Primary
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/tenants/${tenantId}/edit`}
                          className="action-link"
                          aria-label={`Edit ${contact.fullName}`}
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