import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, Table, Badge, Alert, Skeleton, EmptyState } from '@client/common/ui'
import { TenantLicense } from '../../licenses/types'
import { Application } from '../../../../services/applications'
import { ApplicationsService } from '../../../../services/applications'
import { entitlementsService } from '../../../../services/entitlements'
import { publishFeedback } from '@client/common/feedback/store'

interface ActivateApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: number
  existingLicenses: TenantLicense[]
  onActivated: (newLicense: TenantLicense) => void
}

export const ActivateApplicationModal: React.FC<ActivateApplicationModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  existingLicenses,
  onActivated
}) => {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get licensed application slugs for filtering
  const licensedSlugs = existingLicenses.map(license => license.application.slug)

  useEffect(() => {
    if (isOpen) {
      fetchApplications()
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredApplications(applications)
    } else {
      const filtered = applications.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredApplications(filtered)
    }
  }, [searchTerm, applications])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 [ActivateApplicationModal] Fetching active applications')

      const applications = await ApplicationsService.getApplications()
      
      // Filter out already licensed applications
      const availableApps = applications.filter(
        app => !licensedSlugs.includes(app.slug)
      )
      
      console.log('✅ [ActivateApplicationModal] Applications fetched:', { 
        total: applications.length,
        available: availableApps.length,
        licensedSlugs 
      })

      setApplications(availableApps)
      setFilteredApplications(availableApps)
    } catch (err) {
      console.error('❌ [ActivateApplicationModal] Failed to fetch applications:', err)
      setError('Failed to load applications. Please try again.')
      setApplications([])
      setFilteredApplications([])
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (appSlug: string) => {
    try {
      setActivating(appSlug)
      setError(null)
      console.log('🔄 [ActivateApplicationModal] Activating license:', { tenantId, appSlug })

      const response = await entitlementsService.activateLicense(tenantId, appSlug)
      
      console.log('✅ [ActivateApplicationModal] License activated successfully:', response.data)

      // Close modal first
      onClose()
      
      // Then notify parent and scroll to new card
      onActivated(response.data.license)
      
      // Scroll to the new card after a brief delay to ensure it's rendered
      setTimeout(() => {
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
          }, 3000)
        }
      }, 100)
      
    } catch (err: any) {
      console.error('❌ [ActivateApplicationModal] Failed to activate license:', err)
      
      // Check if it's a known error type with details
      if (err.response?.data?.error?.details?.reason) {
        const reason = err.response.data.error.details.reason
        const message = err.response.data.error.message
        
        switch (reason) {
          case 'ALREADY_LICENSED':
            setError('This application is already licensed for this tenant.')
            break
          case 'APP_INACTIVE':
            setError('This application is currently inactive and cannot be licensed.')
            break
          case 'APP_NOT_FOUND':
            setError('Application not found. Please try again.')
            break
          default:
            setError(message || 'Failed to activate license. Please try again.')
        }
      } else {
        setError('Failed to activate license. Please try again.')
      }
    } finally {
      setActivating(null)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setError(null)
    onClose()
  }

  return (
    <Modal 
      open={isOpen} 
      onClose={handleClose}
      title="Activate Application"
      description="Select an application to activate for this tenant"
      size="xl"
    >
      <div className="px-6 py-4 flex flex-col gap-4">
        {/* Search */}
        <div>
          <Input
            placeholder="Search applications by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" role="alert" aria-live="assertive">
            {error}
          </Alert>
        )}

        {/* Content */}
        <div className="overflow-auto max-h-96">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title={applications.length === 0 ? "No applications available" : "No applications found"}
              description={
                applications.length === 0 
                  ? "No active applications are available to activate for this tenant."
                  : `No applications match "${searchTerm}". Try a different search term.`
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th className="text-left">Application</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const isLicensed = licensedSlugs.includes(app.slug)
                  const isActivating = activating === app.slug
                  
                  return (
                    <tr key={app.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">
                            {app.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.slug}
                          </div>
                          {app.description && (
                            <div className="text-sm text-gray-400 mt-1">
                              {app.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {isLicensed ? (
                          <Badge variant="success">Licensed</Badge>
                        ) : (
                          <Badge variant="default">Available</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleActivate(app.slug)}
                          disabled={isLicensed || isActivating}
                          isLoading={isActivating}
                        >
                          {isActivating ? 'Activating...' : isLicensed ? 'Licensed' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}