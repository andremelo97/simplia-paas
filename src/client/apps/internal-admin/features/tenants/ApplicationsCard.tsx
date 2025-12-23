import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent, Button } from '@client/common/ui'
import { ApplicationsService, Application } from '../../services/applications'
import { publishFeedback } from '@client/common/feedback/store'

interface TenantApplication {
  application: Application
  status: 'active' | 'inactive'
  seatsPurchased: number
  seatsUsed: number
  expiresAt?: string
  activatedAt: string
}

interface ApplicationsCardProps {
  tenantId: number
}

export const ApplicationsCard: React.FC<ApplicationsCardProps> = ({ tenantId }) => {
  const [tenantApps, setTenantApps] = useState<TenantApplication[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    loadTenantApplications()
  }, [tenantId])

  const loadTenantApplications = async () => {
    try {
      setLoading(true)
      
      // Mock data - would come from backend in real implementation
      const allApplications = await ApplicationsService.getApplications()
      
      // Mock tenant applications with seat usage data
      const mockTenantApps: TenantApplication[] = [
        {
          application: allApplications.find(app => app.slug === 'tq') || allApplications[0],
          status: 'active',
          seatsPurchased: 10,
          seatsUsed: 3,
          activatedAt: '2024-08-15T10:00:00Z',
          expiresAt: '2025-08-15T10:00:00Z'
        },
        {
          application: allApplications.find(app => app.slug === 'pm') || allApplications[1],
          status: 'active',
          seatsPurchased: 5,
          seatsUsed: 5, // At limit
          activatedAt: '2024-07-01T10:00:00Z'
        }
      ].filter(ta => ta.application)

      setTenantApps(mockTenantApps)

    } catch (error) {
      publishFeedback({
        kind: 'error',
        message: 'Failed to load tenant applications'
      })
      setTenantApps([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full" style={{color: 'var(--brand-tertiary)', backgroundColor: 'var(--brand-tertiary-bg)', fontFamily: 'Montserrat, sans-serif'}}>Active</span>
      case 'inactive':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getSeatUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-white'
  }
  
  const getSeatUsageStyle = (used: number, limit: number) => {
    const percentage = (used / limit) * 100
    if (percentage >= 100) return {}
    if (percentage >= 80) return {}
    return { color: 'var(--brand-tertiary)' }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Licensed Applications</h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading applications...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Licensed Applications</h2>
            <p className="text-sm text-gray-600 mt-1">
              Applications licensed for this tenant with seat usage
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate(`/tenants/${tenantId}/licenses`)}
          >
            Manage Licenses
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {tenantApps.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications licensed</h3>
            <p className="text-gray-500">
              This tenant doesn't have any licensed applications yet.
            </p>
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
                    Seat Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenantApps.map((tenantApp) => (
                  <tr key={tenantApp.application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tenantApp.application.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenantApp.application.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tenantApp.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className={`font-medium ${getSeatUsageColor(tenantApp.seatsUsed, tenantApp.seatsPurchased)}`} style={getSeatUsageStyle(tenantApp.seatsUsed, tenantApp.seatsPurchased)}>
                          {tenantApp.seatsUsed}/{tenantApp.seatsPurchased}
                        </span>
                        <span className="text-gray-500 ml-1">seats</span>
                      </div>
                      {tenantApp.seatsUsed >= tenantApp.seatsPurchased && (
                        <div className="text-xs text-red-600 font-medium">
                          At limit
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(tenantApp.activatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenantApp.expiresAt ? formatDate(tenantApp.expiresAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/applications/${tenantApp.application.id}/pricing`, '_blank')}
                        >
                          View Pricing
                        </Button>
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