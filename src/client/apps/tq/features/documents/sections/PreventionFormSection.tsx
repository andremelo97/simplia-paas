import React from 'react'
import { useTranslation } from 'react-i18next'
import { LinkToast } from '@client/common/ui'

import { LandingPageCard } from '../components/LandingPageCard'
import { GenerateLandingPageModal } from '../../../components/landing-pages/GenerateLandingPageModal'
import { DocumentConfig, DocumentData } from '../documentConfig'

export interface PreventionFormState {
  showGenerateModal: boolean
  showLinkToast: boolean
  toastData: { landingPageId: string; publicUrl: string; password: string } | null
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
    <>
      {/* Landing Page Card */}
      <LandingPageCard
        documentId={documentId}
        documentNumber={document?.number || ''}
        config={config}
        patientName={patientName}
        patientEmail={patientEmail}
        patientPhone={patientPhone}
        onShowGenerateModal={() => onFormStateChange({ showGenerateModal: true })}
      />

      {/* Generate Landing Page Modal */}
      {document && (
        <GenerateLandingPageModal
          open={formState.showGenerateModal}
          onClose={() => onFormStateChange({ showGenerateModal: false })}
          documentId={documentId}
          documentType="prevention"
          documentNumber={document.number}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          onSuccess={() => onFormStateChange({ showGenerateModal: false })}
          onShowToast={(data) => onFormStateChange({ toastData: data, showLinkToast: true })}
        />
      )}

      {/* Link Toast for Landing Page */}
      {formState.toastData && document && (
        <LinkToast
          show={formState.showLinkToast}
          itemNumber={document.number}
          itemId={formState.toastData.landingPageId}
          onClose={() => onFormStateChange({ showLinkToast: false })}
          type="landing-page"
          publicUrl={formState.toastData.publicUrl}
          password={formState.toastData.password}
          duration={15000}
          darkBackground={true}
        />
      )}
    </>
  )
}
