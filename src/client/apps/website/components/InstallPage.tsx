import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, ChevronDown, Download, Chrome, MoreHorizontal, Menu, Plus, Mic, Users, MonitorSmartphone } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

type Platform = 'ios' | 'android'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** iOS Share icon */
const IOSShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

const SafariIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
)

const SamsungIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12c0-2.2 1.8-4 4-4" />
    <path d="M16 12c0 2.2-1.8 4-4 4" />
  </svg>
)

const StepCard: React.FC<{ number: number; children: React.ReactNode; delay?: number }> = ({ number, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -15 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}
    >
      {number}
    </div>
    <div className="text-gray-300 text-sm leading-relaxed">
      {children}
    </div>
  </motion.div>
)

const FAQItem: React.FC<{
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  delay?: number
}> = ({ question, answer, isOpen, onToggle, delay = 0 }) => (
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
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0">
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

const BrowserHeader: React.FC<{ icon: React.ReactNode; name: string }> = ({ icon, name }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/10">
      {icon}
    </div>
    <h3 className="text-white font-semibold text-sm">{name}</h3>
  </div>
)

export function InstallPage() {
  const { t } = useLanguage()
  const [platform, setPlatform] = useState<Platform>('ios')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  // Listen for Android install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  const faqItems = t.install.faq.items

  return (
    <>
      {/* Block 1: Dark — 2-column hero + instructions */}
      <section className="relative bg-[#0a0a0f] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(183,37,183,0.5), transparent 70%)' }}
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
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
                {t.install.hero.title}
              </h1>
              <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10">
                {t.install.hero.subtitle}
              </p>

              {/* Mobile features */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {t.install.hero.mobileFeatures}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(183,37,183,0.1)' }}>
                      <Mic className="w-4 h-4 text-[#B725B7]" />
                    </div>
                    <span className="text-gray-300 text-sm">{t.install.hero.feature1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(94,214,206,0.1)' }}>
                      <Smartphone className="w-4 h-4 text-[#5ED6CE]" />
                    </div>
                    <span className="text-gray-300 text-sm">{t.install.hero.feature2}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,30,99,0.1)' }}>
                      <Users className="w-4 h-4 text-[#E91E63]" />
                    </div>
                    <span className="text-gray-300 text-sm">{t.install.hero.feature3}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 mt-6 p-3.5 rounded-xl border border-[#5ED6CE]/20 bg-[#5ED6CE]/5">
                  <MonitorSmartphone className="w-5 h-5 text-[#5ED6CE] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {t.install.hero.fullAccess}
                  </p>
                </div>
              </div>

              {/* App icon preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10 flex justify-center lg:justify-start"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-[18px] bg-white shadow-lg shadow-black/30 flex items-center justify-center overflow-hidden">
                    <img src="/app-icon.png" alt="LivoCare" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">LivoCare</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Platform selector + instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {/* Platform Selector */}
              <div className="flex mb-8">
                <div className="inline-flex rounded-xl p-1 border border-white/10 bg-white/[0.03]">
                  {(['ios', 'android'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
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
                        <Smartphone className="w-4 h-4" />
                        {p === 'ios' ? 'iPhone / iPad' : 'Android'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
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
                      {/* Safari */}
                      <div className="space-y-2.5">
                        <BrowserHeader icon={<SafariIcon className="w-4 h-4 text-[#5ED6CE]" />} name="Safari" />
                        <div className="space-y-2 pl-0.5">
                          <StepCard number={1} delay={0}>
                            {t.install.ios.safari.step1}
                          </StepCard>
                          <StepCard number={2} delay={0.08}>
                            Toque em "<IOSShareIcon className="w-3.5 h-3.5 inline-block align-text-bottom text-[#5ED6CE]" /> {t.install.ios.safari.step2.replace('Toque em ', '').replace('Tap ', '')}
                          </StepCard>
                          <StepCard number={3} delay={0.16}>
                            Toque em "<Plus className="w-3.5 h-3.5 inline-block align-text-bottom text-[#5ED6CE]" /> {t.install.ios.safari.step3.replace('Toque em ', '').replace('Tap ', '')}
                          </StepCard>
                        </div>
                      </div>

                      {/* Chrome */}
                      <div className="space-y-2.5">
                        <BrowserHeader icon={<Chrome className="w-4 h-4 text-[#5ED6CE]" />} name="Google Chrome" />
                        <div className="space-y-2 pl-0.5">
                          <StepCard number={1} delay={0}>
                            Toque em "<IOSShareIcon className="w-3.5 h-3.5 inline-block align-text-bottom text-[#5ED6CE]" />" no topo, junto à URL
                          </StepCard>
                          <StepCard number={2} delay={0.08}>
                            Toque em "<MoreHorizontal className="w-3.5 h-3.5 inline-block align-text-bottom text-[#5ED6CE]" /> {t.install.ios.chrome.step2.replace('Toque em ', '').replace('Tap ', '')}
                          </StepCard>
                          <StepCard number={3} delay={0.16}>
                            {t.install.ios.chrome.step3}
                          </StepCard>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Android install button */}
                      {deferredPrompt && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-xl border border-[#B725B7]/20 bg-[#B725B7]/5"
                        >
                          <p className="text-gray-300 text-sm mb-4">{t.install.android.installDescription}</p>
                          <button
                            onClick={handleInstall}
                            className="w-full py-3 px-6 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#B725B7]/20"
                            style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}
                          >
                            <Download className="w-4 h-4 inline-block mr-2 align-text-bottom" />
                            {t.install.android.installButton}
                          </button>
                        </motion.div>
                      )}

                      {/* Manual instructions */}
                      {!deferredPrompt && (
                        <>
                          {/* Chrome */}
                          <div className="space-y-2.5">
                            <BrowserHeader icon={<Chrome className="w-4 h-4 text-[#5ED6CE]" />} name="Google Chrome" />
                            <div className="space-y-2 pl-0.5">
                              <StepCard number={1} delay={0}>
                                {t.install.android.chrome.step1}
                              </StepCard>
                              <StepCard number={2} delay={0.08}>
                                {t.install.android.chrome.step2}
                              </StepCard>
                            </div>
                          </div>

                          {/* Samsung */}
                          <div className="space-y-2.5">
                            <BrowserHeader icon={<SamsungIcon className="w-4 h-4 text-[#5ED6CE]" />} name="Samsung Internet" />
                            <div className="space-y-2 pl-0.5">
                              <StepCard number={1} delay={0}>
                                {t.install.android.samsung.step1}
                              </StepCard>
                              <StepCard number={2} delay={0.08}>
                                {t.install.android.samsung.step2}
                              </StepCard>
                              <StepCard number={3} delay={0.16}>
                                {t.install.android.samsung.step3}
                              </StepCard>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Block 2: FAQ */}
      <section className="relative bg-[#0a0a0f] overflow-hidden py-24">
        <div className="absolute top-0 left-0 w-full h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(183,37,183,0.3), rgba(233,30,99,0.3), transparent)' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(183,37,183,0.25) 0%, rgba(94,214,206,0.08) 50%, transparent 70%)' }}
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
