import { useState, useCallback, useRef, useEffect } from 'react'
import { patientsService, Patient } from '../services/patients'
import { usersService, TenantUser } from '../services/users'
import { ComboboxOption } from '@client/common/ui'

interface UseFilterOptionsReturn {
  options: ComboboxOption[]
  loading: boolean
  search: (query: string) => void
}

/**
 * Hook for loading patient options for filter combobox
 * Loads all patients initially, then filters client-side
 */
export const usePatientOptions = (): UseFilterOptionsReturn => {
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const initialLoadDone = useRef(false)

  // Load all patients once on mount
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const loadPatients = async () => {
      setLoading(true)
      try {
        const response = await patientsService.list({ limit: 500 })
        setAllPatients(response.data)
        setOptions(
          response.data.map((p) => ({
            value: p.id,
            label: `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`
          }))
        )
      } catch (error) {
        console.error('Failed to load patients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPatients()
  }, [])

  // Client-side filtering
  const search = useCallback(
    (query: string) => {
      if (!query) {
        setOptions(
          allPatients.map((p) => ({
            value: p.id,
            label: `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`
          }))
        )
        return
      }

      const queryLower = query.toLowerCase()
      const filtered = allPatients.filter((p) => {
        const fullName = `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`.toLowerCase()
        return fullName.includes(queryLower)
      })

      setOptions(
        filtered.map((p) => ({
          value: p.id,
          label: `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`
        }))
      )
    },
    [allPatients]
  )

  return { options, loading, search }
}

/**
 * Hook for loading user options for filter combobox
 * Uses server-side search with debounce
 */
export const useUserOptions = (): UseFilterOptionsReturn => {
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [allUsers, setAllUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(false)
  const initialLoadDone = useRef(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // Load all users once on mount
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const loadUsers = async () => {
      setLoading(true)
      try {
        const users = await usersService.list({ limit: 100 })
        setAllUsers(users)
        setOptions(
          users.map((u) => ({
            value: u.id.toString(),
            label: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`
          }))
        )
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Client-side filtering with debounce for consistency
  const search = useCallback(
    (query: string) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }

      debounceTimeout.current = setTimeout(() => {
        if (!query) {
          setOptions(
            allUsers.map((u) => ({
              value: u.id.toString(),
              label: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`
            }))
          )
          return
        }

        const queryLower = query.toLowerCase()
        const filtered = allUsers.filter((u) => {
          const fullName = `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`.toLowerCase()
          return fullName.includes(queryLower)
        })

        setOptions(
          filtered.map((u) => ({
            value: u.id.toString(),
            label: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`
          }))
        )
      }, 150)
    },
    [allUsers]
  )

  return { options, loading, search }
}
