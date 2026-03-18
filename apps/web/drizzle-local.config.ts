import { readdirSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

/**
 * Auto-detect the local D1 SQLite file created by Wrangler/Miniflare.
 * Override with: DRIZZLE_SQLITE_URL=path/to/file.sqlite pnpm db:studio:local
 */
function resolveLocalD1Path(): string {
  if (process.env.DRIZZLE_SQLITE_URL) return process.env.DRIZZLE_SQLITE_URL

  const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
  try {
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.sqlite'))
    if (files.length === 1) return `${dir}/${files[0]}`
    if (files.length === 0) {
      throw new Error(
        `No .sqlite files found in ${dir}. Run "pnpm dev" first to create the local D1 database.`,
      )
    }
    throw new Error(
      `Found ${files.length} .sqlite files in ${dir}. Set DRIZZLE_SQLITE_URL to the one you want:\n${files.map((f) => `  ${dir}/${f}`).join('\n')}`,
    )
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Directory ${dir} not found. Run "pnpm dev" first to create the local D1 database.`,
      )
    }
    throw err
  }
}

export default defineConfig({
  schema: './drizzle-local.schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveLocalD1Path(),
  },
})
