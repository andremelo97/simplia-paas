import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { Header as CommonHeader } from '@client/common/components'
import { QuickSearchBar } from '../../components/home/QuickSearchBar'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { quotesService, Quote } from '../../services/quotes'
import { clinicalReportsService, ClinicalReport } from '../../services/clinicalReports'
import { templatesService, Template } from '../../services/templates'
import { publicQuotesService, PublicQuoteTemplate } from '../../services/publicQuotes'
import { useTranslation } from 'react-i18next'

const getBreadcrumbs = (pathname: string, t: (key: string) => string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || pathname === '/') {
    return [{ label: t('breadcrumbs.home'), href: '/' }]
  }

  const breadcrumbs = [
    { label: t('breadcrumbs.home'), href: '/' }
  ]

  // Helper function to check if a segment is a numeric ID or UUID
  const isId = (segment: string) => {
    return /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
  }

  // Helper function to map segments to user-friendly labels
  const mapSegmentToLabel = (segment: string) => {
    switch (segment) {
      case 'patients': return t('breadcrumbs.patients')
      case 'sessions': return t('breadcrumbs.sessions')
      case 'quotes': return t('breadcrumbs.quotes')
      case 'clinical-reports': return t('breadcrumbs.clinical_reports')
      case 'templates': return t('breadcrumbs.templates')
      case 'configurations': return t('breadcrumbs.configurations')
      case 'public-quotes': return t('breadcrumbs.public_quotes')
      case 'new-session': return t('breadcrumbs.new_session')
      case 'create': return t('breadcrumbs.create')
      case 'edit': return t('breadcrumbs.edit')
      case 'design': return t('breadcrumbs.design')
      case 'history': return t('breadcrumbs.history')
      case 'ai-agent': return t('breadcrumbs.ai_agent')
      case 'email-template': return t('breadcrumbs.email_template')
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
        breadcrumbs.push({ label: t('breadcrumbs.patients'), href: '/patients' })
      } else if (index === 1) {
        breadcrumbs.push({ label: t('breadcrumbs.create'), href: '#' })
      }
      return
    }

    // For patient edit routes: /patients/:id/edit -> Home > Patients > Edit
    if (segments[0] === 'patients' && segments[2] === 'edit') {
      if (index === 0) {
        breadcrumbs.push({ label: t('breadcrumbs.patients'), href: '/patients' })
      } else if (index === 2) {
        breadcrumbs.push({ label: t('breadcrumbs.edit'), href: '#' })
      }
      return
    }

    // For public-quotes template design: /public-quotes/templates/:id/design -> Home > Public Quotes > Templates > Edit > Design
    if (segments[0] === 'public-quotes' && segments[1] === 'templates' && segments[3] === 'design') {
      if (index === 0) {
        breadcrumbs.push({ label: t('breadcrumbs.public_quotes'), href: '/public-quotes' })
      } else if (index === 1) {
        breadcrumbs.push({ label: t('breadcrumbs.templates'), href: '/public-quotes/templates' })
      } else if (index === 3) {
        const templateId = segments[2]
        breadcrumbs.push({ label: t('breadcrumbs.edit'), href: `/public-quotes/templates/${templateId}/edit` })
        breadcrumbs.push({ label: t('breadcrumbs.design'), href: '#' })
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
  const { t } = useTranslation('tq')
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

  return (
    <CommonHeader
      user={user}
      tenant={null}
      getBreadcrumbs={(pathname) => getBreadcrumbs(pathname, t)}
      getDisplayRole={getDisplayRole}
      showSearch={true}
      showNotifications={false}
      showLogout={false}
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
