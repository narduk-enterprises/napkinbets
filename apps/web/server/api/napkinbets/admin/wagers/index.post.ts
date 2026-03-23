import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { z } from 'zod'

const bodySchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).default(''),
  status: z
    .enum(['open', 'locked', 'live', 'settling', 'settled', 'closed', 'archived'])
    .default('open'),
  league: z.string().max(40).default(''),
  eventTitle: z.string().max(160).default(''),
  slug: z.string().max(120).optional(),
})

const RATE_LIMIT = { namespace: 'admin-wager-create', maxRequests: 20, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const db = useAppDatabase(event)
    const generatedId = crypto.randomUUID()
    const generatedSlug = body.slug || `admin-bet-${generatedId.split('-')[0]}`

    await db.insert(napkinbetsWagers).values({
      id: generatedId,
      slug: generatedSlug,
      title: body.title,
      description: body.description,
      status: body.status,
      league: body.league,
      eventTitle: body.eventTitle,

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
  },
)
