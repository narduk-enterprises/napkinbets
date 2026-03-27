import { getHeader } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import {
  normalizeNapkinbetsDemoRedirectPath,
  resolveNapkinbetsDemoSessionUser,
} from '#server/utils/demo'

const querySchema = z.object({
  redirect: z.string().optional(),
})

/** Demo login is hit often by e2e (many tests, parallel workers); use a higher limit than authLogin. */
const DEMO_RATE_LIMIT = { namespace: 'auth-demo', maxRequests: 300, windowMs: 60_000 }

export default defineEventHandler(async (event) => {
  await enforceRateLimit(
    event,
    DEMO_RATE_LIMIT.namespace,
    DEMO_RATE_LIMIT.maxRequests,
    DEMO_RATE_LIMIT.windowMs,
  )

  const fetchSite = getHeader(event, 'sec-fetch-site')
  if (fetchSite === 'cross-site') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-site demo login is blocked.',
    })
  }

  const query = await getValidatedQuery(event, querySchema.parse)
  const user = await resolveNapkinbetsDemoSessionUser(event)
  const redirectPath = normalizeNapkinbetsDemoRedirectPath(query.redirect)

  await setUserSession(event, { user })

  return sendRedirect(event, redirectPath, 302)
})
