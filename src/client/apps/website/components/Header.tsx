import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { Language } from '../i18n/translations'
import { ChevronDown } from 'lucide-react'

export function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const productsRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const isProductPage = location.pathname.startsWith('/products/')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productsRef.current && !productsRef.current.contains(event.target as Node)) {
        setIsProductsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
            {isProductPage ? (
              <>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.howItWorks}
                </button>
                <button
                  onClick={() => scrollTo('features')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.features}
                </button>
                <button
                  onClick={() => scrollTo('for-whom')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.forWhom}
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
              </>
            ) : (
              <>
                {/* Products Dropdown */}
                <div className="relative" ref={productsRef}>
                  <button
                    onClick={() => setIsProductsOpen(!isProductsOpen)}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    {t.nav.products}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isProductsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isProductsOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                      <Link
                        to="/products/tq"
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProductsOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#5ED6CE] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">TQ</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">TQ - Transcription & Quote</p>
                            <p className="text-xs text-gray-500">{t.nav.tqDescription}</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => scrollTo('app')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.app}
                </button>
                <button
                  onClick={() => scrollTo('licenses')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.licenses}
                </button>
                <button
                  onClick={() => scrollTo('contact')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.contact}
                </button>
              </>
            )}
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
