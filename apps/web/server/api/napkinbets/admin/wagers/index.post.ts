import { requireAdmin } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { z } from 'zod'

const bodySchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).default(''),
  status: z.enum(['open', 'locked', 'live', 'settling', 'settled', 'closed', 'archived']).default('open'),
  league: z.string().max(40).default(''),
  eventTitle: z.string().max(160).default(''),
  slug: z.string().max(120).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'admin-wager-create', 20, 60_000)

  const db = useAppDatabase(event)
  const body = await readBody(event)

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((i) => i.message).join(', '),
    })
  }

  const generatedId = crypto.randomUUID()
  const generatedSlug = parsed.data.slug || `admin-bet-${generatedId.split('-')[0]}`

  await db.insert(napkinbetsWagers).values({
    id: generatedId,
    slug: generatedSlug,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    league: parsed.data.league,
    eventTitle: parsed.data.eventTitle,
    
    // Required fields defaults
    napkinType: 'simple-bet',
    boardType: 'manual-curated',
    category: 'custom',
    format: 'custom',
    contextKey: 'community',
    creatorName: 'Admin',
    sideOptionsJson: '[]',
    paymentService: 'manual',
    terms: 'Admin Created',
    eventState: '',
    homeScore: '',
    awayScore: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return { id: generatedId, slug: generatedSlug }
})
