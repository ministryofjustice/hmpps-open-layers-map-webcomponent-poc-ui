const commonProjectSettings = {
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!ol|rbush|quickselect)/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  moduleNameMapper: {
    '^ol/(.*)$': '<rootDir>/node_modules/ol/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.css\\?raw$': 'jest-transform-stub',
  },
}

export default {
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test_results/jest/' }],
    ['./node_modules/jest-html-reporter', { outputPath: 'test_results/unit-test-reports.html' }],
  ],
  projects: [
    {
      displayName: 'ui',
      ...commonProjectSettings,
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/src/scripts/ordnance-survey-auth/'],
    },
    {
      displayName: 'server',
      ...commonProjectSettings,
      testEnvironment: 'node',
      setupFilesAfterEnv: [],
      testMatch: ['<rootDir>/src/scripts/ordnance-survey-auth/**/*.test.ts'],
    },
  ],
}
