import config from '../map/config'
import type { CachedToken, OrdnanceSurveyAuthOptions } from './index'

jest.mock('../map/config', () => ({
  __esModule: true,
  default: {
    tiles: {
      urls: { authUrl: 'https://api.os.uk/oauth2/v1/token' },
    },
  },
}))

// Global fetch mock
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Freeze time to avoid flaky time-based tests
const NOW = 1_700_000_000_000
jest.spyOn(Date, 'now').mockImplementation(() => NOW)

function makeToken(overrides: Partial<CachedToken> = {}): CachedToken {
  return {
    access_token: 'mock-access',
    token_type: 'Bearer',
    expires_in: 3600,
    issued_at: NOW,
    ...overrides,
  }
}

// Each test starts with fresh module + mocks
beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('isTokenExpired', () => {
  it('returns false for a valid token', async () => {
    const { isTokenExpired } = await import('./auth')
    const token = { issued_at: Date.now(), expires_in: 3600 }
    expect(isTokenExpired(token)).toBe(false)
  })

  it('returns true if the token is expired', async () => {
    const { isTokenExpired } = await import('./auth')
    const old = Date.now() - 5_000_000
    const token = { issued_at: old, expires_in: 1 }
    expect(isTokenExpired(token)).toBe(true)
  })
})

describe('getAccessToken', () => {
  const options: OrdnanceSurveyAuthOptions = {
    apiKey: 'test-key',
    apiSecret: 'test-secret',
  }

  it('fetches a new token if no cached token exists', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => makeToken() })
    const { getAccessToken } = await import('./auth')

    const token = await getAccessToken(options)

    expect(token).toBe('mock-access')
    expect(mockFetch).toHaveBeenCalledWith(
      config.tiles.urls.authUrl,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Basic /) }),
      }),
    )
  })

  it('returns cached token if still valid', async () => {
    const { getAccessToken } = await import('./auth')
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => makeToken() })

    await getAccessToken(options)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const token = await getAccessToken(options)
    expect(token).toBe('mock-access')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('fetches a new token if cached token is expired', async () => {
    // First import (fresh)
    const { getAccessToken: firstAccessToken } = await import('./auth')
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => makeToken({ issued_at: NOW - 10_000_000 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => makeToken({ access_token: 'new-access' }) })

    // First call (expired token)
    const token1 = await firstAccessToken(options)
    expect(token1).toBe('mock-access')

    // Re-import to reset module state
    const { getAccessToken: nextAccessToken } = await import('./auth')
    jest.spyOn(Date, 'now').mockImplementation(() => NOW + 4_000_000)

    const token2 = await nextAccessToken(options)
    expect(token2).toBe('new-access')
  })

  it('throws an error if fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const { getAccessToken } = await import('./auth')
    await expect(getAccessToken(options)).rejects.toThrow(/401 Unauthorized/)
  })
})
