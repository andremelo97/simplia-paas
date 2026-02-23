import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Stepper, Button } from '@client/common/ui'
import { useDocGenWizardStore } from '../../shared/store/docGenWizard'
import { sessionsService } from '../../services/sessions'
import { ChevronLeft, X, Loader2, FilePlus, ChevronRight, Minimize2 } from 'lucide-react'
import { SessionSelectStep } from './steps/SessionSelectStep'
import { AudioPatientStep } from './steps/AudioPatientStep'
import { TemplateDocTypeStep } from './steps/TemplateDocTypeStep'
import { ReviewEditStep } from './steps/ReviewEditStep'
import { CompletionStep } from './steps/CompletionStep'

const STEP_DEFINITIONS = [
  { id: 'select_session' },
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
    isNewSession,
    transcriptionStatus,
    transcriptionId,
    patientId,
    sessionId,
    createdDocuments,
    minimizeWizard,
    closeWizard,
    setStep,
    setSession,
    loopToStep2,
  } = useDocGenWizardStore()

  const [isCreatingSession, setIsCreatingSession] = useState(false)

  if (!isOpen) return null

  // Minimize is blocked during recording/transcription
  const canMinimize = !['recording', 'uploading', 'processing'].includes(transcriptionStatus)

  // Step 1 gating: transcription completed + patient selected + transcription ID
  const canCreateSession = transcriptionStatus === 'completed' && !!patientId && !!transcriptionId
  const hasSession = !!sessionId

  const handleMinimize = () => {
    if (canMinimize) {
      minimizeWizard()
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      // If not a new session, skip step 1 (audio/patient)
      if (!isNewSession && step === 1) return
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

  const handleCreateSessionAndAdvance = async () => {
    if (!canCreateSession) return

    // If session already exists (e.g., after resume), just advance
    if (hasSession) {
      setStep(2)
      return
    }

    setIsCreatingSession(true)
    try {
      const session = await sessionsService.createSession({
        patient_id: patientId!,
        transcription_id: transcriptionId!,
      })
      setSession(session.id, session.number)
      setStep(2)
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const stepperSteps = STEP_DEFINITIONS.map(s => ({
    id: s.id,
    title: t(`doc_gen_wizard.steps.${s.id}`, s.id),
  }))

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <SessionSelectStep />
      case 1:
        return <AudioPatientStep />
      case 2:
        return <TemplateDocTypeStep />
      case 3:
        return <ReviewEditStep />
      case 4:
        return <CompletionStep />
      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 0:
        // Step 0: Select Session — no footer needed (actions are inline)
        return (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleMinimize} disabled={!canMinimize}>
              {t('doc_gen_wizard.cancel', 'Cancel')}
            </Button>
            <div />
          </div>
        )
      case 1:
        // Step 1: Audio & Patient — Back + Create Session & Continue
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
            {hasSession ? (
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                className="flex items-center gap-1"
              >
                {t('doc_gen_wizard.next', 'Next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCreateSessionAndAdvance}
                disabled={!canCreateSession || isCreatingSession}
                className="flex items-center gap-2"
              >
                {isCreatingSession && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('doc_gen_wizard.step1.create_session', 'Create Session & Continue')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      case 2:
        // Step 2: Template & Doc Type — Back + (create doc is inline)
        return (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setStep(isNewSession ? 1 : 0)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('doc_gen_wizard.back', 'Back')}
            </Button>
            <div />
          </div>
        )
      case 3:
        // Step 3: Review & Edit — no extra footer
        return (
          <div className="flex items-center justify-end w-full">
            <div />
          </div>
        )
      case 4:
        // Step 4: Completion — Create Another + Minimize + Close
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={minimizeWizard}
                className="flex items-center gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                {t('doc_gen_wizard.minimize', 'Minimize')}
              </Button>
              <Button
                variant="outline"
                onClick={handleCloseFromCompletion}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                {t('doc_gen_wizard.close_wizard', 'Close Wizard')}
              </Button>
            </div>
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
        <div className="px-6 py-3 flex items-center gap-4">
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
        <div className="px-8 py-6 h-full">
          {renderStepContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
        <div className="px-8 py-3">
          {renderFooter()}
        </div>
      </div>
    </div>
  )
}
