import { createError, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { savePoolData } from '#server/services/napkinbets/pools'
import { NAPKINBETS_BOARD_TYPES } from '#server/services/napkinbets/taxonomy'
import { normalizeCreateWagerTaxonomyInputFromStore } from '#server/services/napkinbets/taxonomy-store'

const bodySchema = z.object({
  title: z.string().min(3).max(120),
  creatorName: z.string().min(2).max(80),
  description: z.string().min(12).max(500),
  napkinType: z.enum(['simple-bet', 'pool']),
  boardType: z.enum(NAPKINBETS_BOARD_TYPES),
  format: z.string().min(2).max(40),
  sport: z.string().max(40),
  contextKey: z.string().max(40),
  league: z.string().max(40),
  customContextName: z.string().max(120),
  groupId: z.string().max(120),
  sideOptions: z.string().min(3).max(500),
  participantNames: z.string().max(500),
  participantSeeds: z
    .array(
      z.object({
        displayName: z.string().min(1).max(80),
        userId: z.string().max(120).nullable().optional(),
      }),
    )
    .max(24)
    .optional(),
  shuffleParticipants: z.boolean().optional(),
  potRules: z.string().min(3).max(500),
  entryFeeDollars: z.coerce.number().min(0).max(1000),
  paymentService: z.string().min(2).max(40),
  paymentHandle: z.string().max(120),
  venueName: z.string().max(120),
  latitude: z.string().max(32),
  longitude: z.string().max(32),
  terms: z.string().min(12).max(600),
  eventSource: z.string().max(40).optional(),
  eventId: z.string().max(120).optional(),
  eventTitle: z.string().max(160).optional(),
  eventStartsAt: z.string().max(64).optional(),
  eventStatus: z.string().max(40).optional(),
  homeTeamName: z.string().max(80).optional(),
  awayTeamName: z.string().max(80).optional(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-create', 20, 60_000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  let normalizedTaxonomy
  try {
    normalizedTaxonomy = await normalizeCreateWagerTaxonomyInputFromStore(event, parsed.data)
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Invalid napkin taxonomy.',
    })
  }

  return await savePoolData(event, {
    ...parsed.data,
    ...normalizedTaxonomy,
  })
})
