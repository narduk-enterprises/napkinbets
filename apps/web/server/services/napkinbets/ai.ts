import type { H3Event } from 'h3'
import { createError } from 'h3'
import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import { grokChat } from '#server/utils/grok'

async function requireAi(
  event: H3Event,
  capability: 'terms' | 'closeout',
) {
  const config = useRuntimeConfig(event)
  const settings = await loadNapkinbetsAiSettings(event)

  if (!config.public.aiRecommendationsEnabled) {
    throw createError({
      statusCode: 404,
      message: 'AI recommendations are disabled.',
    })
  }

  if (!settings.aiRecommendationsEnabled) {
    throw createError({
      statusCode: 403,
      message: 'AI recommendations are turned off by the operator.',
    })
  }

  if (capability === 'terms' && !settings.aiTermsAssistEnabled) {
    throw createError({
      statusCode: 403,
      message: 'Terms assists are currently disabled.',
    })
  }

  if (capability === 'closeout' && !settings.aiCloseoutAssistEnabled) {
    throw createError({
      statusCode: 403,
      message: 'Closeout assists are currently disabled.',
    })
  }

  if (!config.xaiApiKey) {
    throw createError({
      statusCode: 503,
      message: 'xAI is not configured for this environment.',
    })
  }

  return {
    apiKey: config.xaiApiKey,
    model: config.xaiModel || 'grok-4-1-fast-non-reasoning',
  }
}

export async function rewriteNapkinbetsTerms(
  event: H3Event,
  input: {
    title: string
    description: string
    format: string
    paymentService: string
    terms: string
  },
) {
  const ai = await requireAi(event, 'terms')
  const content = await grokChat(
    ai.apiKey,
    [
      {
        role: 'system',
        content:
          'You rewrite friendly wager rules. Keep the meaning grounded in the provided board details. Keep it short, clear, and explicitly friendly-wagers-only. Never imply gambling automation, odds pricing, or in-app money movement.',
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ],
    ai.model,
  )

  return {
    terms: content,
  }
}

export async function buildNapkinbetsCloseoutSummary(
  event: H3Event,
  input: {
    title: string
    paymentService: string
    pendingCount: number
    submittedCount: number
    confirmedCount: number
    rejectedCount: number
    leaderboard: Array<{
      displayName: string
      projectedPayoutCents: number
      score: number
    }>
  },
) {
  const ai = await requireAi(event, 'closeout')
  const content = await grokChat(
    ai.apiKey,
    [
      {
        role: 'system',
        content:
          'You summarize closeout state for a friendly wager board. Use only the provided grounded data. Return a concise operator summary with 3 short checklist bullets. Do not invent scores, dates, or payment status.',
      },
      {
        role: 'user',
        content: JSON.stringify(input),
      },
    ],
    ai.model,
  )

  return {
    summary: content,
  }
}
