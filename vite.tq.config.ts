import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client/apps/tq',
  base: '/', // Always root - hostname-based routing handles subdomain
  publicDir: '../../../../imgs',
  server: {
    port: 3005,
    host: true,
    strictPort: true,
    proxy: {
      '/internal/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api/tq': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
        timeout: 120000, // 120 seconds for AI operations
        proxyTimeout: 120000
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: '../../../../dist/tq',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, 'src/client'),
      '@server': path.resolve(__dirname, 'src/server'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
})