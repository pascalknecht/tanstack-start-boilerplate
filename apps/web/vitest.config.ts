import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.integration.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, './src'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
