import { fetchAccessToken, startTokenRefresh } from './token-refresh'

describe('fetchAccessToken', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns token and expiresIn on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'access-token', expires_in: 3600 }),
    }) as jest.Mock

    const result = await fetchAccessToken('/token-url')
    expect(result).toEqual({ token: 'access-token', expiresIn: 3600 })
    expect(global.fetch).toHaveBeenCalledWith('/token-url')
  })

  it('throws if response not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
    }) as jest.Mock

    await expect(fetchAccessToken('/token-url')).rejects.toThrow('Failed to fetch access token: Bad Request')
    expect(global.fetch).toHaveBeenCalledWith('/token-url')
  })

  it('throws if missing fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock

    await expect(fetchAccessToken('/token-url')).rejects.toThrow('Invalid access_token or expires_in')
    expect(global.fetch).toHaveBeenCalledWith('/token-url')
  })
})

describe('startTokenRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')
    jest.spyOn(global, 'setInterval')
    jest.spyOn(global, 'clearTimeout')
    jest.spyOn(global, 'clearInterval')
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('schedules refresh and calls onTokenUpdate', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-token', expires_in: 120 }),
    }) as jest.Mock

    const onTokenUpdate = jest.fn()
    const stop = startTokenRefresh({
      tokenUrl: '/token-url',
      initialExpiresIn: 120,
      onTokenUpdate,
    })

    // Fast-forward to trigger refresh
    await jest.advanceTimersByTimeAsync((120 - 60) * 1000)

    expect(onTokenUpdate).toHaveBeenCalledWith('new-token')
    expect(global.fetch).toHaveBeenCalledWith('/token-url')
    expect(setTimeout).toHaveBeenCalled()

    stop()
    expect(clearTimeout).toHaveBeenCalled()
    expect(clearInterval).toHaveBeenCalled()
  })

  it('forces early refresh if drift detected', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'drift-token', expires_in: 120 }),
    }) as jest.Mock

    const onTokenUpdate = jest.fn()
    startTokenRefresh({
      tokenUrl: '/token-url',
      initialExpiresIn: 120,
      onTokenUpdate,
    })

    // Simulate system sleep by advancing timers way beyond CHECK_INTERVAL + MAX_DRIFT
    await jest.advanceTimersByTimeAsync(1000 * 100)

    expect(onTokenUpdate).toHaveBeenCalledWith('drift-token')
    expect(global.fetch).toHaveBeenCalledWith('/token-url')
  })
})
