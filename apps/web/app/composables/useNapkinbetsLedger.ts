import type { NapkinbetsLedgerResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_LEDGER: NapkinbetsLedgerResponse = {
  counterparties: [],
  totalOwedCents: 0,
  totalOwedToYouCents: 0,
  refreshedAt: '',
}

type NapkinbetsAsyncOptions = {
  server?: boolean
  lazy?: boolean
}

export function useNapkinbetsLedger(options?: NapkinbetsAsyncOptions) {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsLedgerResponse>('napkinbets-ledger', () => api.getLedger(), {
    default: () => EMPTY_LEDGER,
    ...options,
  })
}
