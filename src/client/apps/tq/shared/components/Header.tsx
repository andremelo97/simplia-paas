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
  const home = { label: t('breadcrumbs.home'), href: '/' }
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || pathname === '/' || pathname === '/home') {
    return [home]
  }

  const isId = (s: string) =>
    /^\d+$/.test(s) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

  const s = segments

  // --- Patients ---
  if (s[0] === 'patients') {
    const patients = { label: t('breadcrumbs.patients'), href: '/patients' }
    if (s[1] === 'create') return [home, patients, { label: t('breadcrumbs.create'), href: '#' }]
    if (s[2] === 'edit') return [home, patients, { label: t('breadcrumbs.edit'), href: '#' }]
    if (s[2] === 'history') return [home, patients, { label: t('breadcrumbs.history'), href: '#' }]
    return [home, patients]
  }

  // --- Sessions ---
  if (s[0] === 'sessions') {
    const sessions = { label: t('breadcrumbs.sessions'), href: '/sessions' }
    if (s.length >= 2 && isId(s[1])) return [home, sessions, { label: t('breadcrumbs.edit'), href: '#' }]
    return [home, sessions]
  }

  // --- New Session ---
  if (s[0] === 'new-session') {
    return [home, { label: t('breadcrumbs.new_session'), href: '#' }]
  }

  // --- Documents (skip "Documents" level, go straight to sub-section) ---
  if (s[0] === 'documents') {
    // /documents/items/create
    if (s[1] === 'items' && s[2] === 'create') {
      return [home, { label: t('breadcrumbs.items'), href: '/documents/items' }, { label: t('breadcrumbs.create'), href: '#' }]
    }
    // /documents/items/:id/edit
    if (s[1] === 'items' && s.length >= 4 && isId(s[2])) {
      return [home, { label: t('breadcrumbs.items'), href: '/documents/items' }, { label: t('breadcrumbs.edit'), href: '#' }]
    }
    // /documents/items
    if (s[1] === 'items') {
      return [home, { label: t('breadcrumbs.items'), href: '/documents/items' }]
    }
    // /documents/quote/:id/edit or /documents/:docType/:id/edit
    if (s.length >= 4 && isId(s[2])) {
      const docType = s[1]
      if (docType === 'quote') return [home, { label: t('breadcrumbs.quotes'), href: '/documents/quotes' }, { label: t('breadcrumbs.edit'), href: '#' }]
      if (docType === 'clinical-note') return [home, { label: t('breadcrumbs.clinical_notes'), href: '/documents/clinical-notes' }, { label: t('breadcrumbs.edit'), href: '#' }]
      if (docType === 'prevention') return [home, { label: t('breadcrumbs.prevention'), href: '/documents/prevention' }, { label: t('breadcrumbs.edit'), href: '#' }]
    }
    // /documents/quotes, /documents/clinical-notes, /documents/prevention
    if (s[1] === 'quotes') return [home, { label: t('breadcrumbs.quotes'), href: '/documents/quotes' }]
    if (s[1] === 'clinical-notes') return [home, { label: t('breadcrumbs.clinical_notes'), href: '/documents/clinical-notes' }]
    if (s[1] === 'prevention') return [home, { label: t('breadcrumbs.prevention'), href: '/documents/prevention' }]
    // /documents (redirects to quotes)
    return [home, { label: t('breadcrumbs.quotes'), href: '/documents/quotes' }]
  }

  // --- Templates ---
  if (s[0] === 'templates') {
    const templates = { label: t('breadcrumbs.templates'), href: '/templates' }
    if (s[1] === 'create') return [home, templates, { label: t('breadcrumbs.create'), href: '#' }]
    if (s.length >= 3 && isId(s[1]) && s[2] === 'edit') return [home, templates, { label: t('breadcrumbs.edit'), href: '#' }]
    return [home, templates]
  }

  // --- Landing Pages ---
  if (s[0] === 'landing-pages') {
    const lp = { label: t('breadcrumbs.landing_pages'), href: '/landing-pages' }
    if (s[1] === 'templates') {
      const lpTemplates = { label: t('breadcrumbs.templates'), href: '/landing-pages/templates' }
      if (s[2] === 'create') return [home, lp, lpTemplates, { label: t('breadcrumbs.create'), href: '#' }]
      if (s.length >= 4 && isId(s[2]) && s[3] === 'edit') return [home, lp, lpTemplates, { label: t('breadcrumbs.edit'), href: '#' }]
      if (s.length >= 4 && isId(s[2]) && s[3] === 'design') return [home, lp, lpTemplates, { label: t('breadcrumbs.design'), href: '#' }]
      return [home, lp, lpTemplates]
    }
    return [home, lp]
  }

  // --- Configurations ---
  if (s[0] === 'configurations') {
    const config = { label: t('breadcrumbs.configurations'), href: '/configurations' }
    if (s[1] === 'email-template') return [home, config, { label: t('breadcrumbs.email_template'), href: '#' }]
    return [home, config]
  }

  // --- OLD routes (backwards compat) ---
  if (s[0] === 'clinical-notes') {
    const cn = { label: t('breadcrumbs.clinical_notes'), href: '/documents/clinical-notes' }
    if (s.length >= 3 && isId(s[1]) && s[2] === 'edit') return [home, cn, { label: t('breadcrumbs.edit'), href: '#' }]
    return [home, cn]
  }
  if (s[0] === 'prevention') {
    const prev = { label: t('breadcrumbs.prevention'), href: '/documents/prevention' }
    if (s.length >= 3 && isId(s[1]) && s[2] === 'edit') return [home, prev, { label: t('breadcrumbs.edit'), href: '#' }]
    return [home, prev]
  }
  if (s[0] === 'quotes') {
    if (s[1] === 'items') {
      const items = { label: t('breadcrumbs.items'), href: '/documents/items' }
      if (s[2] === 'create') return [home, items, { label: t('breadcrumbs.create'), href: '#' }]
      if (s.length >= 4 && isId(s[2]) && s[3] === 'edit') return [home, items, { label: t('breadcrumbs.edit'), href: '#' }]
      return [home, items]
    }
    const quotes = { label: t('breadcrumbs.quotes'), href: '/documents/quotes' }
    if (s.length >= 3 && isId(s[1]) && s[2] === 'edit') return [home, quotes, { label: t('breadcrumbs.edit'), href: '#' }]
    return [home, quotes]
  }

  // --- Fallback: capitalize segments ---
  const breadcrumbs = [home]
  segments.forEach((seg, i) => {
    if (!isId(seg)) {
      breadcrumbs.push({
        label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: i === segments.length - 1 ? '#' : '/' + segments.slice(0, i + 1).join('/')
      })
    }
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

interface TQHeaderProps {
  onMenuToggle?: () => void
  onOpenAIChat?: () => void
}

export const Header: React.FC<TQHeaderProps> = ({ onMenuToggle, onOpenAIChat }) => {
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
      <Tooltip content={t('header.support_tooltip', 'Support & Assistance')} side="bottom">
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
          onMenuToggle={onMenuToggle}
        />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        onOpenAIChat={onOpenAIChat}
      />
    </>
  )
}
