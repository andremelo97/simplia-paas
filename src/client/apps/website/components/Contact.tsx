import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { Send, CheckCircle, Loader2 } from 'lucide-react'

export function Contact() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
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
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
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
      setFormData({ name: '', email: '', phone: '', message: '' })

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

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.contact.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.contact.subtitle}
          </p>
        </motion.div>

        {/* Contact form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
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
              rows={5}
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
        </motion.form>
      </div>
    </section>
  )
}
