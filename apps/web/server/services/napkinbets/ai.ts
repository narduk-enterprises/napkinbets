import type { H3Event } from 'h3'
import { createError } from 'h3'
import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import { grokChat } from '#server/utils/grok'
import { getSystemPrompt } from '#server/utils/systemPrompts'

async function requireAi(event: H3Event, capability: 'terms' | 'closeout' | 'napkin-generator') {
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
    model: settings.chatModel || config.xaiModel || 'grok-3-mini',
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
  const systemContent = await getSystemPrompt(event, 'terms_rewrite')
  const content = await grokChat(
    ai.apiKey,
    [
      {
        role: 'system',
        content: systemContent,
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
  const systemContent = await getSystemPrompt(event, 'closeout_summary')
  const content = await grokChat(
    ai.apiKey,
    [
      {
        role: 'system',
        content: systemContent,
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

export interface NapkinbetsGeneratedNapkin {
  title: string
  description: string
  category: string
  format: string
  sideOptions: string[]
  terms: string
  legs: Array<{
    questionText: string
    legType: 'categorical' | 'numeric'
    options: string[]
    numericUnit: string | null
  }>
  message: string
}

export async function generateNapkinBet(
  event: H3Event,
  input: {
    userPrompt: string
    eventContext?: {
      eventTitle: string
      sport: string
      league: string
      homeTeamName?: string
      awayTeamName?: string
      venueName?: string
      startTime?: string
      status?: string
    }
  },
): Promise<NapkinbetsGeneratedNapkin> {
  const ai = await requireAi(event, 'napkin-generator')
  const systemContent = await getSystemPrompt(event, 'napkin_generator')

  let userMessage = input.userPrompt
  if (input.eventContext) {
    userMessage += `\n\nEvent Context:\n${JSON.stringify(input.eventContext, null, 2)}`
  }

  const content = await grokChat(
    ai.apiKey,
    [
      {
        role: 'system',
        content: systemContent,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    ai.model,
  )

  try {
    // Strip potential markdown code fences
    const cleaned = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '')
    return JSON.parse(cleaned) as NapkinbetsGeneratedNapkin
  } catch {
    // If Grok didn't return valid JSON, wrap the text response
    return {
      title: 'AI-Generated Napkin',
      description: content.slice(0, 200),
      category: 'custom',
      format: 'prop',
      sideOptions: ['Yes', 'No'],
      terms: 'Standard friendly wager rules apply.',
      legs: [
        {
          questionText: content.slice(0, 200),
          legType: 'categorical',
          options: ['Yes', 'No'],
          numericUnit: null,
        },
      ],
      message:
        'I had trouble structuring the response. Here is what I came up with — feel free to edit!',
    }
  }
}
