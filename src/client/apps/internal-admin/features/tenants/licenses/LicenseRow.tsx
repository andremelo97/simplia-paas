import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, StatusBadge, Dialog, Input, Label, FieldError } from '@client/common/ui'
import { TenantLicense, AdjustLicensePayload, LicenseStatus } from './types'
import { entitlementsService } from '../../../services/entitlements'
import { publishFeedback } from '@client/common/feedback/store'

interface LicenseRowProps {
  license: TenantLicense
  onLicenseUpdate: (updatedLicense: TenantLicense) => void
}

export const LicenseRow: React.FC<LicenseRowProps> = ({ license, onLicenseUpdate }) => {
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adjustFormData, setAdjustFormData] = useState({
    status: license.status,
    userLimit: license.userLimit.toString(),
    activatedAt: license.activatedAt ? new Date(license.activatedAt).toISOString().split('T')[0] : '',
    expiresAt: license.expiresAt ? new Date(license.expiresAt).toISOString().split('T')[0] : ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSuspendResume = async () => {
    try {
      setIsSubmitting(true)
      let result
      
      if (license.status === 'active') {
        result = await entitlementsService.suspendLicense(license.tenantId, license.applicationSlug)
      } else {
        result = await entitlementsService.resumeLicense(license.tenantId, license.applicationSlug)
      }
      
      onLicenseUpdate(result.data)
    } catch (error) {
      publishFeedback({
        kind: 'error',
        message: 'Failed to update license status. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    const userLimit = parseInt(adjustFormData.userLimit)
    if (isNaN(userLimit) || userLimit < 1) {
      setValidationErrors({ userLimit: 'User limit must be a positive number' })
      return
    }

    try {
      setIsSubmitting(true)
      
      const payload: AdjustLicensePayload = {
        status: adjustFormData.status as LicenseStatus,
        userLimit,
        activatedAt: adjustFormData.activatedAt || undefined,
        expiresAt: adjustFormData.expiresAt || null
      }

      const result = await entitlementsService.adjustLicense(
        license.tenantId, 
        license.applicationSlug, 
        payload
      )

      onLicenseUpdate(result.data)
      setIsAdjustDialogOpen(false)
    } catch (error) {
      publishFeedback({
        kind: 'error',
        message: 'Failed to update license. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenPricing = () => {
    navigate(`/applications/${license.applicationId}/pricing`)
  }

  const handleOpenUsers = () => {
    navigate(`/users?tenantId=${license.tenantId}&app=${license.applicationSlug}`)
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {license.applicationName}
            </div>
            <div className="text-sm text-gray-500">
              {license.applicationSlug}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge status={license.status} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <span className="font-mono">
            {license.seatsUsed}/{license.userLimit}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(license.activatedAt)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {license.expiresAt ? formatDate(license.expiresAt) : 'Never'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setIsAdjustDialogOpen(true)}
              className="action-link"
              aria-label={`Adjust license for ${license.applicationName}`}
            >
              Adjust License
            </button>
            <button
              onClick={handleSuspendResume}
              disabled={isSubmitting}
              className="action-link"
              aria-label={`${license.status === 'active' ? 'Suspend' : 'Resume'} ${license.applicationName} license`}
            >
              {license.status === 'active' ? 'Suspend' : 'Resume'}
            </button>
            <button
              onClick={handleOpenPricing}
              className="action-link"
              aria-label={`Open pricing for ${license.applicationName}`}
            >
              Open Pricing
            </button>
            <button
              onClick={handleOpenUsers}
              className="action-link"
              aria-label={`Open users for ${license.applicationName}`}
            >
              Open Users
            </button>
          </div>
        </td>
      </tr>

      {/* Adjust License Dialog */}
      <Dialog
        open={isAdjustDialogOpen}
        onClose={() => !isSubmitting && setIsAdjustDialogOpen(false)}
        title={`Adjust ${license.applicationName} License`}
        description="Modify license settings including status, user limits, and dates."
        showCloseButton={!isSubmitting}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <Label htmlFor="adjust-status">Status</Label>
            <select
              id="adjust-status"
              value={adjustFormData.status}
              onChange={(e) => setAdjustFormData(prev => ({ ...prev, status: e.target.value as LicenseStatus }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <Label htmlFor="adjust-user-limit">User Limit</Label>
            <Input
              id="adjust-user-limit"
              type="number"
              min="1"
              value={adjustFormData.userLimit}
              onChange={(e) => setAdjustFormData(prev => ({ ...prev, userLimit: e.target.value }))}
              disabled={isSubmitting}
            />
            {validationErrors.userLimit && <FieldError message={validationErrors.userLimit} />}
          </div>

          <div>
            <Label htmlFor="adjust-activated-at">Activated Date</Label>
            <Input
              id="adjust-activated-at"
              type="date"
              value={adjustFormData.activatedAt}
              onChange={(e) => setAdjustFormData(prev => ({ ...prev, activatedAt: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="adjust-expires-at">Expires Date (Optional)</Label>
            <Input
              id="adjust-expires-at"
              type="date"
              value={adjustFormData.expiresAt}
              onChange={(e) => setAdjustFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAdjustDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update License'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}