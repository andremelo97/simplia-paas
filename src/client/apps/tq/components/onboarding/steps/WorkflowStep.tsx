import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  GitBranch,
  Mic,
  Users,
  FileText,
  FolderOpen,
  CheckCircle2,
  Layout,
  Mail,
  ArrowDown,
} from 'lucide-react'

export const WorkflowStep: React.FC = () => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Visual Workflow Diagram */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <GitBranch className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.workflow.title', 'Complete Workflow')}
          </h2>
        </div>

        <p className="text-base text-gray-600 leading-relaxed mb-6">
          {t(
            'onboarding.workflow.description',
            "Here's how all TQ features connect into a complete workflow, from recording audio to sharing documents with your patients."
          )}
        </p>

        {/* Workflow diagram with connecting arrows */}
        <div className="bg-gray-50 rounded-xl p-6">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B725B7] text-white flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {t('onboarding.workflow.step1', 'Record or upload audio')}
              </p>
              <p className="text-xs text-gray-500">
                {t('onboarding.workflow.step1_desc', 'Start a new session with your microphone or an audio file')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-5 py-1">
            <div className="w-px h-4 bg-gray-300" />
            <ArrowDown className="w-4 h-4 text-gray-300 -ml-2" />
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5ED6CE] text-white flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {t('onboarding.workflow.step2', 'Select or create patient')}
              </p>
              <p className="text-xs text-gray-500">
                {t('onboarding.workflow.step2_desc', 'Link the transcription to a patient record')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-5 py-1">
            <div className="w-px h-4 bg-gray-300" />
            <ArrowDown className="w-4 h-4 text-gray-300 -ml-2" />
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E91E63] text-white flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {t('onboarding.workflow.step3', 'Choose template & generate with AI')}
              </p>
              <p className="text-xs text-gray-500">
                {t('onboarding.workflow.step3_desc', 'AI fills the template using the transcription data')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-5 py-1">
            <div className="w-px h-4 bg-gray-300" />
            <ArrowDown className="w-4 h-4 text-gray-300 -ml-2" />
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {t('onboarding.workflow.step4', 'Review and edit your document')}
              </p>
              <p className="text-xs text-gray-500">
                {t('onboarding.workflow.step4_desc', 'Refine the AI-generated content to your standards')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-5 py-1">
            <div className="w-px h-4 bg-gray-300" />
            <ArrowDown className="w-4 h-4 text-gray-300 -ml-2" />
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {t('onboarding.workflow.step5', 'Share via landing page or email')}
              </p>
              <p className="text-xs text-gray-500">
                {t('onboarding.workflow.step5_desc', 'Create a public link or send the document directly')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - How Features Connect */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.workflow.connections_title', 'How Features Connect')}
        </h3>

        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Mic className="w-4 h-4 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_session', 'Session')}</span>
              <span className="text-gray-400">&rarr;</span>
              <Users className="w-4 h-4 text-[#5ED6CE]" />
              <span>{t('onboarding.workflow.label_patient', 'Patient')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('onboarding.workflow.connect_session_patient', 'Every session is linked to a patient, building their interaction history over time.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <FileText className="w-4 h-4 text-[#E91E63]" />
              <span>{t('onboarding.workflow.label_template', 'Template')}</span>
              <span className="text-gray-400">&rarr;</span>
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>{t('onboarding.workflow.label_document', 'Document')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('onboarding.workflow.connect_template_document', 'AI combines the template structure with transcription data to generate professional documents.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>{t('onboarding.workflow.label_document', 'Document')}</span>
              <span className="text-gray-400">&rarr;</span>
              <Layout className="w-4 h-4 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_landing', 'Landing Page')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('onboarding.workflow.connect_document_landing', 'Create a public landing page from any quote or prevention plan to share with patients.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Layout className="w-4 h-4 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_landing', 'Landing Page')}</span>
              <span className="text-gray-400">&rarr;</span>
              <Mail className="w-4 h-4 text-[#E91E63]" />
              <span>{t('onboarding.workflow.label_email', 'Email')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('onboarding.workflow.connect_landing_email', 'Send the landing page link to your patient via the built-in email system with customizable templates.')}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
