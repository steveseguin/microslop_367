import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react()]
})
