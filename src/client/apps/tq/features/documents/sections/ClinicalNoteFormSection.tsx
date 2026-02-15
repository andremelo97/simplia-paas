import React from 'react'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { Button } from '@client/common/ui'
import { DocumentConfig, DocumentData } from '../documentConfig'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

export interface ClinicalNoteFormState {
  // Clinical notes don't have extra state
}

interface ClinicalNoteFormSectionProps {
  document: DocumentData | null
  documentId: string
  config: DocumentConfig
  formState: ClinicalNoteFormState
  onFormStateChange: (state: Partial<ClinicalNoteFormState>) => void
  canEdit: boolean
}

export const ClinicalNoteFormSection: React.FC<ClinicalNoteFormSectionProps> = () => {
  // Clinical notes don't have additional form sections
  // The Print button is rendered in the header of EditDocument
  return null
}

// Export a header action component for clinical notes
export const ClinicalNoteHeaderAction: React.FC<{
  documentId: string
  config: DocumentConfig
  document: DocumentData | null
  patientName: string
}> = ({ document, patientName }) => {
  const { t } = useTranslation('tq')
  const { formatLongDate } = useDateFormatter()

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatLongDate(dateString)
  }

  const handlePrint = () => {
    if (!document) return

    const title = t('clinical_notes.pages.view_title')
    const patientLabel = t('common.patient')
    const generatedOnLabel = t('clinical_notes.pages.generated_on')
    const disclaimerText = t('clinical_notes.pages.disclaimer')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} ${document.number}</title>
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
    <h2 class="title">${title} ${document.number}</h2>
    <p class="patient"><strong>${patientLabel}:</strong> ${patientName}</p>
    <p class="date"><strong>${generatedOnLabel}:</strong> ${formatDate(document.created_at)}</p>
  </div>
  <hr class="divider" />
  <div class="content">${document.content || '<p>No content available</p>'}</div>
  <div class="disclaimer">${disclaimerText}</div>
</body>
</html>`

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(html)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 300)
  }

  return (
    <Button
      variant="primary"
      onClick={handlePrint}
      className="flex items-center gap-2"
      disabled={!document}
    >
      <Printer className="w-4 h-4" />
      {t('clinical_notes.pages.print_save_pdf')}
    </Button>
  )
}
