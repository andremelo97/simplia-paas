import { BrandingData } from '../../../services/branding'
import { createLayoutComponents } from './layout-components'
import { createTypographyComponents } from './typography-components'
import { createActionComponents } from './action-components'
import { createQuoteComponents } from './quote-components'
import { createOtherComponents } from './other-components'
import { createHeaderFooterComponents } from './header-component'
import { createMediaComponents } from './media-components'

export const createConfig = (branding: BrandingData) => ({
  components: {
    ...createLayoutComponents(branding),
    ...createTypographyComponents(branding),
    ...createActionComponents(branding),
    ...createQuoteComponents(branding),
    ...createMediaComponents(branding),
    ...createOtherComponents(branding),
    ...createHeaderFooterComponents(branding),
  },
  categories: {
    layout: {
      title: 'Layout',
      components: ['Grid', 'Flex', 'Space', 'Divider'],
    },
    typography: {
      title: 'Typography',
      components: ['Title', 'Text'],
    },
    actions: {
      title: 'Actions',
      components: ['Button'],
    },
    quoteInfo: {
      title: 'Quote Info',
      components: ['QuoteNumber', 'QuoteTotal', 'QuoteItems', 'QuoteContent'],
    },
    media: {
      title: 'Media',
      components: ['Image', 'Video', 'ImageCarousel', 'VideoRows'],
    },
    headerFooter: {
      title: 'Header & Footer',
      components: ['Header', 'Footer'],
    },
    other: {
      title: 'Other',
      components: ['CardContainer', 'CardWithIcon', 'Hero', 'Logos', 'Stats', 'TextColumns', 'TextRows', 'Testimonials', 'FAQ', 'PricingTable', 'TeamSection', 'IconList'],
    },
  },
})
