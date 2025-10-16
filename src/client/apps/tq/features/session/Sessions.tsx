import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Alert,
  AlertDescription,
  Paginator
} from '@client/common/ui'
import { useSessionsList } from '../../hooks/useSessions'
import { SessionRow } from '../../components/session/SessionRow'
import { SessionsEmpty } from '../../components/session/SessionsEmpty'
import { SessionFilters } from '../../components/session/SessionFilters'
import { Session } from '../../services/sessions'
import { SessionStatus } from '../../types/sessionStatus'

export const Sessions: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all')
  const navigate = useNavigate()

  const {
    data: sessions,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setQuery,
    setStatusFilter: setHookStatusFilter,
    refresh
  } = useSessionsList({
    query: searchQuery,
    statusFilter: statusFilter
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleStatusFilterChange = (status: SessionStatus | 'all') => {
    setStatusFilter(status)
    setHookStatusFilter(status)
  }

  const handleEditSession = (session: Session) => {
    navigate(`/sessions/${session.id}/edit`)
  }

  const handleDeleteSession = (session: Session) => {
    // Placeholder: Will be implemented later
    console.log('Delete session:', session)
  }

  return (
    <div className="space-y-8"> {/* Increased main vertical spacing - same as NewSession */}
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sessions.pages.management_title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('sessions.pages.management_subtitle')}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <SessionFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Session List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('sessions.pages.list_title')} ({sessions?.length || 0} {t('common.of')} {total} {t('sessions.pages.sessions')})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6"> {/* Added horizontal and bottom padding to match header */}
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
          {!loading && !error && (sessions?.length || 0) === 0 && (
            <SessionsEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Session List */}
          {!loading && !error && (sessions?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-2 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('common.session')}</div>
                <div className="flex-1">{t('common.status')}</div>
                <div className="flex-1">{t('common.patient')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Session Rows */}
              <div className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onEdit={handleEditSession}
                    onDelete={handleDeleteSession}
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
