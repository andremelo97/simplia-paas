import React from 'react'
import { useTranslation } from 'react-i18next'

import { LandingPageCard } from '../components/LandingPageCard'
import { GenerateLandingPageModal } from '../../../components/landing-pages/GenerateLandingPageModal'
import { LandingPageLinksSection } from '../../../components/landing-pages/LandingPageLinksSection'
import { DocumentConfig, DocumentData } from '../documentConfig'

export interface PreventionFormState {
  showGenerateModal: boolean
  selectedTemplateId: string
  selectedTemplateName: string
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
  patientPhoneCountryCode?: string
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
  patientPhoneCountryCode,
  canEdit
}) => {
  const { t } = useTranslation('tq')

  const handleLandingPageCreated = () => {
    window.dispatchEvent(new Event('landing-page-created'))
  }

  // Prevention has Landing Page generation similar to Quote
  if (!canEdit) return null

  return (
    <>
      {/* Landing Page Card */}
      <LandingPageCard
        documentId={documentId}
        documentNumber={document?.number || ''}
        config={config}
        patientName={patientName}
        patientEmail={patientEmail}
        patientPhone={patientPhone}
        patientPhoneCountryCode={patientPhoneCountryCode}
        onShowGenerateModal={(templateId, templateName) => onFormStateChange({ showGenerateModal: true, selectedTemplateId: templateId, selectedTemplateName: templateName })}
      />

      {/* Shared Links List */}
      {document && (
        <LandingPageLinksSection
          documentId={documentId}
          documentType="prevention"
          documentNumber={document.number}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          patientPhoneCountryCode={patientPhoneCountryCode}
        />
      )}

      {/* Generate Landing Page Modal */}
      {document && (
        <GenerateLandingPageModal
          open={formState.showGenerateModal}
          onClose={() => onFormStateChange({ showGenerateModal: false })}
          documentId={documentId}
          documentType="prevention"
          documentNumber={document.number}
          templateId={formState.selectedTemplateId}
          templateName={formState.selectedTemplateName}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          patientPhoneCountryCode={patientPhoneCountryCode}
          onSuccess={handleLandingPageCreated}
        />
      )}
    </>
  )
}
