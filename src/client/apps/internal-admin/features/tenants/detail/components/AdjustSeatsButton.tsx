import React, { useState } from 'react'
import { Button } from '@client/common/ui'
import { AdjustSeatsModal } from '../modals/AdjustSeatsModal'
import { TenantLicense } from '../../licenses/types'

interface AdjustSeatsButtonProps {
  license: TenantLicense
  tenantId: number
  onAdjusted: (updatedLicense: TenantLicense) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'secondary' | 'outline' | 'tertiary'
}

export const AdjustSeatsButton: React.FC<AdjustSeatsButtonProps> = ({
  license,
  tenantId,
  onAdjusted,
  size = 'sm',
  variant = 'outline'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleAdjusted = (updatedLicense: TenantLicense) => {
    onAdjusted(updatedLicense)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
      >
        Adjust Seats
      </Button>

      <AdjustSeatsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        license={license}
        tenantId={tenantId}
        onAdjusted={handleAdjusted}
      />
    </>
  )
}