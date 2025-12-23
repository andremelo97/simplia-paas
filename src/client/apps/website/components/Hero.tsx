import React from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'

export function Hero() {
  const { t } = useLanguage()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100" />

      {/* Decorative circles with float + breathing animation */}
      {/* Top-right circle - responsive sizes */}
      <motion.div
        className="absolute top-[-10%] right-[-15%] w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[600px] lg:h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(183,37,183,0.4) 0%, rgba(233,30,99,0.3) 50%, rgba(94,214,206,0.2) 100%)',
        }}
        animate={{
          y: [0, -50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Bottom-left circle - responsive sizes */}
      <motion.div
        className="absolute bottom-[-15%] left-[-20%] w-[350px] h-[350px] md:w-[450px] md:h-[450px] lg:w-[700px] lg:h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(233,30,99,0.35) 0%, rgba(183,37,183,0.25) 50%, rgba(94,214,206,0.15) 100%)',
        }}
        animate={{
          y: [0, 40, 0],
          scale: [1, 0.88, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

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
          <a
            href="#app"
            className="btn-primary text-lg px-10 py-4 inline-block"
          >
            {t.hero.cta}
          </a>
        </motion.div>
      </div>

    </section>
  )
}
