import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { Send } from 'lucide-react'

export function Contact() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Non-functional for now - just prevent default
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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
              {t.contact.name}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t.contact.namePlaceholder}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.contact.email}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.contact.emailPlaceholder}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Message field */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.contact.message}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t.contact.messagePlaceholder}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B725B7] focus:ring-2 focus:ring-[#B725B7]/20 outline-none transition-all resize-none text-gray-900"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
          >
            <Send size={20} />
            {t.contact.send}
          </button>
        </motion.form>
      </div>
    </section>
  )
}
