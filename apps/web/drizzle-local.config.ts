import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './drizzle-local.schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/cb995d60beae114c3818edcc15a54c6261c012aae0abe8bf5d75d1b4f564674d.sqlite',
  },
})
