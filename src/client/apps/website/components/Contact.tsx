import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { Send, CheckCircle, Loader2, CalendarCheck, Zap, Users } from 'lucide-react'

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

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
    { icon: CalendarCheck, text: t.contact.reasons.demo },
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

            {/* WhatsApp CTA */}
            <div className="mt-6">
              <p className="text-gray-500 text-sm mb-3">{t.contact.preferWhatsApp}</p>
              <a
                href="https://wa.me/5511966874759"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-lg transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
                {t.contact.whatsAppButton}
              </a>
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
