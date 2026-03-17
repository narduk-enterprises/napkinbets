import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#server': resolve(__dirname, 'server'),
      '#layer': resolve(__dirname, '../../layers/narduk-nuxt-layer'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
})
