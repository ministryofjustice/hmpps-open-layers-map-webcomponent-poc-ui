// Detect if running in Continuous Integration (e.g. GitHub Actions sets CI=true)
const isCI = process.env.CI === 'true'

export default {
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!ol|rbush|quickselect)/'],
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,js}'],
  testEnvironment: 'jsdom',
  reporters: isCI
    ? [
        'default',
        [
          'jest-junit',
          {
            outputDirectory: 'test_results/jest/',
          },
        ],
        [
          './node_modules/jest-html-reporter',
          {
            outputPath: 'test_results/unit-test-reports.html',
          },
        ],
      ]
    : ['default'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  moduleNameMapper: {
    '^ol/(.*)$': '<rootDir>/node_modules/ol/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.css\\?raw$': 'jest-transform-stub',
  },
}
