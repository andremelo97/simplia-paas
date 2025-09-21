import React, { useState, useEffect } from 'react'
import { useParams, Outlet, NavLink } from 'react-router-dom'
import { Card, Skeleton } from '@client/common/ui'
import { tenantsService } from '../../../services/tenants'
import { publishFeedback } from '@client/common/feedback/store'

interface TenantInfo {
  id: number
  name: string
}

export const TenantDetailLayout: React.FC = () => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const { tenantId } = useParams<{ tenantId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) return

    const fetchTenantInfo = async () => {
      try {
        setLoading(true)
        const response = await tenantsService.getTenant(numericTenantId)
        setTenantInfo({
          id: response.data.id,
          name: response.data.name
        })
      } catch (error) {
        publishFeedback({
          kind: 'error',
          message: 'Failed to load tenant information. Please try again.'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTenantInfo()
  }, [numericTenantId])

  const tabs = [
    { label: 'Overview', path: `/tenants/${numericTenantId}/overview` },
    { label: 'Users', path: `/tenants/${numericTenantId}/users` },
    { label: 'Licenses', path: `/tenants/${numericTenantId}/licenses` },
    { label: 'Addresses', path: `/tenants/${numericTenantId}/addresses` },
    { label: 'Contacts', path: `/tenants/${numericTenantId}/contacts` }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="mb-6">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-4" />
            <div className="flex space-x-8">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!tenantInfo) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600">Tenant not found</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tenant Header with Tabs */}
      <Card className="mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenantInfo.name}</h1>
              <p className="text-gray-600 mt-1">
                Manage tenant information and settings
              </p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <Outlet />
    </div>
  )
}