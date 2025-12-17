import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { Instagram, Linkedin } from 'lucide-react'

export function Footer() {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-16 bg-[#0a0a0f] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <img
              src="/logo-512x256.png"
              alt="LivoCare"
              className="h-10 mb-4"
            />
            <p className="text-gray-500 text-sm mb-6">
              {t.footer.tagline}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-gray-400" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  {t.footer.links.platform}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  {t.footer.links.pricing}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  {t.footer.links.contact}
                </a>
              </li>
            </ul>
          </div>

          {/* Dot Image */}
          <div className="flex justify-center md:justify-end items-start">
            <img
              src="/dot.png"
              alt=""
              className="w-24 h-24 opacity-60"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} LivoCare. {t.footer.rights}
          </p>
          <p className="text-gray-600 text-xs">
            {t.footer.madeWith}
          </p>
        </div>
      </div>
    </footer>
  )
}
