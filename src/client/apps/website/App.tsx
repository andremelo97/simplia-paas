import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { TQPage } from './products/tq'

function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Contact />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="min-h-screen bg-dark">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products/tq" element={<TQPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </BrowserRouter>
  )
}
