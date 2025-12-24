import React, { useState, useEffect } from 'react'
import { Stepper, Step } from './Stepper'
import { Button } from './Button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface WizardStep extends Step {
  content: React.ReactNode
  canProceed?: boolean | (() => boolean)
}

interface WizardModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  onSkip: () => void
  steps: WizardStep[]
  title: string
  skipLabel?: string
  backLabel?: string
  nextLabel?: string
  completeLabel?: string
  initialStep?: number
  onStepChange?: (step: number) => void
}

export const WizardModal: React.FC<WizardModalProps> = ({
  open,
  onClose,
  onComplete,
  onSkip,
  steps,
  title,
  skipLabel = 'Skip',
  backLabel = 'Back',
  nextLabel = 'Next',
  completeLabel = 'Complete',
  initialStep = 0,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep)

  // Sync with initialStep when wizard opens
  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep)
    }
  }, [open, initialStep])

  if (!open) return null

  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const canProceed = () => {
    if (currentStepData.canProceed === undefined) return true
    if (typeof currentStepData.canProceed === 'function') {
      return currentStepData.canProceed()
    }
    return currentStepData.canProceed
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
      onStepChange?.(step)
    }
  }

  const handleSkip = () => {
    onSkip()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-[#B725B7] to-[#E91E63] px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <Stepper
            steps={steps.map(s => ({ id: s.id, title: s.title, description: s.description }))}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {skipLabel}
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-1"
            >
              {isLastStep ? completeLabel : nextLabel}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
