import path from 'node:path'
import { defineConfig } from 'vitest/config'

export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/notilearn_test'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['./test/integration-setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: 'integration-test-secret-at-least-32-characters',
      BETTER_AUTH_URL: 'http://localhost:3000',
      APP_ROOT_DOMAIN: 'localhost',
    },
  },
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, './src'),
    },
  },
})
