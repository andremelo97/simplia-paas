import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Stepper } from '@client/common/ui'
import { Button } from '@client/common/ui'
import { onboardingService } from '@client/common/services/onboardingService'
import { useAuthStore } from '../../shared/store/auth'
import { useOnboardingStore } from '../../shared/store/onboarding'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { WelcomeStep } from './steps/WelcomeStep'
import { SessionsStep } from './steps/SessionsStep'
import { PatientsStep } from './steps/PatientsStep'
import { TemplatesStep } from './steps/TemplatesStep'
import { DocumentsStep } from './steps/DocumentsStep'
import { LandingPagesStep } from './steps/LandingPagesStep'
import { WorkflowStep } from './steps/WorkflowStep'
import { FinalStep } from './steps/FinalStep'

const STEP_DEFINITIONS = [
  { id: 'welcome' },
  { id: 'sessions' },
  { id: 'patients' },
  { id: 'templates' },
  { id: 'documents' },
  { id: 'landing_pages' },
  { id: 'workflow' },
  { id: 'finish' },
]

export const TQOnboardingWizard: React.FC = () => {
  const { t } = useTranslation('tq')
  const { user } = useAuthStore()
  const {
    isWizardOpen, wasSkipped, currentStep,
    openWizard, closeWizard, skipWizard, setCurrentStep
  } = useOnboardingStore()

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user?.role !== 'admin') return
      if (wasSkipped) return

      try {
        const result = await onboardingService.needsOnboarding('tq')
        if (result.needsOnboarding) {
          openWizard()
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
      }
    }

    checkOnboarding()
  }, [user?.role, wasSkipped, openWizard])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEP_DEFINITIONS.length - 1

  const handleNext = async () => {
    if (isLastStep) {
      try {
        await onboardingService.complete('tq')
      } catch {
        // Complete anyway
      }
      closeWizard()
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  const handleSkip = async () => {
    try {
      await onboardingService.skip('tq')
      skipWizard()
    } catch {
      skipWizard()
    }
  }

  const handleClose = () => {
    closeWizard()
  }

  if (!isWizardOpen) return null

  const stepperSteps = STEP_DEFINITIONS.map(s => ({
    id: s.id,
    title: t(`onboarding.steps.${s.id}`, s.id),
  }))

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />
      case 1:
        return <SessionsStep />
      case 2:
        return <PatientsStep />
      case 3:
        return <TemplatesStep />
      case 4:
        return <DocumentsStep />
      case 5:
        return <LandingPagesStep />
      case 6:
        return <WorkflowStep />
      case 7:
        return <FinalStep />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Stepper + Close */}
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
            onClick={handleClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('onboarding.skip', 'Skip for now')}
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('onboarding.back', 'Back')}
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-1"
            >
              {isLastStep
                ? t('onboarding.complete_button', 'Complete')
                : t('onboarding.next', 'Next')
              }
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
