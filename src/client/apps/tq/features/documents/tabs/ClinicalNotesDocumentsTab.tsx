import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Paginator
} from '@client/common/ui'
import { useClinicalNotesList } from '../../../hooks/useClinicalNotes'
import { ClinicalNoteRow } from '../../../components/clinical-notes/ClinicalNoteRow'
import { ClinicalNotesEmpty } from '../../../components/clinical-notes/ClinicalNotesEmpty'
import { ClinicalNotesFilters } from '../../../components/clinical-notes/ClinicalNotesFilters'
import { ClinicalNote } from '../../../services/clinicalNotes'

export const ClinicalNotesDocumentsTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const {
    data: notes,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    patientId,
    createdByUserId,
    createdFrom,
    createdTo,
    setPage,
    setQuery,
    setPatientId,
    setCreatedByUserId,
    setCreatedFrom,
    setCreatedTo,
    refresh
  } = useClinicalNotesList({
    query: searchQuery
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleEditNote = (note: ClinicalNote) => {
    // Navigate to the new documents edit path
    navigate(`/documents/clinical-note/${note.id}/edit`)
  }

  const handleViewNote = (note: ClinicalNote) => {
    // Navigate to the new documents view path
    navigate(`/documents/clinical-note/${note.id}/view`)
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <ClinicalNotesFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        patientId={patientId}
        onPatientChange={setPatientId}
        createdByUserId={createdByUserId}
        onCreatedByChange={setCreatedByUserId}
        createdFrom={createdFrom}
        onCreatedFromChange={setCreatedFrom}
        createdTo={createdTo}
        onCreatedToChange={setCreatedTo}
      />

      {/* Notes List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('clinical_notes.pages.list_title')} ({notes?.length || 0} {t('common.of')} {total} {t('clinical_notes.pages.notes')})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Error State */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription>
                {error}{' '}
                <button
                  onClick={refresh}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  {t('common.try_again')}
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (notes?.length || 0) === 0 && (
            <ClinicalNotesEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Notes List */}
          {!loading && !error && (notes?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-3 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('clinical_notes.pages.note')}</div>
                <div className="flex-1">{t('common.session')}</div>
                <div className="flex-1">{t('common.patient')}</div>
                <div className="flex-1">{t('common.created_by')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Note Rows */}
              <div className="divide-y divide-gray-100">
                {notes.map((note) => (
                  <ClinicalNoteRow
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onView={handleViewNote}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Paginator
                currentPage={currentPage}
                totalItems={total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
