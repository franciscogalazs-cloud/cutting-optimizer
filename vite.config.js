import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Emular __dirname en ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/cutting-optimizer/',
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
    // Deja que Vite/Rollup decidan el code-splitting por defecto.
    // Evitamos manualChunks personalizados para reducir riesgos de
    // agrupación errónea que puedan romper importaciones en producción.
  },
})
