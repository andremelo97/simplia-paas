import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Plus, CheckCircle2 } from 'lucide-react'
import { Input, Button } from '@client/common/ui'
import { patientsService } from '../../../services/patients'
import { useDocGenWizardStore } from '../../../shared/store/docGenWizard'

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

interface SearchPatient {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

export const WizardPatientSelector: React.FC = () => {
  const { t } = useTranslation('tq')
  const { patientId, patientName, setPatient } = useDocGenWizardStore()

  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [searchQuery, setSearchQuery] = useState(patientName || '')
  const [newPatientName, setNewPatientName] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPatient[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebouncedValue(searchQuery, 300)

  // Fetch recent patients (no search query — shown on focus)
  const fetchRecentPatients = useCallback(async () => {
    if (mode !== 'search') return
    setIsSearching(true)
    try {
      const results = await patientsService.searchPatients({ limit: 5 })
      setSearchResults(results as SearchPatient[])
      setShowResults(results.length > 0)
    } catch {
      // ignore
    } finally {
      setIsSearching(false)
    }
  }, [mode])

  // Search patients
  useEffect(() => {
    if (mode !== 'search' || !debouncedQuery.trim()) {
      if (!debouncedQuery.trim()) setSearchResults([])
      return
    }

    const search = async () => {
      setIsSearching(true)
      try {
        const results = await patientsService.searchPatients({
          search: debouncedQuery,
          limit: 10
        })

        // Sort: starts-with first, then contains
        const sorted = (results as SearchPatient[])
          .map(patient => {
            const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim().toLowerCase()
            const searchLower = debouncedQuery.toLowerCase()
            const startsWith = fullName.startsWith(searchLower) ||
              (patient.firstName || '').toLowerCase().startsWith(searchLower) ||
              (patient.lastName || '').toLowerCase().startsWith(searchLower)
            return { ...patient, _score: startsWith ? 1 : 0 }
          })
          .sort((a, b) => b._score - a._score)
          .slice(0, 5)
          .map(({ _score, ...p }) => p)

        setSearchResults(sorted)
        setShowResults(sorted.length > 0)
      } catch {
        setSearchResults([])
        setShowResults(false)
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedQuery, mode])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectPatient = (patient: SearchPatient) => {
    const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
    setPatient(patient.id, name)
    setSearchQuery(name)
    setShowResults(false)
  }

  const handleCreatePatient = async () => {
    if (!newPatientName.trim() || isCreating) return

    setIsCreating(true)
    try {
      // Split name into first/last
      const parts = newPatientName.trim().split(/\s+/)
      const firstName = parts[0]
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined

      const result = await patientsService.createPatient({ first_name: firstName, last_name: lastName })
      const name = `${firstName}${lastName ? ` ${lastName}` : ''}`
      setPatient(result.id, name)
      setSearchQuery(name)
      setMode('search')
    } catch {
      // Error creating patient
    } finally {
      setIsCreating(false)
    }
  }

  const handleModeToggle = () => {
    if (mode === 'search') {
      setMode('create')
      setNewPatientName('')
    } else if (newPatientName.trim()) {
      handleCreatePatient()
    } else {
      setMode('search')
    }
  }

  const isSelected = !!patientId

  return (
    <div className="space-y-3">
      <h3 className="flex items-center text-base font-semibold text-gray-900">
        <User className="w-5 h-5 mr-2" />
        {t('doc_gen_wizard.patient.title', 'Patient')}
      </h3>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div ref={searchContainerRef} className="relative w-full sm:w-72">
          <Input
            placeholder={
              mode === 'search'
                ? t('sessions.placeholders.search_patient', 'Search patient...')
                : t('sessions.placeholders.enter_patient_name', 'Enter patient name')
            }
            value={mode === 'search' ? searchQuery : newPatientName}
            onChange={(e) => {
              if (mode === 'search') {
                setSearchQuery(e.target.value)
                if (patientId) {
                  // Clear selection when typing
                  useDocGenWizardStore.getState().setPatient('', '')
                }
                setShowResults(true)
              } else {
                setNewPatientName(e.target.value)
              }
            }}
            onFocus={() => {
              if (mode === 'search') {
                if (searchQuery.trim()) {
                  if (searchResults.length > 0) setShowResults(true)
                } else {
                  fetchRecentPatients()
                }
              }
            }}
            disabled={isCreating}
            className={`bg-white ${isSelected ? 'border-2 border-[var(--brand-tertiary)]' : ''}`}
          />

          {/* Search results dropdown */}
          {mode === 'search' && showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-md last:rounded-b-md border-b border-gray-100 last:border-b-0"
                  onClick={() => selectPatient(patient)}
                >
                  <div className="font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </div>
                  {patient.email && (
                    <div className="text-sm text-gray-500">{patient.email}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {mode === 'search' && isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
            </div>
          )}
        </div>

        {/* Status or action button */}
        {isSelected ? (
          <div className="flex items-center gap-1 font-medium flex-shrink-0 whitespace-nowrap" style={{ color: 'var(--brand-tertiary)' }}>
            <CheckCircle2 className="h-4 w-4" />
            {t('sessions.patient_selected', 'Patient selected')}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleModeToggle}
            disabled={isCreating || (mode === 'create' && !newPatientName.trim())}
            style={{ color: '#B725B7' }}
            className="flex items-center gap-1 hover:bg-purple-50 flex-shrink-0 whitespace-nowrap"
          >
            {mode === 'search' ? (
              <>
                <Plus className="w-4 h-4" />
                {t('sessions.create_new_patient', 'Create New Patient')}
              </>
            ) : (
              isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-1" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                t('common.save', 'Save')
              )
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
