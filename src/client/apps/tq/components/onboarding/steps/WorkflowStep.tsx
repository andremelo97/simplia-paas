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
  MessageCircle,
  Wand2,
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

        <p className="text-lg text-gray-600 leading-relaxed mb-8">
          {t(
            'onboarding.workflow.description',
            "Here's how all TQ features connect into a complete workflow, from recording audio to sharing documents with your patients."
          )}
        </p>

        {/* Workflow diagram with connecting arrows */}
        <div className="bg-gray-50 rounded-xl p-8">
          {/* Step 1 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#B725B7] text-white flex items-center justify-center flex-shrink-0">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-base">
                {t('onboarding.workflow.step1', 'Record or upload audio')}
              </p>
              <p className="text-sm text-gray-500">
                {t('onboarding.workflow.step1_desc', 'Start a new session with your microphone or an audio file')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-6 py-1.5">
            <div className="w-px h-5 bg-gray-300" />
            <ArrowDown className="w-5 h-5 text-gray-300 -ml-2.5" />
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#5ED6CE] text-white flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-base">
                {t('onboarding.workflow.step2', 'Select or create patient')}
              </p>
              <p className="text-sm text-gray-500">
                {t('onboarding.workflow.step2_desc', 'Link the transcription to a patient record')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-6 py-1.5">
            <div className="w-px h-5 bg-gray-300" />
            <ArrowDown className="w-5 h-5 text-gray-300 -ml-2.5" />
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E91E63] text-white flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-base">
                {t('onboarding.workflow.step3', 'Choose template & generate with AI')}
              </p>
              <p className="text-sm text-gray-500">
                {t('onboarding.workflow.step3_desc', 'AI fills the template using the transcription data')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-6 py-1.5">
            <div className="w-px h-5 bg-gray-300" />
            <ArrowDown className="w-5 h-5 text-gray-300 -ml-2.5" />
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-base">
                {t('onboarding.workflow.step4', 'Review and edit your document')}
              </p>
              <p className="text-sm text-gray-500">
                {t('onboarding.workflow.step4_desc', 'Refine the AI-generated content to your standards')}
              </p>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center ml-6 py-1.5">
            <div className="w-px h-5 bg-gray-300" />
            <ArrowDown className="w-5 h-5 text-gray-300 -ml-2.5" />
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-base">
                {t('onboarding.workflow.step5', 'Share via email or WhatsApp')}
              </p>
              <p className="text-sm text-gray-500">
                {t('onboarding.workflow.step5_desc', 'Send the document directly to the patient via email or WhatsApp')}
              </p>
            </div>
          </div>
        </div>

        {/* Wizard shortcut tip */}
        <div className="mt-6 bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}>
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t('onboarding.workflow.wizard_tip_title', 'Want a faster way?')}
              </p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {t('onboarding.workflow.wizard_tip_description', 'The Document Wizard combines all these steps into a single guided flow. You can open it from the "Generate Document" button in the sidebar or from the quick action on the home page.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - How Features Connect */}
      <div className="flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-5">
          {t('onboarding.workflow.connections_title', 'How Features Connect')}
        </h3>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900">
              <Mic className="w-5 h-5 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_transcription', 'Transcription')}</span>
              <span className="text-gray-400 font-bold">+</span>
              <Users className="w-5 h-5 text-[#5ED6CE]" />
              <span>{t('onboarding.workflow.label_patient', 'Patient')}</span>
              <span className="text-gray-400 font-bold">=</span>
              <Mic className="w-5 h-5 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_session', 'Session')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t('onboarding.workflow.connect_transcription_session', 'A transcription linked to a patient creates a session — the starting point for all documents.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900">
              <Mic className="w-5 h-5 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_session', 'Session')}</span>
              <span className="text-gray-400">&rarr;</span>
              <Users className="w-5 h-5 text-[#5ED6CE]" />
              <span>{t('onboarding.workflow.label_patient', 'Patient')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t('onboarding.workflow.connect_session_patient', 'Every session is linked to a patient, building their interaction history over time.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900">
              <FileText className="w-5 h-5 text-[#E91E63]" />
              <span>{t('onboarding.workflow.label_template', 'Template')}</span>
              <span className="text-gray-400">&rarr;</span>
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <span>{t('onboarding.workflow.label_document', 'Document')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t('onboarding.workflow.connect_template_document', 'AI combines the template structure with transcription data to generate professional documents.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <span>{t('onboarding.workflow.label_document', 'Document')}</span>
              <span className="text-gray-400">&rarr;</span>
              <Layout className="w-5 h-5 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_landing', 'Landing Page')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t('onboarding.workflow.connect_document_landing', 'Create a public landing page from any quote or prevention plan to share with patients.')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900 flex-wrap">
              <Layout className="w-5 h-5 text-[#B725B7]" />
              <span>{t('onboarding.workflow.label_landing', 'Landing Page')}</span>
              <span className="text-gray-400">&rarr;</span>
              <Mail className="w-5 h-5 text-[#E91E63]" />
              <span>{t('onboarding.workflow.label_email', 'Email')}</span>
              <span className="text-gray-400">/</span>
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span>{t('onboarding.workflow.label_whatsapp', 'WhatsApp')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t('onboarding.workflow.connect_landing_email', 'Send the landing page link to your patient via the built-in email system or WhatsApp with customizable templates.')}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
