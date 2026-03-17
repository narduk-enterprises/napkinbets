import { and, desc, eq } from 'drizzle-orm'
import { createError } from 'h3'
import { requireAuth } from '#layer/server/utils/auth'
import { napkinbetsUserPaymentProfiles } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

interface SavePaymentProfileInput {
  provider: string
  handle: string
  displayLabel: string
  isDefault: boolean
  isPublicOnBoards: boolean
}

const SUPPORTED_PAYMENT_PROVIDERS = new Set(['Venmo', 'PayPal', 'Cash App', 'Zelle'])

function normalizeProvider(provider: string) {
  const trimmed = provider.trim()
  if (!SUPPORTED_PAYMENT_PROVIDERS.has(trimmed)) {
    throw createError({ statusCode: 400, message: 'Unsupported payment provider.' })
  }

  return trimmed
}

export async function loadUserPaymentProfiles(event: Parameters<typeof requireAuth>[0]) {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  const rows = await db
    .select()
    .from(napkinbetsUserPaymentProfiles)
    .where(eq(napkinbetsUserPaymentProfiles.userId, user.id))
    .orderBy(desc(napkinbetsUserPaymentProfiles.isDefault), desc(napkinbetsUserPaymentProfiles.updatedAt))

  return {
    profiles: rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      handle: row.handle,
      displayLabel: row.displayLabel ?? null,
      isDefault: Boolean(row.isDefault),
      isPublicOnBoards: Boolean(row.isPublicOnBoards),
    })),
  }
}

export async function saveUserPaymentProfile(
  event: Parameters<typeof requireAuth>[0],
  input: SavePaymentProfileInput,
) {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)
  const now = new Date().toISOString()
  const provider = normalizeProvider(input.provider)

  if (input.isDefault) {
    await db
      .update(napkinbetsUserPaymentProfiles)
      .set({
        isDefault: false,
        updatedAt: now,
      })
      .where(eq(napkinbetsUserPaymentProfiles.userId, user.id))
  }

  await db.insert(napkinbetsUserPaymentProfiles).values({
    id: crypto.randomUUID(),
    userId: user.id,
    provider,
    handle: input.handle.trim(),
    displayLabel: input.displayLabel.trim() || null,
    isDefault: input.isDefault,
    isPublicOnBoards: input.isPublicOnBoards,
    createdAt: now,
    updatedAt: now,
  })

  return { ok: true }
}

export async function removeUserPaymentProfile(
  event: Parameters<typeof requireAuth>[0],
  profileId: string,
) {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  await db
    .delete(napkinbetsUserPaymentProfiles)
    .where(
      and(
        eq(napkinbetsUserPaymentProfiles.id, profileId),
        eq(napkinbetsUserPaymentProfiles.userId, user.id),
      ),
    )

  return { ok: true }
}

export async function setDefaultUserPaymentProfile(
  event: Parameters<typeof requireAuth>[0],
  profileId: string,
) {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)
  const now = new Date().toISOString()

  const [profile] = await db
    .select()
    .from(napkinbetsUserPaymentProfiles)
    .where(
      and(
        eq(napkinbetsUserPaymentProfiles.id, profileId),
        eq(napkinbetsUserPaymentProfiles.userId, user.id),
      ),
    )
    .limit(1)

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Payment profile not found.' })
  }

  await db
    .update(napkinbetsUserPaymentProfiles)
    .set({
      isDefault: false,
      updatedAt: now,
    })
    .where(eq(napkinbetsUserPaymentProfiles.userId, user.id))

  await db
    .update(napkinbetsUserPaymentProfiles)
    .set({
      isDefault: true,
      updatedAt: now,
    })
    .where(eq(napkinbetsUserPaymentProfiles.id, profileId))

  return { ok: true }
}
