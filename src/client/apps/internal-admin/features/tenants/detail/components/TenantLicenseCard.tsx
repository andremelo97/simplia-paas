import React from 'react'
import { Card, CardHeader, CardContent, Badge, Button, Table, StatusBadge } from '@client/common/ui'
import { TenantLicense } from '../../licenses/types'

interface TenantLicenseCardProps {
  license: TenantLicense
  onAdjustSeats: (license: TenantLicense) => void
  onManageUsers: (license: TenantLicense) => void
  onViewPricing: (license: TenantLicense) => void
}

export const TenantLicenseCard: React.FC<TenantLicenseCardProps> = ({
  license,
  onAdjustSeats,
  onManageUsers,
  onViewPricing
}) => {

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase()
    })
    return formatter.format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const totalSeatsUsed = license.seatsByUserType?.reduce((sum, seat) => sum + seat.used, 0) || 0
  const hasSeats = (license.seatsByUserType?.length || 0) > 0

  return (
    <Card id={`app-${license.application?.slug || 'unknown'}`} className="scroll-mt-4">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {license.application?.name || 'Unknown Application'}
              </h3>
              <StatusBadge status={license.status as 'active' | 'inactive' | 'suspended'} />
            </div>
            {license.application?.description && (
              <p className="text-sm text-gray-600">{license.application.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewPricing(license)}
            >
              View Pricing
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAdjustSeats(license)}
            >
              Adjust Seats
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onManageUsers(license)}
            >
              Manage Users
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0 pb-6">
        {/* Plan/Price Information */}
        {license.pricingSnapshot && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Plan</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Base Price:</span>
                <div className="font-medium">
                  {formatCurrency(license.pricingSnapshot.price, license.pricingSnapshot.currency)}
                  <span className="text-gray-500">/{license.pricingSnapshot.billingCycle}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Total Seats:</span>
                <div className="font-medium">{license.userLimit || 'Unlimited'}</div>
              </div>
              <div>
                <span className="text-gray-500">Used Seats:</span>
                <div className="font-medium">{totalSeatsUsed}</div>
              </div>
              <div>
                <span className="text-gray-500">Available:</span>
                <div className="font-medium">
                  {license.userLimit ? license.userLimit - totalSeatsUsed : 'Unlimited'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seats by User Type */}
        {hasSeats ? (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Seats by User Type</h4>
            <Table>
              <thead>
                <tr>
                  <th className="text-left">User Type</th>
                  <th className="text-center">Used</th>
                  <th className="text-center">Available</th>
                  <th className="text-right">Price per Seat</th>
                </tr>
              </thead>
              <tbody>
                {(license.seatsByUserType || []).map((seat) => (
                  <tr key={seat.userTypeId}>
                    <td className="font-medium">{seat.userType}</td>
                    <td className="text-center">
                      <span className="font-medium">{seat.used}</span>
                    </td>
                    <td className="text-center">
                      <span className={seat.available === 0 ? 'text-red-600 font-medium' : ''}>
                        {seat.available !== null ? seat.available : '∞'}
                      </span>
                    </td>
                    <td className="text-right">
                      {seat.pricing?.price ? (
                        <span className="font-medium">
                          {formatCurrency(seat.pricing.price, seat.pricing.currency)}
                          <span className="text-gray-500">/{seat.pricing.billingCycle}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No users assigned to this application yet.</p>
          </div>
        )}

        {/* License Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Activated:</span>
              <div className="font-medium">{formatDate(license.activatedAt)}</div>
            </div>
            <div>
              <span className="text-gray-500">Expires:</span>
              <div className="font-medium">{formatDate(license.expiryDate)}</div>
            </div>
            <div>
              <span className="text-gray-500">License ID:</span>
              <div className="font-mono text-xs">{license.id}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}