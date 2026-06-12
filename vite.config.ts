import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// base './' hace que el build funcione en cualquier subruta
// (GitHub Pages sirve en https://usuario.github.io/forjafit/)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // CAPA 4 · Plataforma — PWA instalable y 100% offline (Workbox).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Temple — Cuaderno de gimnasio',
        short_name: 'Temple',
        description:
          'Registro de entrenamientos de fuerza. Gratis, sin cuentas, 100% offline y accesible.',
        lang: 'es',
        display: 'standalone',
        background_color: '#14161a',
        theme_color: '#14161a',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precachear todo el build, fuentes e ilustraciones de músculos
        // incluidas: tras la primera visita la app funciona sin red
        // (el gimnasio sin cobertura).
        globPatterns: ['**/*.{js,css,html,png,ico,woff2,webp}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/data/**'],
      reporter: ['text', 'html'],
    },
  },
});
