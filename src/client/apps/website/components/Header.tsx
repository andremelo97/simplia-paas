import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { Language } from '../i18n/translations'
import { ChevronDown, Menu, X } from 'lucide-react'

export function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const productsRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const toggleLanguage = () => {
    setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')
  }

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle anchor link clicks with smooth scroll
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.pushState(null, '', window.location.pathname)
    } else {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', `#${id}`)
      }
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
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

          {/* Nav Links - Desktop (lg and up) */}
          <div className="hidden lg:flex items-center gap-8">
            {isProductPage ? (
              <>
                <a
                  href="#"
                  onClick={(e) => handleAnchorClick(e, 'top')}
                  className={`transition-colors text-sm font-medium ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {t.nav.howItWorks}
                </a>
                <a
                  href="#testimonials"
                  onClick={(e) => handleAnchorClick(e, 'testimonials')}
                  className={`transition-colors text-sm font-medium ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {t.nav.testimonials}
                </a>
                <a
                  href="#for-whom"
                  onClick={(e) => handleAnchorClick(e, 'for-whom')}
                  className={`transition-colors text-sm font-medium ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {t.nav.forWhom}
                </a>
                <a
                  href="#integrations"
                  onClick={(e) => handleAnchorClick(e, 'integrations')}
                  className={`transition-colors text-sm font-medium ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {t.nav.integrations}
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => handleAnchorClick(e, 'pricing')}
                  className={`transition-colors text-sm font-medium ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {t.nav.pricing}
                </a>
                <a
                  href="#contact"
                  onClick={(e) => handleAnchorClick(e, 'contact')}
                  className={`transition-colors text-sm font-medium ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}
                >
                  {t.nav.contact}
                </a>
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
                  onClick={() => scrollTo('automation')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  {t.nav.automation}
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
            {/* Language Toggle - Always visible */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${
                isScrolled || !isProductPage
                  ? 'bg-gray-100 hover:bg-gray-200'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className={`${isScrolled || !isProductPage ? (language === 'pt-BR' ? 'text-gray-900' : 'text-gray-400') : (language === 'pt-BR' ? 'text-white' : 'text-white/50')}`}>
                PT
              </span>
              <span className={isScrolled || !isProductPage ? 'text-gray-300' : 'text-white/30'}>|</span>
              <span className={`${isScrolled || !isProductPage ? (language === 'en' ? 'text-gray-900' : 'text-gray-400') : (language === 'en' ? 'text-white' : 'text-white/50')}`}>
                EN
              </span>
            </button>

            {/* Access button - Desktop only (lg and up) */}
            <a
              href="https://hub.livocare.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden lg:block px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isScrolled || !isProductPage
                  ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  : 'border border-white/30 text-white hover:bg-white/10'
              }`}
            >
              {t.nav.access}
            </a>

            {/* Conhecer App button - Desktop only, hidden on product pages */}
            {!isProductPage && (
              <button
                onClick={() => scrollTo('app')}
                className="hidden lg:block px-4 py-2 rounded-lg bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t.nav.knowApp}
              </button>
            )}

            {/* Hamburger Menu - Mobile and Tablet (below lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isScrolled || isMobileMenuOpen || !isProductPage
                  ? 'hover:bg-gray-100'
                  : 'hover:bg-white/10'
              }`}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className={`w-6 h-6 ${isScrolled || !isProductPage ? 'text-gray-700' : 'text-white'}`} />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile & Tablet Menu */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="lg:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-2">
              {isProductPage ? (
                <>
                  <a
                    href="#"
                    onClick={(e) => handleAnchorClick(e, 'top')}
                    className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.howItWorks}
                  </a>
                  <a
                    href="#testimonials"
                    onClick={(e) => handleAnchorClick(e, 'testimonials')}
                    className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.testimonials}
                  </a>
                  <a
                    href="#for-whom"
                    onClick={(e) => handleAnchorClick(e, 'for-whom')}
                    className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.forWhom}
                  </a>
                  <a
                    href="#integrations"
                    onClick={(e) => handleAnchorClick(e, 'integrations')}
                    className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.integrations}
                  </a>
                  <a
                    href="#pricing"
                    onClick={(e) => handleAnchorClick(e, 'pricing')}
                    className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.pricing}
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => handleAnchorClick(e, 'contact')}
                    className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.contact}
                  </a>
                </>
              ) : (
                <>
                  {/* Products Section */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t.nav.products}
                  </div>
                  <Link
                    to="/products/tq"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5ED6CE]/10 hover:text-[#0a8a80] active:scale-[0.98] rounded-lg transition-all duration-200 ml-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 bg-[#5ED6CE] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">TQ</span>
                    </div>
                    <span className="font-medium">TQ - Transcription & Quote</span>
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-2" />

                  <button
                    onClick={() => scrollTo('app')}
                    className="text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.app}
                  </button>
                  <button
                    onClick={() => scrollTo('licenses')}
                    className="text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.licenses}
                  </button>
                  <button
                    onClick={() => scrollTo('automation')}
                    className="text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.automation}
                  </button>
                  <button
                    onClick={() => scrollTo('contact')}
                    className="text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#B725B7]/10 hover:to-[#E91E63]/10 hover:text-[#B725B7] active:scale-[0.98] rounded-lg transition-all duration-200 font-medium"
                  >
                    {t.nav.contact}
                  </button>
                </>
              )}

              {/* Divider and Conhecer App button - only on non-product pages */}
              {!isProductPage && (
                <>
                  <div className="border-t border-gray-100 my-2" />
                  <button
                    className="mx-4 mt-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-medium hover:shadow-lg hover:shadow-[#B725B7]/30 active:scale-[0.98] transition-all duration-200"
                    onClick={() => scrollTo('app')}
                  >
                    {t.nav.knowApp}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
