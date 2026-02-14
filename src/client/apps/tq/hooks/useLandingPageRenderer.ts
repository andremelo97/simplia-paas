import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BrandingData } from '../services/branding'
import { Quote } from '../services/quotes'
import { LandingPageTemplate } from '../services/landingPages'
import { resolveTemplateVariables } from '../lib/resolveTemplateVariables'
import { createConfigWithResolvedData } from '../features/landing-pages/puck-config-preview'
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface WidgetConfig {
  url: string
  title: string
  height: string
}

interface UseLandingPageRendererOptions {
  onApprove?: () => void
  onOpenWidget?: (config: WidgetConfig) => void
  accessToken?: string
}

/**
 * Reusable hook for rendering landing pages with Puck
 * Used by both authenticated preview and public access pages
 */
export function useLandingPageRenderer(
  template: LandingPageTemplate | null,
  quote: Quote | any | null,
  branding: BrandingData | null,
  options: UseLandingPageRendererOptions = {}
) {
  const { t } = useTranslation('tq')
  const { formatCurrency } = useCurrencyFormatter()
  const { formatShortDate } = useDateFormatter()

  const localizedLabels = useMemo(() => ({
    quoteNumber: t('landing_pages.labels.quote_number'),
    total: t('landing_pages.labels.total'),
    noItems: t('landing_pages.labels.items_empty'),
    item: t('landing_pages.labels.item'),
    quantity: t('landing_pages.labels.quantity'),
    price: t('landing_pages.labels.price'),
    discount: t('landing_pages.labels.discount')
  }), [t])

  const footerLabels = useMemo(() => ({
    socialTitle: t('landing_pages.footer.social_title'),
    quickLinksTitle: t('landing_pages.footer.quick_links_title'),
    contactTitle: t('landing_pages.footer.contact_title')
  }), [t])

  const previewConfig = useMemo(() => {
    if (!branding || !quote) return null

    const resolvedData = resolveTemplateVariables(template?.content || {}, quote, {
      formatCurrency,
      formatDate: (value) => formatShortDate(value) || ''
    })
    return createConfigWithResolvedData(branding, resolvedData, {
      labels: localizedLabels,
      footerLabels,
      accessToken: options.accessToken,
      onApprove: options.onApprove,
      onOpenWidget: options.onOpenWidget
    })
  }, [branding, quote, template, localizedLabels, footerLabels, formatCurrency, formatShortDate, options.accessToken, options.onApprove, options.onOpenWidget])

  return previewConfig
}
