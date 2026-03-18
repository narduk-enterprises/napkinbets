import { computed, ref, shallowRef } from 'vue'
import { describe, expect, it } from 'vitest'
import type { CreateWagerInput } from '../../types/napkinbets'
import { useNapkinbetsCreateBuilder } from '../../app/composables/useNapkinbetsCreateBuilder'

const defaultPrefill: CreateWagerInput = {
  title: 'Test bet',
  creatorName: 'Creator',
  description: 'A friendly bet.',
  napkinType: 'simple-bet',
  boardType: 'community-created',
  format: 'head-to-head',
  sport: 'basketball',
  contextKey: 'pro',
  league: 'nba',
  customContextName: '',
  groupId: '',
  sideOptions: 'Side A\nSide B',
  participantNames: '',
  potRules: 'Winner: 100',
  entryFeeDollars: 20,
  paymentService: 'Venmo',
  paymentHandle: '',
  venueName: 'Group chat',
  latitude: '',
  longitude: '',
  terms: 'Friendly bets only.',
}

const emptyTaxonomy = { sports: [], contexts: [], leagues: [] }
const defaultFriends = [
  {
    id: 'friend-1',
    displayName: 'Alice',
    friendshipId: 'f1',
    email: 'a@test.com',
    avatarUrl: '',
    createdAt: '',
  },
]
const defaultGroups = [
  {
    id: 'g1',
    slug: 'g1',
    name: 'Group 1',
    description: '',
    visibility: 'public',
    joinPolicy: 'open',
    memberCount: 0,
    ownerName: '',
    userRole: null,
    joinedAt: null,
  },
]

function createBuilderOptions(
  overrides: {
    prefill?: Partial<CreateWagerInput> | CreateWagerInput
    mode?: 'event' | 'manual'
    taxonomy?: { sports: unknown[]; contexts: unknown[]; leagues: unknown[] }
    friends?: Array<{ id: string; displayName: string }>
    groups?: Array<{ id: string; name: string }>
    initialFriendId?: string
  } = {},
) {
  const prefill = shallowRef<CreateWagerInput>({
    ...defaultPrefill,
    ...overrides.prefill,
  })
  const mode = ref<
    typeof overrides.mode extends 'event' | 'manual' ? typeof overrides.mode : 'manual'
  >(overrides.mode ?? 'manual')
  const taxonomy = shallowRef(overrides.taxonomy ?? emptyTaxonomy)
  const friends = shallowRef(overrides.friends ?? defaultFriends)
  const groups = shallowRef(overrides.groups ?? defaultGroups)
  const initialFriendId = ref(overrides.initialFriendId ?? '')

  return {
    prefill: computed(() => prefill.value),
    mode: computed(() => mode.value),
    taxonomy: computed(() => taxonomy.value),
    friends: computed(() => friends.value),
    groups: computed(() => groups.value),
    initialFriendId: computed(() => initialFriendId.value),
  }
}

