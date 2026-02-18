import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { WizardModal, WizardStep } from '@client/common/ui'
import { onboardingService } from '@client/common/services/onboardingService'
import { useAuthStore } from '../../store/auth'
import { useOnboardingStore } from '../../store/onboarding'
import {
  Sparkles,
  Palette,
  Mail,
  CheckCircle2,
  ArrowRight,
  Settings,
  Rocket,
  Headphones,
  ShoppingBag
} from 'lucide-react'

export const HubOnboardingWizard: React.FC = () => {
  const { t } = useTranslation('hub')
  const navigate = useNavigate()
  const { user, tenantName } = useAuthStore()
  const { isWizardOpen, wasSkipped, currentStep, openWizard, closeWizard, closeWizardForNavigation, skipWizard, setCurrentStep } = useOnboardingStore()

  useEffect(() => {
    const checkOnboarding = async () => {
      // Only check for admin users
      if (user?.role !== 'admin') {
        return
      }

      // Don't show if already skipped
      if (wasSkipped) {
        return
      }

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

  const handleComplete = async () => {
    try {
      await onboardingService.complete('hub')
      closeWizard()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      closeWizard()
    }
  }

  const handleSkip = async () => {
    try {
      await onboardingService.skip('hub')
      skipWizard()
    } catch (error) {
      console.error('Failed to skip onboarding:', error)
      skipWizard()
    }
  }

  const handleClose = () => {
    closeWizard()
  }

  const goToConfiguration = (path: string) => {
    closeWizardForNavigation()
    navigate(path)
  }

  if (!isWizardOpen) return null

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.steps.welcome', 'Welcome'),
      content: (
        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Welcome */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('onboarding.welcome.title', 'Welcome to Hub!')}
                  </h3>
                  <p className="text-sm text-gray-500">{tenantName}</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {t('onboarding.welcome.intro', 'Hub is your central management portal. From here you can access all your applications, configure your organization settings, and manage your team.')}
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-auto">
                <div className="flex items-start gap-2">
                  <Rocket className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {t('onboarding.welcome.ready_title', 'All set! You can start using it right away.')}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {t('onboarding.welcome.ready_description', 'Your system is 100% functional. The following settings are optional — use them to customize the system with your brand.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                {t('onboarding.welcome.features_title', 'What you can do:')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.welcome.feature1', 'Access all your licensed applications')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.welcome.feature2', 'Customize branding with your logo and colors')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.welcome.feature3', 'Configure email settings for notifications')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.welcome.feature4', 'Monitor transcription usage and quotas')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.welcome.feature5', 'Browse and import templates from the Marketplace')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'branding',
      title: t('onboarding.steps.branding', 'Branding'),
      content: (
        <div className="py-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Palette className="w-6 h-6 text-[#B725B7]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.branding.title', 'Customize Your Brand')}
              </h3>
              <p className="text-gray-600">
                {t('onboarding.branding.description',
                  'Upload your company logo and set your brand colors. This will be displayed on public quotes and reports sent to your clients.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('onboarding.branding.features', 'You can configure:')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.branding.feature1', 'Company logo and brand colors')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.branding.feature2', 'Company name, phone and address')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.branding.feature3', 'Social media links (WhatsApp, Instagram, etc.)')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.branding.feature4', 'Background video for public pages')}
              </li>
            </ul>
          </div>

          <button
            onClick={() => goToConfiguration('/configurations')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#B725B7] text-[#B725B7] rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            {t('onboarding.branding.configure_now', 'Configure Branding Now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    {
      id: 'communication',
      title: t('onboarding.steps.communication', 'Email'),
      content: (
        <div className="py-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-[#E91E63]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.communication.title', 'Email Configuration')}
              </h3>
              <p className="text-gray-600">
                {t('onboarding.communication.description',
                  'Set up your SMTP server to send emails to clients. This allows you to send quotes and reports directly from the system.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('onboarding.communication.features', 'Email features:')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.communication.feature1', 'Send quotes via email')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.communication.feature3', 'Custom sender name and email')}
              </li>
            </ul>
          </div>

          <button
            onClick={() => goToConfiguration('/configurations/communication')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E91E63] text-[#E91E63] rounded-lg hover:bg-pink-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            {t('onboarding.communication.configure_now', 'Configure Email Now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    {
      id: 'marketplace',
      title: t('onboarding.steps.marketplace', 'Marketplace'),
      content: (
        <div className="py-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#5ED6CE]/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6 text-[#5ED6CE]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.marketplace.title', 'Template Marketplace')}
              </h3>
              <p className="text-gray-600">
                {t('onboarding.marketplace.description',
                  'Browse curated templates by medical specialty and import them to your TQ with one click. Start with ready-made templates and customize them to your needs.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('onboarding.marketplace.features', 'Available in the Marketplace:')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.marketplace.feature1', 'Clinical document templates by specialty')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.marketplace.feature2', 'Landing page templates for public quotes')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.marketplace.feature3', 'Filter by specialty: General, Dentistry, Nutrition')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('onboarding.marketplace.feature4', 'Preview before importing to your TQ')}
              </li>
            </ul>
          </div>

          <button
            onClick={() => goToConfiguration('/marketplace')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#5ED6CE] text-[#5ED6CE] rounded-lg hover:bg-teal-50 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {t('onboarding.marketplace.browse_now', 'Browse Marketplace Now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    {
      id: 'complete',
      title: t('onboarding.steps.complete', 'Ready!'),
      content: (
        <div className="py-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('onboarding.complete.title', 'You\'re All Set!')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('onboarding.complete.description',
                'Your Hub is ready to use. You can always access these settings from the Configurations menu in the sidebar.'
              )}
            </p>
          </div>

          {/* How to access TQ */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#B725B7]" />
              {t('onboarding.complete.access_tq_title', 'How to access TQ')}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {t('onboarding.complete.access_tq_description',
                'On the home page, you\'ll see application cards at the top. Click on the TQ card to open the application.'
              )}
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {t('onboarding.complete.access_tq_feature1', 'Login is automatic — no need to enter credentials again')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {t('onboarding.complete.access_tq_feature2', 'TQ opens in a new tab, ready to use')}
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5ED6CE]/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-[#5ED6CE]" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  {t('onboarding.complete.support_title', 'Need help?')}
                </h4>
                <p className="text-xs text-gray-600">
                  {t('onboarding.complete.support_description', 'Click the support icon in the top menu to contact us anytime.')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => goToConfiguration('/configurations')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t('onboarding.complete.go_settings', 'Go to Settings')}
            </button>
            <button
              onClick={() => {
                handleComplete()
                navigate('/')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#B725B7] text-white rounded-md hover:bg-[#9a1f9a] transition-colors"
            >
              {t('onboarding.complete.go_home', 'Go to Home')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }
  ]

  return (
    <WizardModal
      open={isWizardOpen}
      onClose={handleClose}
      onComplete={handleComplete}
      onSkip={handleSkip}
      steps={steps}
      title={t('onboarding.title', 'Get Started with Hub')}
      skipLabel={t('onboarding.skip', 'Skip for now')}
      backLabel={t('onboarding.back', 'Back')}
      nextLabel={t('onboarding.next', 'Next')}
      completeLabel={t('onboarding.complete_button', 'Complete')}
      initialStep={currentStep}
      onStepChange={setCurrentStep}
    />
  )
}
