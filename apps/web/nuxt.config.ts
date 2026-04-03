import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const appBackendPreset =
  process.env.APP_BACKEND_PRESET === 'managed-supabase' ? 'managed-supabase' : 'default'
const configuredAuthBackend = process.env.AUTH_BACKEND
const supabaseUrl = process.env.AUTH_AUTHORITY_URL || process.env.SUPABASE_URL || ''
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_AUTH_ANON_KEY ||
  ''
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_AUTH_SERVICE_ROLE_KEY || ''
const authBackend =
  configuredAuthBackend === 'supabase' || configuredAuthBackend === 'local'
    ? configuredAuthBackend
    : supabaseUrl && supabasePublishableKey
      ? 'supabase'
      : 'local'
const authAuthorityUrl = supabaseUrl
const appOrmTablesEntry =
  process.env.NUXT_DATABASE_BACKEND === 'postgres'
    ? './server/database/pg-app-schema.ts'
    : './server/database/app-schema.ts'

function parseAuthProviders(value: string | undefined) {
  return (value || 'apple,email')
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider, index, providers) => provider && providers.indexOf(provider) === index)
}

const authProviders =
  authBackend === 'supabase' ? parseAuthProviders(process.env.AUTH_PROVIDERS) : ['email']
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Extend the published Narduk Nuxt Layer
  extends: ['@narduk-enterprises/narduk-nuxt-template-layer'],

  alias: {
    '#server/app-orm-tables': fileURLToPath(new URL(appOrmTablesEntry, import.meta.url)),
  },

  css: [resolve(__dirname, 'app/assets/css/napkinbets.css')],

  // nitro-cloudflare-dev proxies D1 bindings to the local dev server
  modules: ['nitro-cloudflare-dev'],

  nitro: {
    cloudflareDev: {
      configPath: resolve(__dirname, 'wrangler.json'),
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  devServer: {
    port: Number(process.env.NUXT_PORT || 3000),
  },

  runtimeConfig: {
    appBackendPreset,
    authBackend,
    authAuthorityUrl,
    authAnonKey: supabasePublishableKey,
    authServiceRoleKey: supabaseServiceRoleKey,
    authStorageKey: process.env.AUTH_STORAGE_KEY || 'web-auth',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    supabaseUrl,
    supabasePublishableKey,
    supabaseServiceRoleKey,
    // Force non-secure cookies + SameSite=Lax for Safari dev compatibility
    ...(process.env.NODE_ENV === 'development'
      ? {
          session: {
            cookie: {
              secure: false,
              sameSite: 'lax' as const,
            },
          },
        }
      : {}),
    // Server-only (admin API routes)
    googleServiceAccountKey: process.env.GSC_SERVICE_ACCOUNT_JSON || '',
    posthogApiKey: process.env.POSTHOG_PERSONAL_API_KEY || '',
    gaPropertyId: process.env.GA_PROPERTY_ID || '',
    posthogProjectId: process.env.POSTHOG_PROJECT_ID || '',
    apiSportsKey: process.env.API_SPORTS_KEY || '',
    theSportsDbApiKey: process.env.THE_SPORTS_DB_API_KEY || '',
    ballDontLieApiKey: process.env.BALL_DONT_LIE_API_KEY || '',
    mySportsFeedsApiKey: process.env.MY_SPORTS_FEEDS_API_KEY || '',
    theOddsApiKey: process.env.THE_ODDS_API_KEY || '',
    xaiApiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY || '',
    xaiModel: process.env.XAI_MODEL || 'grok-4-1-fast-non-reasoning',
    public: {
      appBackendPreset,
      authBackend,
      authAuthorityUrl,
      authLoginPath: '/login',
      authRegisterPath: '/register',
      authCallbackPath: '/auth/callback',
      authConfirmPath: '/auth/confirm',
      authResetPath: '/reset-password',
      authLogoutPath: '/logout',
      authRedirectPath: '/dashboard/',
      authProviders,
      authPublicSignup: process.env.AUTH_PUBLIC_SIGNUP !== 'false',
      authRequireMfa: process.env.AUTH_REQUIRE_MFA === 'true',
      authTurnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
      supabaseUrl,
      supabasePublishableKey,
      appUrl: process.env.SITE_URL || 'https://napkinbets.nard.uk',
      appName: process.env.APP_NAME || 'Napkinbets',
      aiRecommendationsEnabled: process.env.NAPKINBETS_AI_RECOMMENDATIONS === 'true',
      // Analytics (client-side tracking)
      posthogPublicKey: process.env.POSTHOG_PUBLIC_KEY || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
      // IndexNow
      indexNowKey: process.env.INDEXNOW_KEY || '',
    },
  },

  site: {
    url: process.env.SITE_URL || 'https://napkinbets.nard.uk',
    name: 'Napkinbets',
    description:
      'Napkinbets is a template-first platform for casual social pools, picks, golf formats, and side games with live event context and manual settle-up.',
    defaultLocale: 'en',
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Napkinbets',
      url: process.env.SITE_URL || 'https://napkinbets.nard.uk',
      logo: '/favicon.svg',
    },
  },

  image: {
    cloudflare: {
      baseURL: process.env.SITE_URL || 'https://napkinbets.nard.uk',
    },
  },

  routeRules: {
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/settings/**': { ssr: false },
    '/napkins/create': { ssr: false },
    '/wagers/create': { ssr: false },
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
})
