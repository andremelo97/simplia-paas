import React from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Upload, Info, Zap, Play, Monitor, Tablet, Smartphone, ArrowRight } from 'lucide-react'

interface SessionsStepProps {
  onNavigate: (path: string) => void
}

export const SessionsStep: React.FC<SessionsStepProps> = ({ onNavigate }) => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.sessions.title', 'Sessions')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.sessions.description',
            'Record your consultations directly in the browser or upload pre-recorded audio files. TQ automatically converts speech to text using advanced AI, so you can focus on your patient.'
          )}
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">
            {t('onboarding.sessions.ways_title', 'Two ways to start:')}
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {t('onboarding.sessions.way_record_title', 'Record live')}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    'onboarding.sessions.way_record_desc',
                    'Use your microphone from any device to record in real-time during the consultation.'
                  )}
                </p>
                {/* Device icons */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Monitor className="w-4 h-4" />
                    <span>{t('onboarding.sessions.device_desktop', 'Desktop')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Tablet className="w-4 h-4" />
                    <span>{t('onboarding.sessions.device_tablet', 'Tablet / iPad')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Smartphone className="w-4 h-4" />
                    <span>{t('onboarding.sessions.device_phone', 'Phone')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {t('onboarding.sessions.way_upload_title', 'Upload audio')}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    'onboarding.sessions.way_upload_desc',
                    'Upload an existing MP3, WAV, or M4A file for transcription.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                {t('onboarding.sessions.quota_title', 'Transcription Quota')}
              </p>
              <p className="text-sm text-blue-700 mt-0.5">
                {t(
                  'onboarding.sessions.quota_desc',
                  'Your plan includes a monthly quota of transcription minutes. You can monitor your usage in the Hub dashboard.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Navigate button */}
        <button
          onClick={() => onNavigate('/new-session')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#B725B7] text-[#B725B7] rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
        >
          <Mic className="w-4 h-4" />
          {t('onboarding.sessions.try_now', 'Try Transcription Now')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right Column - How it works */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.sessions.how_title', 'How it works')}
        </h3>

        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#B725B7] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('onboarding.sessions.step1_title', 'Start Recording')}
              </p>
              <p className="text-sm text-gray-600">
                {t(
                  'onboarding.sessions.step1_desc',
                  "Click 'Start Transcribing' in the sidebar or upload an existing audio file. Grant microphone access when prompted."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5ED6CE] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('onboarding.sessions.step2_title', 'Automatic Transcription')}
              </p>
              <p className="text-sm text-gray-600">
                {t(
                  'onboarding.sessions.step2_desc',
                  "The audio is processed in real-time by our AI engine. You'll see the text appearing as you speak, or after the upload is complete."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E91E63] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('onboarding.sessions.step3_title', 'Create Session')}
              </p>
              <p className="text-sm text-gray-600">
                {t(
                  'onboarding.sessions.step3_desc',
                  'Link the transcription to a patient to create a session. From here, you can generate documents using templates.'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {t('onboarding.sessions.autosave_title', 'Auto-save')}
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                {t(
                  'onboarding.sessions.autosave_desc',
                  'Your recording draft is automatically saved to your browser. If you accidentally close the tab, you can resume where you left off.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Video placeholder */}
        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mt-4">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.sessions.video_placeholder', 'See how easy it is')}
          </p>
        </div>
      </div>
    </>
  )
}
