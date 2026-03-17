import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Extend the published Narduk Nuxt Layer
  extends: ['@narduk-enterprises/narduk-nuxt-template-layer'],

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
    // Server-only (admin API routes)
    googleServiceAccountKey: process.env.GSC_SERVICE_ACCOUNT_JSON || '',
    posthogApiKey: process.env.POSTHOG_PERSONAL_API_KEY || '',
    gaPropertyId: process.env.GA_PROPERTY_ID || '',
    posthogProjectId: process.env.POSTHOG_PROJECT_ID || '',
    xaiApiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY || '',
    xaiModel: process.env.XAI_MODEL || 'grok-4-1-fast-non-reasoning',
    public: {
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
      'Napkinbets is a friendly wagering board for side bets, golf drafts, and watch-party pools with manual settlement and live sports context.',
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
