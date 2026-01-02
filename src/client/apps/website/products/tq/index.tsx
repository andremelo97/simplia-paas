import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../i18n/LanguageContext'
import { Contact } from '../../components/Contact'
import { Mic, FileText, Link2, Sparkles, Play, Check, Code, Globe, Users, ArrowRight, Gift, X, Calculator } from 'lucide-react'

// Stripe Checkout URL (Production) - Single product with 7-day trial built-in
const CHECKOUT_URL = 'https://buy.stripe.com/9B600icG5eRJ9Vh8G9awo01'

export function TQPage() {
  const { t } = useLanguage()
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t.tqPage.hero.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t.tqPage.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#pricing"
                  className="px-8 py-4 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
                >
                  {t.tqPage.hero.cta1}
                </a>
                <p className="text-sm text-gray-500 self-center">
                  {t.tqPage.hero.ctaSubtext}
                </p>
              </div>
            </motion.div>

            {/* Right - Video */}
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

      {/* Problem Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full mb-6">
              {t.tqPage.problem.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              {t.tqPage.problem.title}
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              {t.tqPage.problem.description}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
              {t.tqPage.problem.items.map((item: string, i: number) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 font-bold text-sm">{i + 1}</span>
                  </div>
                  <span className="text-gray-300">{item}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-2xl font-bold text-red-400">
              {t.tqPage.problem.conclusion}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.solution.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t.tqPage.solution.title}
            </h2>
          </motion.div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {t.tqPage.solution.steps.map((step: { title: string; description: string }, i: number) => {
              const StepIcon = solutionIcons[i]
              return (
                <motion.div
                  key={i}
                  className="relative p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {/* Step number */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-[#B725B7] to-[#E91E63] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {i + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5ED6CE]/20 to-[#B725B7]/20 rounded-2xl flex items-center justify-center mx-auto mt-4 mb-4">
                    <StepIcon className="w-8 h-8 text-[#B725B7]" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>

                  {/* Arrow connector (except last) */}
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-[#B725B7]/5 to-[#E91E63]/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#B725B7]/10 text-[#B725B7] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.benefits.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t.tqPage.benefits.title}
            </h2>
          </motion.div>

          <div className="space-y-4">
            {t.tqPage.benefits.items.map((item: string, i: number) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg text-gray-800 font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="for-whom" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#E91E63]/10 text-[#E91E63] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.forWhom.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t.tqPage.forWhom.title}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {t.tqPage.forWhom.items.map((item: { emoji: string; text: string }, i: number) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-gray-800">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Calculator className="w-10 h-10 text-white" />
            </div>

            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#5ED6CE] text-sm font-semibold rounded-full mb-6">
              {t.tqPage.roi.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10">
              {t.tqPage.roi.title}
            </h2>

            <div className="space-y-4 mb-10">
              <p className="text-xl text-gray-400">{t.tqPage.roi.calculation.line1}</p>
              <p className="text-xl text-gray-400">{t.tqPage.roi.calculation.line2}</p>
              <p className="text-3xl font-bold text-[#5ED6CE]">{t.tqPage.roi.calculation.line3}</p>
            </div>

            <div className="inline-block px-8 py-4 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold text-white">{t.tqPage.roi.calculation.conclusion}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-semibold rounded-full mb-4">
              {t.tqPage.pricing.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t.tqPage.pricing.title}
            </h2>
            <p className="text-xl text-gray-600">
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5ED6CE] via-[#0a8a80] to-[#5ED6CE] p-[2px]">
              <div className="relative rounded-2xl bg-white px-6 py-8 md:px-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <span className="px-3 py-0.5 bg-[#5ED6CE]/20 text-[#0a8a80] text-sm font-bold rounded-full">
                        {t.tqPage.pricing.trial.badge}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">
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
                    className="px-8 py-3 bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-2"
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
            className="max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#B725B7] to-[#E91E63] text-white">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{t.tqPage.pricing.plan.name}</h3>
                <p className="text-white/80">{t.tqPage.pricing.plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-5xl font-bold">{t.tqPage.pricing.plan.price}</span>
                <span className="text-white/80">{t.tqPage.pricing.monthly}</span>
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

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#B725B7] to-[#E91E63]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              {t.tqPage.finalCta.title}
            </h2>
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
            >
              {t.tqPage.finalCta.cta}
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-white/80 mt-4">
              {t.tqPage.finalCta.subtext}
            </p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t.tqAutomation.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t.tqAutomation.description}
            </p>
          </motion.div>

          {/* 3-Column Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {t.tqAutomation.cards.map((card: { title: string; description: string }, i: number) => {
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
