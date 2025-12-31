import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../i18n/LanguageContext'
import { Contact } from '../../components/Contact'
import { Mic, FileText, Link2, FileCheck, Users, Settings, Play, Check, ChevronLeft, ChevronRight, Code, Globe, ArrowRight, Star, Gift, Sparkles, X } from 'lucide-react'

// Stripe Checkout URLs (Production)
const CHECKOUT_URLS: Record<string, string> = {
  trial: 'https://buy.stripe.com/eVqeVc21raBtc3p9Kdawo00',
  starter: 'https://buy.stripe.com/9B600icG5eRJ9Vh8G9awo01',
  solo: 'https://buy.stripe.com/3cIbJ06hHaBt2sPe0tawo02',
  duo: 'https://buy.stripe.com/7sY5kCfSh10T6J58G9awo03',
  practice: 'https://buy.stripe.com/5kQ6oGcG5dNF3wT3lPawo04'
}

export function TQPage() {
  const { t } = useLanguage()
  const [activeStep, setActiveStep] = useState(0)
  const [pricingSlide, setPricingSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile: 5 slides (1 card each), Desktop: 3 slides (2+2+1)
  const totalSlides = isMobile ? 5 : 3

  // Auto-scroll pricing carousel every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPricingSlide((prev) => (prev + 1) % totalSlides)
    }, 10000)
    return () => clearInterval(interval)
  }, [totalSlides])

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const features = [
    { icon: Mic, color: '#B725B7' },
    { icon: FileText, color: '#E91E63' },
    { icon: Link2, color: '#5ED6CE' },
    { icon: FileCheck, color: '#B725B7' },
    { icon: Users, color: '#E91E63' },
    { icon: Settings, color: '#5ED6CE' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Video Modal */}
      <AnimatePresence>
        {expandedVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedVideo(null)}
          >
            <motion.div
              className="relative w-full max-w-5xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedVideo(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${expandedVideo}?autoplay=1`}
                  title="TQ Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 bg-[#B725B7]/10 text-[#B725B7] text-sm font-semibold rounded-full mb-6">
                {t.tqPage.hero.badge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {t.tqPage.hero.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t.tqPage.hero.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#pricing"
                  className="px-6 py-3 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t.tqPage.hero.cta1}
                </a>
                {/* Access button - hidden on mobile */}
                <a
                  href="https://hub.livocare.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors items-center gap-2"
                >
                  {t.tqPage.hero.cta2}
                  <span>→</span>
                </a>
              </div>
            </motion.div>

            {/* Right - Video Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div
                className="aspect-video bg-black rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group relative"
                onClick={() => setExpandedVideo('6a_-qRhVnPw')}
              >
                <img
                  src="https://img.youtube.com/vi/6a_-qRhVnPw/maxresdefault.jpg"
                  alt="TQ Tutorial"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Carousel */}
      <section id="how-it-works" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.howItWorks.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.tqPage.howItWorks.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.tqPage.howItWorks.subtitle}
            </p>
          </motion.div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Arrows - Outside on desktop, overlay on mobile */}
            <button
              onClick={() => setActiveStep((prev) => (prev === 0 ? 3 : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors -ml-1 md:-ml-4"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setActiveStep((prev) => (prev === 3 ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors -mr-1 md:-mr-4"
              aria-label="Next step"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Slides Container with Touch Support */}
            <div
              className="mx-8 md:mx-12"
              onTouchStart={(e) => {
                const touch = e.touches[0]
                e.currentTarget.dataset.touchStartX = touch.clientX.toString()
              }}
              onTouchEnd={(e) => {
                const touchStartX = parseFloat(e.currentTarget.dataset.touchStartX || '0')
                const touchEndX = e.changedTouches[0].clientX
                const diff = touchStartX - touchEndX

                if (Math.abs(diff) > 50) {
                  if (diff > 0) {
                    setActiveStep((prev) => (prev === 3 ? 0 : prev + 1))
                  } else {
                    setActiveStep((prev) => (prev === 0 ? 3 : prev - 1))
                  }
                }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 overflow-hidden"
                >
                  {/* Step Header */}
                  <div className="bg-gradient-to-r from-[#B725B7] to-[#E91E63] px-4 py-3 md:px-6 md:py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-white">{activeStep + 1}</span>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium">
                          {t.tqPage.howItWorks.badge} {activeStep + 1}/4
                        </p>
                        <h3 className="text-base md:text-lg font-bold text-white">
                          {t.tqPage.howItWorks.steps[activeStep].title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-4 md:p-6">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                      {/* Step Icon */}
                      <div className="aspect-video bg-gradient-to-br from-[#5ED6CE]/10 to-[#B725B7]/10 rounded-xl border border-gray-200 flex items-center justify-center">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-[#5ED6CE] to-[#B725B7] rounded-2xl flex items-center justify-center shadow-lg">
                          {activeStep === 0 && <Mic className="w-10 h-10 md:w-14 md:h-14 text-white" />}
                          {activeStep === 1 && <FileText className="w-10 h-10 md:w-14 md:h-14 text-white" />}
                          {activeStep === 2 && <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-white" />}
                          {activeStep === 3 && <Link2 className="w-10 h-10 md:w-14 md:h-14 text-white" />}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                          {t.tqPage.howItWorks.steps[activeStep].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {t.tqPage.howItWorks.steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-sm ${
                    activeStep === i
                      ? 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                >
                  <span className="font-semibold">{i + 1}</span>
                  <span className="hidden sm:inline text-xs">{step.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4">
              {t.tqPage.features.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.tqPage.features.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {t.tqPage.features.subtitle}
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.tqPage.features.items.map((feature, i) => {
              const FeatureIcon = features[i].icon
              return (
                <motion.div
                  key={i}
                  className="p-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${features[i].color}20` }}
                  >
                    <FeatureIcon className="w-6 h-6" style={{ color: features[i].color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="for-whom" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#E91E63]/10 text-[#E91E63] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.forWhom.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.tqPage.forWhom.title}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.tqPage.forWhom.segments.map((segment, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-4xl mb-4">{segment.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{segment.title}</h3>
                <p className="text-gray-600">{segment.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-[#B725B7]/5 to-[#E91E63]/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#B725B7]/10 text-[#B725B7] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.benefits.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.tqPage.benefits.title}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.tqPage.benefits.items.map((benefit, i) => (
              <motion.div
                key={i}
                className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-[#B725B7] to-[#E91E63] bg-clip-text text-transparent mb-2">
                  {benefit.stat}
                </div>
                <p className="text-gray-600">{benefit.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.pricing.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.tqPage.pricing.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.tqPage.pricing.subtitle}
            </p>
          </motion.div>

          {/* Trial Banner */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5ED6CE] via-[#0a8a80] to-[#5ED6CE] p-[2px]">
              <div className="relative rounded-2xl bg-white px-6 py-8 md:px-12 md:py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-0.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-bold rounded-full">
                          {t.tqPage.pricing.trial.badge}
                        </span>
                        <Sparkles className="w-4 h-4 text-[#5ED6CE]" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                        {t.tqPage.pricing.trial.title}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {t.tqPage.pricing.trial.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {t.tqPage.pricing.trial.features.map((feature: string, i: number) => (
                        <span key={i} className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-[#5ED6CE]" />
                          {feature}
                        </span>
                      ))}
                    </div>
                    <a
                      href={CHECKOUT_URLS.trial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-2"
                    >
                      {t.tqPage.pricing.trial.cta}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards Carousel */}
          <div className="relative mb-8 md:mb-16">
            {/* Navigation Arrows */}
            <button
              onClick={() => setPricingSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors -ml-2 md:-ml-5"
              aria-label="Previous plans"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setPricingSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors -mr-2 md:-mr-5"
              aria-label="Next plans"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Cards Container */}
            <div className="overflow-hidden mx-8 md:mx-12">
              <div
                className="flex transition-transform duration-500 ease-in-out pt-6"
                style={{ transform: `translateX(-${pricingSlide * 100}%)` }}
              >
                {isMobile ? (
                  /* Mobile: 1 card per slide (5 slides) */
                  t.tqPage.pricing.plans.map((plan, i) => {
                    const isVIP = i === 4
                    const isPopular = plan.featured === 'purple' || plan.featured === 'black'
                    const isBestValue = plan.featured === 'bestValue'
                    const hasBadge = isPopular || isBestValue
                    const isWhiteText = plan.featured === 'purple' || plan.featured === 'black' || plan.featured === 'bestValue'
                    const bgClass = plan.featured === 'purple'
                      ? 'bg-[#B725B7] text-white'
                      : plan.featured === 'black'
                        ? 'bg-[#0a0a0f] text-white'
                        : plan.featured === 'bestValue'
                          ? 'bg-[#E91E63] text-white'
                          : isVIP
                            ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-[#B725B7]/20'
                            : 'bg-gray-50'
                    return (
                      <div key={i} className="w-full flex-shrink-0 px-2">
                        <div className={`relative p-6 rounded-2xl ${bgClass}`}>
                          {isVIP ? (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#B725B7] to-[#E91E63] rounded-full flex items-center justify-center shadow-lg">
                                <Star className="w-5 h-5 text-white fill-white" />
                              </div>
                            </div>
                          ) : hasBadge && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5ED6CE] text-[#0a8a80] text-sm font-bold rounded-full whitespace-nowrap">
                              {isBestValue ? t.tqPage.pricing.bestValue : t.tqPage.pricing.popular}
                            </span>
                          )}
                          <div className={`text-center mb-6 ${isVIP ? 'mt-2' : ''}`}>
                            <h3 className={`text-2xl font-bold mb-2 ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
                              {plan.name}
                            </h3>
                            <p className={isWhiteText ? 'text-white/80' : 'text-gray-600'}>
                              {plan.description}
                            </p>
                          </div>
                          <div className="text-center mb-6">
                            <span className={`text-4xl font-bold ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
                              {plan.price}
                            </span>
                            {plan.price !== 'Sob consulta' && plan.price !== 'Contact us' && (
                              <span className={isWhiteText ? 'text-white/80' : 'text-gray-500'}>
                                {t.tqPage.pricing.monthly}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-center gap-4 mb-6">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isWhiteText ? 'bg-white/20 text-white' : 'bg-[#5ED6CE]/20 text-[#0a8a80]'
                            }`}>
                              {plan.hours}{plan.hours !== 'Custom' && t.tqPage.pricing.hoursSuffix}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isWhiteText ? 'bg-white/20 text-white' : 'bg-[#B725B7]/10 text-[#B725B7]'
                            }`}>
                              {plan.users}
                            </div>
                          </div>
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, j) => (
                              <li key={j} className={`flex items-start gap-3 ${isWhiteText ? 'text-white/90' : 'text-gray-600'}`}>
                                <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isWhiteText ? 'text-white' : 'text-[#5ED6CE]'}`} />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {/* CTA Button */}
                          {isVIP ? (
                            <button
                              onClick={() => {
                                const element = document.getElementById('contact')
                                if (element) element.scrollIntoView({ behavior: 'smooth' })
                              }}
                              className="w-full py-3 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                              {t.tqPage.pricing.contactSales}
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <a
                              href={CHECKOUT_URLS[plan.name.toLowerCase()]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-full py-3 font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 ${
                                isWhiteText
                                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                                  : 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white hover:opacity-90'
                              }`}
                            >
                              {t.tqPage.pricing.selectPlan}
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  /* Desktop: 2+2+1 layout (3 slides) */
                  <>
                    {/* Slide 1: Starter + Solo */}
                    <div className="w-full flex-shrink-0 px-2">
                      <div className="grid md:grid-cols-2 gap-6">
                        {t.tqPage.pricing.plans.slice(0, 2).map((plan, i) => {
                          const isPopular = plan.featured === 'purple' || plan.featured === 'black'
                          const isBestValue = plan.featured === 'bestValue'
                          const hasBadge = isPopular || isBestValue
                          const isWhiteText = plan.featured === 'purple' || plan.featured === 'black' || plan.featured === 'bestValue'
                          const bgClass = plan.featured === 'purple'
                            ? 'bg-[#B725B7] text-white'
                            : plan.featured === 'black'
                              ? 'bg-[#0a0a0f] text-white'
                              : plan.featured === 'bestValue'
                                ? 'bg-[#E91E63] text-white'
                                : 'bg-gray-50'
                          return (
                            <div
                              key={i}
                              className={`relative p-8 rounded-2xl min-h-[620px] ${bgClass}`}
                            >
                              {hasBadge && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5ED6CE] text-[#0a8a80] text-sm font-bold rounded-full whitespace-nowrap">
                                  {isBestValue ? t.tqPage.pricing.bestValue : t.tqPage.pricing.popular}
                                </span>
                              )}
                              <div className="text-center mb-6">
                                <h3 className={`text-2xl font-bold mb-2 ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
                                  {plan.name}
                                </h3>
                                <p className={isWhiteText ? 'text-white/80' : 'text-gray-600'}>
                                  {plan.description}
                                </p>
                              </div>
                              <div className="text-center mb-6">
                                <span className={`text-4xl font-bold ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
                                  {plan.price}
                                </span>
                                {plan.price !== 'Sob consulta' && plan.price !== 'Contact us' && (
                                  <span className={isWhiteText ? 'text-white/80' : 'text-gray-500'}>
                                    {t.tqPage.pricing.monthly}
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-center gap-4 mb-6">
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  isWhiteText ? 'bg-white/20 text-white' : 'bg-[#5ED6CE]/20 text-[#0a8a80]'
                                }`}>
                                  {plan.hours}{plan.hours !== 'Custom' && t.tqPage.pricing.hoursSuffix}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  isWhiteText ? 'bg-white/20 text-white' : 'bg-[#B725B7]/10 text-[#B725B7]'
                                }`}>
                                  {plan.users}
                                </div>
                              </div>
                              <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, j) => (
                                  <li key={j} className={`flex items-start gap-3 ${isWhiteText ? 'text-white/90' : 'text-gray-600'}`}>
                                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isWhiteText ? 'text-white' : 'text-[#5ED6CE]'}`} />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              {/* CTA Button */}
                              <a
                                href={CHECKOUT_URLS[plan.name.toLowerCase()]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full py-3 font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 ${
                                  isWhiteText
                                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                                    : 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white hover:opacity-90'
                                }`}
                              >
                                {t.tqPage.pricing.selectPlan}
                                <ArrowRight className="w-4 h-4" />
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Slide 2: Duo + Practice */}
                    <div className="w-full flex-shrink-0 px-2">
                      <div className="grid md:grid-cols-2 gap-6">
                        {t.tqPage.pricing.plans.slice(2, 4).map((plan, i) => {
                          const isPopular = plan.featured === 'purple' || plan.featured === 'black'
                          const isBestValue = plan.featured === 'bestValue'
                          const hasBadge = isPopular || isBestValue
                          const isWhiteText = plan.featured === 'purple' || plan.featured === 'black' || plan.featured === 'bestValue'
                          const bgClass = plan.featured === 'purple'
                            ? 'bg-[#B725B7] text-white'
                            : plan.featured === 'black'
                              ? 'bg-[#0a0a0f] text-white'
                              : plan.featured === 'bestValue'
                                ? 'bg-[#E91E63] text-white'
                                : 'bg-gray-50'
                          return (
                            <div
                              key={i}
                              className={`relative p-8 rounded-2xl min-h-[620px] ${bgClass}`}
                            >
                              {hasBadge && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5ED6CE] text-[#0a8a80] text-sm font-bold rounded-full whitespace-nowrap">
                                  {isBestValue ? t.tqPage.pricing.bestValue : t.tqPage.pricing.popular}
                                </span>
                              )}
                              <div className="text-center mb-6">
                                <h3 className={`text-2xl font-bold mb-2 ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
                                  {plan.name}
                                </h3>
                                <p className={isWhiteText ? 'text-white/80' : 'text-gray-600'}>
                                  {plan.description}
                                </p>
                              </div>
                              <div className="text-center mb-6">
                                <span className={`text-4xl font-bold ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
                                  {plan.price}
                                </span>
                                {plan.price !== 'Sob consulta' && plan.price !== 'Contact us' && (
                                  <span className={isWhiteText ? 'text-white/80' : 'text-gray-500'}>
                                    {t.tqPage.pricing.monthly}
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-center gap-4 mb-6">
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  isWhiteText ? 'bg-white/20 text-white' : 'bg-[#5ED6CE]/20 text-[#0a8a80]'
                                }`}>
                                  {plan.hours}{plan.hours !== 'Custom' && t.tqPage.pricing.hoursSuffix}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  isWhiteText ? 'bg-white/20 text-white' : 'bg-[#B725B7]/10 text-[#B725B7]'
                                }`}>
                                  {plan.users}
                                </div>
                              </div>
                              <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, j) => (
                                  <li key={j} className={`flex items-start gap-3 ${isWhiteText ? 'text-white/90' : 'text-gray-600'}`}>
                                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isWhiteText ? 'text-white' : 'text-[#5ED6CE]'}`} />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              {/* CTA Button */}
                              <a
                                href={CHECKOUT_URLS[plan.name.toLowerCase()]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full py-3 font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 ${
                                  isWhiteText
                                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                                    : 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white hover:opacity-90'
                                }`}
                              >
                                {t.tqPage.pricing.selectPlan}
                                <ArrowRight className="w-4 h-4" />
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Slide 3: VIP alone */}
                    <div className="w-full flex-shrink-0 px-2">
                      <div className="grid md:grid-cols-2 gap-6 justify-items-center">
                        {t.tqPage.pricing.plans.slice(4, 5).map((plan, i) => {
                          return (
                            <div
                              key={i}
                              className="relative p-8 rounded-2xl min-h-[620px] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-[#B725B7]/20 w-full md:col-span-2 md:max-w-[580px]"
                            >
                              {/* Star icon at top */}
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#B725B7] to-[#E91E63] rounded-full flex items-center justify-center shadow-lg">
                                  <Star className="w-5 h-5 text-white fill-white" />
                                </div>
                              </div>
                              <div className="text-center mb-6 mt-2">
                                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                                  {plan.name}
                                </h3>
                                <p className="text-gray-600">
                                  {plan.description}
                                </p>
                              </div>
                              <div className="text-center mb-6">
                                <span className="text-4xl font-bold text-gray-900">
                                  {plan.price}
                                </span>
                              </div>
                              <div className="flex justify-center gap-4 mb-6">
                                <div className="px-3 py-1 rounded-full text-sm font-medium bg-[#5ED6CE]/20 text-[#0a8a80]">
                                  {plan.hours}{plan.hours !== 'Custom' && t.tqPage.pricing.hoursSuffix}
                                </div>
                                <div className="px-3 py-1 rounded-full text-sm font-medium bg-[#B725B7]/10 text-[#B725B7]">
                                  {plan.users}
                                </div>
                              </div>
                              <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, j) => (
                                  <li key={j} className="flex items-start gap-3 text-gray-600">
                                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#5ED6CE]" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              {/* CTA Button - VIP goes to contact */}
                              <button
                                onClick={() => {
                                  const element = document.getElementById('contact')
                                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                                }}
                                className="w-full py-3 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                              >
                                {t.tqPage.pricing.contactSales}
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 md:gap-3 mt-3 md:mt-6 flex-wrap">
              {isMobile ? (
                /* Mobile: show plan names as individual dots/buttons */
                t.tqPage.pricing.plans.map((plan, i) => (
                  <button
                    key={i}
                    onClick={() => setPricingSlide(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      pricingSlide === i
                        ? 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={plan.name}
                  />
                ))
              ) : (
                /* Desktop: grouped buttons */
                <>
                  <button
                    onClick={() => setPricingSlide(0)}
                    className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                      pricingSlide === 0
                        ? 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    Starter • Solo
                  </button>
                  <button
                    onClick={() => setPricingSlide(1)}
                    className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                      pricingSlide === 1
                        ? 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    Duo • Practice
                  </button>
                  <button
                    onClick={() => setPricingSlide(2)}
                    className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                      pricingSlide === 2
                        ? 'bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    VIP
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Licenses Section */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.tqPage.pricing.licenses.title}</h3>
              <p className="text-gray-600">{t.tqPage.pricing.licenses.subtitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">{t.tqPage.pricing.licenses.operations.name}</p>
                <p className="text-2xl font-bold text-gray-900">{t.tqPage.pricing.licenses.operations.price}</p>
                <p className="text-xs text-gray-500">{t.tqPage.pricing.licenses.operations.description}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">{t.tqPage.pricing.licenses.manager.name}</p>
                <p className="text-2xl font-bold text-gray-900">{t.tqPage.pricing.licenses.manager.price}</p>
                <p className="text-xs text-gray-500">{t.tqPage.pricing.licenses.manager.description}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">{t.tqPage.pricing.licenses.admin.name}</p>
                <p className="text-2xl font-bold text-gray-900">{t.tqPage.pricing.licenses.admin.price}</p>
                <p className="text-xs text-gray-500">{t.tqPage.pricing.licenses.admin.description}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* API & Automation Section */}
      <section id="automation" className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#5ED6CE] text-sm font-semibold rounded-full mb-4">
              {t.tqAutomation.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.tqAutomation.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t.tqAutomation.description}
            </p>
          </motion.div>

          {/* 3-Column Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {t.tqAutomation.cards.map((card, i) => {
              const icons = [Code, Globe, Users]
              const CardIcon = icons[i]
              return (
                <motion.div
                  key={i}
                  className="text-center p-8 bg-white/5 backdrop-blur border border-white/10 rounded-2xl"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CardIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                  <p className="text-gray-400">{card.description}</p>
                </motion.div>
              )
            })}
          </div>

          {/* CTA Button */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button
              onClick={() => {
                const element = document.getElementById('contact')
                if (element) element.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80] text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              {t.tqAutomation.cta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <Contact />
    </div>
  )
}
