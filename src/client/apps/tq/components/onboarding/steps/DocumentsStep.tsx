import React from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Mic, FileText, Receipt, ClipboardList, ShieldCheck, Package, Play, ArrowRight } from 'lucide-react'

interface DocumentsStepProps {
  onNavigate: (path: string) => void
}

export const DocumentsStep: React.FC<DocumentsStepProps> = ({ onNavigate }) => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Documents overview */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.documents.title', 'Documents')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.documents.description',
            'When you combine a transcription with a template, TQ generates a document using AI. Each document type serves a different purpose in your practice.'
          )}
        </p>

        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-lg py-4 px-5 mb-6">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-purple-200 text-sm">
              <Mic className="w-4 h-4 text-[#B725B7]" />
              <span className="font-medium text-gray-700">
                {t('onboarding.documents.flow_transcription', 'Transcription')}
              </span>
            </div>
            <span className="text-gray-400 font-bold text-lg">+</span>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-pink-200 text-sm">
              <FileText className="w-4 h-4 text-[#E91E63]" />
              <span className="font-medium text-gray-700">
                {t('onboarding.documents.flow_template', 'Template')}
              </span>
            </div>
            <span className="text-gray-400 font-bold text-lg">=</span>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-blue-200 text-sm">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-700">
                {t('onboarding.documents.flow_document', 'Document')}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {t(
              'onboarding.documents.flow_explanation',
              'AI analyzes your transcription and fills in the template to create a professional document in seconds.'
            )}
          </p>
        </div>

        {/* Video placeholder */}
        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mb-4">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.documents.video_placeholder', 'See how it works')}
          </p>
        </div>

        {/* Navigate button */}
        <button
          onClick={() => onNavigate('/documents/quotes')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          <FolderOpen className="w-4 h-4" />
          {t('onboarding.documents.go_to', 'Go to Documents')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right Column - Document Types */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.documents.types_title', 'Document Types')}
        </h3>

        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-[#E91E63] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {t('onboarding.documents.type_quote', 'Quotes')}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    'onboarding.documents.type_quote_desc',
                    'Treatment proposals with pricing. Add line items, set quantities and prices.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-[#B725B7] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {t('onboarding.documents.type_clinical_note', 'Clinical Notes')}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    'onboarding.documents.type_clinical_note_desc',
                    'Detailed consultation documentation for medical records. Supports rich text formatting, can be printed or exported as PDF.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {t('onboarding.documents.type_prevention', 'Prevention Plans')}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    'onboarding.documents.type_prevention_desc',
                    'Preventive care plans with personalized recommendations. Share with patients via landing pages for easy access.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {t('onboarding.documents.type_items', 'Items Catalog')}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    'onboarding.documents.type_items_desc',
                    'Reusable catalog of line items (treatments, procedures, products) with preset prices. Add items to any quote with one click.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
