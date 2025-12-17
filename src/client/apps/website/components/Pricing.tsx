import React from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { Check } from 'lucide-react'

const plans = ['basic', 'professional', 'enterprise'] as const

export function Pricing() {
  const { t } = useLanguage()

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-gray-900 to-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((planKey, index) => {
            const plan = t.pricing[planKey]
            const isPopular = planKey === 'professional'

            return (
              <motion.div
                key={planKey}
                className={`relative rounded-2xl p-8 ${
                  isPopular
                    ? 'bg-gradient-to-b from-[#B725B7]/20 to-[#E91E63]/10 border-2 border-[#B725B7]/50'
                    : 'bg-white/5 border border-white/10'
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white text-sm font-semibold px-4 py-1 rounded-full">
                      {t.pricing.popular}
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  {planKey !== 'enterprise' && (
                    <span className="text-gray-400 ml-1">
                      {t.pricing.monthly}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Features list */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        size={20}
                        className={`mt-0.5 flex-shrink-0 ${
                          isPopular ? 'text-[#E91E63]' : 'text-[#5ED6CE]'
                        }`}
                      />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    isPopular
                      ? 'btn-primary'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {t.pricing.cta}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
