import React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Progress } from '@client/common/ui'
import { TranscriptionStatus } from '../../../shared/store/docGenWizard'

interface WizardTranscriptionProgressProps {
  status: TranscriptionStatus
  error?: string | null
}

export const WizardTranscriptionProgress: React.FC<WizardTranscriptionProgressProps> = ({
  status,
  error,
}) => {
  const { t } = useTranslation('tq')

  if (status === 'idle' || status === 'recording') return null

  const progressValue =
    status === 'uploading' ? 33 :
    status === 'processing' ? 75 :
    status === 'completed' ? 100 :
    status === 'error' ? 0 : 0

  const statusLabel =
    status === 'uploading' ? t('doc_gen_wizard.transcription.uploading', 'Uploading audio...') :
    status === 'processing' ? t('doc_gen_wizard.transcription.processing', 'Transcribing audio...') :
    status === 'completed' ? t('doc_gen_wizard.transcription.completed', 'Transcription complete') :
    status === 'error' ? t('doc_gen_wizard.transcription.error', 'Transcription failed') : ''

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : status === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        ) : (
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: 'var(--brand-tertiary)' }} />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-900">{statusLabel}</p>
            {status !== 'error' && status !== 'completed' && (
              <p className="text-xs text-gray-500">{progressValue}%</p>
            )}
          </div>
          {status !== 'error' && (
            <Progress value={progressValue} className="h-2" />
          )}
        </div>
      </div>

      {status === 'error' && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="rounded-lg p-3" style={{
          backgroundColor: 'var(--brand-tertiary-bg)',
          borderColor: 'var(--brand-tertiary)',
          borderWidth: '1px'
        }}>
          <p className="text-xs" style={{ color: 'var(--brand-tertiary-hover)' }}>
            {t('doc_gen_wizard.transcription.estimated_time', 'This usually takes 1-3 minutes depending on audio length.')}
          </p>
        </div>
      )}
    </div>
  )
}
