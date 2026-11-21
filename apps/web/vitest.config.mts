import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./src/shared/testing/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: [fileURLToPath(new URL('./src/shared/testing/setup.ts', import.meta.url))],
  },
})
