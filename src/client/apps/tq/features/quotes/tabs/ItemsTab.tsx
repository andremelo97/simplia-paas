import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

export const ItemsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const {
    data: items,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setQuery,
    refresh
  } = useItemsList({
    query: searchQuery
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleCreateItem = () => {
    navigate('/quotes/items/create')
  }

  const handleEditItem = (item: Item) => {
    navigate(`/quotes/items/${item.id}/edit`)
  }

  const handleDeleteItem = (item: Item) => {
    // Placeholder: Will be implemented later
    console.log('Delete item:', item)
  }


  return (
    <div className="space-y-8">
      {/* Search */}
      <ItemFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      {/* Items List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Items ({items?.length || 0} of {total} items)
            </CardTitle>
            <Button
              onClick={handleCreateItem}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Item
            </Button>
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
                  Try again
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
                <div className="w-24">Created</div>
                <div className="flex-1">Name</div>
                <div className="flex-1">Description</div>
                <div className="flex-1">Base Price</div>
                <div className="flex-1">Status</div>
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