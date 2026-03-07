import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('vite/preload-helper')) {
              return 'route-loader'
            }

            return
          }

          if (id.includes('@fortune-sheet')) {
            return 'excel-workbook'
          }

          if (id.includes('@tiptap') || id.includes('prosemirror')) {
            return 'word-editor'
          }

          if (
            id.includes('/react/') ||
            id.includes('\\react\\') ||
            id.includes('react-dom') ||
            id.includes('scheduler')
          ) {
            return 'framework'
          }

          if (id.includes('react-router') || id.includes('@remix-run/router')) {
            return 'router'
          }

          if (id.includes('lucide-react')) {
            return 'ui-icons'
          }

          if (id.includes('idb')) {
            return 'storage'
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

          if (id.includes('jszip')) {
            return 'zip-runtime'
          }

          if (id.includes('pptxgenjs')) {
            return 'slides-io'
          }

          if (id.includes('docx') || id.includes('mammoth')) {
            return 'word-io'
          }
        }
      }
    }
  },
  plugins: [react()]
})
