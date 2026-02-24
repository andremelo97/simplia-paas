import React, { useMemo } from 'react'
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

const extractPuckHeroTitle = (content: string): string | null => {
  try {
    const parsed = JSON.parse(content)
    const hero = parsed?.content?.find((c: any) => c.type === 'Hero')
    return hero?.props?.title || null
  } catch {
    return null
  }
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  item,
  onImport,
  onView,
  isImporting = false
}) => {
  const { t } = useTranslation('hub')

  const specialtyLabel = t(`marketplace.specialty_${item.specialty}`, item.specialty)
  const specialtyColor = specialtyColors[item.specialty] || 'bg-gray-100 text-gray-700'

  const typeLabel = item.type === 'template'
    ? t('marketplace.type_template')
    : t('marketplace.type_landing_page')

  const lpHeroTitle = useMemo(() => {
    if (item.type === 'landing_page' && item.content) {
      return extractPuckHeroTitle(item.content)
    }
    return null
  }, [item.type, item.content])

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-[#B725B7]/30 hover:shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col"
      onClick={() => onView(item)}
    >
      {/* Preview area */}
      {item.thumbnailUrl ? (
        <div className="h-28 w-full overflow-hidden rounded-t-lg bg-gray-50">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : item.type === 'template' && item.content ? (
        <div className="h-28 w-full rounded-t-lg bg-white overflow-hidden relative border-b border-gray-100">
          <div
            className="absolute inset-0 origin-top-left scale-[0.25] w-[400%] h-[400%] p-4 prose prose-sm max-w-none pointer-events-none select-none"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
        </div>
      ) : item.type === 'landing_page' ? (
        <div className="h-28 w-full rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center border-b border-gray-100 px-4">
          <Layout className="w-6 h-6 text-gray-300 mb-1" />
          {lpHeroTitle && (
            <p className="text-[0.625rem] text-gray-400 text-center line-clamp-2">{lpHeroTitle}</p>
          )}
        </div>
      ) : (
        <div className="h-28 w-full rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b border-gray-100">
          <FileText className="w-6 h-6 text-gray-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 flex-1">
            {item.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium bg-gray-100 text-gray-600">
            {item.type === 'template' ? <FileText className="w-3 h-3" /> : <Layout className="w-3 h-3" />}
            {typeLabel}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium ${specialtyColor}`}>
            {specialtyLabel}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <span className="text-[0.625rem] text-gray-400">
            {item.importCount > 0 && (
              <>
                <Download className="w-3 h-3 inline mr-0.5" />
                {item.importCount}
              </>
            )}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onImport(item)
            }}
            disabled={isImporting}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[0.6875rem] font-medium text-white bg-[#B725B7] rounded-md hover:bg-[#9a1f9a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
