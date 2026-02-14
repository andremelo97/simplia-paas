import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { Button } from '@client/common/ui'
import { LandingPageCard } from '../components/LandingPageCard'
import { DocumentConfig, DocumentData } from '../documentConfig'

export interface PreventionFormState {
  // Prevention may have LP generation state in the future
}

interface PreventionFormSectionProps {
  document: DocumentData | null
  documentId: string
  config: DocumentConfig
  formState: PreventionFormState
  onFormStateChange: (state: Partial<PreventionFormState>) => void
  patientName: string
  patientEmail: string
  patientPhone: string
  canEdit: boolean
}

export const PreventionFormSection: React.FC<PreventionFormSectionProps> = ({
  document,
  documentId,
  config,
  formState,
  onFormStateChange,
  patientName,
  patientEmail,
  patientPhone,
  canEdit
}) => {
  const { t } = useTranslation('tq')

  // Prevention has Landing Page generation similar to Quote
  if (!canEdit) return null

  return (
    <LandingPageCard
      documentId={documentId}
      documentNumber={document?.number || ''}
      config={config}
      patientName={patientName}
      patientEmail={patientEmail}
      patientPhone={patientPhone}
      // TODO: Add generate modal for prevention landing pages
      // onShowGenerateModal={() => onFormStateChange({ showGenerateModal: true })}
    />
  )
}

// Export a header action component for prevention
export const PreventionHeaderAction: React.FC<{
  documentId: string
  config: DocumentConfig
}> = ({ documentId, config }) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

  const handleView = () => {
    if (config.viewPath) {
      navigate(config.viewPath(documentId))
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleView}
      className="flex items-center gap-2"
    >
      <Eye className="w-4 h-4" />
      {t('prevention.view')}
    </Button>
  )
}
