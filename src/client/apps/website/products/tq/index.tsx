import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../i18n/LanguageContext'
import { Contact } from '../../components/Contact'
import { Mic, FileText, Link2, Sparkles, Play, Check, ArrowRight, Gift, X, Calculator, Clock, ClipboardList, Send, TrendingUp, Users, Code, Plug, Wrench, ChevronLeft, ChevronRight, MessageCircle, Zap, ShieldCheck, ThumbsUp, Globe } from 'lucide-react'

// Stripe Checkout URL (Production) - Single product with 7-day trial built-in
const CHECKOUT_URL = 'https://buy.stripe.com/9B600icG5eRJ9Vh8G9awo01'

// Benefits cards with gradients and icons
const benefitsCards = [
  { icon: Clock, gradient: 'from-[#5ED6CE] to-[#0a8a80]', metric: '10h', label: 'economizadas por semana' },
  { icon: ClipboardList, gradient: 'from-[#B725B7] to-[#E91E63]', metric: '100%', label: 'planos padronizados' },
  { icon: Zap, gradient: 'from-[#8B5CF6] to-[#6D28D9]', metric: '3min', label: 'para criar orçamento' },
  { icon: Send, gradient: 'from-[#3B82F6] to-[#1D4ED8]', metric: '2x', label: 'mais orçamentos enviados' },
  { icon: ShieldCheck, gradient: 'from-[#EC4899] to-[#BE185D]', metric: '-90%', label: 'erros em orçamentos' },
  { icon: Users, gradient: 'from-[#F59E0B] to-[#D97706]', metric: '-50%', label: 'retrabalho da equipe' },
  { icon: ThumbsUp, gradient: 'from-[#14B8A6] to-[#0D9488]', metric: '+45%', label: 'aprovação de pacientes' },
  { icon: TrendingUp, gradient: 'from-[#10B981] to-[#059669]', metric: '+30%', label: 'taxa de fechamento' },
  { icon: Globe, gradient: 'from-[#6366F1] to-[#4F46E5]', metric: '24/7', label: 'acesso do paciente' },
]

// Integrations icons mapping
const integrationsIcons = [Code, Plug, Wrench]

export function TQPage() {
  const { t } = useLanguage()
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0)
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

  const solutionIcons = [Mic, FileText, Sparkles, Link2]

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

      {/* Hero + How it Works - Unified Purple Section */}
      <section id="how-it-works" className="pt-24 pb-20 bg-gradient-to-br from-[#1a0a1a] via-[#2d1035] to-[#1a0a2e]">
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 mb-20">
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
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-[1.1]">
                {t.tqPage.hero.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed max-w-xl">
                {t.tqPage.hero.description}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t.tqPage.hero.cta1}
                </a>
                <button
                  onClick={() => setExpandedVideo('6a_-qRhVnPw')}
                  className="flex items-center gap-2 px-6 py-3 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                >
                  <Play className="w-5 h-5" />
                  Ver Demo
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
                onClick={() => setExpandedVideo('6a_-qRhVnPw')}
              >
                <img
                  src="https://img.youtube.com/vi/6a_-qRhVnPw/maxresdefault.jpg"
                  alt="TQ Tutorial"
                  className="w-full h-full object-cover"
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

        {/* How it Works Content */}
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              {t.tqPage.howItWorks?.title || 'Como funciona?'}
            </h2>
          </motion.div>

          {/* Problem + Solution */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Problem */}
            <motion.div
              className="p-10 bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur border border-red-500/20 rounded-3xl"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-red-500/20 text-red-300 text-sm font-bold uppercase tracking-wider rounded-full mb-6">
                {t.tqPage.problem.badge}
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
                {t.tqPage.howItWorks?.problemTitle || t.tqPage.problem.title}
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                {t.tqPage.howItWorks?.problemDescription || t.tqPage.problem.description}
              </p>
            </motion.div>

            {/* Solution */}
            <motion.div
              className="p-10 bg-gradient-to-br from-[#5ED6CE]/20 to-[#B725B7]/20 border border-[#5ED6CE]/30 rounded-3xl"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block px-4 py-2 bg-[#5ED6CE]/20 text-[#5ED6CE] text-sm font-bold uppercase tracking-wider rounded-full mb-6">
                {t.tqPage.solution.badge}
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
                {t.tqPage.howItWorks?.solutionTitle || t.tqPage.solution.title}
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                O TQ automatiza o processo de pós-consulta, desde a transcrição até o envio da cotação ao paciente.
              </p>
            </motion.div>
          </div>

          {/* 4-Column Solution Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.tqPage.solution.steps.map((step: { title: string; description: string }, i: number) => {
              const StepIcon = solutionIcons[i]
              const stepGradients = [
                'from-[#5ED6CE] to-[#0a8a80]',
                'from-[#B725B7] to-[#E91E63]',
                'from-[#3B82F6] to-[#1D4ED8]',
                'from-[#F59E0B] to-[#D97706]'
              ]
              return (
                <motion.div
                  key={i}
                  className="p-8 bg-white/5 backdrop-blur border border-white/10 rounded-2xl hover:border-[#5ED6CE]/30 hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${stepGradients[i]} rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                      {i + 1}
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <StepIcon className="w-6 h-6 text-[#5ED6CE]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-base leading-relaxed">{step.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section - Carousel with Large Gradient Cards */}
      <section className="py-24 bg-white">
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
                Resultados
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
            {benefitsCards.map((card, i) => {
              const CardIcon = card.icon
              return (
                <motion.div
                  key={i}
                  className={`flex-shrink-0 w-[340px] md:w-[400px] h-[280px] md:h-[320px] p-8 md:p-10 rounded-3xl bg-gradient-to-br ${card.gradient} snap-start cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300`}
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

      {/* For Whom Section */}
      <section id="for-whom" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
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

      {/* ROI Section - Purple Background */}
      <section className="py-24 bg-gradient-to-br from-[#1a0a1a] via-[#2d1035] to-[#1a0a2e]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl">
              <Calculator className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-12">
              {t.tqPage.roi.title}
            </h2>

            <div className="space-y-6 mb-12">
              <p className="text-2xl md:text-3xl text-gray-300">{t.tqPage.roi.calculation.line1}</p>
              <p className="text-2xl md:text-3xl text-gray-300">{t.tqPage.roi.calculation.line2}</p>
              <p className="text-4xl md:text-5xl font-black text-[#5ED6CE]">{t.tqPage.roi.calculation.line3}</p>
            </div>

            <div className="inline-block px-12 py-6 bg-gradient-to-r from-[#5ED6CE]/20 to-[#B725B7]/20 rounded-2xl border-2 border-[#5ED6CE]/30">
              <p className="text-3xl md:text-4xl font-black text-white">{t.tqPage.roi.calculation.conclusion}</p>
            </div>
          </motion.div>
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
              {t.tqPage.integrations?.description || 'Nossa plataforma possui API própria, facilitando criar integrações personalizadas. Conte com nosso time de desenvolvedores experientes para automações sob medida.'}
            </p>
          </motion.div>

          {/* 3 Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {(t.tqPage.integrations?.cards || [
              { title: 'API Própria', description: 'API REST + Webhooks prontos para integrações.' },
              { title: 'Qualquer Sistema', description: 'Conecte com seu ERP, CRM, agenda ou qualquer ferramenta.' },
              { title: 'Nós Desenvolvemos', description: 'Nosso time cria automações e integrações sob medida.' }
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
              Preço
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
          <span className="text-lg">Começar</span>
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
          <span className="text-lg">Contato</span>
        </motion.button>
      </div>
    </div>
  )
}
