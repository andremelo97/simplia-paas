import React, { useState } from 'react'
import { Card, CardHeader, CardContent, StatusBadge, Badge, Table, EmptyState, Button } from '@client/common/ui'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getRoleBadgeVariant } from '@client/common/utils/badgeUtils'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useTranslation } from 'react-i18next'

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

interface EntitlementAppCardProps {
  license: EntitlementLicense
}

export function EntitlementAppCard({ license }: EntitlementAppCardProps) {
  const [showUsers, setShowUsers] = useState(false)
  const { formatShortDate } = useDateFormatter()
   const { t } = useTranslation('hub')

  const formatDate = (dateString: string) => {
    return formatShortDate(dateString)
  }

  const getUserDisplayName = (user: EntitlementUser) => {
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim()
    return fullName || user.email.split('@')[0]
  }

  const getRoleLabel = (role: EntitlementUser['role']) =>
    t(`entitlements.roles.${role}`, { defaultValue: role })

  return (
    <Card id={`app-${license.slug}`} className="scroll-mt-4">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {license.name}
              </h3>
              <StatusBadge status={license.status as 'active' | 'inactive' | 'suspended'} />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowUsers(!showUsers)}
            className="flex items-center gap-2"
          >
            {showUsers ? t('entitlements.hide_team') : t('entitlements.show_team')}
            {showUsers ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0 pb-6">
        {/* Team Members */}
        {showUsers && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">{t('entitlements.team_members')}</h4>
            {license.users && license.users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th className="text-left">{t('entitlements.table.name')}</th>
                      <th className="text-left">{t('entitlements.table.email')}</th>
                      <th className="text-left">{t('entitlements.table.role_in_app')}</th>
                      <th className="text-left">{t('entitlements.table.access')}</th>
                      <th className="text-left">{t('entitlements.table.granted')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {license.users.map((user, index) => (
                      <tr key={index}>
                        <td className="text-gray-600">
                          <div className="font-medium">{getUserDisplayName(user)}</div>
                        </td>
                        <td className="text-gray-600">
                          <div className="text-sm">{user.email}</div>
                        </td>
                        <td>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                            {getRoleLabel(user.role)}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant="success">
                            {t('entitlements.granted')}
                          </Badge>
                        </td>
                        <td className="text-gray-500 text-sm">
                          {formatDate(user.grantedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title={t('entitlements.no_team_members_title')}
                description={t('entitlements.no_team_members_description')}
              />
            )}
          </div>
        )}

        {/* License Information */}
        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t('entitlements.table.activated')}</span>
              <div className="font-medium">{formatDate(license.activatedAt)}</div>
            </div>
            <div>
              <span className="text-gray-500">{t('entitlements.table.expires')}</span>
              <div className="font-medium">{t('entitlements.never')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
