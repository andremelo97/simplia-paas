import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import commonPtBR from './locales/pt-BR/common.json'
import commonEnUS from './locales/en-US/common.json'
import tqPtBR from './locales/pt-BR/tq.json'
import tqEnUS from './locales/en-US/tq.json'
import hubPtBR from './locales/pt-BR/hub.json'
import hubEnUS from './locales/en-US/hub.json'

// Language detection based on locale from auth store
// pt-BR → Brazilian Portuguese
// Anything else → English (en-US)
const languageDetector = new LanguageDetector()
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    // Try to get locale from localStorage (persisted from auth store)
    try {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const parsed = JSON.parse(authData)
        const locale = parsed?.state?.tenantLocale

        // Map locale to language: pt-BR stays pt-BR, everything else becomes en-US
        if (locale === 'pt-BR') {
          return 'pt-BR'
        }
      }
    } catch (error) {
      console.warn('Failed to detect language from auth store:', error)
    }

    // Default to English for any non-Brazilian locale
    return 'en-US'
  },
  cacheUserLanguage(lng: string) {
    // Language is managed via auth store, no need to cache separately
  }
})

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        common: commonPtBR,
        tq: tqPtBR,
        hub: hubPtBR
      },
      'en-US': {
        common: commonEnUS,
        tq: tqEnUS,
        hub: hubEnUS
      }
    },
    fallbackLng: 'en-US',
    defaultNS: 'common',
    ns: ['common', 'tq', 'hub'],
    detection: {
      order: ['customDetector'],
      caches: []
    },
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  })

export default i18n
