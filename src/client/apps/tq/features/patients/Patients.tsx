import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Alert,
  AlertDescription,
  Paginator
} from '@client/common/ui'
import { usePatientsList } from '../../hooks/usePatients'
import { PatientRow } from '../../components/patients/PatientRow'
import { PatientsEmpty } from '../../components/patients/PatientsEmpty'
import { PatientFilters } from '../../components/patients/PatientFilters'
import { Patient } from '../../services/patients'

export const Patients: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const {
    data: patients,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setQuery,
    refresh
  } = usePatientsList({
    query: searchQuery
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }


  const handleAddPatient = () => {
    navigate('/patients/create')
  }

  const handleEditPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}/edit`)
  }

  const handleHistoryPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}/history`)
  }

  const handleDeletePatient = (patient: Patient) => {
    // Placeholder: Will be implemented later
    console.log('Delete patient:', patient)
  }


  return (
    <div className="space-y-8"> {/* Increased main vertical spacing - same as NewSession */}
      {/* Header with Title and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.pages.management_title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('patients.pages.management_subtitle')}
          </p>
        </div>
        {/* Add Patient Button */}
        <Button
          variant="primary"
          onClick={handleAddPatient}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('patients.pages.add_patient')}
        </Button>
      </div>

      {/* Search */}
      <PatientFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      {/* Patient List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('patients.pages.list_title')} ({patients?.length || 0} {t('common.of')} {total} {t('patients.title').toLowerCase()})
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
          {!loading && !error && (patients?.length || 0) === 0 && (
            <PatientsEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Patient List */}
          {!loading && !error && (patients?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-2 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('common.name')}</div>
                <div className="flex-1">{t('patients.email')}</div>
                <div className="flex-1">{t('patients.phone')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Patient Rows */}
              <div className="divide-y divide-gray-100">
                {patients.map((patient) => (
                  <PatientRow
                    key={patient.id}
                    patient={patient}
                    onEdit={handleEditPatient}
                    onHistory={handleHistoryPatient}
                    onDelete={handleDeletePatient}
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