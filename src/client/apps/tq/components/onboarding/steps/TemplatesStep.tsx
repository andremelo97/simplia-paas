import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  ShoppingBag,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

interface TemplatesStepProps {
  onNavigate: (path: string) => void
}

export const TemplatesStep: React.FC<TemplatesStepProps> = ({ onNavigate }) => {
  const { t } = useTranslation('tq')
  const [showVariables, setShowVariables] = useState(false)

  const hubMarketplaceUrl = window.location.origin.replace('tq', 'hub') + '/marketplace'

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

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t(
            'onboarding.templates.description',
            'Templates are pre-made document structures that AI fills in automatically using your transcription data. Create once, reuse with every patient.'
          )}
        </p>

        {/* Video placeholder */}
        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mb-4">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.templates.video_placeholder', 'See how easy it is')}
          </p>
        </div>

        {/* Marketplace callout */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-[#B725B7] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                {t(
                  'onboarding.templates.marketplace_tip',
                  'Browse the Template Marketplace in Hub to import curated templates by specialty.'
                )}
              </p>
              <a
                href={hubMarketplaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#B725B7] hover:underline mt-2"
              >
                {t('onboarding.templates.marketplace_link', 'Open Marketplace')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
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

      {/* Right Column - Template Creation Guide */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {t('templates.guide.title', 'Template Creation Guide')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('templates.guide.subtitle', 'How to create dynamic templates for clinical documentation')}
        </p>

        <div className="bg-gray-50 rounded-xl p-6 space-y-5">
          {/* Placeholders */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              {t('templates.guide.placeholders_title', 'Placeholders:')}
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <code className="text-sm text-blue-800 font-mono">[placeholder]</code>
            </div>
            <p className="text-xs text-gray-600">
              {t('templates.guide.placeholders_description')}
            </p>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              {t('templates.guide.instructions_title', 'Instructions:')}
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
              <code className="text-sm text-amber-800 font-mono">(instruction)</code>
            </div>
            <p className="text-xs text-gray-600">
              {t('templates.guide.instructions_description')}
            </p>
          </div>

          {/* System Variables */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              {t('templates.guide.variables_title', 'System Variables:')}
            </h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <code className="text-sm text-green-800 font-mono">$variable$</code>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {t('templates.guide.variables_description')}
            </p>

            <button
              type="button"
              onClick={() => setShowVariables(!showVariables)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
            >
              {showVariables ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {t('templates.guide.click_to_see_variables', 'Click here to see the available variables')}
            </button>

            {showVariables && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="space-y-2 text-xs">
                  <div><code className="font-mono text-green-700">$patient.first_name$</code> - Patient's first name</div>
                  <div><code className="font-mono text-green-700">$patient.last_name$</code> - Patient's last name</div>
                  <div><code className="font-mono text-green-700">$patient.fullName$</code> - Patient's full name (first + last)</div>
                  <div><code className="font-mono text-green-700">$date.now$</code> - Current date</div>
                  <div><code className="font-mono text-green-700">$session.created_at$</code> - Session creation date</div>
                  <div><code className="font-mono text-green-700">$me.first_name$</code> - Your first name</div>
                  <div><code className="font-mono text-green-700">$me.last_name$</code> - Your last name</div>
                  <div><code className="font-mono text-green-700">$me.fullName$</code> - Your full name (first + last)</div>
                  <div><code className="font-mono text-green-700">$me.clinic$</code> - Your clinic name</div>
                </div>
              </div>
            )}
          </div>

          {/* Example */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              {t('templates.guide.example_title', 'Example:')}
            </h4>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <code className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {t('templates.guide.example_content')}
              </code>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
