import { defineSharedAuthContract } from '../../../../layers/narduk-nuxt-layer/testing/e2e/auth-contract.ts'

defineSharedAuthContract({
  appName: 'web',
  protectedPath: '/dashboard',
  dashboardHeading: /Everything you host, joined, or still need to settle/i,
  loginHeading: /^Get back to your napkins\.$/i,
  registerHeading: /^Create an account$/i,
})
