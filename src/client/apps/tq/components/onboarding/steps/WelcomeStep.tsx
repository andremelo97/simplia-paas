import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Rocket,
  CheckCircle2,
  Play,
  Mic,
  Users,
  FileText,
  FolderOpen,
  Layout,
  GitBranch,
} from 'lucide-react'

export const WelcomeStep: React.FC = () => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Welcome */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.welcome.title', 'Welcome to TQ!')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.welcome.description',
            'TQ helps you transcribe consultations, manage patients, and create professional documents (quotes, clinical notes, prevention plans) with AI assistance.'
          )}
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-auto">
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {t('onboarding.welcome.ready_title', 'Ready to use!')}
              </p>
              <p className="text-sm text-green-700 mt-0.5">
                {t(
                  'onboarding.welcome.ready_description',
                  'The system is 100% functional with default settings. This tour will show you the main features and how they connect.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - What you'll learn + video */}
      <div className="flex flex-col gap-5">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            {t('onboarding.welcome.learn_title', "What you'll learn:")}
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm text-gray-600">
                {t(
                  'onboarding.welcome.learn_sessions',
                  'Sessions — Record and transcribe consultations'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-teal-500" />
              </div>
              <span className="text-sm text-gray-600">
                {t(
                  'onboarding.welcome.learn_patients',
                  'Patients — Manage records and history'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-pink-500" />
              </div>
              <span className="text-sm text-gray-600">
                {t(
                  'onboarding.welcome.learn_templates',
                  'Templates — Pre-made document structures'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">
                {t(
                  'onboarding.welcome.learn_documents',
                  'Documents — Quotes, clinical notes, and prevention plans'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Layout className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm text-gray-600">
                {t(
                  'onboarding.welcome.learn_landing_pages',
                  'Landing Pages — Share documents publicly'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-gray-600/10 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600">
                {t(
                  'onboarding.welcome.learn_workflow',
                  'Workflow — How everything connects'
                )}
              </span>
            </li>
          </ul>
        </div>

        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mt-6">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t(
              'onboarding.welcome.video_placeholder',
              'Tutorial video coming soon'
            )}
          </p>
        </div>
      </div>
    </>
  )
}
