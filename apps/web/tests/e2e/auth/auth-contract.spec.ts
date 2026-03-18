import { defineSharedAuthContract } from '../../../../../layers/narduk-nuxt-layer/testing/e2e/auth-contract.ts'

defineSharedAuthContract({
  appName: 'web',
  protectedPath: '/dashboard',
  dashboardHeading: /Your bets/i,
  loginHeading: /^Get back to your bets\.$/i,
  registerHeading: /^Create an account$/i,
})
