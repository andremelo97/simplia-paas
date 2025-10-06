import { useMemo } from 'react'
import { BrandingData } from '../services/branding'
import { Quote } from '../services/quotes'
import { PublicQuoteTemplate } from '../services/publicQuotes'
import { resolveTemplateVariables } from '../lib/resolveTemplateVariables'
import { createConfigWithResolvedData } from '../features/public-quotes/puck-config-preview'

/**
 * Reusable hook for rendering public quotes with Puck
 * Used by both authenticated preview and public access pages
 */
export function usePublicQuoteRenderer(
  template: PublicQuoteTemplate | null,
  quote: Quote | any | null,
  branding: BrandingData | null
) {
  const previewConfig = useMemo(() => {
    if (!branding || !quote) return null

    const resolvedData = resolveTemplateVariables(template?.content || {}, quote)
    return createConfigWithResolvedData(branding, resolvedData)
  }, [branding, quote, template])

  return previewConfig
}

