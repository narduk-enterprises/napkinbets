import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'

export default defineEventHandler(async (event) => {
  const settings = await loadNapkinbetsAiSettings(event)

  return {
    aiEnabled: settings.aiRecommendationsEnabled,
  }
})
