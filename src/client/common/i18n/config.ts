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

// Language detection priority:
// 1. Hub login page language selector (hub-language key)
// 2. Tenant locale from auth store (after login)
// 3. Browser language
// 4. Default to pt-BR (main market)
const languageDetector = new LanguageDetector()
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    try {
      // Priority 1: Check for manual language selection from login page
      const hubLanguage = localStorage.getItem('hub-language')
      if (hubLanguage && (hubLanguage === 'pt-BR' || hubLanguage === 'en-US')) {
        return hubLanguage
      }

      // Priority 2: Check tenant locale from auth store (after login)
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const parsed = JSON.parse(authData)
        const locale = parsed?.state?.tenantLocale
        if (locale === 'pt-BR') {
          return 'pt-BR'
        }
        if (locale) {
          return 'en-US' // Any other locale → English
        }
      }

      // Priority 3: Check browser language
      const browserLang = navigator.language || (navigator as any).userLanguage
      if (browserLang?.startsWith('pt')) {
        return 'pt-BR'
      }
    } catch (error) {
      // Failed to detect language, will use default
    }

    // Default to Portuguese (main market is Brazil)
    return 'pt-BR'
  },
  cacheUserLanguage(lng: string) {
    // Language is managed via login selector or auth store
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
    fallbackLng: 'pt-BR',
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
