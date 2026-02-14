import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useOnboardingStore } from '../store/onboarding'
import { Header as CommonHeader } from '@client/common/components'
import { QuickSearchBar } from '../../components/home/QuickSearchBar'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { quotesService, Quote } from '../../services/quotes'
import { clinicalNotesService, ClinicalNote } from '../../services/clinicalNotes'
import { preventionService, Prevention } from '../../services/prevention'
import { templatesService, Template } from '../../services/templates'
import { landingPagesService, LandingPageTemplate } from '../../services/landingPages'
import { useTranslation } from 'react-i18next'
import { HelpCircle, Headphones } from 'lucide-react'
import { Tooltip, Button, SupportModal } from '@client/common/ui'

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
      case 'clinical-notes': return t('breadcrumbs.clinical_notes')
      case 'prevention': return t('breadcrumbs.prevention')
      case 'templates': return t('breadcrumbs.templates')
      case 'configurations': return t('breadcrumbs.configurations')
      case 'landing-pages': return t('breadcrumbs.landing_pages')
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

    // For documents routes: /documents/quote/:id/edit -> Home > Documents > Quotes > Edit
    if (segments[0] === 'documents' && segments.length >= 4 && isId(segments[2])) {
      if (index === 0) {
        breadcrumbs.push({ label: t('breadcrumbs.documents'), href: '/documents/quotes' })
      } else if (index === 1) {
        const docType = segment
        if (docType === 'quote') {
          breadcrumbs.push({ label: t('breadcrumbs.quotes'), href: '/quotes' })
        } else if (docType === 'clinical-note') {
          breadcrumbs.push({ label: t('breadcrumbs.clinical_notes'), href: '/documents/clinical-notes' })
        } else if (docType === 'prevention') {
          breadcrumbs.push({ label: t('breadcrumbs.prevention'), href: '/documents/prevention' })
        }
      } else if (index === 3) {
        breadcrumbs.push({ label: t('breadcrumbs.edit'), href: '#' })
      }
      return
    }

    // For landing-pages template design: /landing-pages/templates/:id/design -> Home > Landing Pages > Templates > Edit > Design
    if (segments[0] === 'landing-pages' && segments[1] === 'templates' && segments[3] === 'design') {
      if (index === 0) {
        breadcrumbs.push({ label: t('breadcrumbs.landing_pages'), href: '/landing-pages' })
      } else if (index === 1) {
        breadcrumbs.push({ label: t('breadcrumbs.templates'), href: '/landing-pages/templates' })
      } else if (index === 3) {
        const templateId = segments[2]
        breadcrumbs.push({ label: t('breadcrumbs.edit'), href: `/landing-pages/templates/${templateId}/edit` })
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
  const { openWizard } = useOnboardingStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([])
  const [prevention, setPrevention] = useState<Prevention[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [landingPageTemplates, setLandingPageTemplates] = useState<LandingPageTemplate[]>([])
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  // Load data for search
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [patientsRes, sessionsRes, quotesRes, reportsRes, preventionRes, templatesRes, landingPageTemplatesRes] = await Promise.all([
          patientsService.list({}),
          sessionsService.list({}),
          quotesService.list({}),
          clinicalNotesService.list({}),
          preventionService.list({}),
          templatesService.getAll({}),
          landingPagesService.listTemplates({ active: true })
        ])

        setPatients(patientsRes.data || [])
        setSessions(sessionsRes.data || [])
        setQuotes(quotesRes.data || [])
        setClinicalNotes(reportsRes.data || [])
        setPrevention(preventionRes.data || [])
        setTemplates(templatesRes.templates || [])
        setLandingPageTemplates(landingPageTemplatesRes.data || [])
      } catch (error) {
        // Failed to load search data
      }
    }

    loadSearchData()
  }, [])

  // Only show help button for admin users
  const isAdmin = user?.role === 'admin'
  const rightActions = (
    <div className="flex items-center gap-1">
      {/* Support Button */}
      <Tooltip content={t('header.support_tooltip', 'Suporte')} side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSupportOpen(true)}
          className="text-gray-500 hover:text-[#5ED6CE] transition-colors"
        >
          <Headphones className="w-5 h-5" />
        </Button>
      </Tooltip>

      {/* Help Button (admin only) */}
      {isAdmin && (
        <Tooltip content={t('header.help_tooltip', 'Setup Assistant')} side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={openWizard}
            className="text-gray-500 hover:text-[#B725B7] transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </Tooltip>
      )}
    </div>
  )

  return (
    <>
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
            clinicalNotes={clinicalNotes}
            prevention={prevention}
            templates={templates}
            landingPageTemplates={landingPageTemplates}
          />
        }
        rightActions={rightActions}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </>
  )
}
