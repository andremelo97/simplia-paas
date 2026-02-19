import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Monitor, ChevronDown, Download, Globe, Chrome, Share2, MoreHorizontal, Menu, Plus, ArrowUp } from 'lucide-react'
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
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-colors"
  >
    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}
    >
      {number}
    </div>
    <div className="flex items-center gap-2.5 text-gray-300 text-sm md:text-base leading-relaxed">
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
    className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] backdrop-blur-sm"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
    >
      <span className="font-medium text-white text-sm md:text-base pr-4">{question}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
      >
        <ChevronDown className="w-5 h-5 text-gray-400" />
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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="space-y-3"
  >
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/10">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-base">{name}</h3>
    </div>
    <div className="space-y-2.5 pl-1">
      {steps.map((step, i) => (
        <StepCard key={i} number={i + 1} icon={step.icon} text={step.text} delay={i * 0.1} />
      ))}
    </div>
  </motion.div>
)

export function InstallPage() {
  const { t } = useLanguage()
  const [platform, setPlatform] = useState<Platform>('ios')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const iosSteps = {
    safari: [
      {
        icon: <IOSShareIcon className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.ios.safari.step1
      },
      {
        icon: <Plus className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.ios.safari.step2
      }
    ],
    chrome: [
      {
        icon: <IOSShareIcon className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.ios.chrome.step1
      },
      {
        icon: <MoreHorizontal className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.ios.chrome.step2
      },
      {
        icon: <Plus className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.ios.chrome.step3
      }
    ]
  }

  const androidSteps = {
    chrome: [
      {
        icon: <MoreHorizontal className="w-5 h-5 flex-shrink-0 text-[#5ED6CE] rotate-90" />,
        text: t.install.android.chrome.step1
      },
      {
        icon: <Download className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.android.chrome.step2
      }
    ],
    samsung: [
      {
        icon: <Menu className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.android.samsung.step1
      },
      {
        icon: <Plus className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.android.samsung.step2
      },
      {
        icon: <Smartphone className="w-5 h-5 flex-shrink-0 text-[#5ED6CE]" />,
        text: t.install.android.samsung.step3
      }
    ]
  }

  const faqItems = t.install.faq.items

  return (
    <section className="relative min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(183,37,183,0.3) 0%, rgba(233,30,99,0.1) 40%, transparent 70%)'
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-5 pt-32 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(183,37,183,0.15), rgba(233,30,99,0.15))' }}
          >
            <Download className="w-8 h-8 text-[#B725B7]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.install.hero.title}
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {t.install.hero.subtitle}
          </p>
        </motion.div>

        {/* Platform Selector */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex rounded-xl p-1 border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {(['ios', 'android'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  platform === p ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {platform === p && (
                  <motion.div
                    layoutId="platform-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(183,37,183,0.3), rgba(233,30,99,0.3))' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {p === 'ios' ? <Smartphone className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  {p === 'ios' ? 'iPhone / iPad' : 'Android'}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Browser Instructions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={platform}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-10 mb-20"
          >
            {platform === 'ios' ? (
              <>
                <BrowserSection
                  icon={<SafariIcon className="w-5 h-5 text-[#5ED6CE]" />}
                  name="Safari"
                  steps={iosSteps.safari}
                />
                <BrowserSection
                  icon={<Chrome className="w-5 h-5 text-[#5ED6CE]" />}
                  name="Google Chrome"
                  steps={iosSteps.chrome}
                />
              </>
            ) : (
              <>
                <BrowserSection
                  icon={<Chrome className="w-5 h-5 text-[#5ED6CE]" />}
                  name="Google Chrome"
                  steps={androidSteps.chrome}
                />
                <BrowserSection
                  icon={<SamsungIcon className="w-5 h-5 text-[#5ED6CE]" />}
                  name="Samsung Internet"
                  steps={androidSteps.samsung}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase border border-white/10 text-gray-400 mb-4">
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {t.install.faq.title}
            </h2>
          </div>

          <div className="space-y-2.5">
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
        </motion.div>

        {/* Back to top */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mt-16"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
            {t.install.backToTop}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
