// Minimal Service Worker - enables PWA install prompt
// No offline caching - app requires network connectivity

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pass through all requests to the network
  return
})
