import crypto from 'crypto'
import { TileCache, generateEtag, type CacheClient } from './tile-cache'

describe('TileCache', () => {
  let mockClient: jest.Mocked<CacheClient>

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      set: jest.fn(),
    }
  })

  it('returns null when no Redis client is configured', async () => {
    const cache = new TileCache()
    const result = await cache.get('key')
    expect(result).toBeNull()
  })

  it('returns cached data as a Buffer when found in Redis', async () => {
    const buffer = Buffer.from('hello')
    const base64 = buffer.toString('base64')
    mockClient.get.mockResolvedValue(base64)
    const cache = new TileCache({ redisClient: mockClient })

    const result = await cache.get('key')

    expect(mockClient.get).toHaveBeenCalledWith('key')
    expect(result?.equals(buffer)).toBe(true)
  })

  it('returns null when cache lookup throws an error', async () => {
    mockClient.get.mockRejectedValue(new Error('fail'))
    const cache = new TileCache({ redisClient: mockClient })
    const result = await cache.get('key')
    expect(result).toBeNull()
  })

  it('stores data in Redis as base64 with an expiry time', async () => {
    const cache = new TileCache({ redisClient: mockClient, cacheExpiry: 123 })
    const buffer = Buffer.from('test-buffer')

    await cache.set('key', buffer)

    const expectedBase64 = buffer.toString('base64')
    expect(mockClient.set).toHaveBeenCalledWith('key', expectedBase64, { EX: 123 })
  })

  it('silently ignores errors when setting data fails', async () => {
    mockClient.set.mockRejectedValue(new Error('write failed'))
    const cache = new TileCache({ redisClient: mockClient })
    await expect(cache.set('key', Buffer.from('data'))).resolves.toBeUndefined()
  })

  it('exposes the configured cache expiry time', () => {
    const cache = new TileCache({ redisClient: mockClient, cacheExpiry: 999 })
    expect(cache.expiry).toBe(999)
  })

  it('defaults to 600 seconds expiry when none provided', () => {
    const cache = new TileCache({ redisClient: mockClient })
    expect(cache.expiry).toBe(600)
  })
})

describe('generateEtag', () => {
  it('generates a consistent SHA-1 hash for a given buffer', () => {
    const buffer = Buffer.from('abc')
    const hash1 = generateEtag(buffer)
    const hash2 = crypto.createHash('sha1').update('abc').digest('hex')

    expect(hash1).toBe(hash2)
  })

  it('produces different values for different buffers', () => {
    const a = generateEtag(Buffer.from('a'))
    const b = generateEtag(Buffer.from('b'))
    expect(a).not.toBe(b)
  })
})
