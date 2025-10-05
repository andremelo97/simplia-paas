import { BrandingData } from '../../../services/branding'
import { createLayoutComponents } from './layout-components'
import { createTypographyComponents } from './typography-components'
import { createActionComponents } from './action-components'
import { createQuoteComponents } from './quote-components'
import { createOtherComponents } from './other-components'
import { createHeaderComponent } from './header-component'

export const createConfig = (branding: BrandingData) => ({
  components: {
    ...createLayoutComponents(branding),
    ...createTypographyComponents(branding),
    ...createActionComponents(branding),
    ...createQuoteComponents(branding),
    ...createOtherComponents(branding),
    ...createHeaderComponent(branding),
  },
  categories: {
    layout: {
      title: 'Layout',
      components: ['Grid', 'Flex', 'Space', 'Divider'],
    },
    typography: {
      title: 'Typography',
      components: ['Heading', 'Text'],
    },
    actions: {
      title: 'Actions',
      components: ['Button'],
    },
    quoteInfo: {
      title: 'Quote Info',
      components: ['QuoteNumber', 'QuoteTotal', 'QuoteItems', 'QuoteContent'],
    },
    header: {
      title: 'Header',
      components: ['Header'],
    },
    other: {
      title: 'Other',
      components: ['CardContainer', 'CardWithIcon', 'Hero', 'Logos', 'Stats'],
    },
  },
})
