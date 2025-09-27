import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Emular __dirname en ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173, // usar puerto por defecto de Vite
    strictPort: false, // permitir usar otro puerto si el 5173 está ocupado
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1024, // Reducir avisos por chunks grandes (1 MB)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar librerías pesadas en chunks dedicados
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            // Radix y utilidades varias a vendor
            if (id.includes('@radix-ui') || id.includes('react-router-dom')) return 'vendor';
          }

          // Agrupar módulos de IA en un chunk separado
          const aiPath = path.resolve(__dirname, 'src/components/ai');
          if (id.includes(aiPath)) return 'ai';
        },
      },
    },
  },
})
