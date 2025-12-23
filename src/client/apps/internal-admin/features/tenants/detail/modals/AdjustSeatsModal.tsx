import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, Alert } from '@client/common/ui'
import { TenantLicense } from '../../licenses/types'
import { tenantsService } from '../../../../services/tenants'
import { publishFeedback } from '@client/common/feedback/store'

interface AdjustSeatsModalProps {
  isOpen: boolean
  onClose: () => void
  license: TenantLicense
  tenantId: number
  onAdjusted: (updatedLicense: TenantLicense) => void
}

export const AdjustSeatsModal: React.FC<AdjustSeatsModalProps> = ({
  isOpen,
  onClose,
  license,
  tenantId,
  onAdjusted
}) => {
  const [seatLimit, setSeatLimit] = useState<number>(license.seatsPurchased || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes or license changes
  useEffect(() => {
    if (isOpen) {
      setSeatLimit(license.seatsPurchased || 0)
      setError(null)
    }
  }, [isOpen, license.seatsPurchased])

  const currentUsed = license.seatsUsed || 0
  const currentTotal = license.seatsPurchased || 0
  const currentAvailable = Math.max(0, currentTotal - currentUsed)

  const newAvailable = Math.max(0, seatLimit - currentUsed)
  const isReducingBelowUsed = seatLimit < currentUsed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isReducingBelowUsed) {
      setError(`Cannot reduce limit below ${currentUsed} seats currently in use.`)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await tenantsService.adjustLicense(tenantId, license.application.slug, {
        userLimit: seatLimit
      })

      // Convert response to TenantLicense format
      const updatedLicense: TenantLicense = {
        ...license,
        seatsPurchased: response.data.license.seatsPurchased,
        seatsUsed: response.data.license.seatsUsed,
        seatsAvailable: response.data.license.seatsAvailable,
        updatedAt: response.data.license.updatedAt
      }

      // Close modal first
      onClose()
      
      // Notify parent
      onAdjusted(updatedLicense)
      
      // Highlight the card briefly
      setTimeout(() => {
        const cardElement = document.getElementById(`app-${license.application.slug}`)
        if (cardElement) {
          cardElement.classList.add('ring-2', 'ring-blue-500')
          setTimeout(() => {
            cardElement.classList.remove('ring-2', 'ring-blue-500')
          }, 3000)
        }
      }, 100)

    } catch (err: any) {
      
      // Handle specific validation errors
      if (err.response?.data?.details?.reason === 'TOTAL_LT_USED') {
        const { seatsUsed, requestedLimit } = err.response.data.details
        setError(`Cannot reduce limit to ${requestedLimit}. Currently using ${seatsUsed} seats.`)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to adjust seats. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Modal 
      open={isOpen} 
      onClose={handleClose}
      title="Adjust Seats"
      description={`Modify seat limit for ${license.application.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Current Usage Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Current Usage</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Used</div>
              <div className="font-semibold text-gray-900">{currentUsed}</div>
            </div>
            <div>
              <div className="text-gray-500">Total</div>
              <div className="font-semibold text-gray-900">{currentTotal}</div>
            </div>
            <div>
              <div className="text-gray-500">Available</div>
              <div className="font-semibold text-gray-900">{currentAvailable}</div>
            </div>
          </div>
        </div>

        {/* New Limit Input */}
        <div>
          <label htmlFor="seatLimit" className="block text-sm font-medium text-gray-700 mb-2">
            New Seat Limit
          </label>
          <Input
            id="seatLimit"
            type="number"
            min={0}
            value={seatLimit}
            onChange={(e) => setSeatLimit(parseInt(e.target.value) || 0)}
            placeholder="Enter new seat limit"
            className="w-full"
            required
            disabled={isSubmitting}
          />
          <div className="mt-2 text-xs text-gray-500">
            Minimum value: {currentUsed} (cannot reduce below seats currently in use)
          </div>
        </div>

        {/* New Usage Preview */}
        {seatLimit !== currentTotal && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-blue-900">After Adjustment</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-blue-600">Used</div>
                <div className="font-semibold text-blue-900">{currentUsed}</div>
              </div>
              <div>
                <div className="text-blue-600">Total</div>
                <div className="font-semibold text-blue-900">{seatLimit}</div>
              </div>
              <div>
                <div className="text-blue-600">Available</div>
                <div className={`font-semibold ${isReducingBelowUsed ? 'text-red-600' : 'text-blue-900'}`}>
                  {isReducingBelowUsed ? 'Invalid' : newAvailable}
                </div>
              </div>
            </div>
            {isReducingBelowUsed && (
              <div className="text-xs text-red-600 font-medium">
                ⚠️ Cannot reduce limit below {currentUsed} seats currently in use
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" role="alert" aria-live="assertive">
            {error}
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting || isReducingBelowUsed}
          >
            {isSubmitting ? 'Adjusting...' : 'Adjust Seats'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}