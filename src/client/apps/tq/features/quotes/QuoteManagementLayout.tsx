import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@client/common/ui'

export const QuoteManagementLayout: React.FC = () => {
  const { t } = useTranslation('tq')

  const tabs = [
    { label: t('quotes.pages.tab_quotes'), path: '/quotes/overview' },
    { label: t('quotes.pages.tab_items'), path: '/quotes/items' }
  ]

  return (
    <div className="space-y-8">
      {/* Header with Tabs */}
      <Card className="mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('quotes.pages.management_title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('quotes.pages.management_subtitle')}
              </p>
            </div>
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