import React from 'react'
import { Card, CardHeader, CardContent, Table, Badge } from '@client/common/ui'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useTranslation } from 'react-i18next'

interface EntitlementUser {
  email: string
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
  seatsPurchased: number | null
  users: EntitlementUser[]
}

interface EntitlementsSummary {
  apps: number
  seatsUsed: number
  seatsLimit: number | null
}

interface EntitlementsSummaryCardProps {
  licenses: EntitlementLicense[]
  summary: EntitlementsSummary
}

export function EntitlementsSummaryCard({ licenses, summary }: EntitlementsSummaryCardProps) {
  const { formatShortDate } = useDateFormatter()
  const { t } = useTranslation('hub')

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'active':
        return 'success'
      case 'trial':
        return 'info'
      case 'suspended':
        return 'warning'
      case 'expired':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return t('entitlements.summary.not_available')
    return formatShortDate(date)
  }

  const getTotalUsers = (license: EntitlementLicense) => {
    const used = license.seatsUsed || 0
    if (license.seatsPurchased === null) {
      return `${used}/${t('entitlements.summary.unlimited')}`
    }
    return `${used}/${license.seatsPurchased}`
  }

  const getStatusLabel = (status: string) =>
    t(`entitlements.status.${status}`, { defaultValue: status })

  const appsCount = summary?.apps ?? licenses.length
  const applicationsCountLabel = t('entitlements.summary.applications_count', {
    count: appsCount
  })

  const seatsTotalLabel =
    summary.seatsLimit === null ? t('entitlements.summary.unlimited') : summary.seatsLimit
  const seatsUsageLabel = t('entitlements.summary.seats_usage', {
    used: summary.seatsUsed,
    total: seatsTotalLabel
  })

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('entitlements.summary.title')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('entitlements.summary.description')}
            </p>
          </div>
          <div className="text-sm text-gray-500 text-right">
            <div>{applicationsCountLabel}</div>
            <div className="text-xs text-gray-400">{seatsUsageLabel}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0 pb-6">
        <Table>
          <thead>
            <tr>
              <th className="text-left">{t('entitlements.summary.table.application')}</th>
              <th className="text-center">{t('entitlements.summary.table.status')}</th>
              <th className="text-center">{t('entitlements.summary.table.licenses')}</th>
              <th className="text-center">{t('entitlements.summary.table.activated')}</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr key={license.applicationId}>
                <td>
                  <div>
                    <div className="font-medium text-gray-900">
                      {license.name || t('entitlements.summary.unknown_application')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {license.slug || t('entitlements.summary.unknown_slug')}
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Badge variant={getStatusColor(license.status)}>
                    {getStatusLabel(license.status)}
                  </Badge>
                </td>
                <td className="text-center">
                  <span className="font-mono text-sm">{getTotalUsers(license)}</span>
                </td>
                <td className="text-center text-sm">{formatDate(license.activatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  )
}
