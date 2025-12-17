import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'

export function Hero() {
  const { t } = useLanguage()
  const [showDot, setShowDot] = useState(false)

  useEffect(() => {
    // Small delay before showing the dot animation
    const timer = setTimeout(() => setShowDot(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100" />

      {/* Rolling Dot - appears from left and rolls to the right */}
      {showDot && (
        <motion.div
          className="absolute"
          style={{
            top: '30%',
            width: '500px',
            height: '500px',
          }}
          initial={{
            opacity: 0,
            left: '-550px',
            rotate: 0,
          }}
          animate={{
            opacity: 0.7,
            left: 'calc(100% - 200px)',
            rotate: 1080,
          }}
          transition={{
            duration: 5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <img
            src="/dot.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Logo image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <img
            src="/logo-512x256.png"
            alt="LivoCare.ai"
            className="h-24 md:h-32"
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-xl md:text-2xl text-gray-600 font-light mb-6 tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t.hero.tagline}
        </motion.p>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {t.hero.subtitle}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <button className="btn-primary text-lg px-10 py-4">
            {t.hero.cta}
          </button>
        </motion.div>
      </div>

    </section>
  )
}
