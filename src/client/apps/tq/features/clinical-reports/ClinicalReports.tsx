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
import { useClinicalReportsList } from '../../hooks/useClinicalReports'
import { ClinicalReportRow } from '../../components/clinical-reports/ClinicalReportRow'
import { ClinicalReportsEmpty } from '../../components/clinical-reports/ClinicalReportsEmpty'
import { ClinicalReportsFilters } from '../../components/clinical-reports/ClinicalReportsFilters'
import { ClinicalReport } from '../../services/clinicalReports'

export const ClinicalReports: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const {
    data: reports,
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
  } = useClinicalReportsList({
    query: searchQuery
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleEditReport = (report: ClinicalReport) => {
    navigate(`/clinical-reports/${report.id}/edit`)
  }

  const handleViewReport = (report: ClinicalReport) => {
    navigate(`/clinical-reports/${report.id}/view`)
  }

  const handleDeleteReport = (report: ClinicalReport) => {
    // Placeholder: Will be implemented later
  }

  return (
    <div className="space-y-8">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clinical_reports.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('clinical_reports.pages.management_subtitle')}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <ClinicalReportsFilters
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

      {/* Reports List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('clinical_reports.pages.list_title')} ({reports?.length || 0} {t('common.of')} {total} {t('clinical_reports.pages.reports')})
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
          {!loading && !error && (reports?.length || 0) === 0 && (
            <ClinicalReportsEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Reports List */}
          {!loading && !error && (reports?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-3 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('clinical_reports.pages.report')}</div>
                <div className="flex-1">{t('common.session')}</div>
                <div className="flex-1">{t('common.patient')}</div>
                <div className="flex-1">{t('common.created_by')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Report Rows */}
              <div className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <ClinicalReportRow
                    key={report.id}
                    report={report}
                    onEdit={handleEditReport}
                    onView={handleViewReport}
                    onDelete={handleDeleteReport}
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
