import React, { useState, useEffect } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { Language } from '../i18n/translations'

export function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')
  }

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img
              src="/logo-512x256.png"
              alt="LivoCare"
              className="h-10"
            />
          </a>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo('features')}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t.nav.features}
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t.nav.pricing}
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t.nav.contact}
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <span className={language === 'pt-BR' ? 'text-gray-900' : 'text-gray-400'}>
                PT
              </span>
              <span className="text-gray-300">|</span>
              <span className={language === 'en' ? 'text-gray-900' : 'text-gray-400'}>
                EN
              </span>
            </button>

            {/* Access button */}
            <a
              href="https://hub.livocare.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {t.nav.access}
            </a>

            {/* Schedule Demo button */}
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              {t.nav.scheduleDemo}
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
