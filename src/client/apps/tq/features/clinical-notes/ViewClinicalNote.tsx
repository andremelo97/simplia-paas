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
import { clinicalNotesService, ClinicalNote } from '../../services/clinicalNotes'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

export const ViewClinicalNote: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatLongDate } = useDateFormatter()

  const [note, setNote] = useState<ClinicalNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadNote = async () => {
      try {
        setIsLoading(true)
        const noteData = await clinicalNotesService.getById(id)
        setNote(noteData)
        setLoadError(null)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load clinical note')
      } finally {
        setIsLoading(false)
      }
    }

    loadNote()
  }, [id])

  const handlePrint = () => {
    if (!note) return

    const title = t('clinical_notes.pages.view_title')
    const patientLabel = t('common.patient')
    const generatedOnLabel = t('clinical_notes.pages.generated_on')
    const disclaimerText = t('clinical_notes.pages.disclaimer')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} ${note.number}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111827; line-height: 1.6; font-size: 11pt; margin: 0; padding: 2rem 2.5rem;
    }
    .header { margin-bottom: 1.5rem; }
    .title { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; color: #111827; }
    .patient { margin-bottom: 0.5rem; font-size: 1rem; color: #374151; }
    .date { font-size: 0.875rem; color: #6b7280; }
    .divider { margin: 1.5rem 0; border: none; border-top: 1px solid #e5e7eb; }
    .content { font-size: 11pt; line-height: 1.6; color: #111827; }
    .content p { margin-bottom: 0.75rem; orphans: 2; widows: 2; }
    .content h1, .content h2, .content h3, .content h4 {
      page-break-after: avoid; break-after: avoid;
      margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600;
    }
    .content h1 { font-size: 1.5rem; }
    .content h2 { font-size: 1.25rem; }
    .content h3 { font-size: 1.1rem; }
    .content ul, .content ol { margin-left: 1.5rem; margin-bottom: 0.75rem; }
    .content li { margin-bottom: 0.25rem; }
    .content strong { font-weight: 600; }
    .content blockquote, .content pre, .content table { page-break-inside: avoid; }
    .disclaimer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #6b7280; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <h2 class="title">${title} ${note.number}</h2>
    <p class="patient"><strong>${patientLabel}:</strong> ${patientName}</p>
    <p class="date"><strong>${generatedOnLabel}:</strong> ${formatDate(note.created_at)}</p>
  </div>
  <hr class="divider" />
  <div class="content">${note.content || '<p>No content available</p>'}</div>
  <div class="disclaimer">${disclaimerText}</div>
</body>
</html>`

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(html)
    printWindow.document.close()

    // Wait for content to render before printing
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
    // Fallback if onload doesn't fire (some browsers with document.write)
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 300)
  }

  const handleEdit = () => {
    navigate(`/documents/clinical-note/${id}/edit`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatLongDate(dateString)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_notes.pages.view_title')}</h1>
          <p className="text-gray-600 mt-1">{t('common.loading')}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B725B7]"></div>
        </div>
      </div>
    )
  }

  if (loadError || !note) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_notes.pages.view_title')}</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {loadError || t('clinical_notes.note_not_found')}
          </AlertDescription>
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/documents/clinical-notes')}>
          {t('clinical_notes.pages.back_to_notes')}
        </Button>
      </div>
    )
  }

  const patientName = note.patient_first_name || note.patient_last_name
    ? `${note.patient_first_name || ''} ${note.patient_last_name || ''}`.trim()
    : t('clinical_notes.pages.unknown_patient')

  return (
    <div className="space-y-6">
      {/* Header - Hide on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_notes.pages.view_title')} {note.number}</h1>
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
            {t('clinical_notes.pages.print_save_pdf')}
          </Button>
        </div>
      </div>

      {/* Note Content Card - Screen view */}
      <Card className="print:hidden">
        <CardContent className="p-8">
          {/* Note Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('clinical_notes.pages.view_title')} {note.number}
            </h2>
            <p className="text-gray-700 mb-1">
              <strong>{t('common.patient')}:</strong> {patientName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>{t('clinical_notes.pages.generated_on')}:</strong> {formatDate(note.created_at)}
            </p>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Note Content */}
          <div className="clinical-note-view">
            <TemplateEditor
              content={note.content || '<p>No content available</p>'}
              onChange={() => {}} // No-op since it's readonly
              readonly={true}
            />
          </div>

          {/* Footer disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              {t('clinical_notes.pages.disclaimer')}
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
