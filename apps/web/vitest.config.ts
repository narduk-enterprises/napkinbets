import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)
const nuxtPkgDir = dirname(require.resolve('nuxt/package.json'))
const vuePath = dirname(require.resolve('vue', { paths: [nuxtPkgDir] }))

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '#layer/server/database/schema',
        replacement: resolve(__dirname, '../../layers/narduk-nuxt-layer/server/database/schema.ts'),
      },
      {
        find: '#server/database/schema',
        replacement: resolve(__dirname, 'server/database/schema.ts'),
      },
      { find: '#layer', replacement: resolve(__dirname, '../../layers/narduk-nuxt-layer') },
      {
        find: '#server/utils/auth',
        replacement: resolve(__dirname, '../../layers/narduk-nuxt-layer/server/utils/auth.ts'),
      },
      {
        find: '#server/utils/database',
        replacement: resolve(__dirname, '../../layers/narduk-nuxt-layer/server/utils/database.ts'),
      },
      { find: '#server', replacement: resolve(__dirname, 'server') },
    ],
  },
  test: {
    projects: [
      {
        resolve: {
          alias: [{ find: 'vue', replacement: vuePath }],
        },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      // Server must be running (pnpm run dev). NUXT_TEST_BASE_URL defaults to http://localhost:3000
      {
        test: {
          name: 'integration',
          include: ['tests/integration/api/**/*.test.ts'],
          environment: 'node',
          testTimeout: 15_000,
        },
      },
      {
        test: {
          name: 'integration-external',
          include: ['tests/integration/api-external/**/*.test.ts'],
          environment: 'node',
          testTimeout: 30_000,
        },
      },
    ],
  },
})
