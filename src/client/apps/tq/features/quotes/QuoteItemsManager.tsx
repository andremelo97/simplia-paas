import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, PriceInput } from '@client/common/ui'
import { itemsService, Item } from '../../services/items'
import { QuoteItemInput } from '../../services/quotes'
import { Trash2, Plus } from 'lucide-react'
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'

interface LocalQuoteItem extends QuoteItemInput {
  localId: string // Temporary ID for local management
  itemName?: string
  itemBasePrice?: number
  isSearchMode?: boolean // True when showing search, false when showing full row
}

interface QuoteItemsManagerProps {
  quoteId: string
  initialItems?: LocalQuoteItem[]
  onItemsChange: (items: LocalQuoteItem[]) => void
  readonly?: boolean
}

export const QuoteItemsManager: React.FC<QuoteItemsManagerProps> = ({
  quoteId,
  initialItems = [],
  onItemsChange,
  readonly = false
}) => {
  const { t } = useTranslation('tq')
  const { formatCurrency } = useCurrencyFormatter()
  const [items, setItems] = useState<LocalQuoteItem[]>([])
  const [searchQuery, setSearchQuery] = useState<{ [key: string]: string }>({})
  const [searchResults, setSearchResults] = useState<{ [key: string]: Item[] }>({})
  const [showDropdown, setShowDropdown] = useState<{ [key: string]: boolean }>({})
  const searchTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize items and search queries ONLY ONCE when component mounts
  useEffect(() => {
    if (!isInitialized) {
      if (initialItems.length > 0) {
        // Mark existing items as NOT in search mode
        const itemsWithMode = initialItems.map(item => ({
          ...item,
          isSearchMode: false
        }))
        setItems(itemsWithMode)

        const queries: { [key: string]: string } = {}
        initialItems.forEach(item => {
          if (item.itemName) {
            queries[item.localId] = item.itemName
          }
        })
        setSearchQuery(queries)
      }
      setIsInitialized(true)
    }
  }, [initialItems, isInitialized])

  useEffect(() => {
    onItemsChange(items)
  }, [items])

  const handleAddRow = () => {
    const newItem: LocalQuoteItem = {
      localId: `temp-${Date.now()}`,
      itemId: '',
      quantity: 1,
      discountAmount: 0,
      isSearchMode: true // Start in search mode
    }
    setItems([...items, newItem])
  }

  const handleRemoveRow = (localId: string) => {
    setItems(items.filter(item => item.localId !== localId))
    // Clean up search state for this row
    const newSearchQuery = { ...searchQuery }
    const newSearchResults = { ...searchResults }
    const newShowDropdown = { ...showDropdown }
    delete newSearchQuery[localId]
    delete newSearchResults[localId]
    delete newShowDropdown[localId]
    setSearchQuery(newSearchQuery)
    setSearchResults(newSearchResults)
    setShowDropdown(newShowDropdown)
  }

  const handleSearch = async (localId: string, query: string) => {
    setSearchQuery({ ...searchQuery, [localId]: query })

    if (!query || query.length < 2) {
      setSearchResults({ ...searchResults, [localId]: [] })
      setShowDropdown({ ...showDropdown, [localId]: false })
      return
    }

    // Debounce search
    if (searchTimeoutRef.current[localId]) {
      clearTimeout(searchTimeoutRef.current[localId])
    }

    searchTimeoutRef.current[localId] = setTimeout(async () => {
      try {
        const response = await itemsService.list({
          query,
          activeOnly: true,
          pageSize: 10
        })
        setSearchResults({ ...searchResults, [localId]: response.data })
        setShowDropdown({ ...showDropdown, [localId]: true })
      } catch (error) {
        // Failed to search items
      }
    }, 300)
  }

  const handleSelectItem = (localId: string, item: Item) => {
    const basePrice = typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice
    setItems(items.map(i =>
      i.localId === localId
        ? {
            ...i,
            itemId: item.id,
            itemName: item.name,
            itemBasePrice: basePrice,
            isSearchMode: false // Switch to full row mode
          }
        : i
    ))
    setSearchQuery({ ...searchQuery, [localId]: item.name })
    setShowDropdown({ ...showDropdown, [localId]: false })
  }

  const handleUpdateQuantity = (localId: string, quantity: number) => {
    setItems(items.map(i =>
      i.localId === localId ? { ...i, quantity: Math.max(1, quantity) } : i
    ))
  }

  const handleUpdateDiscount = (localId: string, discountAmount: number) => {
    setItems(items.map(i =>
      i.localId === localId ? { ...i, discountAmount: Math.max(0, discountAmount) } : i
    ))
  }

  const calculateItemTotal = (item: LocalQuoteItem) => {
    if (!item.itemBasePrice) return 0
    return (item.itemBasePrice - (item.discountAmount || 0)) * (item.quantity || 1)
  }

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('quotes.quote_items')}</h2>
        </div>
        {!readonly && (
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors mt-3"
          >
            <Plus className="w-4 h-4" />
            <span>{t('quotes.add_item')}</span>
          </button>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t('quotes.no_items_yet')}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              return (
                <div
                  key={item.localId}
                  className="p-3 bg-gray-50 rounded-md space-y-3"
                >
                  {item.isSearchMode ? (
                  /* Search Mode - Only show search input */
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <Input
                        label={t('quotes.search_item')}
                        placeholder={t('quotes.placeholders.search_items')}
                        value={searchQuery[item.localId] || ''}
                        onChange={(e) => handleSearch(item.localId, e.target.value)}
                        onFocus={() => {
                          if (searchResults[item.localId]?.length > 0) {
                            setShowDropdown({ ...showDropdown, [item.localId]: true })
                          }
                        }}
                        autoFocus
                      />
                      {showDropdown[item.localId] && searchResults[item.localId]?.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchResults[item.localId].slice(0, 5).map((resultItem) => (
                            <button
                              key={resultItem.id}
                              onClick={() => handleSelectItem(item.localId, resultItem)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-gray-900">{resultItem.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatCurrency(resultItem.basePrice)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveRow(item.localId)}
                      className="flex items-center space-x-1 px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title={t('common.cancel')}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  /* Full Row Mode - Show all fields */
                  <>
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Item Name - 4 cols (read-only) */}
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('quotes.item_name')}
                        </label>
                        <div className="h-8 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md text-gray-900 flex items-center font-medium">
                          {item.itemName}
                        </div>
                      </div>

                      {/* Base Price - 2 cols (read-only) */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('quotes.base_price')}
                        </label>
                        <div className="h-8 px-2 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-md text-gray-700 flex items-center">
                          {formatCurrency(item.itemBasePrice || 0)}
                        </div>
                      </div>

                      {/* Quantity - 2 cols */}
                      <div className="col-span-2">
                        <Input
                          label={t('quotes.quantity')}
                          type="number"
                          min={1}
                          value={item.quantity || 1}
                          onChange={(e) => handleUpdateQuantity(item.localId, parseInt(e.target.value) || 1)}
                          disabled={readonly}
                        />
                      </div>

                      {/* Discount - 2 cols */}
                      <div className="col-span-2">
                        <PriceInput
                          label={t('quotes.discount')}
                          value={item.discountAmount || 0}
                          onChange={(value) => handleUpdateDiscount(item.localId, value)}
                          disabled={readonly}
                        />
                      </div>

                      {/* Total - 2 cols */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('common.total')}
                        </label>
                        <div className="h-8 px-2 py-1.5 text-xs font-semibold bg-purple-50 border border-purple-200 rounded-md text-purple-700 flex items-center justify-center">
                          {formatCurrency(calculateItemTotal(item))}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button - Separate row below */}
                    {!readonly && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemoveRow(item.localId)}
                          className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title={t('quotes.remove_item')}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('quotes.remove')}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
            })}

            {/* Grand Total */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">{t('quotes.quote_total')}</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(calculateGrandTotal())}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}