import { getHeader } from 'h3'
import { z } from 'zod'
import { RATE_LIMIT_POLICIES, enforceRateLimitPolicy } from '#layer/server/utils/rateLimit'
import { normalizeDemoRedirectPath, resolveDemoSessionUser } from '#server/utils/demo'

const querySchema = z.object({
  redirect: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimitPolicy(event, RATE_LIMIT_POLICIES.authLogin)

  const fetchSite = getHeader(event, 'sec-fetch-site')
  if (fetchSite === 'cross-site') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-site demo login is blocked.',
    })
  }

  const query = await getValidatedQuery(event, querySchema.parse)
  const user = await resolveDemoSessionUser(event)
  const redirectPath = normalizeDemoRedirectPath(query.redirect)

  await setUserSession(event, { user })

  return sendRedirect(event, redirectPath, 302)
})
