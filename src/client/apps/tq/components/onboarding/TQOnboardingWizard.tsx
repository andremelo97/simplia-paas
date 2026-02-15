import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { WizardModal, WizardStep } from '@client/common/ui'
import { onboardingService } from '@client/common/services/onboardingService'
import { useAuthStore } from '../../shared/store/auth'
import { useOnboardingStore } from '../../shared/store/onboarding'
import {
  Sparkles,
  Mic,
  FileText,
  ArrowRight,
  CheckCircle2,
  Users,
  Receipt,
  ClipboardList,
  Layout,
  Mail,
  Palette,
  ExternalLink,
  Rocket,
  Bot,
  Headphones
} from 'lucide-react'

export const TQOnboardingWizard: React.FC = () => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isWizardOpen, wasSkipped, currentStep, openWizard, closeWizard, closeWizardForNavigation, skipWizard, setCurrentStep } = useOnboardingStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkOnboarding = async () => {
      // Only check for admin users
      if (user?.role !== 'admin') {
        setIsLoading(false)
        return
      }

      // Don't show if already skipped
      if (wasSkipped) {
        setIsLoading(false)
        return
      }

      try {
        const result = await onboardingService.needsOnboarding('tq')
        if (result.needsOnboarding) {
          openWizard()
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboarding()
  }, [user?.role, wasSkipped, openWizard])

  const handleComplete = async () => {
    try {
      await onboardingService.complete('tq')
      closeWizard()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      closeWizard()
    }
  }

  const handleSkip = async () => {
    try {
      await onboardingService.skip('tq')
      skipWizard()
    } catch (error) {
      console.error('Failed to skip onboarding:', error)
      skipWizard()
    }
  }

  const handleClose = () => {
    closeWizard()
  }

  const goToPage = (path: string) => {
    closeWizardForNavigation()
    navigate(path)
  }

  if (isLoading || !isWizardOpen) return null

  const steps: WizardStep[] = [
    // Step 1: Welcome - Two column layout
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
                    {t('onboarding.welcome.title', 'Welcome to TQ!')}
                  </h3>
                  <p className="text-sm text-gray-500">Transcription & Quotes</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {t('onboarding.welcome.description',
                  'TQ helps you transcribe consultations, manage patients, and create professional quotes and clinical reports. Let\'s learn how it works!'
                )}
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-auto">
                <div className="flex items-start gap-2">
                  <Rocket className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {t('onboarding.welcome.ready_title', 'Ready to use!')}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {t('onboarding.welcome.ready_description', 'This quick tour will show you the main features. It takes about 2 minutes.')}
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
                  <Mic className="w-4 h-4 text-[#B725B7] flex-shrink-0" />
                  {t('onboarding.welcome.feature1', 'Record and transcribe consultations')}
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#5ED6CE] flex-shrink-0" />
                  {t('onboarding.welcome.feature2', 'Manage patient records')}
                </li>
                <li className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#E91E63] flex-shrink-0" />
                  {t('onboarding.welcome.feature3', 'Create quotes with AI assistance')}
                </li>
                <li className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#B725B7] flex-shrink-0" />
                  {t('onboarding.welcome.feature4', 'Generate clinical reports')}
                </li>
                <li className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[#E91E63] flex-shrink-0" />
                  {t('onboarding.welcome.feature5', 'Share documents with custom landing pages')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    // Step 2: Transcription
    {
      id: 'transcription',
      title: t('onboarding.steps.transcription', 'Transcription'),
      content: (
        <div className="py-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Mic className="w-6 h-6 text-[#B725B7]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.transcription.title', 'Audio Transcription')}
              </h3>
              <p className="text-gray-600">
                {t('onboarding.transcription.description',
                  'Record your consultations or upload audio files, and TQ will automatically transcribe them into text.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 mb-4">
            <h4 className="font-medium text-gray-900 mb-4">
              {t('onboarding.transcription.how_it_works', 'How it works:')}
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#B725B7] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('onboarding.transcription.step1_title', 'Start Recording')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('onboarding.transcription.step1_desc', 'Click "Start Transcribing" or upload an existing audio file.')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#B725B7] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('onboarding.transcription.step2_title', 'Automatic Transcription')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('onboarding.transcription.step2_desc', 'The audio is automatically converted to text.')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#B725B7] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('onboarding.transcription.step3_title', 'Create Session')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('onboarding.transcription.step3_desc', 'Link the transcription to a patient to create a session.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => goToPage('/new-session')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#B725B7] text-[#B725B7] rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Mic className="w-5 h-5" />
            {t('onboarding.transcription.try_now', 'Try Transcription Now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    // Step 3: Templates - With syntax instructions + AI Agent alternative
    {
      id: 'templates',
      title: t('onboarding.steps.templates', 'Templates'),
      content: (
        <div className="py-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-[#E91E63]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.templates.title', 'Document Templates')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('onboarding.templates.description',
                  'Templates are pre-made document structures that AI fills in automatically using your transcription data.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* Template Types */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">
                {t('onboarding.templates.types', 'Available templates:')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                  <Receipt className="w-4 h-4 text-[#E91E63]" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {t('onboarding.templates.quote', 'Quotes')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('onboarding.templates.quote_desc', 'Treatment proposals with pricing')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                  <ClipboardList className="w-4 h-4 text-[#B725B7]" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {t('onboarding.templates.report', 'Clinical Reports')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('onboarding.templates.report_desc', 'Medical documentation')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Syntax Guide */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">
                {t('onboarding.templates.syntax_title', 'Template Syntax:')}
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">[placeholder]</div>
                  <span className="text-gray-600">{t('onboarding.templates.syntax_placeholder', 'AI fills from transcription')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-mono">$variable$</div>
                  <span className="text-gray-600">{t('onboarding.templates.syntax_variable', 'System data (patient, date)')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">(instruction)</div>
                  <span className="text-gray-600">{t('onboarding.templates.syntax_instruction', 'AI guidance (removed in output)')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                {t('onboarding.templates.guide_hint', 'A complete guide is available on the template create/edit page.')}
              </p>
            </div>
          </div>

          {/* AI Agent Alternative */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {t('onboarding.templates.ai_agent_title', 'Or use the AI Agent')}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {t('onboarding.templates.ai_agent_description',
                    'Don\'t want to use templates? The AI Agent can create documents for you directly from the transcription. Just click this button in the session page:'
                  )}
                </p>
                {/* Visual representation of the button - exact copy from NewSession */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-[5px] text-sm font-medium cursor-default" style={{ fontFamily: 'Inter, sans-serif', height: '32px' }}>
                  <Bot className="w-4 h-4" />
                  {t('sessions.call_ai_agent', 'Call AI Agent')}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  {t('onboarding.templates.ai_agent_config_hint',
                    'You can customize the AI Agent\'s initial instructions in the configurations.'
                  )}
                </p>
                <button
                  onClick={() => goToPage('/configurations/ai-agent')}
                  className="mt-2 text-xs text-[#B725B7] hover:text-[#9a1f9a] font-medium flex items-center gap-1"
                >
                  {t('onboarding.templates.configure_ai_agent', 'Configure AI Agent')}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => goToPage('/templates')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E91E63] text-[#E91E63] rounded-lg hover:bg-pink-50 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            {t('onboarding.templates.view_templates', 'View Templates')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    // Step 4: Landing Page Templates (Public Quotes)
    {
      id: 'landing-pages',
      title: t('onboarding.steps.landing_pages', 'LP'),
      content: (
        <div className="py-4">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Layout className="w-6 h-6 text-[#B725B7]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.landing_pages.title', 'Landing Pages')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('onboarding.landing_pages.description',
                  'Create beautiful landing pages to share documents with your patients. They can view details without needing to log in.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-5">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">
              {t('onboarding.landing_pages.features_title', 'Features:')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {t('onboarding.landing_pages.feature1', 'Drag-and-drop page builder')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {t('onboarding.landing_pages.feature2', 'Custom branding and colors')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {t('onboarding.landing_pages.feature3', 'Password protection')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {t('onboarding.landing_pages.feature4', 'Shareable links via email')}
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-sm text-amber-800">
              {t('onboarding.landing_pages.hint',
                'This is an advanced feature. You can create up to 3 templates and customize them with the visual editor.'
              )}
            </p>
          </div>

          <button
            onClick={() => goToPage('/landing-pages/templates')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#B725B7] text-[#B725B7] rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Layout className="w-5 h-5" />
            {t('onboarding.landing_pages.view_templates', 'View Landing Page Templates')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    // Step 5: Email Configuration (from Hub)
    {
      id: 'email-config',
      title: t('onboarding.steps.email_config', 'Email'),
      content: (
        <div className="py-4">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-[#E91E63]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('onboarding.email_config.title', 'Email Template')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('onboarding.email_config.description',
                  'Customize the email template used when sending documents to patients. Add your logo, colors, and contact information.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 text-sm">
                {t('onboarding.email_config.customize_title', 'You can customize:')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#B725B7] flex-shrink-0" />
                  {t('onboarding.email_config.customize1', 'Header and button colors')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.email_config.customize2', 'Company logo')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.email_config.customize3', 'Contact information')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('onboarding.email_config.customize4', 'Social media links')}
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {t('onboarding.email_config.hub_note_title', 'Branding from Hub')}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('onboarding.email_config.hub_note_description',
                      'Logo and brand colors are configured in Hub. The email template will use those settings automatically.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => goToPage('/configurations/email-template')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E91E63] text-[#E91E63] rounded-lg hover:bg-pink-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            {t('onboarding.email_config.configure_now', 'Configure Email Template')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )
    },
    // Step 6: Workflow
    {
      id: 'workflow',
      title: t('onboarding.steps.workflow', 'Workflow'),
      content: (
        <div className="py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
            {t('onboarding.workflow.title', 'Complete Workflow')}
          </h3>
          <p className="text-gray-600 text-center mb-5 text-sm">
            {t('onboarding.workflow.description', 'Here\'s how everything connects:')}
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#B725B7] text-white flex items-center justify-center flex-shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {t('onboarding.workflow.step1', 'Record or upload audio')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-4 p-3 bg-cyan-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#5ED6CE] text-white flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {t('onboarding.workflow.step2', 'Select or create patient')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-4 p-3 bg-pink-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#E91E63] text-white flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {t('onboarding.workflow.step3', 'Choose template & let AI fill it')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {t('onboarding.workflow.step4', 'Review, edit & send to patient')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Step 7: Complete
    {
      id: 'complete',
      title: t('onboarding.steps.complete', 'Ready!'),
      content: (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('onboarding.complete.title', 'You\'re Ready!')}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4 text-sm">
            {t('onboarding.complete.description',
              'You now know the basics of TQ. Start by creating your first transcription or adding patients.'
            )}
          </p>

          {/* Support */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5ED6CE]/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-[#5ED6CE]" />
              </div>
              <div className="text-left">
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
              onClick={() => {
                handleComplete()
                navigate('/new-session')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#B725B7] text-white rounded-md hover:bg-[#9a1f9a] transition-colors"
            >
              <Mic className="w-4 h-4" />
              {t('onboarding.complete.start_transcription', 'Start Transcription')}
            </button>
            <button
              onClick={() => {
                handleComplete()
                navigate('/patients')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              {t('onboarding.complete.add_patient', 'Add Patient')}
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
      title={t('onboarding.title', 'Get Started with TQ')}
      skipLabel={t('onboarding.skip', 'Skip for now')}
      backLabel={t('onboarding.back', 'Back')}
      nextLabel={t('onboarding.next', 'Next')}
      completeLabel={t('onboarding.complete_button', 'Complete')}
      initialStep={currentStep}
      onStepChange={setCurrentStep}
    />
  )
}
