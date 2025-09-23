import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig(),

  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'nunjucks/**',
      'src/styles/**/*.raw.css',
      'eslint.config.{js,cjs,mjs}',
      'babel.config.{js,cjs,mjs}',
    ],
  },

  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Allow single named exports so don't need to change from default export if another export is added
      'import/prefer-default-export': 'off',
      // Allow console.warn and console.error to feedback to developers using the component but not console.log
      'no-console':
      process.env.NODE_ENV === 'production'
        ? ['error', { allow: ['warn', 'error'] }]
        : 'off',
    },
  },

  // Looser rules for config files, dev scripts, and tests
  {
    files: [
      'vite.config.{ts,js,mjs,cjs}',
      '*.config.{ts,js,mjs,cjs}',
      'src/dev.ts',
      'src/jest.setup.ts',
      'src/**/*.test.{ts,js}',
    ],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'max-classes-per-file': 'off',
      'no-underscore-dangle': 'off',
      'no-new': 'off',
      'global-require': 'off',
    },
  },
]
