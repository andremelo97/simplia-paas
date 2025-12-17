import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { Mic, FileText, Receipt, ClipboardList, Users, Shield, Sparkles, ArrowRight, Code, Globe } from 'lucide-react'

export function Features() {
  const { t } = useLanguage()

  return (
    <>
      {/* Platform Overview Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#B725B7]/10 to-[#E91E63]/10 text-[#B725B7] text-sm font-semibold rounded-full mb-4">
              {t.platform.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.platform.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t.platform.description}
            </p>
          </motion.div>

          {/* Platform Architecture Visual */}
          <motion.div
            className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid md:grid-cols-2 gap-12">
              {/* Hub Central */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#B725B7] to-[#E91E63] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{t.platform.hub.title}</h3>
                    <p className="text-gray-600">{t.platform.hub.description}</p>
                  </div>
                </div>
                <ul className="space-y-3 ml-20">
                  {t.platform.hub.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 bg-[#B725B7] rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Apps Ecosystem */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5ED6CE] to-[#B725B7] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{t.platform.ecosystem.title}</h3>
                    <p className="text-gray-600">{t.platform.ecosystem.description}</p>
                  </div>
                </div>
                {/* Visual representation of apps */}
                <div className="ml-20 flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-[#5ED6CE]/20 text-[#0a8a80] rounded-full text-sm font-medium border border-[#5ED6CE]/30">
                    TQ - Transcription & Quote
                  </div>
                  <div className="px-4 py-2 bg-gray-200/50 text-gray-400 rounded-full text-sm font-medium border border-gray-200">
                    CRM
                  </div>
                  <div className="px-4 py-2 bg-gray-200/50 text-gray-400 rounded-full text-sm font-medium border border-gray-200">
                    Agenda
                  </div>
                  <div className="px-4 py-2 bg-gray-200/50 text-gray-400 rounded-full text-sm font-medium border border-gray-200">
                    + mais
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TQ App Showcase */}
      <section id="app" className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#5ED6CE]/20 text-[#5ED6CE] text-sm font-semibold rounded-full mb-4">
              {t.tqApp.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.tqApp.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t.tqApp.description}
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
              {/* Media Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-[#B725B7]/20 to-[#E91E63]/20 flex items-center justify-center">
                <div className="text-center">
                  <Mic className="w-16 h-16 text-[#B725B7] mx-auto mb-3 opacity-50" />
                  <span className="text-gray-500 text-sm">{t.tqApp.mediaPlaceholder}</span>
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
              <div className="aspect-video bg-gradient-to-br from-[#E91E63]/20 to-[#B725B7]/20 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-[#E91E63] mx-auto mb-3 opacity-50" />
                  <span className="text-gray-500 text-sm">{t.tqApp.mediaPlaceholder}</span>
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
              <div className="aspect-video bg-gradient-to-br from-[#5ED6CE]/20 to-[#B725B7]/20 flex items-center justify-center">
                <div className="text-center">
                  <Receipt className="w-16 h-16 text-[#5ED6CE] mx-auto mb-3 opacity-50" />
                  <span className="text-gray-500 text-sm">{t.tqApp.mediaPlaceholder}</span>
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
              <div className="aspect-video bg-gradient-to-br from-[#B725B7]/20 to-[#5ED6CE]/20 flex items-center justify-center">
                <div className="text-center">
                  <ClipboardList className="w-16 h-16 text-[#B725B7] mx-auto mb-3 opacity-50" />
                  <span className="text-gray-500 text-sm">{t.tqApp.mediaPlaceholder}</span>
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

          {/* CTA Button */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link
              to="/products/tq"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              {t.tqApp.learnMore}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* License System Section */}
      <section id="licenses" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#B725B7]/10 to-[#E91E63]/10 text-[#B725B7] text-sm font-semibold rounded-full mb-4">
              {t.licenses.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.licenses.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.licenses.description}
            </p>
          </motion.div>

          {/* License Types */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Admin */}
            <motion.div
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#B725B7]/5 to-[#E91E63]/5 border border-[#B725B7]/20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#B725B7] to-[#E91E63] rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.licenses.admin.title}</h3>
              <p className="text-gray-600 mb-4">{t.licenses.admin.description}</p>
              <ul className="space-y-2">
                {t.licenses.admin.permissions.map((permission, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-[#B725B7] rounded-full" />
                    {permission}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Manager */}
            <motion.div
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#5ED6CE]/5 to-[#B725B7]/5 border border-[#5ED6CE]/20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#5ED6CE] to-[#B725B7] rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.licenses.manager.title}</h3>
              <p className="text-gray-600 mb-4">{t.licenses.manager.description}</p>
              <ul className="space-y-2">
                {t.licenses.manager.permissions.map((permission, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-[#5ED6CE] rounded-full" />
                    {permission}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Operations */}
            <motion.div
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#E91E63]/5 to-[#5ED6CE]/5 border border-[#E91E63]/20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#E91E63] to-[#5ED6CE] rounded-xl flex items-center justify-center mb-6">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.licenses.operations.title}</h3>
              <p className="text-gray-600 mb-4">{t.licenses.operations.description}</p>
              <ul className="space-y-2">
                {t.licenses.operations.permissions.map((permission, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full" />
                    {permission}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Automation Section */}
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
              {t.automation.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.automation.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t.automation.description}
            </p>
          </motion.div>

          {/* 3-Column Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {t.automation.cards.map((card, i) => {
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
              {t.automation.cta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-24 bg-gradient-to-br from-[#B725B7] via-[#a020a0] to-[#E91E63]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full mb-4">
              {t.comingSoon.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.comingSoon.title}
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
              {t.comingSoon.description}
            </p>

            {/* Coming Soon Apps */}
            <div className="flex flex-wrap justify-center gap-4">
              {t.comingSoon.apps.map((app, i) => (
                <motion.div
                  key={i}
                  className="px-6 py-3 bg-white/10 backdrop-blur rounded-full border border-white/20 text-white font-medium"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  {app}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
