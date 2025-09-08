import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Skeleton, EmptyState, Alert, Button } from '@client/common/ui'
import { TenantLicense, TenantLicensesResponse } from '../../licenses/types'
import { TenantLicenseCard } from '../components/TenantLicenseCard'
import { TenantLicensedApplicationsCard } from '../components/TenantLicensedApplicationsCard'
import { ActivateApplicationButton } from '../components/ActivateApplicationButton'
import { AdjustSeatsModal } from '../modals/AdjustSeatsModal'
import { ManageApplicationsModal } from '../modals/ManageApplicationsModal'
import { tenantsService } from '../../../../services/tenants'

export const TenantLicensesTab: React.FC = () => {
  const [licenses, setLicenses] = useState<TenantLicense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLicense, setSelectedLicense] = useState<TenantLicense | null>(null)
  const [isAdjustSeatsModalOpen, setIsAdjustSeatsModalOpen] = useState(false)
  const [selectedLicenseForUsers, setSelectedLicenseForUsers] = useState<TenantLicense | null>(null)
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false)
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
    // Handle deep-link to specific app or user context
    const appSlug = searchParams.get('app')
    const userId = searchParams.get('user')
    
    if (appSlug && licenses.length > 0) {
      setTimeout(() => {
        const cardElement = document.getElementById(`app-${appSlug}`)
        if (cardElement) {
          cardElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          // Add temporary highlight for deep-link context
          cardElement.classList.add('ring-2', 'ring-purple-500')
          setTimeout(() => {
            cardElement.classList.remove('ring-2', 'ring-purple-500')
          }, 3000)
        }
      }, 100)
    } else if (userId) {
      // Scroll to top and show user context banner
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }, [searchParams, licenses])

  const fetchLicenses = async () => {
    if (!numericTenantId) return

    try {
      setLoading(true)
      setError(null)
      console.log('🔄 [TenantLicensesTab] Fetching tenant details for licenses:', numericTenantId)

      // Use tenant details endpoint which includes applications in metrics
      const response = await tenantsService.getTenant(numericTenantId)
      
      console.log('✅ [TenantLicensesTab] Tenant details fetched successfully:', response.data)

      // Convert applications from tenant metrics to license format
      const applications = response.metrics?.applications || []
      const convertedLicenses: TenantLicense[] = applications.map(app => ({
        id: `${numericTenantId}-${app.slug}`, // Generate pseudo ID
        application: {
          id: 0, // We don't have app ID from this endpoint
          name: app.name || app.slug?.toUpperCase() || 'Unknown', // Use name from backend
          slug: app.slug,
          description: `${app.name || app.slug} license`
        },
        status: app.status,
        userLimit: app.userLimit,
        seatsUsed: app.seatsUsed,
        seatsAvailable: app.userLimit ? Math.max(0, app.userLimit - app.seatsUsed) : null,
        expiresAt: app.expiresAt,
        activatedAt: new Date().toISOString(), // We don't have this from the endpoint
        seatsByUserType: [] // We don't have this breakdown from this endpoint
      })).filter(license => license.application.slug) // Filter out apps without slug

      setLicenses(convertedLicenses)
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
    setSelectedLicense(license)
    setIsAdjustSeatsModalOpen(true)
  }

  const handleAdjustSeatsClose = () => {
    setIsAdjustSeatsModalOpen(false)
    setSelectedLicense(null)
  }

  const handleSeatsAdjusted = (updatedLicense: TenantLicense) => {
    // Update the license in the list
    setLicenses(prev => prev.map(license => 
      license.id === updatedLicense.id ? updatedLicense : license
    ))
    
    // Refresh data to get latest state
    fetchLicenses()
  }

  const handleManageUsers = (license: TenantLicense) => {
    setSelectedLicenseForUsers(license)
    setIsManageUsersModalOpen(true)
  }

  const handleManageUsersClose = () => {
    setIsManageUsersModalOpen(false)
    setSelectedLicenseForUsers(null)
  }

  const handleUsersUpdated = (updatedLicense: TenantLicense) => {
    // Update the license in the list
    setLicenses(prev => prev.map(license => 
      license.id === updatedLicense.id ? updatedLicense : license
    ))
    
    // Refresh data to get latest state
    fetchLicenses()
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

  const userId = searchParams.get('user')
  const showUserContext = !!userId

  return (
    <div className="space-y-8">
      {/* User Context Banner */}
      {showUserContext && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-purple-800">
                  Viewing from User Context
                </h3>
                <p className="text-sm text-purple-600">
                  Showing license information for user ID {userId}. Use the "Manage Users" button on any application to grant or revoke access.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Remove user parameter from URL
                const newSearchParams = new URLSearchParams(searchParams)
                newSearchParams.delete('user')
                setSearchParams(newSearchParams)
              }}
              className="text-purple-400 hover:text-purple-600 transition-colors"
              aria-label="Close user context banner"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

      {/* Adjust Seats Modal */}
      {selectedLicense && numericTenantId && (
        <AdjustSeatsModal
          isOpen={isAdjustSeatsModalOpen}
          onClose={handleAdjustSeatsClose}
          license={selectedLicense}
          tenantId={numericTenantId}
          onAdjusted={handleSeatsAdjusted}
        />
      )}

      {/* Manage Users Modal */}
      {selectedLicenseForUsers && numericTenantId && (
        <ManageApplicationsModal
          isOpen={isManageUsersModalOpen}
          onClose={handleManageUsersClose}
          license={selectedLicenseForUsers}
          tenantId={numericTenantId}
          onUsersUpdated={handleUsersUpdated}
        />
      )}
    </div>
  )
}