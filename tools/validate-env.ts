/**
 * Validate required environment variables before dev/deploy.
 *
 * Usage:
 *   npx tsx tools/validate-env.ts          # checks production-required vars
 *   npx tsx tools/validate-env.ts --dev    # relaxed checks for local dev
 */

const isDev = process.argv.includes('--dev')

interface EnvCheck {
  name: string
  required: 'always' | 'prod-only'
  description: string
}

const checks: EnvCheck[] = [
  {
    name: 'CRON_SECRET',
    required: 'prod-only',
    description: 'Secret for authenticating cron job requests',
  },
  { name: 'SITE_URL', required: 'prod-only', description: 'Public URL of the application' },
]

const warnings: string[] = []
const errors: string[] = []

for (const check of checks) {
  const value = process.env[check.name]
  if (!value) {
    if (check.required === 'always' || (!isDev && check.required === 'prod-only')) {
      errors.push(`❌ Missing required env var: ${check.name} — ${check.description}`)
    } else {
      warnings.push(`⚠️  Optional (${check.required}): ${check.name} — ${check.description}`)
    }
  }
}

if (warnings.length > 0) {
  console.log('\n🔔 Environment warnings:')
  warnings.forEach((w) => console.log(`   ${w}`))
}

if (errors.length > 0) {
  console.error('\n🚨 Missing required environment variables:')
  errors.forEach((e) => console.error(`   ${e}`))
  console.error('\nSet these variables or run with --dev for relaxed checks.\n')
  process.exit(1)
}

if (errors.length === 0) {
  console.log('✅ Environment validation passed.')
}
