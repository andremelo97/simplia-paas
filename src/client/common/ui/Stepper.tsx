import React from 'react'
import { Check } from 'lucide-react'

export interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isClickable = onStepClick && index < currentStep

        return (
          <React.Fragment key={step.id}>
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-200
                  ${isCompleted
                    ? 'bg-[#B725B7] text-white cursor-pointer hover:bg-[#9a1f9a]'
                    : isCurrent
                      ? 'bg-[#B725B7] text-white ring-4 ring-[#B725B7]/20'
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={`
                  mt-2 text-xs font-medium max-w-[5rem] text-center
                  ${isCurrent ? 'text-[#B725B7]' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                `}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-12 h-0.5 mx-2 mt-[-1.25rem]
                  ${index < currentStep ? 'bg-[#B725B7]' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
