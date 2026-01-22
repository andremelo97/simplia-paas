import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../i18n/LanguageContext'
import { Contact } from '../../components/Contact'
import { Sparkles, Play, Check, ArrowRight, Gift, X, Clock, ClipboardList, Send, TrendingUp, Users, Code, Plug, Wrench, ChevronLeft, ChevronRight, MessageCircle, Zap, ShieldCheck, ThumbsUp, Globe, Quote } from 'lucide-react'

// Stripe Checkout URL (Production) - Single product with 7-day trial built-in
const CHECKOUT_URL = 'https://buy.stripe.com/9B600icG5eRJ9Vh8G9awo01'

// Benefits cards icons and gradients (labels come from translations)
const benefitsCardStyles = [
  { icon: Clock, gradient: 'from-[#5ED6CE] to-[#0a8a80]' },
  { icon: ClipboardList, gradient: 'from-[#B725B7] to-[#E91E63]' },
  { icon: Zap, gradient: 'from-[#8B5CF6] to-[#6D28D9]' },
  { icon: Send, gradient: 'from-[#3B82F6] to-[#1D4ED8]' },
  { icon: ShieldCheck, gradient: 'from-[#EC4899] to-[#BE185D]' },
  { icon: Users, gradient: 'from-[#F59E0B] to-[#D97706]' },
  { icon: ThumbsUp, gradient: 'from-[#14B8A6] to-[#0D9488]' },
  { icon: TrendingUp, gradient: 'from-[#10B981] to-[#059669]' },
  { icon: Globe, gradient: 'from-[#6366F1] to-[#4F46E5]' },
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
      <section className="pt-24 pb-16 bg-gradient-to-br from-[#1a0a1a] via-[#2d1035] to-[#1a0a2e]">
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
              <div className="flex flex-col gap-3 mb-8">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#5ED6CE]/20 hover:bg-[#5ED6CE]/30 rounded-lg transition-all cursor-pointer group w-fit"
                >
                  <span className="text-sm md:text-base font-bold text-[#5ED6CE]">{t.tqPage.hero.trialBadge}</span>
                  <span className="text-white/60">•</span>
                  <span className="text-sm md:text-base text-white/80">{t.tqPage.hero.ctaSubtext}</span>
                  <ArrowRight className="w-4 h-4 text-[#5ED6CE] group-hover:translate-x-1 transition-transform" />
                </a>

                <button
                  onClick={() => setExpandedVideo('m6tJfyuh-_Q')}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors w-fit"
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

      {/* Testimonials Carousel Section */}
      <section id="testimonials" className="pt-24 pb-12 bg-white">
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
              const borderColors = ['border-[#B725B7]', 'border-[#5ED6CE]', 'border-[#8B5CF6]', 'border-[#3B82F6]']
              const quoteColors = ['text-[#B725B7]/30', 'text-[#5ED6CE]/30', 'text-[#8B5CF6]/30', 'text-[#3B82F6]/30']
              const gradients = [
                'from-[#B725B7] to-[#E91E63]',
                'from-[#5ED6CE] to-[#0a8a80]',
                'from-[#8B5CF6] to-[#6D28D9]',
                'from-[#3B82F6] to-[#1D4ED8]'
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

      {/* For Whom Section */}
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

      {/* Benefits Section - Carousel with Large Gradient Cards */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header with Navigation */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-[#5ED6CE]/10 text-[#5ED6CE] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
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

          {/* CTA Button */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => {
                const element = document.getElementById('contact')
                if (element) element.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-10 py-5 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
            >
              {t.tqPage.integrations?.cta || 'Falar com especialista'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#5ED6CE]/10 text-[#5ED6CE] text-sm font-bold uppercase tracking-wider rounded-full mb-4">
              {t.tqPage.pricing.badge}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              {t.tqPage.pricing.title}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600">
              {t.tqPage.pricing.subtitle}
            </p>
          </motion.div>

          {/* Trial Banner */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#5ED6CE] via-[#0a8a80] to-[#5ED6CE] p-[2px]">
              <div className="relative rounded-xl bg-white px-6 py-6 md:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="px-3 py-0.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-bold rounded-full">
                        {t.tqPage.pricing.trial.badge}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">
                        {t.tqPage.pricing.trial.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t.tqPage.pricing.trial.description}
                      </p>
                    </div>
                  </div>
                  <a
                    href={CHECKOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-2"
                  >
                    {t.tqPage.pricing.trial.cta}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Single Plan Card */}
          <motion.div
            className="max-w-xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative p-10 md:p-12 rounded-3xl bg-gradient-to-br from-[#B725B7] to-[#E91E63] text-white shadow-2xl">
              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black mb-3">{t.tqPage.pricing.plan.name}</h3>
                <p className="text-xl text-white/80">{t.tqPage.pricing.plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <span className="text-6xl md:text-7xl font-black">{t.tqPage.pricing.plan.price}</span>
                <span className="text-xl text-white/80">{t.tqPage.pricing.monthly}</span>
              </div>

              {/* Badges */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                  {t.tqPage.pricing.plan.hours}h/mês
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                  {t.tqPage.pricing.plan.users}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {t.tqPage.pricing.plan.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-white/90">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                {t.tqPage.pricing.selectPlan}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Licenses */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t.tqPage.pricing.licenses.title}</h3>
              <p className="text-gray-600 text-sm">{t.tqPage.pricing.licenses.subtitle}</p>
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

      {/* Final CTA Section - LivoCare Gradient */}
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

      {/* Contact Form Section */}
      <Contact />

      {/* Floating Buttons - Desktop & Tablet only */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-40 flex-col gap-3">
        {/* Start Button */}
        <motion.a
          href={CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80] text-white font-bold rounded-full shadow-2xl hover:shadow-[#5ED6CE]/40 transition-all duration-300"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-lg">{t.tqPage.floatingButtons.start}</span>
        </motion.a>

        {/* Contact Button */}
        <motion.button
          onClick={() => {
            const element = document.getElementById('contact')
            if (element) element.scrollIntoView({ behavior: 'smooth' })
          }}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-bold rounded-full shadow-2xl hover:shadow-[#B725B7]/40 transition-all duration-300"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-lg">{t.tqPage.floatingButtons.contact}</span>
        </motion.button>
      </div>
    </div>
  )
}
