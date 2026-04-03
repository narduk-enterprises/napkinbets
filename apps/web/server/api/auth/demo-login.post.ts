import { definePublicMutation } from '#layer/server/utils/mutation'
import { resolveNapkinbetsDemoSessionUser } from '#server/utils/demo'

/** Demo login is hit often by e2e; use a higher limit than authLogin. */
const DEMO_RATE_LIMIT = { namespace: 'auth-demo', maxRequests: 300, windowMs: 60_000 }

export default definePublicMutation(
  {
    rateLimit: DEMO_RATE_LIMIT,
  },
  async ({ event }) => {
    const cleanUser = await resolveNapkinbetsDemoSessionUser(event)

    await setUserSession(event, { user: cleanUser })

    return { user: cleanUser }
  },
)
