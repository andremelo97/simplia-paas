import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Paginator,
  Button
} from '@client/common/ui'
import { useItemsList } from '../../../hooks/useItems'
import { ItemRow } from '../../../components/items/ItemRow'
import { ItemsEmpty } from '../../../components/items/ItemsEmpty'
import { ItemFilters } from '../../../components/items/ItemFilters'
import { Item } from '../../../services/items'
import { useAuthStore } from '../../../shared/store'

export const ItemsDocumentsTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const {
    data: items,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setQuery,
    setActiveOnly,
    refresh
  } = useItemsList({
    query: searchQuery,
    activeOnly: !includeInactive
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleIncludeInactiveChange = (include: boolean) => {
    setIncludeInactive(include)
    setActiveOnly(!include)
  }

  const handleCreateItem = () => {
    // Navigate to the new documents items path
    navigate('/documents/items/create')
  }

  const handleEditItem = (item: Item) => {
    // Navigate to the new documents items path
    navigate(`/documents/items/${item.id}/edit`)
  }

  const handleDeleteItem = (item: Item) => {
    // Placeholder: Will be implemented later
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <ItemFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        includeInactive={includeInactive}
        onIncludeInactiveChange={handleIncludeInactiveChange}
      />

      {/* Items List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t('quote_items.pages.list_title')} ({items?.length || 0} {t('common.of')} {total} {t('quote_items.pages.items')})
            </CardTitle>
            {canEdit && (
              <Button
                onClick={handleCreateItem}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('quote_items.pages.create_item')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Error State */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription>
                {error}{' '}
                <button
                  onClick={refresh}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  {t('common.try_again')}
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (items?.length || 0) === 0 && (
            <ItemsEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Items List */}
          {!loading && !error && (items?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-2 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('common.name')}</div>
                <div className="flex-1">{t('common.description')}</div>
                <div className="flex-1">{t('quote_items.base_price')}</div>
                <div className="flex-1">{t('common.status')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Item Rows */}
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Paginator
                  currentPage={currentPage}
                  totalItems={total}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
