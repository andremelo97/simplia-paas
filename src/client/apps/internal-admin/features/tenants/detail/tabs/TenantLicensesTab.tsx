import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Skeleton, EmptyState, Alert, Button } from '@client/common/ui'
import { TenantLicense, TenantLicensesResponse } from '../../licenses/types'
import { TenantLicenseCard } from '../components/TenantLicenseCard'
import { TenantLicensedApplicationsCard } from '../components/TenantLicensedApplicationsCard'
import { ActivateApplicationButton } from '../components/ActivateApplicationButton'
import { entitlementsService } from '../../../../services/entitlements'

export const TenantLicensesTab: React.FC = () => {
  const [licenses, setLicenses] = useState<TenantLicense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { tenantId } = useParams<{ tenantId: string }>()
  const [searchParams] = useSearchParams()
  const numericTenantId = tenantId ? parseInt(tenantId) : undefined

  useEffect(() => {
    if (!numericTenantId) {
      setError('Invalid tenant ID')
      setLoading(false)
      return
    }

    fetchLicenses()
  }, [numericTenantId])

  useEffect(() => {
    // Handle deep-link to specific app
    const appSlug = searchParams.get('app')
    if (appSlug && licenses.length > 0) {
      setTimeout(() => {
        const cardElement = document.getElementById(`app-${appSlug}`)
        if (cardElement) {
          cardElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100)
    }
  }, [searchParams, licenses])

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

  const handleLicenseActivated = (newLicense: TenantLicense) => {
    setLicenses(prev => [...prev, newLicense])
  }

  const handleViewDetails = (appSlug: string) => {
    const cardElement = document.getElementById(`app-${appSlug}`)
    if (cardElement) {
      cardElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      // Add temporary highlight
      cardElement.classList.add('ring-2', 'ring-blue-500')
      setTimeout(() => {
        cardElement.classList.remove('ring-2', 'ring-blue-500')
      }, 2000)
    }
  }

  const handleAdjustSeats = (license: TenantLicense) => {
    // TODO: Implement seat adjustment modal
    console.log('Adjust seats for:', license.application.name)
  }

  const handleManageUsers = (license: TenantLicense) => {
    // TODO: Navigate to user management for this application
    console.log('Manage users for:', license.application.name)
  }

  const handleViewPricing = (license: TenantLicense) => {
    // TODO: Open pricing details modal
    console.log('View pricing for:', license.application.name)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Section A - License Cards Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" onClick={fetchLicenses} size="sm">
            Try Again
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section A: Application Licenses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Application Licenses</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage licenses and seats for each application
            </p>
          </div>
          {numericTenantId && (
            <ActivateApplicationButton
              tenantId={numericTenantId}
              existingLicenses={licenses}
              onActivated={handleLicenseActivated}
            />
          )}
        </div>

        {licenses.length === 0 ? (
          <EmptyState
            title="No licenses yet"
            description="Activate an application to start managing seats and users."
          />
        ) : (
          <div className="space-y-6">
            {licenses.map((license) => (
              <TenantLicenseCard
                key={license.id}
                license={license}
                onAdjustSeats={handleAdjustSeats}
                onManageUsers={handleManageUsers}
                onViewPricing={handleViewPricing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section B: Licensed Applications Summary */}
      {licenses.length > 0 && (
        <div>
          <TenantLicensedApplicationsCard
            licenses={licenses}
            onViewDetails={handleViewDetails}
            onViewPricing={handleViewPricing}
          />
        </div>
      )}
    </div>
  )
}