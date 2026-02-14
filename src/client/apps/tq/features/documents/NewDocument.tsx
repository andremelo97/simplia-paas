import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, CardContent, CardHeader, CardTitle, Select, RichTextEditor, isEditorContentFilled } from '@client/common/ui'
import { sessionsService, Session } from '../../services/sessions'
import { quotesService, CreateQuoteRequest } from '../../services/quotes'
import { clinicalNotesService, CreateClinicalNoteRequest } from '../../services/clinicalNotes'
import { preventionService, CreatePreventionRequest } from '../../services/prevention'
import { DocumentType, getDocumentConfig } from './documentConfig'

export const NewDocument: React.FC = () => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

  // State
  const [documentType, setDocumentType] = useState<DocumentType>('quote')
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [content, setContent] = useState('')
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<{ session?: string; content?: string }>({})

  const config = getDocumentConfig(documentType)

  // Load recent sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true)
        const response = await sessionsService.list({ limit: 50 })
        setSessions(response.data)
      } catch (error) {
        // Error handled by HTTP interceptor
      } finally {
        setIsLoadingSessions(false)
      }
    }
    loadSessions()
  }, [])

  const handleDocumentTypeChange = (type: string) => {
    setDocumentType(type as DocumentType)
    setErrors({})
  }

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    if (errors.session) {
      setErrors(prev => ({ ...prev, session: '' }))
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (errors.content && isEditorContentFilled(newContent)) {
      setErrors(prev => ({ ...prev, content: '' }))
    }
  }

  const handleCreate = async () => {
    // Validate
    const newErrors: { session?: string; content?: string } = {}

    if (!selectedSessionId) {
      newErrors.session = t('documents.session_required')
    }
    if (!isEditorContentFilled(content)) {
      newErrors.content = t('documents.content_required')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsCreating(true)

    try {
      let newDocumentId: string

      switch (documentType) {
        case 'quote': {
          const quoteData: CreateQuoteRequest = {
            sessionId: selectedSessionId,
            content,
            status: 'draft'
          }
          const newQuote = await quotesService.createQuote(quoteData)
          newDocumentId = newQuote.id
          break
        }
        case 'clinical-note': {
          const noteData: CreateClinicalNoteRequest = {
            sessionId: selectedSessionId,
            content
          }
          const newNote = await clinicalNotesService.create(noteData)
          newDocumentId = newNote.id
          break
        }
        case 'prevention': {
          const preventionData: CreatePreventionRequest = {
            sessionId: selectedSessionId,
            content,
            status: 'draft'
          }
          const newPrevention = await preventionService.create(preventionData)
          newDocumentId = newPrevention.id
          break
        }
        default:
          throw new Error('Invalid document type')
      }

      // Navigate to edit page
      navigate(`/documents/${documentType}/${newDocumentId}/edit`)

    } catch (error) {
      // Error handled by HTTP interceptor
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    navigate('/documents')
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('documents.new_document')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('documents.new_document_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Document Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t('modals.template_quote.document_type')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={documentType}
                  onChange={(e) => handleDocumentTypeChange(e.target.value)}
                  options={[
                    { value: 'quote', label: t('modals.template_quote.type_quote') },
                    { value: 'clinical-note', label: t('modals.template_quote.type_clinical_note') },
                    { value: 'prevention', label: t('modals.template_quote.type_prevention') }
                  ]}
                />
              </CardContent>
            </Card>

            {/* Session Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t('documents.select_session')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedSessionId}
                      onChange={(e) => handleSessionChange(e.target.value)}
                      placeholder={t('documents.select_session_placeholder')}
                      options={sessions.map((session) => ({
                        value: session.id,
                        label: `#${session.number} - ${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
                      }))}
                    />
                    {errors.session && (
                      <p className="text-red-500 text-sm mt-1">{errors.session}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>{t('common.content')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder={t('templates.placeholders.content')}
                  readonly={isCreating}
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content}</p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <Button
                variant="default"
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={isCreating}
              >
                {isCreating ? t('common.saving') : t('common.create')}
              </Button>

              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isCreating}
                style={{ height: '32px', minHeight: '32px' }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{t('common.information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSession && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('common.session')}</p>
                    <p className="text-sm text-gray-900">#{selectedSession.number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('common.patient')}</p>
                    <p className="text-sm text-gray-900">
                      {selectedSession.patient_first_name || ''} {selectedSession.patient_last_name || ''}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">{t('modals.template_quote.document_type')}</p>
                <p className="text-sm text-gray-900">
                  {documentType === 'quote' && t('modals.template_quote.type_quote')}
                  {documentType === 'clinical-note' && t('modals.template_quote.type_clinical_note')}
                  {documentType === 'prevention' && t('modals.template_quote.type_prevention')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
