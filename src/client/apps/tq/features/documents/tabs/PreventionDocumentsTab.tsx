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
import { usePreventionList } from '../../../hooks/usePrevention'
import { PreventionRow } from '../../../components/prevention/PreventionRow'
import { PreventionEmpty } from '../../../components/prevention/PreventionEmpty'
import { PreventionFilters } from '../../../components/prevention/PreventionFilters'
import { Prevention as PreventionType } from '../../../services/prevention'

export const PreventionDocumentsTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const {
    data: preventions,
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
  } = usePreventionList({
    query: searchQuery
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleEditPrevention = (prevention: PreventionType) => {
    // Navigate to the new documents edit path
    navigate(`/documents/prevention/${prevention.id}/edit`)
  }

  const handleViewPrevention = (prevention: PreventionType) => {
    navigate(`/documents/prevention/${prevention.id}/edit`)
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <PreventionFilters
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

      {/* Preventions List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('prevention.pages.list_title')} ({preventions?.length || 0} {t('common.of')} {total} {t('prevention.pages.preventions')})
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
          {!loading && !error && (preventions?.length || 0) === 0 && (
            <PreventionEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Preventions List */}
          {!loading && !error && (preventions?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-3 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('prevention.pages.prevention')}</div>
                <div className="flex-1">{t('common.session')}</div>
                <div className="flex-1">{t('common.patient')}</div>
                <div className="flex-1">{t('common.created_by')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Prevention Rows */}
              <div className="divide-y divide-gray-100">
                {preventions.map((prevention) => (
                  <PreventionRow
                    key={prevention.id}
                    prevention={prevention}
                    onEdit={handleEditPrevention}
                    onView={handleViewPrevention}
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
