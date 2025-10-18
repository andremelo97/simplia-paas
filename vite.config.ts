import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  base: '/', // Always root - hostname-based routing handles subdomain
  build: {
    outDir: '../../dist/client'
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@client': path.resolve(__dirname, 'src/client')
    }
  },
  server: {
    port: 3002,
    strictPort: true,
    proxy: {
      '/internal/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})