import React from 'react'
import { useTranslation } from 'react-i18next'
import { QuoteItemsManager } from '../../quotes/QuoteItemsManager'
import { GenerateLandingPageModal } from '../../../components/landing-pages/GenerateLandingPageModal'
import { LandingPageLinksSection } from '../../../components/landing-pages/LandingPageLinksSection'
import { LandingPageCard } from '../components/LandingPageCard'
import { DocumentConfig, DocumentData } from '../documentConfig'

export interface QuoteFormState {
  status: string
  items: any[]
  showGenerateModal: boolean
}

interface QuoteFormSectionProps {
  document: DocumentData | null
  documentId: string
  config: DocumentConfig
  formState: QuoteFormState
  onFormStateChange: (state: Partial<QuoteFormState>) => void
  patientName: string
  patientEmail: string
  patientPhone: string
  canEdit: boolean
}

export const QuoteFormSection: React.FC<QuoteFormSectionProps> = ({
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

  const handleLandingPageCreated = () => {
    // Trigger reload in LandingPageLinksSection
    window.dispatchEvent(new Event('landing-page-created'))
  }

  return (
    <>
      {/* Quote Items Manager */}
      <QuoteItemsManager
        quoteId={documentId}
        initialItems={formState.items}
        onItemsChange={(items) => onFormStateChange({ items })}
        readonly={!canEdit}
      />

      {/* Landing Page Card - Only for users who can edit */}
      {canEdit && (
        <LandingPageCard
          documentId={documentId}
          documentNumber={document?.number || ''}
          config={config}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          onShowGenerateModal={() => onFormStateChange({ showGenerateModal: true })}
        />
      )}

      {/* Shared Links List */}
      {document && (
        <LandingPageLinksSection
          documentId={documentId}
          documentType="quote"
          documentNumber={document.number}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
        />
      )}

      {/* Generate Landing Page Modal */}
      {document && (
        <GenerateLandingPageModal
          open={formState.showGenerateModal}
          onClose={() => onFormStateChange({ showGenerateModal: false })}
          documentId={document.id}
          documentType="quote"
          documentNumber={document.number}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          onSuccess={handleLandingPageCreated}
        />
      )}
    </>
  )
}
