import type { H3Event } from 'h3'
import { createError } from 'h3'
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm'
import { users } from '#layer/server/database/schema'
import { requireAuth } from '#layer/server/utils/auth'
import { hashUserPassword } from '#layer/server/utils/password'
import {
  napkinbetsFriendships,
  napkinbetsGroupMembers,
  napkinbetsGroups,
} from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const DEMO_PASSWORD = 'DemoBoard123!'

const DEMO_SOCIAL_USERS = [
  { email: 'olivia@napkinbets.app', name: 'Olivia Ramos' },
  { email: 'marcus@napkinbets.app', name: 'Marcus Lee' },
  { email: 'mara@napkinbets.app', name: 'Mara Kim' },
  { email: 'nora@napkinbets.app', name: 'Nora Patel' },
  { email: 'leo@napkinbets.app', name: 'Leo Ortega' },
] as const

const DEMO_GROUP_DEFINITIONS = [
  {
    slug: 'friday-night-watch',
    name: 'Friday Night Watch',
    description: 'Quick one-on-one bets and small game-night pools.',
    visibility: 'public',
    joinPolicy: 'open',
    memberEmails: ['demo@napkinbets.app', 'olivia@napkinbets.app', 'marcus@napkinbets.app'],
  },
  {
    slug: 'augusta-text-chain',
    name: 'Augusta Text Chain',
    description: 'A tighter golf room for majors, side bets, and closeout sweats.',
    visibility: 'private',
    joinPolicy: 'invite-only',
    memberEmails: ['demo@napkinbets.app', 'mara@napkinbets.app', 'leo@napkinbets.app'],
  },
] as const

function nowIso() {
  return new Date().toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 48)
}

