import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../i18n/LanguageContext'
import { Contact } from '../../components/Contact'
import { Sparkles, Play, Check, ArrowRight, Gift, X, Clock, ClipboardList, Send, TrendingUp, Users, Code, Plug, Wrench, ChevronLeft, ChevronRight, Zap, ShieldCheck, ThumbsUp, Globe, Quote, Mic, FileText, Receipt, Maximize2 } from 'lucide-react'

// Stripe Checkout URL (Production) - Single product with 7-day trial built-in
const CHECKOUT_URL = 'https://buy.stripe.com/9B600icG5eRJ9Vh8G9awo01'

// Benefits cards icons and gradients (purple and pink alternating - green is tertiary)
const benefitsCardStyles = [
  { icon: Clock, gradient: 'from-[#B725B7] to-[#8B1A8B]' },
  { icon: Zap, gradient: 'from-[#E91E63] to-[#C2185B]' },
  { icon: Send, gradient: 'from-[#B725B7] to-[#8B1A8B]' },
  { icon: ShieldCheck, gradient: 'from-[#E91E63] to-[#C2185B]' },
  { icon: TrendingUp, gradient: 'from-[#B725B7] to-[#8B1A8B]' },
  { icon: Globe, gradient: 'from-[#E91E63] to-[#C2185B]' },
]

// Integrations icons mapping
const integrationsIcons = [Code, Plug, Wrench]

