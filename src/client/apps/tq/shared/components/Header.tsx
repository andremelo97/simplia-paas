import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { authService } from '../../services/auth'
import { Header as CommonHeader } from '@client/common/components'
import { QuickSearchBar } from '../../components/home/QuickSearchBar'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { quotesService, Quote } from '../../services/quotes'
import { clinicalReportsService, ClinicalReport } from '../../services/clinicalReports'
import { templatesService, Template } from '../../services/templates'
import { publicQuotesService, PublicQuoteTemplate } from '../../services/publicQuotes'
import { Search } from 'lucide-react'

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || pathname === '/') {
    return [{ label: 'Home', href: '/' }]
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' }
  ]

  // Helper function to check if a segment is a numeric ID or UUID
  const isId = (segment: string) => {
    return /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
  }

  // Helper function to map segments to user-friendly labels
  const mapSegmentToLabel = (segment: string) => {
    switch (segment) {
      case 'patients': return 'Patients'
      case 'sessions': return 'Sessions'
      case 'quotes': return 'Quotes'
      case 'clinical-reports': return 'Clinical Reports'
      case 'templates': return 'Templates'
      case 'configurations': return 'Configurations'
      case 'public-quotes': return 'Public Quotes'
      case 'new-session': return 'New Session'
      case 'create': return 'Create'
      case 'edit': return 'Edit'
      case 'design': return 'Design'
      default: return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
  }

  segments.forEach((segment, index) => {
    // Skip numeric IDs and UUIDs - never show them in breadcrumbs
    if (isId(segment)) {
      return
    }

    // For patients create route: /patients/create -> Home > Patients > Create
    if (segments[0] === 'patients' && segments[1] === 'create') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Patients', href: '/patients' })
      } else if (index === 1) {
        breadcrumbs.push({ label: 'Create', href: '#' })
      }
      return
    }

    // For patient edit routes: /patients/:id/edit -> Home > Patients > Edit
    if (segments[0] === 'patients' && segments[2] === 'edit') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Patients', href: '/patients' })
      } else if (index === 2) {
        breadcrumbs.push({ label: 'Edit', href: '#' })
      }
      return
    }

    // For public-quotes template design: /public-quotes/templates/:id/design -> Home > Public Quotes > Templates > Edit > Design
    if (segments[0] === 'public-quotes' && segments[1] === 'templates' && segments[3] === 'design') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Public Quotes', href: '/public-quotes' })
      } else if (index === 1) {
        breadcrumbs.push({ label: 'Templates', href: '/public-quotes/templates' })
      } else if (index === 3) {
        const templateId = segments[2]
        breadcrumbs.push({ label: 'Edit', href: `/public-quotes/templates/${templateId}/edit` })
        breadcrumbs.push({ label: 'Design', href: '#' })
      }
      return
    }

    // Default case: add non-ID segments as breadcrumbs
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = mapSegmentToLabel(segment)
    breadcrumbs.push({ label, href })
  })

  return breadcrumbs
}

const getDisplayRole = (user: any) => {
  if (user?.userType?.slug) {
    return user.userType.slug.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }
  // Get TQ-specific role from allowedApps instead of global role
  const tqApp = user?.allowedApps?.find((app: any) => app.slug === 'tq')
  if (tqApp?.roleInApp) {
    return tqApp.roleInApp.charAt(0).toUpperCase() + tqApp.roleInApp.slice(1)
  }
  return user?.role || 'User'
}

export const Header: React.FC = () => {
  const { user } = useAuthStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clinicalReports, setClinicalReports] = useState<ClinicalReport[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [publicQuoteTemplates, setPublicQuoteTemplates] = useState<PublicQuoteTemplate[]>([])

  // Load data for search
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [patientsRes, sessionsRes, quotesRes, reportsRes, templatesRes, publicQuoteTemplatesRes] = await Promise.all([
          patientsService.list({}),
          sessionsService.list({}),
          quotesService.list({}),
          clinicalReportsService.list({}),
          templatesService.getAll({}),
          publicQuotesService.listTemplates({ active: true })
        ])

        setPatients(patientsRes.data || [])
        setSessions(sessionsRes.data || [])
        setQuotes(quotesRes.data || [])
        setClinicalReports(reportsRes.data || [])
        setTemplates(templatesRes.templates || [])
        setPublicQuoteTemplates(publicQuoteTemplatesRes.data || [])
      } catch (error) {
        console.error('Failed to load search data:', error)
      }
    }

    loadSearchData()
  }, [])

  const handleLogout = () => {
    authService.logout()
  }

  return (
    <CommonHeader
      user={user}
      tenant={null}
      onLogout={handleLogout}
      getBreadcrumbs={getBreadcrumbs}
      getDisplayRole={getDisplayRole}
      showSearch={true}
      showNotifications={false}
      searchComponent={
        <QuickSearchBar
          patients={patients}
          sessions={sessions}
          quotes={quotes}
          clinicalReports={clinicalReports}
          templates={templates}
          publicQuoteTemplates={publicQuoteTemplates}
        />
      }
    />
  )
}