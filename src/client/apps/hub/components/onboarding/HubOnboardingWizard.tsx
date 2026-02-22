import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Stepper } from '@client/common/ui'
import { Button } from '@client/common/ui'
import { onboardingService } from '@client/common/services/onboardingService'
import { brandingService, BrandingData } from '../../services/brandingService'
import { useAuthStore } from '../../store/auth'
import { useOnboardingStore } from '../../store/onboarding'
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'
import { WelcomeStep } from './steps/WelcomeStep'
import { LogoUploadStep } from './steps/LogoUploadStep'
import { BrandColorsStep } from './steps/BrandColorsStep'
import { CompanyInfoStep } from './steps/CompanyInfoStep'
import { MediaLibraryStep } from './steps/MediaLibraryStep'
import { FinalStep } from './steps/FinalStep'

const STEP_DEFINITIONS = [
  { id: 'welcome', requiresSave: false },
  { id: 'logo', requiresSave: true },
  { id: 'colors', requiresSave: true },
  { id: 'company', requiresSave: true },
  { id: 'media', requiresSave: false },
  { id: 'finish', requiresSave: false },
]

export const HubOnboardingWizard: React.FC = () => {
  const { t } = useTranslation('hub')
  const navigate = useNavigate()
  const { user, tenantName } = useAuthStore()
  const {
    isWizardOpen, wasSkipped, currentStep, isSaving,
    openWizard, closeWizard, closeWizardForNavigation, skipWizard,
    setCurrentStep, setSaving
  } = useOnboardingStore()

  const [branding, setBranding] = useState<BrandingData>({
    tenantId: 0,
    primaryColor: '',
    secondaryColor: '',
    tertiaryColor: '',
    logoUrl: null,
    companyName: null,
    email: null,
    phone: null,
    address: null,
    socialLinks: {}
  })
  const [loading, setLoading] = useState(false)

  // Check if onboarding is needed on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user?.role !== 'admin') return
      if (wasSkipped) return

      try {
        const result = await onboardingService.needsOnboarding('hub')
        if (result.needsOnboarding) {
          openWizard()
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
      }
    }

    checkOnboarding()
  }, [user?.role, wasSkipped, openWizard])

  // Load branding when wizard opens
  useEffect(() => {
    if (!isWizardOpen) return

    const loadBranding = async () => {
      setLoading(true)
      try {
        const data = await brandingService.getBranding()
        if (data) setBranding(data)
      } catch {
        // Keep defaults
      } finally {
        setLoading(false)
      }
    }

    loadBranding()
  }, [isWizardOpen])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEP_DEFINITIONS.length - 1
  const currentStepDef = STEP_DEFINITIONS[currentStep]

  const saveBranding = async () => {
    setSaving(true)
    try {
      await brandingService.updateBranding(branding)
    } catch (error) {
      console.error('Failed to save branding:', error)
      // Fail-open: continue anyway
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (isLastStep) {
      // Save any pending branding, then complete
      if (currentStepDef.requiresSave) await saveBranding()
      try {
        await onboardingService.complete('hub')
      } catch {
        // Complete anyway
      }
      closeWizard()
      navigate('/')
      return
    }

    // Auto-save branding for form steps
    if (currentStepDef.requiresSave) await saveBranding()

    const newStep = currentStep + 1
    setCurrentStep(newStep)
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
      await onboardingService.skip('hub')
      skipWizard()
    } catch {
      skipWizard()
    }
  }

  const handleClose = () => {
    closeWizard()
  }

  const handleNavigateAway = (path: string) => {
    closeWizardForNavigation()
    navigate(path)
  }

  if (!isWizardOpen) return null

  const stepperSteps = STEP_DEFINITIONS.map(s => ({
    id: s.id,
    title: t(`onboarding.steps.${s.id}`, s.id),
  }))

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="col-span-2 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#B725B7]" />
        </div>
      )
    }

    switch (currentStep) {
      case 0:
        return <WelcomeStep tenantName={tenantName || ''} />
      case 1:
        return <LogoUploadStep branding={branding} setBranding={setBranding} />
      case 2:
        return <BrandColorsStep branding={branding} setBranding={setBranding} />
      case 3:
        return <CompanyInfoStep branding={branding} setBranding={setBranding} />
      case 4:
        return <MediaLibraryStep />
      case 5:
        return <FinalStep branding={branding} onNavigate={handleNavigateAway} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="bg-gradient-to-r from-[#B725B7] to-[#E91E63] px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <h2 className="text-lg font-bold text-white">
              {t('onboarding.title', 'Get Started with Hub')}
            </h2>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="max-w-6xl mx-auto">
            <Stepper
              steps={stepperSteps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('onboarding.skip', 'Skip for now')}
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('onboarding.back', 'Back')}
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLastStep
                ? t('onboarding.complete_button', 'Complete')
                : t('onboarding.next', 'Next')
              }
              {!isLastStep && !isSaving && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