async function ensureUser(event: H3Event, input: { email: string; name: string }) {
  const db = useAppDatabase(event)
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()
  if (existing) {
    return existing
  }

  const hashedPassword = await hashUserPassword(DEMO_PASSWORD)
  const id = crypto.randomUUID()

  await db.insert(users).values({
    id,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    name: input.name,
    isAdmin: false,
  })

  return {
    id,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    name: input.name,
    isAdmin: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

async function ensureFriendship(
  event: H3Event,
  input: {
    requesterUserId: string
    addresseeUserId: string
    status: 'pending' | 'accepted' | 'declined'
  },
) {
  const db = useAppDatabase(event)
  const existing = await db
    .select()
    .from(napkinbetsFriendships)
    .where(
      or(
        and(
          eq(napkinbetsFriendships.requesterUserId, input.requesterUserId),
          eq(napkinbetsFriendships.addresseeUserId, input.addresseeUserId),
        ),
        and(
          eq(napkinbetsFriendships.requesterUserId, input.addresseeUserId),
          eq(napkinbetsFriendships.addresseeUserId, input.requesterUserId),
        ),
      ),
    )
    .get()

  const timestamp = nowIso()

  if (existing) {
    await db
      .update(napkinbetsFriendships)
      .set({
        status: input.status,
        respondedAt: input.status === 'pending' ? null : timestamp,
        updatedAt: timestamp,
      })
      .where(eq(napkinbetsFriendships.id, existing.id))

    return existing.id
  }

  const id = crypto.randomUUID()
  await db.insert(napkinbetsFriendships).values({
    id,
    requesterUserId: input.requesterUserId,
    addresseeUserId: input.addresseeUserId,
    status: input.status,
    respondedAt: input.status === 'pending' ? null : timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return id
}

async function ensureGroup(
  event: H3Event,
  input: {
    slug: string
    name: string
    description: string
    visibility: 'public' | 'private'
    joinPolicy: 'open' | 'invite-only' | 'closed'
    ownerUserId: string
    memberUserIds: string[]
  },
) {
  const db = useAppDatabase(event)
  const timestamp = nowIso()
  const existing = await db
    .select()
    .from(napkinbetsGroups)
    .where(eq(napkinbetsGroups.slug, input.slug))
    .get()

  const groupId = existing?.id ?? crypto.randomUUID()

  if (existing) {
    await db
      .update(napkinbetsGroups)
      .set({
        name: input.name,
        description: input.description,
        visibility: input.visibility,
        joinPolicy: input.joinPolicy,
        updatedAt: timestamp,
      })
      .where(eq(napkinbetsGroups.id, groupId))

    await db.delete(napkinbetsGroupMembers).where(eq(napkinbetsGroupMembers.groupId, groupId))
  } else {
    await db.insert(napkinbetsGroups).values({
      id: groupId,
      slug: input.slug,
      ownerUserId: input.ownerUserId,
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      joinPolicy: input.joinPolicy,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  await db.insert(napkinbetsGroupMembers).values(
    input.memberUserIds.map((userId) => ({
      id: crypto.randomUUID(),
      groupId,
      userId,
      role: userId === input.ownerUserId ? 'owner' : 'member',
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  )

  return groupId
}

export async function ensureDemoSocialGraph(event: H3Event, demoUserId: string) {
  const socialUsers = new Map<string, string>()

  for (const definition of DEMO_SOCIAL_USERS) {
    const user = await ensureUser(event, definition)
    socialUsers.set(user.email, user.id)
  }

  const oliviaId = socialUsers.get('olivia@napkinbets.app')
  const marcusId = socialUsers.get('marcus@napkinbets.app')
  const maraId = socialUsers.get('mara@napkinbets.app')
  const noraId = socialUsers.get('nora@napkinbets.app')

  if (oliviaId) {
    await ensureFriendship(event, {
      requesterUserId: demoUserId,
      addresseeUserId: oliviaId,
      status: 'accepted',
    })
  }

  if (marcusId) {
    await ensureFriendship(event, {
      requesterUserId: marcusId,
      addresseeUserId: demoUserId,
      status: 'accepted',
    })
  }

  if (maraId) {
    await ensureFriendship(event, {
      requesterUserId: demoUserId,
      addresseeUserId: maraId,
      status: 'pending',
    })
  }

  if (noraId) {
    await ensureFriendship(event, {
      requesterUserId: noraId,
      addresseeUserId: demoUserId,
      status: 'pending',
    })
  }

  const memberIdsByEmail = new Map<string, string>([
    ['demo@napkinbets.app', demoUserId],
    ...Array.from(socialUsers.entries()),
  ])

  for (const group of DEMO_GROUP_DEFINITIONS) {
    const memberUserIds = group.memberEmails
      .map((email) => memberIdsByEmail.get(email))
      .filter((value): value is string => Boolean(value))

    await ensureGroup(event, {
      slug: group.slug,
      name: group.name,
      description: group.description,
      visibility: group.visibility,
      joinPolicy: group.joinPolicy,
      ownerUserId: demoUserId,
      memberUserIds,
    })
  }

  return socialUsers
}

function toDisplayName(user: { name: string | null; email: string }) {
  return user.name?.trim() || user.email
}

export async function loadNapkinbetsFriendsBundle(event: H3Event) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)

  const rows = await db
    .select()
    .from(napkinbetsFriendships)
    .where(
      or(
        eq(napkinbetsFriendships.requesterUserId, authUser.id),
        eq(napkinbetsFriendships.addresseeUserId, authUser.id),
      ),
    )
    .orderBy(desc(napkinbetsFriendships.updatedAt), desc(napkinbetsFriendships.createdAt))

  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.requesterUserId, row.addresseeUserId])
        .filter((id) => id !== authUser.id),
    ),
  )

  const userRows =
    userIds.length > 0
      ? await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(inArray(users.id, userIds))
      : []

  const usersById = new Map(userRows.map((user) => [user.id, user]))
  const friends = []
  const incomingRequests = []
  const outgoingRequests = []

  for (const row of rows) {
    const counterpartId =
      row.requesterUserId === authUser.id ? row.addresseeUserId : row.requesterUserId
    const counterpart = usersById.get(counterpartId)
    if (!counterpart) {
      continue
    }

    const payload = {
      id: counterpart.id,
      friendshipId: row.id,
      displayName: toDisplayName(counterpart),
      email: counterpart.email,
      createdAt: row.createdAt,
    }

    if (row.status === 'accepted') {
      friends.push(payload)
      continue
    }

    if (row.requesterUserId === authUser.id) {
      outgoingRequests.push(payload)
      continue
    }

    incomingRequests.push(payload)
  }

  return {
    friends,
    incomingRequests,
    outgoingRequests,
  }
}

export async function searchNapkinbetsUsers(event: H3Event, query: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.length < 2) {
    return []
  }

  const connections = await db
    .select()
    .from(napkinbetsFriendships)
    .where(
      or(
        eq(napkinbetsFriendships.requesterUserId, authUser.id),
        eq(napkinbetsFriendships.addresseeUserId, authUser.id),
      ),
    )

  const excludedIds = new Set<string>([authUser.id])
  for (const connection of connections) {
    excludedIds.add(connection.requesterUserId)
    excludedIds.add(connection.addresseeUserId)
  }

  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .orderBy(asc(users.name), asc(users.email))

  return candidates
    .filter((user) => {
      if (excludedIds.has(user.id)) {
        return false
      }

      const haystack = `${user.name ?? ''} ${user.email}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
    .slice(0, 12)
    .map((user) => ({
      id: user.id,
      displayName: toDisplayName(user),
      email: user.email,
    }))
}

export async function sendNapkinbetsFriendRequest(event: H3Event, targetUserId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const timestamp = nowIso()

  if (authUser.id === targetUserId) {
    throw createError({ statusCode: 400, message: 'You cannot add yourself.' })
  }

  const target = await db.select().from(users).where(eq(users.id, targetUserId)).get()
  if (!target) {
    throw createError({ statusCode: 404, message: 'User not found.' })
  }

  const existing = await db
    .select()
    .from(napkinbetsFriendships)
    .where(
      or(
        and(
          eq(napkinbetsFriendships.requesterUserId, authUser.id),
          eq(napkinbetsFriendships.addresseeUserId, targetUserId),
        ),
        and(
          eq(napkinbetsFriendships.requesterUserId, targetUserId),
          eq(napkinbetsFriendships.addresseeUserId, authUser.id),
        ),
      ),
    )
    .get()

  if (existing?.status === 'accepted') {
    throw createError({ statusCode: 409, message: 'You are already friends.' })
  }

  if (existing?.status === 'pending') {
    throw createError({ statusCode: 409, message: 'A friend request is already pending.' })
  }

  await db.insert(napkinbetsFriendships).values({
    id: crypto.randomUUID(),
    requesterUserId: authUser.id,
    addresseeUserId: targetUserId,
    status: 'pending',
    respondedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return { ok: true }
}

export async function acceptNapkinbetsFriendRequest(event: H3Event, requestId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const request = await db
    .select()
    .from(napkinbetsFriendships)
    .where(eq(napkinbetsFriendships.id, requestId))
    .get()

  if (!request || request.addresseeUserId !== authUser.id || request.status !== 'pending') {
    throw createError({ statusCode: 404, message: 'Friend request not found.' })
  }

  await db
    .update(napkinbetsFriendships)
    .set({
      status: 'accepted',
      respondedAt: nowIso(),
      updatedAt: nowIso(),
    })
    .where(eq(napkinbetsFriendships.id, requestId))

  return { ok: true }
}

export async function declineNapkinbetsFriendRequest(event: H3Event, requestId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const request = await db
    .select()
    .from(napkinbetsFriendships)
    .where(eq(napkinbetsFriendships.id, requestId))
    .get()

  if (!request) {
    throw createError({ statusCode: 404, message: 'Friend request not found.' })
  }

  const ownsRequest =
    request.requesterUserId === authUser.id || request.addresseeUserId === authUser.id
  if (!ownsRequest) {
    throw createError({ statusCode: 403, message: 'Not allowed to update this request.' })
  }

  await db.delete(napkinbetsFriendships).where(eq(napkinbetsFriendships.id, requestId))

  return { ok: true }
}

export async function removeNapkinbetsFriend(event: H3Event, friendshipId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const friendship = await db
    .select()
    .from(napkinbetsFriendships)
    .where(eq(napkinbetsFriendships.id, friendshipId))
    .get()

  if (!friendship) {
    throw createError({ statusCode: 404, message: 'Friendship not found.' })
  }

  const ownsFriendship =
    friendship.requesterUserId === authUser.id || friendship.addresseeUserId === authUser.id
  if (!ownsFriendship) {
    throw createError({ statusCode: 403, message: 'Not allowed to remove this friendship.' })
  }

  await db.delete(napkinbetsFriendships).where(eq(napkinbetsFriendships.id, friendshipId))

  return { ok: true }
}

export async function loadNapkinbetsGroupsBundle(event: H3Event) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)

  const [groups, members, owners] = await Promise.all([
    db.select().from(napkinbetsGroups).orderBy(asc(napkinbetsGroups.name)),
    db.select().from(napkinbetsGroupMembers).orderBy(asc(napkinbetsGroupMembers.createdAt)),
    db.select({ id: users.id, email: users.email, name: users.name }).from(users),
  ])

  const ownersById = new Map(owners.map((owner) => [owner.id, owner]))
  const membersByGroupId = new Map<string, Array<(typeof members)[number]>>()
  for (const member of members) {
    const groupMembers = membersByGroupId.get(member.groupId) ?? []
    groupMembers.push(member)
    membersByGroupId.set(member.groupId, groupMembers)
  }

  const allGroups = groups
    .filter((group) => group.visibility === 'public' || group.ownerUserId === authUser.id)
    .map((group) => {
      const groupMembers = membersByGroupId.get(group.id) ?? []
      const membership = groupMembers.find((member) => member.userId === authUser.id) ?? null
      const owner = ownersById.get(group.ownerUserId) ?? null

      return {
        id: group.id,
        slug: group.slug,
        name: group.name,
        description: group.description ?? '',
        visibility: group.visibility,
        joinPolicy: group.joinPolicy,
        memberCount: groupMembers.length,
        ownerName: owner ? toDisplayName(owner) : 'Unknown',
        userRole: membership?.role ?? null,
        joinedAt: membership?.createdAt ?? null,
      }
    })

  return {
    groups: allGroups.filter((group) => group.visibility === 'public'),
    myGroups: allGroups.filter((group) => Boolean(group.userRole)),
  }
}

export async function createNapkinbetsGroup(
  event: H3Event,
  input: {
    name: string
    description?: string
    visibility: 'public' | 'private'
    joinPolicy: 'open' | 'invite-only' | 'closed'
  },
) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const timestamp = nowIso()
  const slugBase = slugify(input.name) || 'napkin-group'

  const existing = await db
    .select({ slug: napkinbetsGroups.slug })
    .from(napkinbetsGroups)
    .where(eq(napkinbetsGroups.slug, slugBase))
    .get()

  const slug = existing ? `${slugBase}-${crypto.randomUUID().slice(0, 6)}` : slugBase
  const id = crypto.randomUUID()

  await db.insert(napkinbetsGroups).values({
    id,
    slug,
    ownerUserId: authUser.id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    visibility: input.visibility,
    joinPolicy: input.joinPolicy,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await db.insert(napkinbetsGroupMembers).values({
    id: crypto.randomUUID(),
    groupId: id,
    userId: authUser.id,
    role: 'owner',
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return {
    ok: true,
    group: {
      id,
      slug,
      name: input.name.trim(),
    },
  }
}

export async function joinNapkinbetsGroup(event: H3Event, groupId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const timestamp = nowIso()

  const group = await db
    .select()
    .from(napkinbetsGroups)
    .where(eq(napkinbetsGroups.id, groupId))
    .get()
  if (!group) {
    throw createError({ statusCode: 404, message: 'Group not found.' })
  }

  if (group.visibility !== 'public' || group.joinPolicy !== 'open') {
    throw createError({ statusCode: 403, message: 'This group is not open for direct joins.' })
  }

  const existingMember = await db
    .select()
    .from(napkinbetsGroupMembers)
    .where(
      and(
        eq(napkinbetsGroupMembers.groupId, groupId),
        eq(napkinbetsGroupMembers.userId, authUser.id),
      ),
    )
    .get()

  if (existingMember) {
    return { ok: true }
  }

  await db.insert(napkinbetsGroupMembers).values({
    id: crypto.randomUUID(),
    groupId,
    userId: authUser.id,
    role: 'member',
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return { ok: true }
}
