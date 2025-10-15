import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BrandingData } from '../services/branding'
import { Quote } from '../services/quotes'
import { PublicQuoteTemplate } from '../services/publicQuotes'
import { resolveTemplateVariables } from '../lib/resolveTemplateVariables'
import { createConfigWithResolvedData } from '../features/public-quotes/puck-config-preview'
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

/**
 * Reusable hook for rendering public quotes with Puck
 * Used by both authenticated preview and public access pages
 */
export function usePublicQuoteRenderer(
  template: PublicQuoteTemplate | null,
  quote: Quote | any | null,
  branding: BrandingData | null
) {
  const { t } = useTranslation('tq')
  const { formatCurrency } = useCurrencyFormatter()
  const { formatShortDate } = useDateFormatter()

  const localizedLabels = useMemo(() => ({
    quoteNumber: t('public_quotes.labels.quote_number'),
    total: t('public_quotes.labels.total'),
    noItems: t('public_quotes.labels.items_empty'),
    item: t('public_quotes.labels.item'),
    quantity: t('public_quotes.labels.quantity'),
    price: t('public_quotes.labels.price'),
    discount: t('public_quotes.labels.discount')
  }), [t])

  const footerLabels = useMemo(() => ({
    socialTitle: t('public_quotes.footer.social_title'),
    quickLinksTitle: t('public_quotes.footer.quick_links_title'),
    contactTitle: t('public_quotes.footer.contact_title')
  }), [t])

  const previewConfig = useMemo(() => {
    if (!branding || !quote) return null

    const resolvedData = resolveTemplateVariables(template?.content || {}, quote, {
      formatCurrency,
      formatDate: (value) => formatShortDate(value) || ''
    })
    return createConfigWithResolvedData(branding, resolvedData, {
      labels: localizedLabels,
      footerLabels
    })
  }, [branding, quote, template, localizedLabels, footerLabels, formatCurrency, formatShortDate])

  return previewConfig
}

