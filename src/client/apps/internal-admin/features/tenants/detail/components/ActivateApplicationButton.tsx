import React, { useState } from 'react'
import { Button } from '@client/common/ui'
import { ActivateApplicationModal } from '../modals/ActivateApplicationModal'
import { TenantLicense } from '../../licenses/types'

interface ActivateApplicationButtonProps {
  tenantId: number
  existingLicenses: TenantLicense[]
  onActivated: (newLicense: TenantLicense) => void
}

export const ActivateApplicationButton: React.FC<ActivateApplicationButtonProps> = ({
  tenantId,
  existingLicenses,
  onActivated
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="default"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Activate Application
      </Button>

      <ActivateApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId}
        existingLicenses={existingLicenses}
        onActivated={onActivated}
      />
    </>
  )
}