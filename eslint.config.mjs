import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig(),

  // Allow devDependencies in build/config scripts
  {
    files: [
      'vite.config.{ts,js,mjs,cjs}',
      '*.config.{ts,js,mjs,cjs}',
      'scripts/**/*.{ts,js}'
    ],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
    }
  }
]