export function TQPage() {
  const { t } = useLanguage()
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Auto-scroll testimonials every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (testimonialsRef.current) {
        const container = testimonialsRef.current
        const cardWidth = container.querySelector('div')?.offsetWidth || 0
        const gap = 24
        const maxScroll = container.scrollWidth - container.clientWidth

        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' })
        }
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialsRef.current) {
      const container = testimonialsRef.current
      const cardWidth = container.querySelector('div')?.offsetWidth || 600
      const gap = 24
      container.scrollBy({
        left: direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap),
        behavior: 'smooth'
      })
    }
  }

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
                {expandedVideo.startsWith('video-') ? (
                  <video
                    className="w-full h-full rounded-lg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  >
                    <source src={`/${expandedVideo}.mp4`} type="video/mp4" />
                  </video>
                ) : (
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${expandedVideo}?autoplay=1`}
                    title="TQ Tutorial"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-24 pb-24 bg-gradient-to-br from-[#1a0a1a] via-[#2d1035] to-[#1a0a2e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-[#5ED6CE]/20 text-[#5ED6CE] text-sm font-bold tracking-wider uppercase rounded-full mb-6">
                {t.tqPage.hero.badge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
                {t.tqPage.hero.headline1}<br />
                <span className="text-white border-b-4 border-[#E91E63] pb-1">{t.tqPage.hero.headline2}</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
                {t.tqPage.hero.subtitle}
              </p>

              {/* CTA buttons stacked */}
              <div className="flex flex-col gap-3 mb-8 w-fit">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#5ED6CE]/20 hover:bg-[#5ED6CE]/30 rounded-lg transition-all cursor-pointer group"
                >
                  <span className="text-sm md:text-base font-bold text-[#5ED6CE]">{t.tqPage.hero.trialBadge}</span>
                  <span className="text-white/60">•</span>
                  <span className="text-sm md:text-base text-white/80">{t.tqPage.hero.ctaSubtext}</span>
                  <ArrowRight className="w-4 h-4 text-[#5ED6CE] group-hover:translate-x-1 transition-transform" />
                </a>

                <button
                  onClick={() => setExpandedVideo('m6tJfyuh-_Q')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm md:text-base font-medium">{t.tqPage.hero.ctaDemo}</span>
                </button>
              </div>
            </motion.div>

            {/* Right - Video/Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div
                className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden cursor-pointer group relative shadow-2xl"
                onClick={() => setExpandedVideo('m6tJfyuh-_Q')}
              >
                <img
                  src="https://img.youtube.com/vi/m6tJfyuh-_Q/maxresdefault.jpg"
                  alt="TQ Tutorial"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-8 h-8 text-[#B725B7] ml-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Feature Cards */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#5ED6CE]/20 text-[#5ED6CE] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
              {t.tqPage.howItWorks?.badge || 'Como Funciona'}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              {t.tqPage.howItWorks?.title || 'Veja o TQ em ação'}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t.tqPage.howItWorks?.description || 'Cada funcionalidade foi pensada para economizar seu tempo e aumentar suas conversões.'}
            </p>
          </motion.div>

          {/* TQ Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Feature 1 - Transcription */}
            <motion.div
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="aspect-video bg-black flex items-center justify-center relative cursor-pointer"
                onClick={() => setExpandedVideo('video-home-01')}
              >
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/video-home-01.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#B725B7]/20 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-[#B725B7]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t.tqApp.features.transcription.title}</h3>
                </div>
                <p className="text-gray-400">{t.tqApp.features.transcription.description}</p>
              </div>
            </motion.div>

            {/* Feature 2 - Templates */}
            <motion.div
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div
                className="aspect-video bg-black flex items-center justify-center relative cursor-pointer"
                onClick={() => setExpandedVideo('video-home-02')}
              >
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/video-home-02.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#E91E63]/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#E91E63]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t.tqApp.features.templates.title}</h3>
                </div>
                <p className="text-gray-400">{t.tqApp.features.templates.description}</p>
              </div>
            </motion.div>

            {/* Feature 3 - Quotes */}
            <motion.div
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div
                className="aspect-video bg-black flex items-center justify-center relative cursor-pointer"
                onClick={() => setExpandedVideo('video-home-03')}
              >
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/video-home-03.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#5ED6CE]/20 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-[#5ED6CE]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t.tqApp.features.quotes.title}</h3>
                </div>
                <p className="text-gray-400">{t.tqApp.features.quotes.description}</p>
              </div>
            </motion.div>

            {/* Feature 4 - Reports */}
            <motion.div
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div
                className="aspect-video bg-black flex items-center justify-center relative cursor-pointer"
                onClick={() => setExpandedVideo('video-home-04')}
              >
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/video-home-04.MP4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#B725B7]/20 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-[#B725B7]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t.tqApp.features.reports.title}</h3>
                </div>
                <p className="text-gray-400">{t.tqApp.features.reports.description}</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header with Navigation */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-[#B725B7]/10 text-[#B725B7] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
                {t.tqPage.testimonials.badge}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900">
                {t.tqPage.testimonials.title}
              </h2>
            </motion.div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollTestimonials('left')}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-[#B725B7] hover:bg-[#B725B7]/10 flex items-center justify-center transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={() => scrollTestimonials('right')}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-[#B725B7] hover:bg-[#B725B7]/10 flex items-center justify-center transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials Carousel - 1 per slide, auto-scroll 10s */}
        <div className="relative">
          <div
            ref={testimonialsRef}
            className="flex gap-6 overflow-x-auto px-6 md:px-[calc((100vw-1280px)/2+24px)] pb-4 pt-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {t.tqPage.testimonials.items.map((testimonial: { quote: string; name: string; role: string; initials: string }, i: number) => {
              // Brand colors: purple and pink alternating (green is tertiary)
              const borderColors = ['border-[#B725B7]', 'border-[#E91E63]', 'border-[#B725B7]', 'border-[#E91E63]']
              const quoteColors = ['text-[#B725B7]/30', 'text-[#E91E63]/30', 'text-[#B725B7]/30', 'text-[#E91E63]/30']
              const gradients = [
                'from-[#B725B7] to-[#8B1A8B]',
                'from-[#E91E63] to-[#C2185B]',
                'from-[#B725B7] to-[#8B1A8B]',
                'from-[#E91E63] to-[#C2185B]'
              ]
              return (
                <motion.div
                  key={i}
                  className={`flex-shrink-0 w-[320px] md:w-[600px] min-h-[320px] md:min-h-[320px] p-6 md:p-10 rounded-3xl bg-white border-4 ${borderColors[i]} snap-start shadow-lg hover:shadow-2xl transition-shadow duration-300`}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="h-full flex flex-col justify-between">
                    <div>
                      <Quote className={`w-10 h-10 ${quoteColors[i]} mb-4`} />
                      <blockquote className="text-lg md:text-xl text-gray-800 leading-relaxed">
                        "{testimonial.quote}"
                      </blockquote>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                      <div className={`w-12 h-12 bg-gradient-to-br ${gradients[i]} rounded-full flex items-center justify-center text-white font-bold`}>
                        {testimonial.initials}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{testimonial.name}</p>
                        <p className="text-gray-500 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* For Whom Section - COMMENTED OUT FOR NOW
      <section id="for-whom" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#B725B7]/10 text-[#B725B7] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
              {t.tqPage.forWhom.badge}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900">
              {t.tqPage.forWhom.title}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.tqPage.forWhom.items.map((item: { emoji: string; text: string }, i: number) => {
              const cardColors = [
                'from-[#5ED6CE]/10 to-[#0a8a80]/10 border-[#5ED6CE]/30 hover:border-[#5ED6CE]',
                'from-[#B725B7]/10 to-[#E91E63]/10 border-[#B725B7]/30 hover:border-[#B725B7]',
                'from-[#3B82F6]/10 to-[#1D4ED8]/10 border-[#3B82F6]/30 hover:border-[#3B82F6]',
                'from-[#F59E0B]/10 to-[#D97706]/10 border-[#F59E0B]/30 hover:border-[#F59E0B]'
              ]
              return (
                <motion.div
                  key={i}
                  className={`flex flex-col items-center text-center p-8 bg-gradient-to-br ${cardColors[i]} rounded-2xl border-2 transition-all duration-300 hover:shadow-xl`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <span className="text-6xl mb-4">{item.emoji}</span>
                  <span className="text-gray-800 font-bold text-lg">{item.text}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
      */}

      {/* Benefits Section - Carousel with Large Gradient Cards */}
      <section id="results" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header with Navigation */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-[#B725B7]/10 text-[#B725B7] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
                {t.tqPage.results.badge}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900">
                {t.tqPage.benefits.title}
              </h2>
            </motion.div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-[#B725B7] hover:bg-[#B725B7]/10 flex items-center justify-center transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-[#B725B7] hover:bg-[#B725B7]/10 flex items-center justify-center transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel - Full width with overflow visible */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto px-6 md:px-[calc((100vw-1280px)/2+24px)] pb-8 pt-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {t.tqPage.results.cards.map((card: { metric: string; label: string }, i: number) => {
              const CardIcon = benefitsCardStyles[i]?.icon || Clock
              const gradient = benefitsCardStyles[i]?.gradient || 'from-[#5ED6CE] to-[#0a8a80]'
              return (
                <motion.div
                  key={i}
                  className={`flex-shrink-0 w-[340px] md:w-[400px] h-[280px] md:h-[320px] p-8 md:p-10 rounded-3xl bg-gradient-to-br ${gradient} snap-start cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300`}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <div className="h-full flex flex-col justify-between">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                      <CardIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-6xl md:text-7xl font-black text-white mb-3 leading-none">
                        {card.metric}
                      </p>
                      <p className="text-xl md:text-2xl font-medium text-white/90">
                        {card.label}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section - 3 Cards */}
      <section id="integrations" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#B725B7]/10 text-[#B725B7] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
              {t.tqPage.integrations?.badge || 'Integrações & Automações'}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              {t.tqPage.integrations?.title || 'Conecte com seus sistemas'}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              {t.tqPage.integrations?.description || 'Conecte o TQ com suas ferramentas. Nosso time desenvolve integrações sob medida.'}
            </p>
          </motion.div>

          {/* 3 Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {(t.tqPage.integrations?.cards || [
              { title: 'API Própria', description: 'Integre facilmente com qualquer sistema.' },
              { title: 'Qualquer Sistema', description: 'Conecte com seu ERP, CRM ou agenda.' },
              { title: 'Nós Desenvolvemos', description: 'Automações sob medida para você.' }
            ]).map((card: { title: string; description: string }, i: number) => {
              const CardIcon = integrationsIcons[i] || Code
              const cardGradients = [
                'from-[#5ED6CE] to-[#0a8a80]',
                'from-[#B725B7] to-[#E91E63]',
                'from-[#3B82F6] to-[#1D4ED8]'
              ]
              return (
                <motion.div
                  key={i}
                  className="group p-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 hover:border-[#B725B7]/50 hover:shadow-2xl transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <div className={`w-20 h-20 bg-gradient-to-br ${cardGradients[i]} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <CardIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">{card.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{card.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#B725B7]/10 text-[#B725B7] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
              {t.tqPage.pricing.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              {t.tqPage.pricing.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.tqPage.pricing.subtitle}
            </p>
          </motion.div>

          {/* Two Column Layout - Desktop/Tablet (65/35) */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-stretch">
            {/* Left Column - Plan Card (65%) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-[#B725B7] to-[#E91E63] text-white shadow-2xl">
                {/* Two columns inside the card */}
                <div className="grid md:grid-cols-[1fr_auto_1.2fr] gap-8 h-full">
                  {/* Left - Plan Info */}
                  <div className="flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-3xl font-black mb-1">{t.tqPage.pricing.plan.name}</h3>
                      <p className="text-white/80">{t.tqPage.pricing.plan.description}</p>
                    </div>

                    {/* Price with Trial Info */}
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-5 h-5 text-[#5ED6CE]" />
                        <span className="text-lg font-bold text-[#5ED6CE]">{t.tqPage.pricing.trial.title}</span>
                      </div>
                      <p className="text-white/80 text-sm mb-4">{t.tqPage.pricing.trial.description}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-white/70">depois,</span>
                        <span className="text-4xl font-black">{t.tqPage.pricing.plan.price}</span>
                        <span className="text-white/70">{t.tqPage.pricing.monthly}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <a
                      href={CHECKOUT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mt-auto"
                    >
                      {t.tqPage.pricing.selectPlan}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-px bg-white/20" />

                  {/* Right - Features */}
                  <div className="flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-white/70 uppercase tracking-wider mb-4">Incluso</h4>
                    <ul className="space-y-4">
                      {t.tqPage.pricing.plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-white">
                          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span className="text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Licenses (35%) */}
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Licenses */}
              <div className="p-8 bg-white rounded-2xl border-2 border-gray-200 shadow-lg h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{t.tqPage.pricing.licenses.title}</h3>
                  <p className="text-gray-600">{t.tqPage.pricing.licenses.subtitle}</p>
                </div>
                <div className="space-y-4 flex-grow flex flex-col justify-center">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#B725B7] transition-colors">
                    <div>
                      <p className="font-bold text-gray-900">{t.tqPage.pricing.licenses.operations.name}</p>
                      <p className="text-sm text-gray-500">{t.tqPage.pricing.licenses.operations.description}</p>
                    </div>
                    <p className="text-2xl font-black text-[#B725B7]">{t.tqPage.pricing.licenses.operations.price}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#B725B7] transition-colors">
                    <div>
                      <p className="font-bold text-gray-900">{t.tqPage.pricing.licenses.manager.name}</p>
                      <p className="text-sm text-gray-500">{t.tqPage.pricing.licenses.manager.description}</p>
                    </div>
                    <p className="text-2xl font-black text-[#B725B7]">{t.tqPage.pricing.licenses.manager.price}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#E91E63] transition-colors">
                    <div>
                      <p className="font-bold text-gray-900">{t.tqPage.pricing.licenses.admin.name}</p>
                      <p className="text-sm text-gray-500">{t.tqPage.pricing.licenses.admin.description}</p>
                    </div>
                    <p className="text-2xl font-black text-[#E91E63]">{t.tqPage.pricing.licenses.admin.price}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - COMMENTED OUT
      <section className="py-24 bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-10">
              {t.tqPage.finalCta.title}
            </h2>
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-12 py-6 bg-white text-gray-900 font-black rounded-xl hover:bg-gray-100 transition-colors text-xl shadow-2xl"
            >
              {t.tqPage.finalCta.cta}
              <ArrowRight className="w-6 h-6" />
            </a>
            <p className="text-white/80 mt-4">
              {t.tqPage.finalCta.subtext}
            </p>
          </motion.div>
        </div>
      </section>
      */}

      {/* Contact Form Section */}
      <div className="bg-white">
        <Contact />
      </div>

    </div>
  )
}
