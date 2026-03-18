import { describe, expect, it } from 'vitest'
import { getNapkinbetsWagerSettlementStage } from '../../app/utils/napkinbets-wager-detail'

function createWager(
  overrides: Partial<Parameters<typeof getNapkinbetsWagerSettlementStage>[0]> = {},
): Parameters<typeof getNapkinbetsWagerSettlementStage>[0] {
  return {
    status: 'locked',
    eventState: 'pre',
    settlements: [],
    ...overrides,
  }
}

describe('getNapkinbetsWagerSettlementStage', () => {
  it('keeps pregame wagers in the upcoming stage', () => {
    expect(getNapkinbetsWagerSettlementStage(createWager())).toBe('upcoming')
  })

  it('moves live wagers into the live stage before any settlement exists', () => {
    expect(
      getNapkinbetsWagerSettlementStage(
        createWager({
          status: 'live',
          eventState: 'in',
        }),
      ),
    ).toBe('live')
  })

  it('unlocks settlement once the event is final', () => {
    expect(
      getNapkinbetsWagerSettlementStage(
        createWager({
          status: 'settling',
          eventState: 'post',
        }),
      ),
    ).toBe('ready')
  })

  it('shows submitted when the current participant already logged proof', () => {
    expect(
      getNapkinbetsWagerSettlementStage(
        createWager({
          status: 'settling',
          eventState: 'post',
          settlements: [
            {
              participantId: 'pat',
              verificationStatus: 'submitted',
              recipientAcknowledged: false,
            },
          ],
        }),
        'pat',
      ),
    ).toBe('submitted')
  })

  it('shows rejected when the current participant proof was sent back', () => {
    expect(
      getNapkinbetsWagerSettlementStage(
        createWager({
          status: 'settling',
          eventState: 'post',
          settlements: [
            {
              participantId: 'pat',
              verificationStatus: 'rejected',
              recipientAcknowledged: false,
            },
          ],
        }),
        'pat',
      ),
    ).toBe('rejected')
  })

  it('marks completed wagers as settled', () => {
    expect(
      getNapkinbetsWagerSettlementStage(
        createWager({
          status: 'settled',
          eventState: 'post',
        }),
      ),
    ).toBe('settled')
  })
})
