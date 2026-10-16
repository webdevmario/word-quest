import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new version waits until the player is back on the home screen,
      // so an update never reloads the page in the middle of a game.
      registerType: 'prompt',
      // The workbox globs below already cover the icons.
      includeManifestIcons: false,
      manifest: {
        name: 'Word Quest',
        short_name: 'Word Quest',
        description:
          'A word game for kids: themed word search, Word Worm and Word Guess, with a friendly dictionary.',
        theme_color: '#10291f',
        background_color: '#10291f',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell, fonts and the word lists, so every mode plays offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,txt}'],
        // words.txt is about 1.7 MB.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Remember online definitions so looked-up words still work
            // offline. With no connection and no copy, the lookup fails and
            // the word card falls back to "no definition".
            urlPattern: /^https:\/\/api\.dictionaryapi\.dev\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'online-definitions',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 500 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5520 },
  preview: { port: 5521 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
    },
  },
});
