import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { FileText, Layout, Download, Loader2, Maximize2, Minimize2, X } from 'lucide-react'
import { marketplaceService, type MarketplaceItem as MarketplaceItemType } from '../../services/marketplaceService'
import { createConfigWithResolvedData } from '@client/apps/tq/features/landing-pages/puck-config-preview'
import type { BrandingData } from '@client/apps/tq/services/branding'

const specialtyColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700',
  dentistry: 'bg-emerald-100 text-emerald-700',
  nutrition: 'bg-orange-100 text-orange-700'
}

const defaultBranding: BrandingData = {
  tenantId: 0,
  primaryColor: '#B725B7',
  secondaryColor: '#5ED6CE',
  tertiaryColor: '#E91E63',
  logoUrl: null,
  companyName: 'LivoCare',
}

export const MarketplaceItemDetail: React.FC = () => {
  const { t } = useTranslation('hub')
  const { id } = useParams<{ id: string }>()

  const [item, setItem] = useState<MarketplaceItemType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  const puckConfig = useMemo(() => {
    if (item?.type === 'landing_page') {
      return createConfigWithResolvedData(defaultBranding, {})
    }
    return null
  }, [item?.type])

  const puckData = useMemo(() => {
    if (item?.type === 'landing_page' && item.content) {
      try {
        return JSON.parse(item.content)
      } catch {
        return null
      }
    }
    return null
  }, [item?.type, item?.content])

  // Close fullscreen on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isFullscreen])

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

  const previewContent = (
    <>
      {item.type === 'template' ? (
        <div
          className="p-6 lg:p-8 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      ) : puckConfig && puckData ? (
        <div className="marketplace-puck-preview relative">
          <style>{`
            .marketplace-puck-preview header[style] {
              position: absolute !important;
            }
          `}</style>
          <div className="pointer-events-none">
            <Render config={puckConfig} data={puckData} />
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center text-gray-400 py-20">
          <Layout className="w-12 h-12 mb-2" />
          <p className="text-sm">{t('marketplace.type_landing_page')}</p>
        </div>
      )}
    </>
  )

  return (
    <>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {item.title}
            </h1>

            {item.description && (
              <p className="text-gray-600 mt-1">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {typeIcon}
                {typeLabel}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${specialtyColor}`}>
                {specialtyLabel}
              </span>
              {item.importCount > 0 && (
                <span className="text-xs text-gray-400 ml-2">
                  <Download className="w-3.5 h-3.5 inline mr-1" />
                  {t('marketplace.imported_count', { count: item.importCount })}
                </span>
              )}
            </div>
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
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">
              {t('marketplace.preview')}
            </h2>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title={t('marketplace.fullscreen')}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {previewContent}
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h2 className="text-sm font-medium text-gray-700">
              {t('marketplace.preview')} — {item.title}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#B725B7] rounded-md hover:bg-[#9a1f9a] disabled:opacity-50 transition-colors"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {t('marketplace.import_to_tq')}
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {previewContent}
          </div>
        </div>
      )}
    </>
  )
}
