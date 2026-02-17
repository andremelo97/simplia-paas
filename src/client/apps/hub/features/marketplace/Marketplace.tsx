import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Loader2, Package } from 'lucide-react'
import { marketplaceService, type MarketplaceItem } from '../../services/marketplaceService'
import { MarketplaceCard } from './MarketplaceCard'

const SPECIALTIES = ['general', 'dentistry', 'nutrition'] as const
const TYPES = ['template', 'landing_page'] as const

export const Marketplace: React.FC = () => {
  const { t } = useTranslation('hub')
  const navigate = useNavigate()

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [importingId, setImportingId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await marketplaceService.getItems({
        type: selectedType || undefined,
        specialty: selectedSpecialty || undefined,
        search: search || undefined,
        limit: 50
      })
      setItems(response.data)
      setTotal(response.meta.total)
    } catch (error) {
      console.error('Failed to fetch marketplace items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedType, selectedSpecialty, search])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleImport = async (item: MarketplaceItem) => {
    if (importingId) return
    setImportingId(item.id)
    try {
      await marketplaceService.importItem(item.id)
      // Refresh to update import counts
      fetchItems()
    } catch (error) {
      console.error('Failed to import item:', error)
    } finally {
      setImportingId(null)
    }
  }

  const handleView = (item: MarketplaceItem) => {
    navigate(`/marketplace/${item.id}`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {t('marketplace.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('marketplace.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('marketplace.search_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B725B7]/20 focus:border-[#B725B7] bg-white"
          />
        </div>

        {/* Type filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B725B7]/20 focus:border-[#B725B7] bg-white"
        >
          <option value="">{t('marketplace.filter_type')}</option>
          {TYPES.map(type => (
            <option key={type} value={type}>
              {t(`marketplace.type_${type}`)}
            </option>
          ))}
        </select>

        {/* Specialty filter */}
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B725B7]/20 focus:border-[#B725B7] bg-white"
        >
          <option value="">{t('marketplace.filter_specialty')}</option>
          {SPECIALTIES.map(specialty => (
            <option key={specialty} value={specialty}>
              {t(`marketplace.specialty_${specialty}`)}
            </option>
          ))}
        </select>

        {/* Result count */}
        {!isLoading && (
          <span className="text-xs text-gray-400 ml-auto">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-sm font-medium text-gray-900">
            {t('marketplace.empty_title')}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {t('marketplace.empty_description')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <MarketplaceCard
              key={item.id}
              item={item}
              onImport={handleImport}
              onView={handleView}
              isImporting={importingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
