import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, LinkToast } from '@client/common/ui'
import { QuoteItemsManager } from '../../quotes/QuoteItemsManager'
import { GeneratePublicQuoteModal } from '../../../components/quotes/GeneratePublicQuoteModal'
import { LandingPageCard } from '../components/LandingPageCard'
import { DocumentConfig, DocumentData } from '../documentConfig'

export interface QuoteFormState {
  status: string
  items: any[]
  showGenerateModal: boolean
  showLinkToast: boolean
  toastData: { publicQuoteId: string; publicUrl: string; password: string } | null
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
  const navigate = useNavigate()

  const handleViewPublicLink = () => {
    if (document?.number) {
      navigate(`/landing-pages/links?quote=${encodeURIComponent(document.number)}`)
    }
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
        <>
          <LandingPageCard
            documentId={documentId}
            documentNumber={document?.number || ''}
            config={config}
            patientName={patientName}
            patientEmail={patientEmail}
            patientPhone={patientPhone}
            onShowGenerateModal={() => onFormStateChange({ showGenerateModal: true })}
          />

          {/* Header action button */}
          <div className="flex justify-end -mt-4">
            <Button
              variant="primary"
              onClick={handleViewPublicLink}
            >
              {t('quotes.view_public_link')}
            </Button>
          </div>
        </>
      )}

      {/* Generate Public Quote Modal */}
      {document && (
        <GeneratePublicQuoteModal
          open={formState.showGenerateModal}
          onClose={() => onFormStateChange({ showGenerateModal: false })}
          quoteId={document.id}
          quoteNumber={document.number}
          patientName={patientName}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          onSuccess={() => {
            onFormStateChange({ showGenerateModal: false })
          }}
          onShowToast={(data) => {
            onFormStateChange({
              toastData: data,
              showLinkToast: true
            })
          }}
        />
      )}

      {/* Link Toast for Public Quote */}
      {formState.toastData && document && (
        <LinkToast
          show={formState.showLinkToast}
          itemNumber={document.number}
          itemId={formState.toastData.publicQuoteId}
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
