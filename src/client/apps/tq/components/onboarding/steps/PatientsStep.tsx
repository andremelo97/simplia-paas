import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  User,
  FileText,
  Clock,
  Search,
  Mic,
  Receipt,
  ClipboardList,
  ShieldCheck,
  Layout,
  BarChart3,
  Info,
  Play,
  ArrowRight,
} from 'lucide-react'

interface PatientsStepProps {
  onNavigate: (path: string) => void
}

export const PatientsStep: React.FC<PatientsStepProps> = ({ onNavigate }) => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Explanation */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.patients.title', 'Patients')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.patients.description',
            'Patients are the central hub of TQ. Every session, document, and landing page is linked to a patient, creating a complete history of interactions.'
          )}
        </p>

        {/* What you can store */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {t('onboarding.patients.store_title', 'What you can store:')}
          </h4>
          <div className="bg-white border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t('onboarding.patients.store_contact', 'Name, email, phone number')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t('onboarding.patients.store_notes', 'Notes and observations')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t('onboarding.patients.store_history', 'Complete interaction history')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Search callout */}
        <div className="bg-[#5ED6CE]/10 border border-[#5ED6CE]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-[#5ED6CE] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t('onboarding.patients.search_title', 'Quick Search')}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {t(
                  'onboarding.patients.search_desc',
                  'Use the search bar to find patients instantly by name, email, or phone number.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Patient Timeline */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.patients.timeline_title', 'Patient Timeline')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t(
            'onboarding.patients.timeline_desc',
            'Each patient has a detailed timeline showing all related data:'
          )}
        </p>

        {/* Tab cards grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <Mic className="w-5 h-5 text-purple-600 mb-1" />
            <p className="text-sm font-medium text-gray-900">
              {t('onboarding.patients.tab_sessions', 'Sessions')}
            </p>
            <p className="text-xs text-gray-500">
              {t('onboarding.patients.tab_sessions_desc', 'Audio recordings and transcriptions')}
            </p>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <Receipt className="w-5 h-5 text-pink-600 mb-1" />
            <p className="text-sm font-medium text-gray-900">
              {t('onboarding.patients.tab_quotes', 'Quotes')}
            </p>
            <p className="text-xs text-gray-500">
              {t('onboarding.patients.tab_quotes_desc', 'Treatment proposals with pricing')}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <ClipboardList className="w-5 h-5 text-purple-600 mb-1" />
            <p className="text-sm font-medium text-gray-900">
              {t('onboarding.patients.tab_clinical_notes', 'Clinical Notes')}
            </p>
            <p className="text-xs text-gray-500">
              {t('onboarding.patients.tab_clinical_notes_desc', 'Consultation documentation')}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <ShieldCheck className="w-5 h-5 text-green-600 mb-1" />
            <p className="text-sm font-medium text-gray-900">
              {t('onboarding.patients.tab_prevention', 'Prevention')}
            </p>
            <p className="text-xs text-gray-500">
              {t('onboarding.patients.tab_prevention_desc', 'Preventive care plans')}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Layout className="w-5 h-5 text-blue-600 mb-1" />
            <p className="text-sm font-medium text-gray-900">
              {t('onboarding.patients.tab_landing_pages', 'Landing Pages')}
            </p>
            <p className="text-xs text-gray-500">
              {t('onboarding.patients.tab_landing_pages_desc', 'Shared document links')}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <BarChart3 className="w-5 h-5 text-amber-600 mb-1" />
            <p className="text-sm font-medium text-gray-900">
              {t('onboarding.patients.tab_metrics', 'Metrics')}
            </p>
            <p className="text-xs text-gray-500">
              {t('onboarding.patients.tab_metrics_desc', 'Summary counts and statistics')}
            </p>
          </div>
        </div>

        {/* Info tip */}
        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              {t(
                'onboarding.patients.info_tip',
                'Everything in one place — click on any patient to see their complete history across all features.'
              )}
            </p>
          </div>
        </div>

        {/* Video placeholder */}
        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mt-4">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.patients.video_placeholder', 'See how it works')}
          </p>
        </div>

        {/* Navigate button */}
        <button
          onClick={() => onNavigate('/patients')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#5ED6CE] text-[#5ED6CE] rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium mt-4"
        >
          <Users className="w-4 h-4" />
          {t('onboarding.patients.go_to', 'Go to Patients')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}
