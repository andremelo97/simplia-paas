import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { Card, Button, LinkToast } from '@client/common/ui'
import { useAuthStore } from '../../shared/store'
import { TemplateQuoteModal } from '../../components/new-session/TemplateQuoteModal'

export const DocumentsLayout: React.FC = () => {
  const { t } = useTranslation('tq')
  const { user } = useAuthStore()
  const canCreate = user?.role !== 'operations'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{itemId: string, itemNumber: string, type: 'quote' | 'clinical-note' | 'prevention'} | null>(null)

  const tabs = [
    { label: t('documents.tabs.quotes'), path: '/documents/quotes' },
    { label: t('documents.tabs.clinical_notes'), path: '/documents/clinical-notes' },
    { label: t('documents.tabs.prevention'), path: '/documents/prevention' },
    { label: t('documents.tabs.items'), path: '/documents/items' }
  ]

  const handleQuoteCreated = (documentId: string, documentNumber: string) => {
    setShowCreateModal(false)
    setToastData({ itemId: documentId, itemNumber: documentNumber, type: 'quote' })
    setShowLinkToast(true)
  }

  const handleClinicalNoteCreated = (documentId: string, documentNumber: string) => {
    setShowCreateModal(false)
    setToastData({ itemId: documentId, itemNumber: documentNumber, type: 'clinical-note' })
    setShowLinkToast(true)
  }

  const handlePreventionCreated = (documentId: string, documentNumber: string) => {
    setShowCreateModal(false)
    setToastData({ itemId: documentId, itemNumber: documentNumber, type: 'prevention' })
    setShowLinkToast(true)
  }

  return (
    <div className="space-y-8">
      {/* Header with Tabs */}
      <Card className="mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('documents.title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('documents.subtitle')}
              </p>
            </div>
            {canCreate && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('documents.create')}
              </Button>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <Outlet />

      {/* Create Document Modal */}
      <TemplateQuoteModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onQuoteCreated={handleQuoteCreated}
        onClinicalNoteCreated={handleClinicalNoteCreated}
        onPreventionCreated={handlePreventionCreated}
      />

      {/* Document Created Toast */}
      {toastData && (
        <LinkToast
          show={showLinkToast}
          itemNumber={toastData.itemNumber}
          itemId={toastData.itemId}
          onClose={() => setShowLinkToast(false)}
          type={toastData.type}
        />
      )}
    </div>
  )
}
