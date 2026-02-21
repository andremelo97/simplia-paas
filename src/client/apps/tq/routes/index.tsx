import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RouteGuard } from '../shared/components/RouteGuard'
import { Layout } from '../shared/components/Layout'
import { Login } from '../features/auth/Login'
import { Home } from '../features/home/Home'
import { NewSession } from '../features/session/NewSession'
import { Sessions } from '../features/session/Sessions'
import { EditSession } from '../features/session/EditSession'
import { Patients } from '../features/patients/Patients'
import { CreatePatient } from '../features/patients/CreatePatient'
import { EditPatient } from '../features/patients/EditPatient'
import { PatientHistory } from '../features/patients/PatientHistory'
import { QuoteManagementLayout } from '../features/quotes/QuoteManagementLayout'
import { QuotesTab } from '../features/quotes/tabs/QuotesTab'
import { ItemsTab } from '../features/quotes/tabs/ItemsTab'
import { CreateItem } from '../features/quotes/items/CreateItem'
import { EditItem } from '../features/quotes/items/EditItem'
import { Templates } from '../features/templates/Templates'
import { CreateTemplate } from '../features/templates/CreateTemplate'
import { EditTemplate } from '../features/templates/EditTemplate'
import { EditQuote } from '../features/quotes/EditQuote'
import { PreviewPublicQuote } from '../features/quotes/PreviewPublicQuote'
import { ClinicalNotes } from '../features/clinical-notes/ClinicalNotes'
import { EditClinicalNote } from '../features/clinical-notes/EditClinicalNote'
import { Prevention } from '../features/prevention/Prevention'
import { EditPrevention } from '../features/prevention/EditPrevention'
import { LandingPagesLayout } from '../features/landing-pages/LandingPagesLayout'
import { DocumentsLayout, EditDocument, QuotesDocumentsTab, ClinicalNotesDocumentsTab, PreventionDocumentsTab, ItemsDocumentsTab } from '../features/documents'
import { LinksTab } from '../features/landing-pages/tabs/LinksTab'
import { TemplatesTab } from '../features/landing-pages/tabs/TemplatesTab'
import { CreateLandingPageTemplate } from '../features/landing-pages/CreateLandingPageTemplate'
import { EditLandingPageTemplate } from '../features/landing-pages/EditLandingPageTemplate'
import { DesignLandingPageTemplate } from '../features/landing-pages/DesignLandingPageTemplate'
import { PreviewLandingPageTemplate } from '../features/landing-pages/PreviewLandingPageTemplate'
import { LandingPageAccess } from '../features/landing-pages/LandingPageAccess'
import { PreviewLandingPageLink } from '../features/landing-pages/PreviewLandingPageLink'
import { Configurations } from '../features/configurations/Configurations'
import { EmailTemplateConfiguration } from '../features/configurations/EmailTemplateConfiguration'

const NotFound: React.FC = () => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
    </div>
  </div>
)

const Unauthorized: React.FC = () => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">403 - Unauthorized</h1>
      <p className="text-gray-600">You don't have permission to access TQ application.</p>
    </div>
  </div>
)


