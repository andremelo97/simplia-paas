import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  User,
  FileText,
  Clock,
  Search,
  ArrowRight,
  History,
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
        <div className="bg-[#5ED6CE]/10 border border-[#5ED6CE]/30 rounded-lg p-4 mb-4">
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

        {/* Navigate button */}
        <button
          onClick={() => onNavigate('/patients')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#5ED6CE] text-[#5ED6CE] rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
        >
          <Users className="w-4 h-4" />
          {t('onboarding.patients.go_to', 'Go to Patients')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right Column - Patient Timeline with image */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {t('onboarding.patients.timeline_title', 'Patient Timeline')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t(
            'onboarding.patients.timeline_desc',
            'Each patient has a detailed timeline showing all related data:'
          )}
        </p>

        {/* History icon hint */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <History className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm text-gray-700 font-medium">
            {t(
              'onboarding.patients.history_icon_hint',
              'Click this icon on any patient row to open their timeline'
            )}
          </p>
        </div>

        {/* Patient history image */}
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mb-4">
          <img
            src="/imgs/patient-history.png"
            alt={t('onboarding.patients.timeline_title', 'Patient Timeline')}
            className="w-full h-auto"
          />
        </div>

        {/* Info tip */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <History className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              {t(
                'onboarding.patients.info_tip_extended',
                'The timeline is also available inside each patient\'s edit page. Click the history icon on any patient row in the list, or open the patient and access it from there.'
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
