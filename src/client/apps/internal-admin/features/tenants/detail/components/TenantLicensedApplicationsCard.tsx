import React from 'react'
import { Card, CardHeader, CardContent, Table, Badge, Button } from '@client/common/ui'
import { TenantLicense } from '../../licenses/types'

interface TenantLicensedApplicationsCardProps {
  licenses: TenantLicense[]
  onViewDetails: (appSlug: string) => void
  onViewPricing: (license: TenantLicense) => void
}

export const TenantLicensedApplicationsCard: React.FC<TenantLicensedApplicationsCardProps> = ({
  licenses,
  onViewDetails,
  onViewPricing
}) => {
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'active': return 'success'
      case 'trial': return 'info'
      case 'suspended': return 'warning'
      case 'expired': return 'error'
      default: return 'default'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getTotalSeats = (license: TenantLicense) => {
    const used = license.seatsByUserType.reduce((sum, seat) => sum + seat.used, 0)
    const total = license.userLimit || '∞'
    return `${used}/${total}`
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Licensed Applications</h3>
            <p className="text-sm text-gray-600 mt-1">
              Overview of all application licenses for this tenant
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {licenses.length} {licenses.length === 1 ? 'license' : 'licenses'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0 pb-6">
        <Table>
          <thead>
            <tr>
              <th className="text-left">Application</th>
              <th className="text-center">Status</th>
              <th className="text-center">Seats Used/Total</th>
              <th className="text-center">Activated</th>
              <th className="text-center">Expires</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr key={license.id}>
                <td>
                  <div>
                    <div className="font-medium text-gray-900">
                      {license.application?.name || 'Unknown Application'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {license.application?.slug || 'unknown'}
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Badge variant={getStatusColor(license.status)}>
                    {license.status}
                  </Badge>
                </td>
                <td className="text-center">
                  <span className="font-mono text-sm">
                    {getTotalSeats(license)}
                  </span>
                </td>
                <td className="text-center text-sm">
                  {formatDate(license.activatedAt)}
                </td>
                <td className="text-center text-sm">
                  {formatDate(license.expiryDate)}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewPricing(license)}
                    >
                      View Pricing
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onViewDetails(license.application.slug)}
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  )
}