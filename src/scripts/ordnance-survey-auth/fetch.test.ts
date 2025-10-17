import type { Request, Response } from 'express'
import { fetchFromOrdnanceSurvey } from './fetch'
import { TileCache, generateEtag } from './tile-cache'

global.fetch = jest.fn() as any
const mockFetch = global.fetch as jest.Mock

describe('fetchFromOrdnanceSurvey', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock
  let cache: {
    get: jest.Mock
    set: jest.Mock
    expiry: number
  }

  const URL = 'https://api.os.uk/tiles/1/2/3.pbf'
  const TOKEN = 'mock-token'

  beforeEach(() => {
    jest.resetAllMocks()
    req = { headers: {} }
    next = jest.fn()
    res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
    }

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      expiry: 300,
    }
  })

  it('returns 304 when client ETag matches cached version', async () => {
    const buffer = Buffer.from('cached tile data')
    cache.get.mockResolvedValue(buffer)
    const etag = generateEtag(buffer)
    req.headers = { 'if-none-match': etag }

    await fetchFromOrdnanceSurvey(req as Request, res as Response, next, URL, TOKEN, {
      cache: cache as unknown as TileCache,
      cacheKeyPrefix: 'test',
    })

    expect(res.status).toHaveBeenCalledWith(304)
    expect(res.end).toHaveBeenCalled()
    expect(res.send).not.toHaveBeenCalled()
  })

  it('returns cached content when ETag differs', async () => {
    const buffer = Buffer.from('cached tile data')
    cache.get.mockResolvedValue(buffer)
    req.headers = { 'if-none-match': '"different-etag"' }

    await fetchFromOrdnanceSurvey(req as Request, res as Response, next, URL, TOKEN, {
      cache: cache as unknown as TileCache,
      cacheKeyPrefix: 'test',
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(buffer)
    expect(res.setHeader).toHaveBeenCalledWith('ETag', generateEtag(buffer))
  })

  it('uses cached data when available', async () => {
    const buffer = Buffer.from('cached')
    cache.get.mockResolvedValue(buffer)

    await fetchFromOrdnanceSurvey(req as Request, res as Response, next, URL, TOKEN, {
      cache: cache as unknown as TileCache,
      cacheKeyPrefix: 'test',
    })

    expect(cache.get).toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('fetches from API when cache is empty', async () => {
    cache.get.mockResolvedValue(null)
    const buf = Buffer.from('fetched')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/x-protobuf' },
      arrayBuffer: async () => buf,
    })

    await fetchFromOrdnanceSurvey(req as Request, res as Response, next, URL, TOKEN, {
      cache: cache as unknown as TileCache,
      cacheKeyPrefix: 'test',
    })

    expect(mockFetch).toHaveBeenCalledWith(URL, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    expect(res.send).toHaveBeenCalledWith(buf)
    expect(cache.set).toHaveBeenCalled()
  })

  it('calls next(err) when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await fetchFromOrdnanceSurvey(req as Request, res as Response, next, URL, TOKEN)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it('sets correct fallback content-type when header missing', async () => {
    const buffer = Buffer.from('data')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => buffer,
    })

    await fetchFromOrdnanceSurvey(req as Request, res as Response, next, URL, TOKEN)

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/x-protobuf')
    expect(res.send).toHaveBeenCalledWith(buffer)
  })
})
