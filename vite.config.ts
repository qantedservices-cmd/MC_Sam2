import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - bibliothèques tierces
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-excel': ['xlsx'],
          'vendor-pdf': ['html2canvas', 'dompurify'],
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    // Augmenter la limite d'avertissement
    chunkSizeWarningLimit: 600,
  }
})
