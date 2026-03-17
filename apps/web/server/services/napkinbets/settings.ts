import type { H3Event } from 'h3'
import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { napkinbetsAppSettings } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

export interface NapkinbetsAiSettings {
  aiRecommendationsEnabled: boolean
  aiPropSuggestionsEnabled: boolean
  aiTermsAssistEnabled: boolean
  aiCloseoutAssistEnabled: boolean
  xaiConfigured: boolean
}

interface SaveNapkinbetsAiSettingsInput {
  aiRecommendationsEnabled: boolean
  aiPropSuggestionsEnabled: boolean
  aiTermsAssistEnabled: boolean
  aiCloseoutAssistEnabled: boolean
}

function nowIso() {
  return new Date().toISOString()
}

async function ensureSettingsRow(event: H3Event) {
  const db = useAppDatabase(event)
  const [existing] = await db
    .select()
    .from(napkinbetsAppSettings)
    .where(eq(napkinbetsAppSettings.id, 1))
    .limit(1)

  if (existing) {
    return existing
  }

  const createdAt = nowIso()
  await db.insert(napkinbetsAppSettings).values({
    id: 1,
    aiRecommendationsEnabled: false,
    aiPropSuggestionsEnabled: false,
    aiTermsAssistEnabled: false,
    aiCloseoutAssistEnabled: false,
    updatedAt: createdAt,
  })

  const [created] = await db
    .select()
    .from(napkinbetsAppSettings)
    .where(eq(napkinbetsAppSettings.id, 1))
    .limit(1)

  if (!created) {
    throw createError({ statusCode: 500, message: 'Napkinbets settings row could not be created.' })
  }

  return created
}

export async function loadNapkinbetsAiSettings(event: H3Event): Promise<NapkinbetsAiSettings> {
  const config = useRuntimeConfig(event)
  const row = await ensureSettingsRow(event)

  return {
    aiRecommendationsEnabled: Boolean(row.aiRecommendationsEnabled),
    aiPropSuggestionsEnabled: Boolean(row.aiPropSuggestionsEnabled),
    aiTermsAssistEnabled: Boolean(row.aiTermsAssistEnabled),
    aiCloseoutAssistEnabled: Boolean(row.aiCloseoutAssistEnabled),
    xaiConfigured: Boolean(config.xaiApiKey),
  }
}

export async function saveNapkinbetsAiSettings(
  event: H3Event,
  input: SaveNapkinbetsAiSettingsInput,
) {
  const db = useAppDatabase(event)
  const updatedAt = nowIso()

  await ensureSettingsRow(event)

  await db
    .update(napkinbetsAppSettings)
    .set({
      aiRecommendationsEnabled: input.aiRecommendationsEnabled,
      aiPropSuggestionsEnabled: input.aiPropSuggestionsEnabled,
      aiTermsAssistEnabled: input.aiTermsAssistEnabled,
      aiCloseoutAssistEnabled: input.aiCloseoutAssistEnabled,
      updatedAt,
    })
    .where(eq(napkinbetsAppSettings.id, 1))

  return await loadNapkinbetsAiSettings(event)
}
