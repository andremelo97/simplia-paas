import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton, EmptyState } from '@client/common/ui'
import { publishFeedback } from '@client/common/feedback'
import { hubService } from '../services/hub'
import { EntitlementAppCard } from './EntitlementAppCard'
import { EntitlementsSummaryCard } from './EntitlementsSummaryCard'

interface EntitlementUser {
  email: string
  firstName?: string
  lastName?: string
  role: 'operations' | 'manager' | 'admin'
  grantedAt: string
}

interface EntitlementLicense {
  applicationId: number
  slug: string
  name: string
  status: 'active' | 'suspended' | 'expired'
  activatedAt: string
  seatsUsed: number
  maxUsers: number | null
  users: EntitlementUser[]
}

interface EntitlementsSummary {
  apps: number
  seatsUsed: number
  seatsLimit: number | null
}

interface TenantEntitlementsSectionProps {
  userRole: string
}

export function TenantEntitlementsSection({ userRole }: TenantEntitlementsSectionProps) {
  const { t } = useTranslation('hub')
  const [licenses, setLicenses] = useState<EntitlementLicense[]>([])
  const [summary, setSummary] = useState<EntitlementsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntitlements()
  }, [])

  const loadEntitlements = async () => {
    try {
      setLoading(true)
      const response = await hubService.getEntitlements()

      // Extract data from response - handle different response structures
      const data = response.data || response
      setLicenses(data.licenses || [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error('Failed to load entitlements:', error)
      publishFeedback({
        kind: 'error',
        code: 'LOAD_ENTITLEMENTS_ERROR',
        title: 'Error',
        message: 'Failed to load licenses'
      })
    } finally {
      setLoading(false)
    }
  }

  // Only show for admin users
  if (userRole !== 'admin') {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-8 mt-8">
        {/* Section A - License Cards Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Section A: Application Licenses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('home.your_applications')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('home.view_apps_team_access')}
            </p>
          </div>
        </div>

        {licenses.length === 0 ? (
          <EmptyState
            title={t('home.no_apps_available')}
            description={t('home.no_apps_description')}
          />
        ) : (
          <div className="space-y-6">
            {licenses.map((license) => (
              <EntitlementAppCard
                key={license.applicationId}
                license={license}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section B: Licensed Applications Summary */}
      {licenses.length > 0 && summary && (
        <div>
          <EntitlementsSummaryCard
            licenses={licenses}
            summary={summary}
          />
        </div>
      )}
    </div>
  )
}