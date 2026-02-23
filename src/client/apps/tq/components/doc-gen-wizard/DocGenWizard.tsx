import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Stepper, Button } from '@client/common/ui'
import { useDocGenWizardStore } from '../../shared/store/docGenWizard'
import { ChevronLeft, ChevronRight, X, Loader2, FilePlus } from 'lucide-react'
import { AudioPatientStep } from './steps/AudioPatientStep'
import { TemplateDocTypeStep } from './steps/TemplateDocTypeStep'
import { ReviewEditStep } from './steps/ReviewEditStep'
import { CompletionStep } from './steps/CompletionStep'

const STEP_DEFINITIONS = [
  { id: 'audio_patient' },
  { id: 'template_doctype' },
  { id: 'review_edit' },
  { id: 'completion' },
]

export const DocGenWizard: React.FC = () => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()
  const {
    isOpen,
    currentStep,
    transcriptionStatus,
    transcriptionId,
    patientId,
    sessionId,
    documentId,
    createdDocuments,
    minimizeWizard,
    closeWizard,
    setStep,
    loopToStep2,
  } = useDocGenWizardStore()

  if (!isOpen) return null

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEP_DEFINITIONS.length - 1

  // Minimize is blocked during recording/transcription
  const canMinimize = !['recording', 'uploading', 'processing'].includes(transcriptionStatus)

  // Step 1 "Next" gating: transcription completed + patient selected
  const canAdvanceStep1 = transcriptionStatus === 'completed' && !!patientId && !!transcriptionId

  // Step 2 has its own "Create Document" button, no footer Next
  // Step 3 has its own "Save & Continue" button, no footer Next

  const handleMinimize = () => {
    if (canMinimize) {
      minimizeWizard()
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setStep(step)
    }
  }

  const handleCloseFromCompletion = () => {
    const lastDoc = createdDocuments[createdDocuments.length - 1]
    closeWizard()
    if (lastDoc) {
      navigate(`/documents/${lastDoc.type}/${lastDoc.id}/edit`)
    }
  }

  const stepperSteps = STEP_DEFINITIONS.map(s => ({
    id: s.id,
    title: t(`doc_gen_wizard.steps.${s.id}`, s.id),
  }))

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <AudioPatientStep />
      case 1:
        return <TemplateDocTypeStep />
      case 2:
        return <ReviewEditStep />
      case 3:
        return <CompletionStep />
      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleMinimize} disabled={!canMinimize}>
              {t('doc_gen_wizard.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(1)}
              disabled={!canAdvanceStep1 || !sessionId}
              className="flex items-center gap-1"
            >
              {t('doc_gen_wizard.next', 'Next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )
      case 1:
        return (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('doc_gen_wizard.back', 'Back')}
            </Button>
            <div />
          </div>
        )
      case 2:
        return (
          <div className="flex items-center justify-end w-full">
            <div />
          </div>
        )
      case 3:
        return (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="primary"
              onClick={loopToStep2}
              className="flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              {t('doc_gen_wizard.create_another', 'Create Another Document')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseFromCompletion}
            >
              {t('doc_gen_wizard.close_wizard', 'Close Wizard')}
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Stepper + Minimize */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <Stepper
              steps={stepperSteps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>
          <button
            onClick={handleMinimize}
            disabled={!canMinimize}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              canMinimize
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                : 'text-gray-200 cursor-not-allowed'
            }`}
            aria-label="Minimize"
            title={canMinimize ? undefined : t('doc_gen_wizard.minimize_blocked', 'Wait for transcription to finish')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {renderStepContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-3">
          {renderFooter()}
        </div>
      </div>
    </div>
  )
}
