import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Card, Button } from '@client/common/ui'
import { useAuthStore } from '../../shared/store'

export const DocumentsLayout: React.FC = () => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canCreate = user?.role !== 'operations'

  const tabs = [
    { label: t('documents.tabs.quotes'), path: '/documents/quotes' },
    { label: t('documents.tabs.clinical_notes'), path: '/documents/clinical-notes' },
    { label: t('documents.tabs.prevention'), path: '/documents/prevention' },
    { label: t('documents.tabs.items'), path: '/documents/items' }
  ]

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
                onClick={() => navigate('/documents/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
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
    </div>
  )
}
