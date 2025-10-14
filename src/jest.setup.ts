import '@testing-library/jest-dom'

/* eslint-disable no-empty-function */
class ResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

global.ResizeObserver = ResizeObserver

// Mock fetch globally for Node/Jest
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ version: 8, sources: {} }),
  }),
) as jest.Mock

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
