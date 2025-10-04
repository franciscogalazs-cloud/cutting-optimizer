import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from './package.json' with { type: 'json' }
import { execSync } from 'node:child_process'
/* eslint-env node */
/* global process */

// Emular __dirname en ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // En desarrollo servimos en raíz para evitar issues con rutas de /public
  // En build/producción mantenemos el base para GitHub Pages
  base: command === 'serve' ? '/' : '/cutting-optimizer/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.VITE_PORT || 5176),
    strictPort: true, // si está ocupado, falla: así evitamos confusiones de puertos
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: (() => {
    const commit = (typeof process !== 'undefined' && process?.env?.GITHUB_SHA)
      ? process.env.GITHUB_SHA.slice(0, 7)
      : (() => {
      try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'local';
      } catch {
        return 'local';
      }
      })();
    const info = {
      version: pkg.version || '0.0.0',
      date: new Date().toISOString(),
      commit,
    };
    return {
      __BUILD_INFO__: JSON.stringify(info),
    };
  })(),
  build: {
    chunkSizeWarningLimit: 1024,
  },
}))
