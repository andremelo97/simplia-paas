import React, { useState, useEffect, useRef } from 'react'
import { Users, FileText, Receipt, ClipboardList, FileType, Layout, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SearchInput } from '@client/common/ui'
import { Patient } from '../../services/patients'
import { Session } from '../../services/sessions'
import { Quote } from '../../services/quotes'
import { ClinicalNote } from '../../services/clinicalNotes'
import { Prevention } from '../../services/prevention'
import { Template } from '../../services/templates'
import { LandingPageTemplate } from '../../services/landingPages'
import { useTranslation } from 'react-i18next'

interface SearchResult {
  id: string
  type: 'patient' | 'session' | 'quote' | 'clinical_note' | 'prevention' | 'template' | 'landing_page_template'
  title: string
  subtitle: string
  path: string
}

interface QuickSearchBarProps {
  patients: Patient[]
  sessions: Session[]
  quotes: Quote[]
  clinicalNotes: ClinicalNote[]
  prevention: Prevention[]
  templates: Template[]
  landingPageTemplates: LandingPageTemplate[]
}

export const QuickSearchBar: React.FC<QuickSearchBarProps> = ({ patients, sessions, quotes, clinicalNotes, prevention, templates, landingPageTemplates }) => {
  const { t } = useTranslation('tq')
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchQuery = query.toLowerCase()
    const foundResults: SearchResult[] = []

    // Search patients
    patients
      .filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        const email = p.email?.toLowerCase() || ''
        return fullName.includes(searchQuery) || email.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((p) => {
        foundResults.push({
          id: p.id,
          type: 'patient',
          title: `${p.first_name} ${p.last_name}`,
          subtitle: p.email || p.phone || t('home.search.no_contact'),
          path: `/patients/${p.id}/edit`
        })
      })

    // Search sessions
    sessions
      .filter((s) => {
        const number = s.number?.toLowerCase() || ''
        const patientName = `${s.patient_first_name} ${s.patient_last_name}`.toLowerCase()
        return number.includes(searchQuery) || patientName.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((s) => {
        foundResults.push({
          id: s.id,
          type: 'session',
          title: s.number,
          subtitle: `${s.patient_first_name} ${s.patient_last_name}`,
          path: `/sessions/${s.id}/edit`
        })
      })

    // Search quotes
    quotes
      .filter((q) => {
        const number = q.number?.toLowerCase() || ''
        const patientName = `${q.patient_first_name} ${q.patient_last_name}`.toLowerCase()
        return number.includes(searchQuery) || patientName.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((q) => {
        foundResults.push({
          id: q.id,
          type: 'quote',
          title: q.number,
          subtitle: `${q.patient_first_name} ${q.patient_last_name} - $${q.total?.toFixed(2)}`,
          path: `/documents/quote/${q.id}/edit`
        })
      })

    // Search clinical notes
    clinicalNotes
      .filter((r) => {
        const number = r.number?.toLowerCase() || ''
        const patientName = `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.toLowerCase()
        return number.includes(searchQuery) || patientName.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((r) => {
        foundResults.push({
          id: r.id,
          type: 'clinical_note',
          title: r.number,
          subtitle: `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.trim() || t('sessions.unknown_patient'),
          path: `/clinical-notes/${r.id}/edit`
        })
      })

    // Search prevention
    prevention
      .filter((p) => {
        const number = p.number?.toLowerCase() || ''
        const patientName = `${p.patient_first_name || ''} ${p.patient_last_name || ''}`.toLowerCase()
        return number.includes(searchQuery) || patientName.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((p) => {
        foundResults.push({
          id: p.id,
          type: 'prevention',
          title: p.number,
          subtitle: `${p.patient_first_name || ''} ${p.patient_last_name || ''}`.trim() || t('sessions.unknown_patient'),
          path: `/documents/prevention/${p.id}/edit`
        })
      })

    // Search templates
    templates
      .filter((t) => {
        const title = t.title?.toLowerCase() || ''
        const description = t.description?.toLowerCase() || ''
        return title.includes(searchQuery) || description.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((t) => {
        foundResults.push({
          id: t.id,
          type: 'template',
          title: t.title,
          subtitle: t.description || t('home.search.no_description'),
          path: `/templates/${t.id}/edit`
        })
      })

    // Search landing page templates
    landingPageTemplates
      .filter((lpt) => {
        const name = lpt.name?.toLowerCase() || ''
        const description = lpt.description?.toLowerCase() || ''
        return name.includes(searchQuery) || description.includes(searchQuery)
      })
      .slice(0, 3)
      .forEach((lpt) => {
        foundResults.push({
          id: lpt.id,
          type: 'landing_page_template',
          title: lpt.name,
          subtitle: lpt.description || t('home.search.no_description'),
          path: `/landing-pages/templates/${lpt.id}/edit`
        })
      })

    setResults(foundResults)
    setIsOpen(foundResults.length > 0)
    setSelectedIndex(0)
  }, [query, patients, sessions, quotes, clinicalNotes, prevention, templates, landingPageTemplates])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelectResult(results[selectedIndex])
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.path)
    setQuery('')
    setIsOpen(false)
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return <Users className="w-4 h-4 text-[#5ED6CE]" />
      case 'session':
        return <FileText className="w-4 h-4 text-[#B725B7]" />
      case 'quote':
        return <Receipt className="w-4 h-4 text-[#E91E63]" />
      case 'clinical_note':
        return <ClipboardList className="w-4 h-4 text-blue-600" />
      case 'prevention':
        return <Shield className="w-4 h-4 text-teal-600" />
      case 'template':
        return <FileType className="w-4 h-4 text-purple-600" />
      case 'landing_page_template':
        return <Layout className="w-4 h-4 text-[#E91E63]" />
    }
  }

  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-64">
      {/* Search Input */}
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={clearSearch}
        placeholder={t('common.search')}
      />

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelectResult(result)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-purple-50' : 'hover:bg-gray-50'
              } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">{getIcon(result.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
              </div>

              {/* Type badge */}
              <span className="flex-shrink-0 text-xs text-gray-400 uppercase">
                {result.type === 'clinical_note' ? t('home.search.badge_note') : result.type === 'landing_page_template' ? t('home.search.badge_lp_template') : result.type === 'prevention' ? t('home.search.badge_prevention') : t(`home.search.badge_${result.type}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
