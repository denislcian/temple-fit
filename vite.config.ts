import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// base './' hace que el build funcione en cualquier subruta
// (GitHub Pages sirve en https://usuario.github.io/forjafit/)
export default defineConfig({
  base: './',
  server: { port: 3000 },
  preview: { port: 3000 },
  plugins: [
    react(),
    // CAPA 4 · Plataforma — PWA instalable y 100% offline (Workbox).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        scope: './',
        start_url: './',
        name: 'Temple — Cuaderno de gimnasio',
        short_name: 'Temple',
        description:
          'Registro de entrenamientos de fuerza. Gratis, sin cuentas, 100% offline y accesible.',
        lang: 'es',
        dir: 'ltr',
        display: 'standalone',
        background_color: '#f4f8f5',
        theme_color: '#f4f8f5',
        categories: ['health', 'fitness', 'sports', 'lifestyle'],
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
        // Accesos directos desde el icono instalado (long-press / clic derecho).
        shortcuts: [
          {
            name: 'Empezar a entrenar',
            short_name: 'Entrenar',
            url: './#/entrenar',
            icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Diario de nutrición',
            short_name: 'Nutrición',
            url: './#/nutricion',
            icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // Precachear todo el build, fuentes e ilustraciones de músculos
        // incluidas: tras la primera visita la app funciona sin red
        // (el gimnasio sin cobertura). La música NO se precachea (pesa), se
        // cachea bajo demanda al reproducirla por primera vez.
        globPatterns: ['**/*.{js,css,html,png,ico,woff2,webp}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'temple-audio',
              rangeRequests: true,
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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