describe('useNapkinbetsCreateBuilder', () => {
  describe('1) Legs CRUD', () => {
    it('addLeg() appends a leg with default shape', () => {
      const options = createBuilderOptions()
      const builder = useNapkinbetsCreateBuilder(options)

      expect(builder.legList.value).toHaveLength(0)
      builder.addLeg()
      expect(builder.legList.value).toHaveLength(1)
      expect(builder.legList.value[0]).toEqual({
        questionText: '',
        legType: 'categorical',
        options: [],
        numericUnit: '',
        optionDraft: '',
      })
      builder.addLeg()
      expect(builder.legList.value).toHaveLength(2)
      expect(builder.legList.value[1]).toEqual({
        questionText: '',
        legType: 'categorical',
        options: [],
        numericUnit: '',
        optionDraft: '',
      })
    })

    it('removeLeg(index) removes the correct leg', () => {
      const options = createBuilderOptions()
      const builder = useNapkinbetsCreateBuilder(options)
      builder.addLeg()
      builder.addLeg()
      builder.addLeg()
      builder.legList.value[0]!.questionText = 'First'
      builder.legList.value[1]!.questionText = 'Second'
      builder.legList.value[2]!.questionText = 'Third'

      builder.removeLeg(1)
      expect(builder.legList.value).toHaveLength(2)
      expect(builder.legList.value[0]!.questionText).toBe('First')
      expect(builder.legList.value[1]!.questionText).toBe('Third')

      builder.removeLeg(0)
      expect(builder.legList.value).toHaveLength(1)
      expect(builder.legList.value[0]!.questionText).toBe('Third')

      builder.removeLeg(0)
      expect(builder.legList.value).toHaveLength(0)
    })

    it('addLegOption(legIndex) adds from optionDraft and clears draft only when optionDraft.trim()', () => {
      const options = createBuilderOptions()
      const builder = useNapkinbetsCreateBuilder(options)
      builder.addLeg()
      expect(builder.legList.value[0]!.options).toEqual([])
      expect(builder.legList.value[0]!.optionDraft).toBe('')

      builder.addLegOption(0)
      expect(builder.legList.value[0]!.options).toEqual([])
      expect(builder.legList.value[0]!.optionDraft).toBe('')

      builder.legList.value[0]!.optionDraft = '  Option A  '
      builder.addLegOption(0)
      expect(builder.legList.value[0]!.options).toEqual(['Option A'])
      expect(builder.legList.value[0]!.optionDraft).toBe('')

      builder.legList.value[0]!.optionDraft = 'Option B'
      builder.addLegOption(0)
      expect(builder.legList.value[0]!.options).toEqual(['Option A', 'Option B'])
      expect(builder.legList.value[0]!.optionDraft).toBe('')

      builder.legList.value[0]!.optionDraft = '   '
      builder.addLegOption(0)
      expect(builder.legList.value[0]!.options).toEqual(['Option A', 'Option B'])
    })

    it('removeLegOption(legIndex, option) removes that option', () => {
      const options = createBuilderOptions()
      const builder = useNapkinbetsCreateBuilder(options)
      builder.addLeg()
      builder.legList.value[0]!.options = ['A', 'B', 'C']
      builder.removeLegOption(0, 'B')
      expect(builder.legList.value[0]!.options).toEqual(['A', 'C'])
      builder.removeLegOption(0, 'A')
      expect(builder.legList.value[0]!.options).toEqual(['C'])
      builder.removeLegOption(0, 'C')
      expect(builder.legList.value[0]!.options).toEqual([])
    })
  })

  describe('2) Payload', () => {
    it('pool mode: payload includes legs when legList has trimmed questionText', () => {
      const options = createBuilderOptions({
        prefill: { ...defaultPrefill, napkinType: 'pool' },
      })
      const builder = useNapkinbetsCreateBuilder(options)
      builder.formState.napkinType = 'pool'
      builder.addLeg()
      builder.legList.value[0]!.questionText = '  Who wins?  '
      builder.legList.value[0]!.optionDraft = 'Team A'
      builder.addLegOption(0)
      builder.legList.value[0]!.optionDraft = 'Team B'
      builder.addLegOption(0)

      const payload = builder.payload.value
      expect(payload.napkinType).toBe('pool')
      expect(payload.legs).toBeDefined()
      expect(payload.legs).toHaveLength(1)
      expect(payload.legs![0]).toEqual({
        questionText: 'Who wins?',
        legType: 'categorical',
        options: ['Team A', 'Team B'],
        numericUnit: undefined,
      })
    })

    it('pool mode: legs with empty questionText are filtered out', () => {
      const options = createBuilderOptions({
        prefill: { ...defaultPrefill, napkinType: 'pool' },
      })
      const builder = useNapkinbetsCreateBuilder(options)
      builder.formState.napkinType = 'pool'
      builder.addLeg()
      builder.addLeg()
      builder.legList.value[0]!.questionText = ''
      builder.legList.value[1]!.questionText = 'Only this one'

      const payload = builder.payload.value
      expect(payload.legs).toHaveLength(1)
      expect(payload.legs![0].questionText).toBe('Only this one')
    })

    it('simple-bet: payload has participantSeeds with creator and opponent', () => {
      const options = createBuilderOptions({
        prefill: { ...defaultPrefill, napkinType: 'simple-bet', creatorName: 'Me' },
      })
      const builder = useNapkinbetsCreateBuilder(options)
      builder.formState.napkinType = 'simple-bet'
      builder.formState.creatorName = 'Me'
      builder.selectedOpponentId.value = 'friend-1'
      builder.manualOpponentName.value = ''

      const payload = builder.payload.value
      expect(payload.napkinType).toBe('simple-bet')
      expect(payload.participantSeeds).toBeDefined()
      expect(payload.participantSeeds).toHaveLength(2)
      expect(payload.participantSeeds!.map((p) => p.displayName)).toContain('Me')
      expect(payload.participantSeeds!.map((p) => p.displayName)).toContain('Alice')
    })

    it('simple-bet: manual opponent uses manualOpponentName when no selected friend', () => {
      const options = createBuilderOptions({
        friends: [],
        prefill: { ...defaultPrefill, napkinType: 'simple-bet' },
      })
      const builder = useNapkinbetsCreateBuilder(options)
      builder.formState.napkinType = 'simple-bet'
      builder.selectedOpponentId.value = ''
      builder.manualOpponentName.value = 'Bob'

      const payload = builder.payload.value
      expect(payload.participantSeeds).toHaveLength(2)
      const opponent = payload.participantSeeds!.find((p) => p.displayName === 'Bob')
      expect(opponent).toBeDefined()
    })
  })

  describe('3) Participant matching', () => {
    it('simple-bet with selectedOpponentId: payload has participantSeeds with userId for friend', () => {
      const options = createBuilderOptions({
        prefill: { ...defaultPrefill, napkinType: 'simple-bet', creatorName: 'Creator' },
        friends: [
          {
            id: 'friend-1',
            displayName: 'Alice',
            friendshipId: 'f1',
            email: 'a@test.com',
            avatarUrl: '',
            createdAt: '',
          },
        ],
      })
      const builder = useNapkinbetsCreateBuilder(options)
      builder.formState.napkinType = 'simple-bet'
      builder.formState.creatorName = 'Creator'
      builder.selectedOpponentId.value = 'friend-1'
      builder.manualOpponentName.value = ''

      const payload = builder.payload.value
      expect(payload.napkinType).toBe('simple-bet')
      expect(payload.participantSeeds).toHaveLength(2)
      const creator = payload.participantSeeds!.find((p) => p.displayName === 'Creator')
      const alice = payload.participantSeeds!.find((p) => p.displayName === 'Alice')
      expect(creator?.userId).toBeNull()
      expect(alice?.userId).toBe('friend-1')
    })

    it('pool with poolParticipants: payload has napkinType pool and participantSeeds', () => {
      const options = createBuilderOptions({
        prefill: { ...defaultPrefill, napkinType: 'pool' },
      })
      const builder = useNapkinbetsCreateBuilder(options)
      builder.formState.napkinType = 'pool'
      builder.poolParticipants.value = [
        { displayName: 'Alice', userId: 'friend-1' },
        { displayName: 'Bob', userId: null },
      ]

      const payload = builder.payload.value
      expect(payload.napkinType).toBe('pool')
      expect(payload.participantSeeds).toBeDefined()
      expect(payload.participantSeeds!.length).toBe(2)
      expect(payload.participantSeeds!.map((p) => p.displayName)).toEqual(
        expect.arrayContaining(['Alice', 'Bob']),
      )
      const alice = payload.participantSeeds!.find((p) => p.displayName === 'Alice')
      const bob = payload.participantSeeds!.find((p) => p.displayName === 'Bob')
      expect(alice?.userId).toBe('friend-1')
      expect(bob?.userId).toBeNull()
    })
  })
})
