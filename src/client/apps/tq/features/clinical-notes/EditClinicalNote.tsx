import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  TemplateEditor,
  isEditorContentFilled
} from '@client/common/ui'
import { clinicalNotesService, ClinicalNote } from '../../services/clinicalNotes'
import { patientsService } from '../../services/patients'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

export const EditClinicalNote: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatDateTime, formatLongDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [note, setNote] = useState<ClinicalNote | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Patient data state (editable)
  const [patientFirstName, setPatientFirstName] = useState('')
  const [patientLastName, setPatientLastName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientId, setPatientId] = useState<string | null>(null)
  const [contentError, setContentError] = useState('')

  // Load clinical note data
  useEffect(() => {
    if (!id) return

    let isCancelled = false

    const loadNoteData = async () => {
      try {
        setIsLoading(true)
        const noteData = await clinicalNotesService.getById(id)

        if (!isCancelled) {
          setNote(noteData)
          setContent(noteData.content || '')
          setContentError('')

          // Load patient data
          setPatientFirstName(noteData.patient_first_name || '')
          setPatientLastName(noteData.patient_last_name || '')
          setPatientEmail(noteData.patient_email || '')
          setPatientPhone(noteData.patient_phone || '')
          setPatientId(noteData.patient_id || null)

          setLoadError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load clinical note')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadNoteData()

    return () => {
      isCancelled = true
    }
  }, [id])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (contentError && isEditorContentFilled(newContent)) {
      setContentError('')
    }
  }

  const handleSave = async () => {
    if (!id || !note) return

    if (!isEditorContentFilled(content)) {
      setContentError(t('common:field_required'))
      return
    }

    setContentError('')
    setIsSaving(true)

    try {
      // 1. Update patient data if changed
      if (patientId) {
        const patientChanged =
          patientFirstName !== (note.patient_first_name || '') ||
          patientLastName !== (note.patient_last_name || '') ||
          patientEmail !== (note.patient_email || '') ||
          patientPhone !== (note.patient_phone || '')

        if (patientChanged) {
          await patientsService.updatePatient(patientId, {
            first_name: patientFirstName,
            last_name: patientLastName,
            email: patientEmail || undefined,
            phone: patientPhone || undefined
          })
        }
      }

      // 2. Update clinical note content if changed
      const noteChanged = content !== (note.content || '')

      if (noteChanged) {
        await clinicalNotesService.update(id, {
          content
        })
      }

      // 3. Fetch fresh note data to ensure all data is updated
      const freshNote = await clinicalNotesService.getById(id)

      // Update local state with fresh data
      setNote(freshNote)
      setContent(freshNote.content || '')
      setContentError('')

      // Update patient state with fresh data
      setPatientFirstName(freshNote.patient_first_name || '')
      setPatientLastName(freshNote.patient_last_name || '')
      setPatientEmail(freshNote.patient_email || '')
      setPatientPhone(freshNote.patient_phone || '')

      // Success feedback is handled automatically by HTTP interceptor
    } catch (error) {
      // Error is handled by HTTP interceptor
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/documents/clinical-notes')
  }

  const handlePrint = () => {
    if (!note) return

    const patientName = note.patient_first_name || note.patient_last_name
      ? `${note.patient_first_name || ''} ${note.patient_last_name || ''}`.trim()
      : ''
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
    <p class="date"><strong>${generatedOnLabel}:</strong> ${formatLongDate(note.created_at)}</p>
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

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 300)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_notes.edit')}</h1>
          <p className="text-gray-600 mt-1">{t('clinical_notes.loading_note')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (loadError || !note) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_notes.edit')}</h1>
          <p className="text-red-600 mt-1">{loadError || t('clinical_notes.note_not_found')}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/documents/clinical-notes')}>
          {t('clinical_notes.back_to_notes')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:sticky sm:top-0 sm:z-30 sm:bg-white sm:pb-4 sm:border-b sm:border-gray-200 sm:-mx-4 lg:-mx-6 sm:px-4 lg:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_notes.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('clinical_notes.note')} {note.number} • {note.patient_first_name || note.patient_last_name ? `${note.patient_first_name || ''} ${note.patient_last_name || ''}`.trim() : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {t('clinical_notes.pages.print_save_pdf')}
          </Button>
          {canEdit && (
            <>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <Button
                variant="default"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('common.save_changes')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
        {/* Left Column - 60% - Note Details */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Note Metadata */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('clinical_notes.information')}</h2>
              </CardHeader>

              <CardContent className="space-y-4 px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('clinical_notes.number')}
                    value={note.number}
                    disabled
                    readOnly
                  />

                  <Input
                    label={t('common.created_at')}
                    value={formatDate(note.created_at)}
                    disabled
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('common.updated_at')}
                    value={formatDate(note.updated_at)}
                    disabled
                    readOnly
                  />

                  <Input
                    label={t('common.created_by')}
                    value={note.createdBy
                      ? `${note.createdBy.firstName || ''} ${note.createdBy.lastName || ''}`.trim()
                      : '—'
                    }
                    disabled
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Note Content */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('clinical_notes.content_section')}
                  <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                </h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <TemplateEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder={t('clinical_notes.placeholders.content')}
                  readonly={!canEdit || isSaving}
                  minHeight="500px"
                  required
                  error={contentError}
                  requiredMessage={t('common:field_required')}
                />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Right Column - 40% - Patient & Session */}
        <div className="lg:col-span-2">
          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Patient and Session Information */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('clinical_notes.patient_session_info')}</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
                  {/* Patient Info - Left */}
                  <div className="space-y-2 pr-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('common.patient')}</h3>
                    {patientId ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.first_name')}
                          </label>
                          <input
                            type="text"
                            value={patientFirstName}
                            onChange={(e) => setPatientFirstName(e.target.value)}
                            disabled={!canEdit || isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.last_name')}
                          </label>
                          <input
                            type="text"
                            value={patientLastName}
                            onChange={(e) => setPatientLastName(e.target.value)}
                            disabled={!canEdit || isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.email')}
                          </label>
                          <input
                            type="email"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            disabled={!canEdit || isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.phone')}
                          </label>
                          <input
                            type="text"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            disabled={!canEdit || isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('clinical_notes.no_patient_data')}</p>
                    )}
                  </div>

                  {/* Session Info - Right */}
                  <div className="space-y-2 pl-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('clinical_notes.session')}</h3>
                    {note.session_number ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('sessions.number')}
                          </label>
                          <p className="text-sm text-gray-900">{note.session_number}</p>
                        </div>

                        {note.session_status && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              {t('common.status')}
                            </label>
                            <p className="text-sm text-gray-900 capitalize">{note.session_status}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">{t('clinical_notes.no_session_data')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  )
}
