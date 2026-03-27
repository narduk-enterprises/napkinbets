import type { H3Event } from 'h3'
import { createError } from 'h3'
import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import { grokChat } from '#layer/server/utils/xai'
import { getNapkinbetsSystemPrompt } from '#server/utils/systemPrompts'

async function requireAi(event: H3Event, capability: 'terms' | 'closeout' | 'napkin-generator') {
  const config = useRuntimeConfig(event)
  const settings = await loadNapkinbetsAiSettings(event)

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
  const systemContent = await getNapkinbetsSystemPrompt(event, 'terms_rewrite')
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
  const systemContent = await getNapkinbetsSystemPrompt(event, 'closeout_summary')
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
  participants: string[]
  message: string
}

export async function generateNapkinBet(
  event: H3Event,
  input: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
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
    friendNames?: string[]
  },
): Promise<NapkinbetsGeneratedNapkin> {
  const ai = await requireAi(event, 'napkin-generator')
  const systemContent = await getNapkinbetsSystemPrompt(event, 'napkin_generator')

  const formattedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    {
      role: 'system',
      content: systemContent,
    },
  ]

  for (let i = 0; i < input.messages.length; i++) {
    const msg = input.messages[i]
    if (!msg) continue

    if (i === 0 && msg.role === 'user') {
      const extras: string[] = []
      if (input.eventContext) {
        extras.push(`Event Context:\n${JSON.stringify(input.eventContext, null, 2)}`)
      }
      if (input.friendNames && input.friendNames.length > 0) {
        extras.push(
          `The user's friends: ${input.friendNames.join(', ')}\nIf the user mentions people by name, include them in the "participants" array. Use the exact friend name if it matches.`,
        )
      }
      formattedMessages.push({
        role: msg.role,
        content: extras.length > 0 ? `${msg.content}\n\n${extras.join('\n\n')}` : msg.content,
      })
    } else {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      })
    }
  }

  const content = await grokChat(ai.apiKey, formattedMessages, ai.model)

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
      participants: [],
      message:
        'I had trouble structuring the response. Here is what I came up with — feel free to edit!',
    }
  }
}

export interface SuggestedLeg {
  questionText: string
  legType: 'categorical' | 'numeric'
  options: string[]
  numericUnit: string | null
}

export async function suggestNapkinbetsLegs(
  event: H3Event,
  input: {
    title: string
    format: string
    existingLegs: Array<{ questionText: string }>
    eventContext?: {
      eventTitle: string
      sport: string
      league: string
      homeTeamName?: string
      awayTeamName?: string
    }
  },
): Promise<SuggestedLeg[]> {
  const ai = await requireAi(event, 'napkin-generator')

  const systemPrompt = `You are a friendly betting assistant for Napkinbets, a social betting app for friends.
Given a bet title, format, and optional event/game context, suggest 3-5 fun additional questions (legs) that would make the bet more interesting.
Each leg should be a clear question with either categorical options (2-6 choices) or a numeric answer.
Return ONLY a JSON array of leg objects. No markdown, no explanation, just the JSON array.
Each leg object must have: questionText (string), legType ("categorical" or "numeric"), options (string array, empty for numeric), numericUnit (string or null).
Keep questions fun, creative, and appropriate for friendly social betting.`

  const userContent: string[] = [`Bet title: "${input.title}"`, `Format: ${input.format}`]

  if (input.existingLegs.length > 0) {
    userContent.push(
      `Existing questions (suggest different ones):\n${input.existingLegs.map((l) => `- ${l.questionText}`).join('\n')}`,
    )
  }

  if (input.eventContext) {
    userContent.push(
      `Event: ${input.eventContext.eventTitle}`,
      `Sport: ${input.eventContext.sport}, League: ${input.eventContext.league}`,
    )
    if (input.eventContext.homeTeamName && input.eventContext.awayTeamName) {
      userContent.push(
        `Teams: ${input.eventContext.awayTeamName} vs ${input.eventContext.homeTeamName}`,
      )
    }
  }

  const content = await grokChat(
    ai.apiKey,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent.join('\n') },
    ],
    ai.model,
  )

  try {
    const cleaned = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '')
    const parsed = JSON.parse(cleaned) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is SuggestedLeg =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as SuggestedLeg).questionText === 'string',
      )
    }
  } catch {
    // Fallback if Grok doesn't return valid JSON
  }

  return [
    {
      questionText: 'Who will be the MVP?',
      legType: 'categorical',
      options: ['Player A', 'Player B', 'Other'],
      numericUnit: null,
    },
    {
      questionText: 'What will the final combined score be?',
      legType: 'numeric',
      options: [],
      numericUnit: 'points',
    },
  ]
}
