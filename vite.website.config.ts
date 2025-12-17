import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client/apps/website',
  base: '/',
  publicDir: '../../../../imgs',
  server: {
    port: 3006,
    host: true,
    strictPort: true
  },
  build: {
    outDir: '../../../../dist/website',
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
