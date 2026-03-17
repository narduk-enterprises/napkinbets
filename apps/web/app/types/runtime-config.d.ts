declare module 'nuxt/schema' {
  interface RuntimeConfig {
    apiSportsKey: string
    xaiApiKey: string
    xaiModel: string
  }

  interface PublicRuntimeConfig {
    aiRecommendationsEnabled: boolean
  }
}

export {}
