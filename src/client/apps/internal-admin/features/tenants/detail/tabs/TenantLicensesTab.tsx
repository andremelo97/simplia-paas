import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button } from '@client/common/ui'
import { LicenseRow } from '../../licenses/LicenseRow'
import { TenantLicense, TenantLicensesResponse } from '../../licenses/types'
import { entitlementsService } from '../../../../services/entitlements'
import { publishFeedback } from '@client/common/feedback/store'

export const TenantLicensesTab: React.FC = () => {
  const [licenses, setLicenses] = useState<TenantLicense[]>([])
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
      console.log('🔄 [TenantLicensesTab] Fetching licenses for tenant:', numericTenantId)

      const response: TenantLicensesResponse = await entitlementsService.getTenantLicenses(numericTenantId)
      
      console.log('✅ [TenantLicensesTab] Licenses fetched successfully:', response.data)

      setLicenses(response.data.licenses || [])
    } catch (err) {
      console.error('❌ [TenantLicensesTab] Failed to fetch licenses:', err)
      setError('Failed to load licenses. Please try again.')
      setLicenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleLicenseUpdate = (updatedLicense: TenantLicense) => {
    setLicenses(prev => prev.map(license => 
      license.id === updatedLicense.id ? updatedLicense : license
    ))
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

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="default" onClick={fetchLicenses}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No licenses yet</h3>
            <p className="text-gray-500 mb-4">
              Activate an application to start using seats.
            </p>
            <Link to="/applications">
              <Button variant="default">
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
  )
}