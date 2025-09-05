import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Badge } from '@client/common/ui'
import { publishFeedback } from '@client/common/feedback/store'

interface Contact {
  id: number
  type: string
  fullName: string
  email: string
  phoneE164?: string
  title?: string
  department?: string
  isPrimary: boolean
  createdAt: string
}

export const TenantContactsTab: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const { tenantId } = useParams<{ tenantId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) return

    const fetchContacts = async () => {
      try {
        setLoading(true)
        // Note: Using mock data for now - replace with actual API call
        // const response = await contactsService.list(numericTenantId)
        
        // Mock data for demonstration
        const mockContacts: Contact[] = [
          {
            id: 1,
            type: 'ADMIN',
            fullName: 'John Smith',
            email: 'john.smith@example.com',
            phoneE164: '+15551234567',
            title: 'Administrator',
            department: 'IT',
            isPrimary: true,
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            type: 'BILLING',
            fullName: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            phoneE164: '+15559876543',
            title: 'Finance Manager',
            department: 'Finance',
            isPrimary: false,
            createdAt: '2024-02-01T14:15:00Z'
          },
          {
            id: 3,
            type: 'TECH',
            fullName: 'Mike Wilson',
            email: 'mike.wilson@example.com',
            title: 'IT Support',
            department: 'IT',
            isPrimary: false,
            createdAt: '2024-02-15T09:20:00Z'
          }
        ]
        
        setContacts(mockContacts)
      } catch (error) {
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

  const formatPhone = (phoneE164?: string) => {
    if (!phoneE164) return 'N/A'
    // Simple formatting for US numbers
    if (phoneE164.startsWith('+1') && phoneE164.length === 12) {
      const digits = phoneE164.slice(2)
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return phoneE164
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
                      {formatPhone(contact.phoneE164)}
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