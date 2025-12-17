import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../i18n/LanguageContext'
import { Contact } from '../../components/Contact'
import { Mic, FileText, Link2, FileCheck, Users, Settings, Play, Check, ChevronLeft, ChevronRight } from 'lucide-react'

export function TQPage() {
  const { t } = useLanguage()
  const [activeStep, setActiveStep] = useState(0)

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
                  href="#contact"
                  className="px-6 py-3 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t.tqPage.hero.cta1}
                </a>
                <a
                  href="https://hub.livocare.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
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
              <div className="aspect-video bg-gradient-to-br from-[#B725B7]/10 to-[#E91E63]/10 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#B725B7] to-[#E91E63] rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <span className="text-gray-500">{t.tqPage.hero.videoPlaceholder}</span>
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
                      {/* Video Placeholder */}
                      <div className="aspect-video bg-gradient-to-br from-[#5ED6CE]/10 to-[#B725B7]/10 rounded-xl border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#5ED6CE] to-[#B725B7] rounded-full flex items-center justify-center mx-auto mb-2 cursor-pointer hover:scale-105 transition-transform">
                            <Play className="w-5 h-5 md:w-6 md:h-6 text-white ml-0.5" />
                          </div>
                          <span className="text-gray-400 text-xs">{t.tqPage.howItWorks.videoPlaceholder}</span>
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
      <section id="pricing" className="py-24 bg-white">
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

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Starter Plan */}
            <motion.div
              className="relative p-8 rounded-2xl bg-white border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.tqPage.pricing.starter.name}</h3>
              <p className="text-gray-600 mb-4">{t.tqPage.pricing.starter.description}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">{t.tqPage.pricing.starter.price}</span>
                <span className="text-gray-500">{t.tqPage.pricing.monthly}</span>
              </div>
              <p className="text-sm text-[#B725B7] font-medium mb-6">{t.tqPage.pricing.starter.limit}</p>
              <ul className="space-y-3 mb-8">
                {t.tqPage.pricing.starter.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-[#5ED6CE] flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="block w-full py-3 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.tqPage.pricing.cta}
              </a>
            </motion.div>

            {/* Basic Plan - Popular */}
            <motion.div
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#B725B7] to-[#E91E63] text-white shadow-xl scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5ED6CE] text-[#0a8a80] text-sm font-bold rounded-full">
                {t.tqPage.pricing.popular}
              </span>
              <h3 className="text-2xl font-bold mb-2">{t.tqPage.pricing.basic.name}</h3>
              <p className="text-white/80 mb-4">{t.tqPage.pricing.basic.description}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold">{t.tqPage.pricing.basic.price}</span>
                <span className="text-white/80">{t.tqPage.pricing.monthly}</span>
              </div>
              <p className="text-xs text-white/70 mb-1">{t.tqPage.pricing.basic.priceNote}</p>
              <p className="text-sm text-[#5ED6CE] font-medium mb-6">{t.tqPage.pricing.basic.limit}</p>
              <ul className="space-y-3 mb-4">
                {t.tqPage.pricing.basic.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/90">
                    <Check className="w-5 h-5 text-[#5ED6CE] flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/60 mb-6 italic">{t.tqPage.pricing.basic.expandable}</p>
              <a
                href="#contact"
                className="block w-full py-3 text-center bg-white text-[#B725B7] font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t.tqPage.pricing.cta}
              </a>
            </motion.div>

            {/* VIP Plan */}
            <motion.div
              className="relative p-8 rounded-2xl bg-white border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.tqPage.pricing.vip.name}</h3>
              <p className="text-gray-600 mb-4">{t.tqPage.pricing.vip.description}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">{t.tqPage.pricing.vip.price}</span>
              </div>
              <p className="text-sm text-[#B725B7] font-medium mb-6">{t.tqPage.pricing.vip.limit}</p>
              <ul className="space-y-3 mb-8">
                {t.tqPage.pricing.vip.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-[#5ED6CE] flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="block w-full py-3 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.tqPage.pricing.cta}
              </a>
            </motion.div>
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

      {/* Contact Form Section */}
      <Contact />
    </div>
  )
}