// Redirect to Hub helper component
const RedirectToHub: React.FC = () => {
  React.useEffect(() => {
    const hubUrl = import.meta.env.VITE_HUB_ORIGIN
      || (window.location.hostname.includes('tq-test')
        ? 'https://hub-test.livocare.ai'
        : 'https://hub.livocare.ai')
    window.location.href = hubUrl
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Hub...</h1>
        <p className="text-gray-600">Please access TQ through the Hub application.</p>
      </div>
    </div>
  )
}

// Redirect to documents quotes (new unified route)
const QuotesRedirect: React.FC = () => {
  return <Navigate to="/documents/quotes" replace />
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Landing Page Access - Completely public, no auth required */}
      {/* Public route for patient access - NO AUTH */}
      <Route path="/lp/:accessToken" element={<LandingPageAccess />} />

      {/* Preview Landing Page Template - Completely isolated, no auth/layout */}
      <Route path="/landing-pages/templates/:id/preview" element={<PreviewLandingPageTemplate />} />

      {/* Preview Document Landing Page - Isolated preview with auth but no layout */}
      <Route
        path="/documents/:documentType/:id/preview/:templateId"
        element={
          <RouteGuard requireAuth requiredApp="tq">
            <PreviewPublicQuote />
          </RouteGuard>
        }
      />

      {/* Preview Landing Page Link - Isolated preview (auth user sees what patient sees) */}
      <Route
        path="/landing-pages/links/:id/preview"
        element={
          <RouteGuard requireAuth requiredApp="tq">
            <PreviewLandingPageLink />
          </RouteGuard>
        }
      />

      {/* Design Landing Page Template - Full screen Puck editor, no layout */}
      <Route
        path="/landing-pages/templates/:id/design"
        element={
          <RouteGuard requireAuth requiredApp="tq">
            <DesignLandingPageTemplate />
          </RouteGuard>
        }
      />

      <Route
        path="/*"
        element={
          <RouteGuard requireAuth requiredApp="tq">
            <Layout />
          </RouteGuard>
        }
      >
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="new-session" element={
          <RouteGuard requireAuth requiredRole="manager" requiredApp="tq">
            <NewSession />
          </RouteGuard>
        } />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:id/edit" element={<EditSession />} />
        {/* Patients - Operations can create and edit */}
        <Route path="patients" element={<Patients />} />
        <Route path="patients/create" element={<CreatePatient />} />
        <Route path="patients/:id/edit" element={<EditPatient />} />
        <Route path="patients/:id/history" element={<PatientHistory />} />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/create" element={
          <RouteGuard requireAuth requiredRole="manager" requiredApp="tq">
            <CreateTemplate />
          </RouteGuard>
        } />
        <Route path="templates/:id/edit" element={<EditTemplate />} />

        {/* Documents with Tabs (NEW unified structure) */}
        <Route path="documents" element={<DocumentsLayout />}>
          <Route index element={<Navigate to="quotes" replace />} />
          <Route path="quotes" element={<QuotesDocumentsTab />} />
          <Route path="clinical-notes" element={<ClinicalNotesDocumentsTab />} />
          <Route path="prevention" element={<PreventionDocumentsTab />} />
          <Route path="items" element={<ItemsDocumentsTab />} />
        </Route>

        {/* Documents Edit routes (outside layout for full page) - Using unified EditDocument */}
        <Route path="documents/:documentType/:id/edit" element={<EditDocument />} />

        <Route path="documents/items/create" element={
          <RouteGuard requireAuth requiredRole="manager" requiredApp="tq">
            <CreateItem />
          </RouteGuard>
        } />
        <Route path="documents/items/:id/edit" element={<EditItem />} />

        {/* Clinical Notes (OLD routes - kept for backwards compatibility) */}
        <Route path="clinical-notes" element={<ClinicalNotes />} />
        <Route path="clinical-notes/:id/edit" element={<EditClinicalNote />} />

        {/* Prevention (OLD routes - redirect to new documents system) */}
        <Route path="prevention" element={<Prevention />} />
        <Route path="prevention/:id/edit" element={<EditPrevention />} />

        {/* Quote Management with Tabs (OLD routes - kept for backwards compatibility) */}
        <Route path="quotes" element={<QuoteManagementLayout />}>
          <Route index element={<QuotesRedirect />} />
          <Route path="overview" element={<QuotesTab />} />
          <Route path="items" element={<ItemsTab />} />
          <Route path="items/create" element={
            <RouteGuard requireAuth requiredRole="manager" requiredApp="tq">
              <CreateItem />
            </RouteGuard>
          } />
          <Route path="items/:id/edit" element={<EditItem />} />
        </Route>

        {/* Landing Pages with Tabs */}
        <Route path="landing-pages" element={<LandingPagesLayout />}>
          <Route index element={<Navigate to="/landing-pages/links" replace />} />
          <Route path="links" element={<LinksTab />} />
          <Route path="templates" element={<TemplatesTab />} />
        </Route>

        {/* Create Landing Page Template - Outside layout for full page */}
        <Route path="landing-pages/templates/create" element={
          <RouteGuard requireAuth requiredRole="manager" requiredApp="tq">
            <CreateLandingPageTemplate />
          </RouteGuard>
        } />

        {/* Edit Landing Page Template - Outside layout for full page */}
        <Route path="landing-pages/templates/:id/edit" element={<EditLandingPageTemplate />} />


        {/* Configurations - Admin only */}
        <Route path="configurations" element={
          <RouteGuard requireAuth requiredRole="admin" requiredApp="tq">
            <Configurations />
          </RouteGuard>
        }>
          <Route index element={<Navigate to="email-template" replace />} />
          <Route path="email-template" element={<EmailTemplateConfiguration />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
