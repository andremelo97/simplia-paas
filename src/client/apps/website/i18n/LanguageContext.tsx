import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { translations, Language, Translations } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('website-language')
    if (saved === 'pt-BR' || saved === 'en') return saved

    // Check browser language
    const browserLang = navigator.language
    if (browserLang.startsWith('pt')) return 'pt-BR'
    return 'en'
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('website-language', lang)
    document.documentElement.lang = lang === 'pt-BR' ? 'pt-BR' : 'en'
  }, [])

  const t = translations[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
