import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@client/common/ui'
import { Quote } from '../../services/quotes'
import { ClinicalNote } from '../../services/clinicalNotes'
import { Prevention } from '../../services/prevention'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'

type DocumentType = 'all' | 'quote' | 'clinical_note' | 'prevention'

interface DocumentItem {
  id: string
  type: 'quote' | 'clinical_note' | 'prevention'
  number: string
  status: string
  patientName: string
  date: Date
  total?: number
  content?: string
  path: string
}

interface LatestDocumentsSectionProps {
  quotes: Quote[]
  reports: ClinicalNote[]
  prevention: Prevention[]
  isLoading: boolean
}

const getTextPreview = (html: string) => {
  const div = document.createElement('div')
  div.innerHTML = html
  const text = div.textContent || div.innerText || ''
  return text.slice(0, 100)
}

export const LatestDocumentsSection: React.FC<LatestDocumentsSectionProps> = ({
  quotes,
  reports,
  prevention,
  isLoading
}) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()
  const { formatLongDate } = useDateFormatter()
  const { formatCurrency } = useCurrencyFormatter()
  const [filter, setFilter] = useState<DocumentType>('all')

  const allDocuments = useMemo<DocumentItem[]>(() => {
    const docs: DocumentItem[] = []

    quotes.forEach((q) => {
      const name = q.patient_first_name || q.patient_last_name
        ? `${q.patient_first_name || ''} ${q.patient_last_name || ''}`.trim()
        : t('sessions.unknown_patient')
      docs.push({
        id: q.id,
        type: 'quote',
        number: q.number,
        status: q.status,
        patientName: name,
        date: new Date(q.created_at),
        total: q.total,
        path: `/documents/quote/${q.id}/edit`
      })
    })

    reports.forEach((r) => {
      const name = r.patient_first_name || r.patient_last_name
        ? `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.trim()
        : t('sessions.unknown_patient')
      docs.push({
        id: r.id,
        type: 'clinical_note',
        number: r.number,
        status: 'note',
        patientName: name,
        date: new Date(r.created_at),
        content: r.content,
        path: `/documents/clinical-note/${r.id}/edit`
      })
    })

    prevention.forEach((p) => {
      const name = p.patient_first_name || p.patient_last_name
        ? `${p.patient_first_name || ''} ${p.patient_last_name || ''}`.trim()
        : t('sessions.unknown_patient')
      docs.push({
        id: p.id,
        type: 'prevention',
        number: p.number,
        status: p.status,
        patientName: name,
        date: new Date(p.createdAt),
        content: p.content,
        path: `/documents/prevention/${p.id}/edit`
      })
    })

    return docs.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [quotes, reports, prevention, t])

  const filteredDocuments = useMemo(() => {
    const docs = filter === 'all'
      ? allDocuments
      : allDocuments.filter((d) => d.type === filter)
    return docs.slice(0, 3)
  }, [allDocuments, filter])

  const filters: { key: DocumentType; label: string }[] = [
    { key: 'all', label: t('home.filter_all') },
    { key: 'quote', label: t('home.filter_quote') },
    { key: 'clinical_note', label: t('home.filter_clinical_note') },
    { key: 'prevention', label: t('home.filter_prevention') }
  ]

  const getStatusStyle = (doc: DocumentItem) => {
    if (doc.type === 'clinical_note') return 'bg-gray-100 text-gray-700'
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-yellow-100 text-yellow-700',
      viewed: 'bg-green-100 text-green-700'
    }
    return styles[doc.status] || 'bg-gray-100 text-gray-700'
  }

  const getBorderColor = (doc: DocumentItem) => {
    if (doc.type === 'quote') {
      const colors: Record<string, string> = {
        draft: 'border-gray-300',
        sent: 'border-blue-300',
        approved: 'border-green-300',
        rejected: 'border-red-300',
        expired: 'border-yellow-300'
      }
      return colors[doc.status] || 'border-gray-300'
    }
    return 'border-gray-300'
  }

  const getStatusLabel = (doc: DocumentItem) => {
    if (doc.type === 'clinical_note') return t('clinical_notes.note')
    if (doc.type === 'quote') return t(`quotes.status.${doc.status}`)
    return t(`prevention.status.${doc.status}`)
  }

  const getTypeLabel = (doc: DocumentItem) => {
    if (doc.type === 'quote') return t('common.quote')
    if (doc.type === 'clinical_note') return t('common.clinical_note')
    return t('common.prevention')
  }

  const getTypeBadgeStyle = (type: DocumentItem['type']) => {
    switch (type) {
      case 'quote': return 'bg-pink-50 text-pink-700'
      case 'clinical_note': return 'bg-blue-50 text-blue-700'
      case 'prevention': return 'bg-teal-50 text-teal-700'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{t('home.latest_documents')}</h2>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={`${doc.type}-${doc.id}`}
              doc={doc}
              onDoubleClick={() => navigate(doc.path)}
              formatLongDate={formatLongDate}
              formatCurrency={formatCurrency}
              getStatusStyle={getStatusStyle}
              getBorderColor={getBorderColor}
              getStatusLabel={getStatusLabel}
              getTypeLabel={getTypeLabel}
              getTypeBadgeStyle={getTypeBadgeStyle}
              patientLabel={t('common.patient')}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center py-8">
            <CardTitle className="text-gray-500 text-base font-normal">
              {t('home.no_documents_yet')}
            </CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

interface DocumentCardProps {
  doc: DocumentItem
  onDoubleClick: () => void
  formatLongDate: (date: string | Date) => string
  formatCurrency: (value: number) => string
  getStatusStyle: (doc: DocumentItem) => string
  getBorderColor: (doc: DocumentItem) => string
  getStatusLabel: (doc: DocumentItem) => string
  getTypeLabel: (doc: DocumentItem) => string
  getTypeBadgeStyle: (type: DocumentItem['type']) => string
  patientLabel: string
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  onDoubleClick,
  formatLongDate,
  formatCurrency,
  getStatusStyle,
  getBorderColor,
  getStatusLabel,
  getTypeLabel,
  getTypeBadgeStyle,
  patientLabel
}) => {
  const [isFlashing, setIsFlashing] = useState(false)

  const handleDoubleClick = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 300)
    onDoubleClick()
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 border-2 ${getBorderColor(doc)} ${
        isFlashing ? 'ring-2 ring-[#B725B7] ring-offset-2 scale-[1.02]' : ''
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-4">
        {/* Header: number + type badge + status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-lg">{doc.number}</h3>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getTypeBadgeStyle(doc.type)}`}>
              {getTypeLabel(doc)}
            </span>
          </div>
          <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${getStatusStyle(doc)}`}>
            {getStatusLabel(doc)}
          </span>
        </div>

        {/* Patient name */}
        <p className="text-sm text-gray-600 mb-2">
          <strong>{patientLabel}:</strong> {doc.patientName}
        </p>

        {/* Type-specific content */}
        {doc.type === 'quote' && doc.total !== undefined && (
          <p className="text-lg font-bold text-gray-900 mb-2">
            {formatCurrency(doc.total || 0)}
          </p>
        )}

        {(doc.type === 'clinical_note' || doc.type === 'prevention') && doc.content && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {getTextPreview(doc.content)}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-gray-500">
          {formatLongDate(doc.date)}
        </p>
      </CardContent>
    </Card>
  )
}
