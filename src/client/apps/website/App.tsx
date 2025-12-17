import React from 'react'
import { LanguageProvider } from './i18n/LanguageContext'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Pricing } from './components/Pricing'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-dark">
        <Header />
        <main>
          <Hero />
          <Features />
          <Pricing />
          <Contact />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  )
}
