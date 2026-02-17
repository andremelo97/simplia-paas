import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Layout, Download, Loader2 } from 'lucide-react'
import type { MarketplaceItem } from '../../services/marketplaceService'

interface MarketplaceCardProps {
  item: MarketplaceItem
  onImport: (item: MarketplaceItem) => void
  onView: (item: MarketplaceItem) => void
  isImporting?: boolean
}

const specialtyColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700',
  dentistry: 'bg-emerald-100 text-emerald-700',
  nutrition: 'bg-orange-100 text-orange-700'
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  item,
  onImport,
  onView,
  isImporting = false
}) => {
  const { t } = useTranslation('hub')

  const typeIcon = item.type === 'template'
    ? <FileText className="w-4 h-4" />
    : <Layout className="w-4 h-4" />

  const typeLabel = item.type === 'template'
    ? t('marketplace.type_template')
    : t('marketplace.type_landing_page')

  const specialtyLabel = t(`marketplace.specialty_${item.specialty}`, item.specialty)
  const specialtyColor = specialtyColors[item.specialty] || 'bg-gray-100 text-gray-700'

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex flex-col"
      onClick={() => onView(item)}
    >
      {/* Thumbnail / Preview */}
      {item.thumbnailUrl ? (
        <div className="aspect-[16/10] w-full overflow-hidden rounded-t-lg bg-gray-50">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : item.type === 'template' && item.content ? (
        <div className="aspect-[16/10] w-full rounded-t-lg bg-white overflow-hidden relative">
          <div
            className="absolute inset-0 origin-top-left scale-[0.35] w-[286%] h-[286%] p-6 prose prose-sm max-w-none pointer-events-none"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
        </div>
      ) : (
        <div className="aspect-[16/10] w-full rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-gray-300">
            <Layout className="w-10 h-10" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            {typeIcon}
            {typeLabel}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${specialtyColor}`}>
            {specialtyLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
            {item.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[11px] text-gray-400">
            {item.importCount > 0 && (
              <>
                <Download className="w-3 h-3 inline mr-0.5" />
                {t('marketplace.imported_count', { count: item.importCount })}
              </>
            )}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onImport(item)
            }}
            disabled={isImporting}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#B725B7] rounded-md hover:bg-[#9a1f9a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('marketplace.importing')}
              </>
            ) : (
              t('marketplace.import')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
