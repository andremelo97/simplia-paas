import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, ChevronDown, Download, Chrome, MoreHorizontal, Menu, Plus } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

type Platform = 'ios' | 'android'

/** iOS Share icon — square with arrow pointing up */
const IOSShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

/** Safari compass icon */
const SafariIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
)

/** Samsung Internet icon */
const SamsungIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12c0-2.2 1.8-4 4-4" />
    <path d="M16 12c0 2.2-1.8 4-4 4" />
  </svg>
)

interface StepCardProps {
  number: number
  icon: React.ReactNode
  text: string
  delay?: number
}

const StepCard: React.FC<StepCardProps> = ({ number, icon, text, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -15 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition-colors"
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}
    >
      {number}
    </div>
    <div className="flex items-center gap-2 text-gray-700 text-sm leading-relaxed">
      {icon}
      <span>{text}</span>
    </div>
  </motion.div>
)

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  delay?: number
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.4, delay }}
    className="rounded-xl overflow-hidden backdrop-blur-sm"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      border: '1px solid rgba(183,37,183,0.15)'
    }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.04] transition-colors group"
    >
      <span className="font-medium text-white text-sm md:text-base pr-4">{question}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
      >
        <ChevronDown className="w-5 h-5 text-[#B725B7] group-hover:text-[#E91E63] transition-colors" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
            {answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)

interface BrowserSectionProps {
  icon: React.ReactNode
  name: string
  steps: { icon: React.ReactNode; text: string }[]
}

const BrowserSection: React.FC<BrowserSectionProps> = ({ icon, name, steps }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-2.5"
  >
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200">
        {icon}
      </div>
      <h3 className="text-gray-900 font-semibold text-sm">{name}</h3>
    </div>
    <div className="space-y-2 pl-0.5">
      {steps.map((step, i) => (
        <StepCard key={i} number={i + 1} icon={step.icon} text={step.text} delay={i * 0.08} />
      ))}
    </div>
  </motion.div>
)

export function InstallPage() {
  const { t } = useLanguage()
  const [platform, setPlatform] = useState<Platform>('ios')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Instructions matching the InstallAppBanner exactly
  const iosSteps = {
    safari: [
      {
        icon: <span className="text-gray-400 text-xs font-medium">"⋯"</span>,
        text: t.install.ios.safari.step1
      },
      {
        icon: <IOSShareIcon className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.ios.safari.step2
      },
      {
        icon: <Plus className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.ios.safari.step3
      }
    ],
    chrome: [
      {
        icon: <IOSShareIcon className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.ios.chrome.step1
      },
      {
        icon: <MoreHorizontal className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.ios.chrome.step2
      },
      {
        icon: <Plus className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.ios.chrome.step3
      }
    ]
  }

  const androidSteps = {
    chrome: [
      {
        icon: <MoreHorizontal className="w-4 h-4 flex-shrink-0 text-[#B725B7] rotate-90" />,
        text: t.install.android.chrome.step1
      },
      {
        icon: <Download className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.android.chrome.step2
      }
    ],
    samsung: [
      {
        icon: <Menu className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.android.samsung.step1
      },
      {
        icon: <Plus className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.android.samsung.step2
      },
      {
        icon: <Smartphone className="w-4 h-4 flex-shrink-0 text-[#B725B7]" />,
        text: t.install.android.samsung.step3
      }
    ]
  }

  const faqItems = t.install.faq.items

  return (
    <>
      {/* Block 1: White bg — 2-column hero + instructions */}
      <section className="relative bg-white overflow-hidden">
        {/* Subtle decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, #B725B7, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-32"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(183,37,183,0.1), rgba(233,30,99,0.1))' }}
              >
                <Download className="w-7 h-7 text-[#B725B7]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t.install.hero.title}
              </h1>
              <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-md">
                {t.install.hero.subtitle}
              </p>
            </motion.div>

            {/* Right: Platform selector + instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {/* Platform Selector */}
              <div className="flex mb-8">
                <div className="inline-flex rounded-xl p-1 border border-gray-200 bg-gray-50">
                  {(['ios', 'android'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        platform === p ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {platform === p && (
                        <motion.div
                          layoutId="platform-pill"
                          className="absolute inset-0 rounded-lg shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        {p === 'ios' ? 'iPhone / iPad' : 'Android'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Browser Instructions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {platform === 'ios' ? (
                    <>
                      <BrowserSection
                        icon={<SafariIcon className="w-4 h-4 text-[#B725B7]" />}
                        name="Safari"
                        steps={iosSteps.safari}
                      />
                      <BrowserSection
                        icon={<Chrome className="w-4 h-4 text-[#B725B7]" />}
                        name="Google Chrome"
                        steps={iosSteps.chrome}
                      />
                    </>
                  ) : (
                    <>
                      <BrowserSection
                        icon={<Chrome className="w-4 h-4 text-[#B725B7]" />}
                        name="Google Chrome"
                        steps={androidSteps.chrome}
                      />
                      <BrowserSection
                        icon={<SamsungIcon className="w-4 h-4 text-[#B725B7]" />}
                        name="Samsung Internet"
                        steps={androidSteps.samsung}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Block 2: Dark bg — FAQ */}
      <section className="relative bg-[#0a0a0f] overflow-hidden py-24">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(183,37,183,0.3), rgba(233,30,99,0.3), transparent)' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(183,37,183,0.25) 0%, rgba(94,214,206,0.08) 50%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(94,214,206,0.4), transparent 70%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(183,37,183,0.12), rgba(233,30,99,0.12))',
                border: '1px solid rgba(183,37,183,0.2)',
                color: '#E91E63'
              }}
            >
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {t.install.faq.title}
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqItems.map((item: { question: string; answer: string }, i: number) => (
              <FAQItem
                key={i}
                question={item.question}
                answer={item.answer}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
