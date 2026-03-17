declare module 'nuxt/schema' {
  interface RuntimeConfig {
    xaiApiKey: string
    xaiModel: string
  }

  interface PublicRuntimeConfig {
    aiRecommendationsEnabled: boolean
  }
}

export {}
