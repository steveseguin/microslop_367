import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('@fortune-sheet')) {
            return 'excel-workbook'
          }

          if (id.includes('xlsx')) {
            return 'excel-io'
          }

          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'excel-chart'
          }

          if (id.includes('fabric')) {
            return 'slides-canvas'
          }

          if (id.includes('pptxgenjs') || id.includes('jszip')) {
            return 'slides-io'
          }

          if (id.includes('docx') || id.includes('mammoth')) {
            return 'word-io'
          }

          if (id.includes('@tiptap')) {
            return 'word-editor'
          }
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB
      },
      manifest: {
        name: 'OfficeNinja',
        short_name: 'OfficeNinja',
        description: 'A modern, lightweight office suite right in your browser.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})
