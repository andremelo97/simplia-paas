import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { Button } from '@client/common/ui'
import { DocumentConfig, DocumentData } from '../documentConfig'

export interface ClinicalNoteFormState {
  // Clinical notes don't have extra state
}

interface ClinicalNoteFormSectionProps {
  document: DocumentData | null
  documentId: string
  config: DocumentConfig
  formState: ClinicalNoteFormState
  onFormStateChange: (state: Partial<ClinicalNoteFormState>) => void
  canEdit: boolean
}

export const ClinicalNoteFormSection: React.FC<ClinicalNoteFormSectionProps> = ({
  document,
  documentId,
  config,
  formState,
  onFormStateChange,
  canEdit
}) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

  const handleView = () => {
    if (config.viewPath) {
      navigate(config.viewPath(documentId))
    }
  }

  // Clinical notes don't have additional form sections
  // The View button is rendered in the header of EditDocument
  return null
}

// Export a header action component for clinical notes
export const ClinicalNoteHeaderAction: React.FC<{
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
      {t('clinical_notes.view')}
    </Button>
  )
}
