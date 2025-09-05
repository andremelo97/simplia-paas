import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button, Skeleton } from '@client/common/ui'
import { LicenseRow } from './LicenseRow'
import { TenantLicense, TenantLicensesResponse } from './types'
import { entitlementsService } from '../../../services/entitlements'
import { publishFeedback } from '@client/common/feedback/store'

export const TenantLicensesPage: React.FC = () => {
  const [licenses, setLicenses] = useState<TenantLicense[]>([])
  const [tenantInfo, setTenantInfo] = useState<{ id: number; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { tenantId } = useParams<{ tenantId: string }>()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) {
      setError('Invalid tenant ID')
      setLoading(false)
      return
    }

    fetchLicenses()
  }, [numericTenantId])

  const fetchLicenses = async () => {
    if (!numericTenantId) return

    try {
      setLoading(true)
      setError(null)
      console.log('🔄 [TenantLicensesPage] Fetching licenses for tenant:', numericTenantId)

      const response: TenantLicensesResponse = await entitlementsService.getTenantLicenses(numericTenantId)
      
      console.log('✅ [TenantLicensesPage] Licenses fetched successfully:', response.data)

      setLicenses(response.data.licenses || [])
      setTenantInfo({
        id: response.data.tenantId,
        name: response.data.tenantName
      })
    } catch (err) {
      console.error('❌ [TenantLicensesPage] Failed to fetch licenses:', err)
      setError('Failed to load licenses. Please try again.')
      setLicenses([])
      setTenantInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLicenseUpdate = (updatedLicense: TenantLicense) => {
    setLicenses(prev => prev.map(license => 
      license.id === updatedLicense.id ? updatedLicense : license
    ))
  }

  // Tenant header with tabs
  const renderTenantHeader = () => {
    if (!tenantInfo) return null

    const tabs = [
      { label: 'Overview', path: `/tenants/${numericTenantId}` },
      { label: 'Users', path: `/users?tenantId=${numericTenantId}` },
      { label: 'Licenses', path: `/tenants/${numericTenantId}/licenses`, active: true },
      { label: 'Addresses', path: `/tenants/${numericTenantId}/addresses` },
      { label: 'Contacts', path: `/tenants/${numericTenantId}/contacts` }
    ]

    return (
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenantInfo.name}</h1>
              <p className="text-gray-600 mt-1">
                Manage licenses and application access
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  tab.active
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-4" />
            <div className="flex space-x-8">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="px-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {renderTenantHeader()}
        <div className="px-6">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchLicenses}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderTenantHeader()}

      <div className="px-6">
        <Card>
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Application Licenses</h2>
              <div className="text-sm text-gray-500">
                {licenses.length} {licenses.length === 1 ? 'license' : 'licenses'}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {licenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No licenses yet</h3>
                <p className="text-gray-500 mb-4">
                  Activate an application to start using seats.
                </p>
                <Link to="/applications">
                  <Button>
                    Browse Applications
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seats (used/limit)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activated At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires At
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {licenses.map((license) => (
                      <LicenseRow
                        key={license.id}
                        license={license}
                        onLicenseUpdate={handleLicenseUpdate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}