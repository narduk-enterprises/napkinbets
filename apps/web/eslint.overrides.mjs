// App-specific ESLint overrides.
// This app uses the shared mutation wrappers in #layer/server/utils/mutation,
// so the older raw rate-limit rule is intentionally disabled here.

export default [
  {
    files: ['server/api/**/*.{post,put,patch,delete}.ts'],
    rules: {
      'narduk/require-enforce-rate-limit-on-mutations': 'off',
    },
  },
]
