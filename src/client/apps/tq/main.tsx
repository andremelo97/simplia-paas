import React from 'react'
import ReactDOM from 'react-dom/client'
import { TQApp } from './app'
import '../../index.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TQApp />
  </React.StrictMode>
)