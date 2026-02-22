import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Receipt,
  ClipboardList,
  ShieldCheck,
  ShoppingBag,
  Play,
  ArrowRight,
} from 'lucide-react'

interface TemplatesStepProps {
  onNavigate: (path: string) => void
}

export const TemplatesStep: React.FC<TemplatesStepProps> = ({ onNavigate }) => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Explanation */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.templates.title', 'Templates')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.templates.description',
            'Templates are pre-made document structures that AI fills in automatically using your transcription data. Create once, reuse with every patient.'
          )}
        </p>

        {/* Template type mini-cards */}
        <div className="space-y-3">
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.templates.type_quote', 'Quotes')}
                </p>
                <p className="text-xs text-gray-500">
                  {t(
                    'onboarding.templates.type_quote_desc',
                    'Treatment proposals with pricing tables. AI generates itemized quotes from your transcription.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.templates.type_clinical_note', 'Clinical Notes')}
                </p>
                <p className="text-xs text-gray-500">
                  {t(
                    'onboarding.templates.type_clinical_note_desc',
                    'Structured medical consultation documentation. AI extracts key findings and recommendations.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.templates.type_prevention', 'Prevention Plans')}
                </p>
                <p className="text-xs text-gray-500">
                  {t(
                    'onboarding.templates.type_prevention_desc',
                    'Preventive care plans with personalized recommendations based on the consultation.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace callout */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <ShoppingBag className="w-4 h-4 text-[#B725B7] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              {t(
                'onboarding.templates.marketplace_tip',
                'Browse the Template Marketplace in Hub to import curated templates by specialty.'
              )}
            </p>
          </div>
        </div>

        {/* Video placeholder */}
        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mt-4">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.templates.video_placeholder', 'See how easy it is')}
          </p>
        </div>

        {/* Navigate button */}
        <button
          onClick={() => onNavigate('/templates')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E91E63] text-[#E91E63] rounded-lg hover:bg-pink-50 transition-colors text-sm font-medium mt-4"
        >
          <FileText className="w-4 h-4" />
          {t('onboarding.templates.go_to', 'Go to Templates')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right Column - Template Syntax */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.templates.syntax_title', 'Template Syntax')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t(
            'onboarding.templates.syntax_desc',
            'Templates use a simple syntax that tells AI how to fill in the content:'
          )}
        </p>

        <div className="bg-gray-50 rounded-xl p-6">
          <div className="space-y-4">
            {/* Placeholder syntax */}
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm flex-shrink-0 mt-0.5">
                [placeholder]
              </span>
              <div>
                <p className="text-sm text-gray-600">
                  {t('onboarding.templates.syntax_placeholder', 'AI fills this from the transcription')}
                </p>
                <p className="text-xs text-gray-400 italic">
                  {t('onboarding.templates.syntax_placeholder_example', 'Example: [patient complaint]')}
                </p>
              </div>
            </div>

            {/* Variable syntax */}
            <div className="flex items-start gap-3">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono text-sm flex-shrink-0 mt-0.5">
                $variable$
              </span>
              <div>
                <p className="text-sm text-gray-600">
                  {t('onboarding.templates.syntax_variable', 'System data inserted automatically')}
                </p>
                <p className="text-xs text-gray-400 italic">
                  {t('onboarding.templates.syntax_variable_example', 'Example: $patient_name$, $date$')}
                </p>
              </div>
            </div>

            {/* Instruction syntax */}
            <div className="flex items-start gap-3">
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-mono text-sm flex-shrink-0 mt-0.5">
                (instruction)
              </span>
              <div>
                <p className="text-sm text-gray-600">
                  {t('onboarding.templates.syntax_instruction', 'Guidance for AI (removed from output)')}
                </p>
                <p className="text-xs text-gray-400 italic">
                  {t('onboarding.templates.syntax_instruction_example', 'Example: (summarize in 3 bullet points)')}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 italic">
                {t(
                  'onboarding.templates.syntax_guide_hint',
                  'A complete syntax guide with more examples is available on the template create/edit page.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
