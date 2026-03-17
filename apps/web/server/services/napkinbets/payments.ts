import { and, desc, eq } from 'drizzle-orm'
import { createError } from 'h3'
import { requireAuth } from '#layer/server/utils/auth'
import { napkinbetsUserPaymentProfiles } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { verifyVenmoHandle } from '#server/services/napkinbets/venmo'

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

function mapProfileRow(row: typeof napkinbetsUserPaymentProfiles.$inferSelect) {
  return {
    id: row.id,
    provider: row.provider,
    handle: row.handle,
    displayLabel: row.displayLabel ?? null,
    isDefault: Boolean(row.isDefault),
    isPublicOnBoards: Boolean(row.isPublicOnBoards),
    handleVerificationStatus: (row.handleVerificationStatus ?? 'unverified') as
      | 'unverified'
      | 'verified'
      | 'failed',
    handleVerifiedAt: row.handleVerifiedAt ?? null,
  }
}

export async function loadUserPaymentProfiles(event: Parameters<typeof requireAuth>[0]) {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  const rows = await db
    .select()
    .from(napkinbetsUserPaymentProfiles)
    .where(eq(napkinbetsUserPaymentProfiles.userId, user.id))
    .orderBy(
      desc(napkinbetsUserPaymentProfiles.isDefault),
      desc(napkinbetsUserPaymentProfiles.updatedAt),
    )

  return {
    profiles: rows.map(mapProfileRow),
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

  // Auto-verify Venmo handles on save
  let verificationStatus: 'unverified' | 'verified' | 'failed' = 'unverified'
  let verifiedAt: string | null = null

  if (provider === 'Venmo') {
    try {
      const result = await verifyVenmoHandle(input.handle)
      verificationStatus = result.valid ? 'verified' : 'failed'
      verifiedAt = result.valid ? now : null
    } catch {
      // If verification fails due to network issues, leave as unverified
      verificationStatus = 'unverified'
    }
  }

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
    handleVerificationStatus: verificationStatus,
    handleVerifiedAt: verifiedAt,
    createdAt: now,
    updatedAt: now,
  })

  return { ok: true, verificationStatus }
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

/**
 * Re-verify a specific payment profile handle.
 * Used when a user explicitly clicks "Verify" on a previously
 * unverified or failed profile.
 */
export async function reverifyPaymentProfile(
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

  if (profile.provider !== 'Venmo') {
    return { ok: true, verificationStatus: 'unverified' as const }
  }

  const result = await verifyVenmoHandle(profile.handle)
  const verificationStatus = result.valid ? 'verified' : 'failed'

  await db
    .update(napkinbetsUserPaymentProfiles)
    .set({
      handleVerificationStatus: verificationStatus,
      handleVerifiedAt: result.valid ? now : null,
      updatedAt: now,
    })
    .where(eq(napkinbetsUserPaymentProfiles.id, profileId))

  return {
    ok: true,
    verificationStatus,
    displayName: result.displayName ?? null,
  }
}
