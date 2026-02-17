import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { FileText, Layout, Download, Loader2 } from 'lucide-react'
import { marketplaceService, type MarketplaceItem as MarketplaceItemType } from '../../services/marketplaceService'

const specialtyColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700',
  dentistry: 'bg-emerald-100 text-emerald-700',
  nutrition: 'bg-orange-100 text-orange-700'
}

export const MarketplaceItemDetail: React.FC = () => {
  const { t } = useTranslation('hub')
  const { id } = useParams<{ id: string }>()

  const [item, setItem] = useState<MarketplaceItemType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return
      setIsLoading(true)
      try {
        const response = await marketplaceService.getItem(parseInt(id, 10))
        setItem(response.data)
      } catch (error) {
        console.error('Failed to fetch marketplace item:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchItem()
  }, [id])

  const handleImport = async () => {
    if (!item || isImporting) return
    setIsImporting(true)
    try {
      await marketplaceService.importItem(item.id)
      const response = await marketplaceService.getItem(item.id)
      setItem(response.data)
    } catch (error) {
      console.error('Failed to import item:', error)
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-500">{t('marketplace.empty_title')}</p>
      </div>
    )
  }

  const typeIcon = item.type === 'template'
    ? <FileText className="w-4 h-4" />
    : <Layout className="w-4 h-4" />

  const typeLabel = item.type === 'template'
    ? t('marketplace.type_template')
    : t('marketplace.type_landing_page')

  const specialtyLabel = t(`marketplace.specialty_${item.specialty}`, item.specialty)
  const specialtyColor = specialtyColors[item.specialty] || 'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {typeIcon}
              {typeLabel}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${specialtyColor}`}>
              {specialtyLabel}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {item.title}
          </h1>

          {item.description && (
            <p className="text-gray-600 mt-2">
              {item.description}
            </p>
          )}

          {item.importCount > 0 && (
            <p className="text-sm text-gray-400 mt-2">
              <Download className="w-3.5 h-3.5 inline mr-1" />
              {t('marketplace.imported_count', { count: item.importCount })}
            </p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={isImporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#B725B7] rounded-lg hover:bg-[#9a1f9a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('marketplace.importing')}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {t('marketplace.import_to_tq')}
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-700">
            {t('marketplace.preview')}
          </h2>
        </div>

        {item.type === 'template' ? (
          <div
            className="p-6 lg:p-8 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        ) : (
          item.thumbnailUrl ? (
            <div className="p-6 flex justify-center">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="max-w-full rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center text-gray-400 py-20">
              <Layout className="w-12 h-12 mb-2" />
              <p className="text-sm">{t('marketplace.type_landing_page')}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
