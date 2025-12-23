import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { Send, CheckCircle, Loader2, Star, Zap, Users } from 'lucide-react'

export function Contact() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields are filled
    if (!formData.name || !formData.company || !formData.email || !formData.phone || !formData.message) {
      setError(t.contact.errorRequired)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/website/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to send message')
      }

      // Success - show feedback for 10 seconds
      setIsSuccess(true)
      setFormData({ name: '', company: '', email: '', phone: '', message: '' })

      setTimeout(() => {
        setIsSuccess(false)
      }, 10000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const reasons = [
    { icon: Star, text: t.contact.reasons.vip },
    { icon: Zap, text: t.contact.reasons.automation },
    { icon: Users, text: t.contact.reasons.questions }
  ]

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-32"
          >
            <span className="inline-block px-4 py-1.5 bg-[#B725B7]/10 text-[#B725B7] text-sm font-semibold rounded-full mb-6">
              {t.contact.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.contact.title}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t.contact.subtitle}
            </p>

            {/* Reasons to contact */}
            <div className="space-y-4">
              {reasons.map((reason, i) => {
                const Icon = reason.icon
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#B725B7]/10 to-[#E91E63]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#B725B7]" />
                    </div>
                    <p className="text-gray-700 font-medium">{reason.text}</p>
                  </div>
                )
              })}
            </div>

            {/* Response time badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-[#5ED6CE]/10 rounded-full">
              <div className="w-2 h-2 bg-[#5ED6CE] rounded-full animate-pulse" />
              <span className="text-sm text-[#0a8a80] font-medium">{t.contact.responseTime}</span>
            </div>
          </motion.div>

          {/* Right side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t.contact.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.contact.namePlaceholder}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all text-gray-900"
                  />
                </div>

                {/* Company field */}
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t.contact.company} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder={t.contact.companyPlaceholder}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all text-gray-900"
                  />
                </div>

                {/* Email and Phone in 2 columns on desktop */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Email field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t.contact.email} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t.contact.emailPlaceholder}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all text-gray-900"
                    />
                  </div>

                  {/* Phone field */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t.contact.phone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t.contact.phonePlaceholder}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* Message field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t.contact.message} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t.contact.messagePlaceholder}
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all resize-none text-gray-900"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit button or Success message */}
                {isSuccess ? (
                  <div className="w-full py-4 px-6 bg-gradient-to-r from-[#5ED6CE]/20 to-[#B725B7]/20 border border-[#5ED6CE]/30 rounded-lg flex items-center justify-center gap-3 text-[#0a8a80]">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t.contact.successMessage}</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t.contact.sending}
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        {t.contact.send}
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
