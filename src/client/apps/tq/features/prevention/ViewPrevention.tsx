import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Printer, Edit } from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Alert,
  AlertDescription,
  TemplateEditor
} from '@client/common/ui'
import { preventionService, Prevention } from '../../services/prevention'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

export const ViewPrevention: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatLongDate } = useDateFormatter()

  const [prevention, setPrevention] = useState<Prevention | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadPrevention = async () => {
      try {
        setIsLoading(true)
        const preventionData = await preventionService.getById(id)
        setPrevention(preventionData)
        setLoadError(null)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load prevention')
      } finally {
        setIsLoading(false)
      }
    }

    loadPrevention()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handleEdit = () => {
    navigate(`/prevention/${id}/edit`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatLongDate(dateString)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('prevention.pages.view_title')}</h1>
          <p className="text-gray-600 mt-1">{t('common.loading')}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B725B7]"></div>
        </div>
      </div>
    )
  }

  if (loadError || !prevention) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('prevention.pages.view_title')}</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {loadError || t('prevention.prevention_not_found')}
          </AlertDescription>
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/documents/prevention')}>
          {t('prevention.pages.back_to_preventions')}
        </Button>
      </div>
    )
  }

  const patientName = prevention.patient_first_name || prevention.patient_last_name
    ? `${prevention.patient_first_name || ''} ${prevention.patient_last_name || ''}`.trim()
    : t('prevention.pages.unknown_patient')

  return (
    <div className="space-y-6">
      {/* Header - Hide on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('prevention.pages.view_title')} {prevention.number}</h1>
          <p className="text-gray-600 mt-1">{t('common.patient')}: {patientName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit')}
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {t('prevention.pages.print_save_pdf')}
          </Button>
        </div>
      </div>

      {/* Prevention Content Card - Screen view */}
      <Card className="print:hidden">
        <CardContent className="p-8">
          {/* Prevention Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('prevention.pages.view_title')} {prevention.number}
            </h2>
            <p className="text-gray-700 mb-1">
              <strong>{t('common.patient')}:</strong> {patientName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>{t('prevention.pages.generated_on')}:</strong> {formatDate(prevention.createdAt)}
            </p>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Prevention Content */}
          <div className="prevention-view">
            <TemplateEditor
              content={prevention.content || '<p>No content available</p>'}
              onChange={() => {}} // No-op since it's readonly
              readonly={true}
            />
          </div>

          {/* Footer disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              {t('prevention.pages.disclaimer')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Print-only version - Simple HTML rendering for proper pagination */}
      <div className="hidden print:block print-prevention-content" data-date={formatDate(prevention.createdAt)}>
        {/* Prevention Header */}
        <div className="print-header">
          <h2 className="print-title">
            {t('prevention.pages.view_title')} {prevention.number}
          </h2>
          <p className="print-patient">
            <strong>{t('common.patient')}:</strong> {patientName}
          </p>
          <p className="print-date">
            <strong>{t('prevention.pages.generated_on')}:</strong> {formatDate(prevention.createdAt)}
          </p>
        </div>

        <hr className="print-divider" />

        {/* Prevention Content - Direct HTML rendering for proper pagination */}
        <div
          className="print-content"
          dangerouslySetInnerHTML={{ __html: prevention.content || '<p>No content available</p>' }}
        />
      </div>
    </div>
  )
}
