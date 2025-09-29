import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  TemplateEditor
} from '@client/common/ui'
import { quotesService, Quote } from '../../services/quotes'

const QUOTE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' }
]

export const EditQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load quote data
  useEffect(() => {
    if (!id) return

    let isCancelled = false

    const loadQuoteData = async () => {
      try {
        setIsLoading(true)
        const quoteData = await quotesService.getQuote(id)

        if (!isCancelled) {
          console.log('🔍 [EditQuote] Quote data loaded:', quoteData)
          console.log('🔍 [EditQuote] Content length:', quoteData.content?.length)
          console.log('🔍 [EditQuote] Content preview:', quoteData.content?.substring(0, 200))

          setQuote(quoteData)
          setContent(quoteData.content || '')
          setStatus(quoteData.status || 'draft')
          setLoadError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load quote')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadQuoteData()

    return () => {
      isCancelled = true
    }
  }, [id])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
  }

  const handleSave = async () => {
    if (!id || !quote) return

    setIsSaving(true)

    try {
      const updatedQuote = await quotesService.updateQuote(id, {
        content,
        status
      })
      // Update local state with saved data
      setQuote(updatedQuote)
      setContent(updatedQuote.content || '')
      setStatus(updatedQuote.status || 'draft')
      // Success feedback is handled automatically by HTTP interceptor
    } catch (error) {
      console.error('Failed to update quote:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/quotes')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quote</h1>
          <p className="text-gray-600 mt-1">Loading quote...</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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

  if (loadError || !quote) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quote</h1>
          <p className="text-red-600 mt-1">{loadError || 'Quote not found'}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/quotes')}>
          Back to Quotes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Quote</h1>
        <p className="text-gray-600 mt-1">
          Editing: {quote.number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - 60% - Quote Details */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Quote Metadata */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quote Information</h2>
              </CardHeader>

              <CardContent className="space-y-4 px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quote Number"
                    value={quote.number}
                    disabled
                    readOnly
                  />

                  <Select
                    label="Status"
                    value={status}
                    onChange={handleStatusChange}
                    options={QUOTE_STATUS_OPTIONS}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Created At"
                    value={formatDate(quote.created_at)}
                    disabled
                    readOnly
                  />

                  <Input
                    label="Updated At"
                    value={formatDate(quote.updated_at)}
                    disabled
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quote Content */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quote Content</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {console.log('🔍 [EditQuote] Rendering TemplateEditor with content length:', content?.length)}
                <TemplateEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Quote content..."
                  readonly={isSaving}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <Button
                variant="default"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
                style={{ height: '32px', minHeight: '32px' }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - 40% - Patient & Items */}
        <div className="lg:col-span-2">
          <div className="space-y-6 sticky top-6">
            {/* Patient and Session Information */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Patient and Session Information</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Patient Info - Left */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Patient</h3>
                    {quote.patient_first_name || quote.patient_last_name ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <p className="text-base text-gray-900">
                            {[quote.patient_first_name, quote.patient_last_name]
                              .filter(Boolean)
                              .join(' ') || 'N/A'}
                          </p>
                        </div>

                        {quote.patient_email && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <p className="text-base text-gray-900">{quote.patient_email}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No patient data</p>
                    )}
                  </div>

                  {/* Session Info - Right */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Session</h3>
                    {quote.session_number ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Session Number
                          </label>
                          <p className="text-base text-gray-900">{quote.session_number}</p>
                        </div>

                        {quote.session_status && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <p className="text-base text-gray-900 capitalize">{quote.session_status}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No session data</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Items Placeholder */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quote Items</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Quote items functionality will be implemented here
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    (Item management, pricing, discounts)
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}