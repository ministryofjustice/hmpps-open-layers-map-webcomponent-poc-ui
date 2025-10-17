import express, { Express } from 'express'
import request from 'supertest'
import type { MockedFunction } from 'jest-mock'
import { mojOrdnanceSurveyAuth } from './index'
import { getAccessToken } from './auth'
import { rewriteStyleUrls, rewriteVectorSource } from './rewrite-os-urls'
import { fetchFromOrdnanceSurvey } from './fetch'

// Mock map config so URLs match our fetch mock
jest.mock('../map/config', () => ({
  __esModule: true,
  default: {
    tiles: {
      urls: {
        localBasePath: '/os-map/vector',
        vectorSourceUrl: 'https://api.os.uk/maps/vector/v1/vts',
      },
      srs: '3857',
      cacheExpirySeconds: 0,
    },
  },
}))

// Mock dependencies
jest.mock('./auth')
jest.mock('./rewrite-os-urls')
jest.mock('./tile-cache')
jest.mock('./fetch')

// Global fetch mock to simulate Ordnance Survey API responses
global.fetch = jest.fn(
  async (
    url: string,
  ): Promise<{
    ok: boolean
    status?: number
    json: () => Promise<unknown>
    text: () => Promise<string>
  }> => {
    // Style JSON fetch
    if (url.includes('/resources/styles')) {
      return {
        ok: true,
        json: async (): Promise<unknown> => ({
          version: 8,
          sources: {
            osSource: { url: 'https://api.os.uk/maps/vector/v1/vts/resources/source.json' },
          },
        }),
        text: async (): Promise<string> => 'mock style json',
      }
    }

    // Vector source fetch
    if (url.includes('source.json')) {
      return {
        ok: true,
        json: async (): Promise<unknown> => ({
          sources: {
            osSource: {
              tiles: ['https://api.os.uk/tiles/mock/{z}/{x}/{y}.pbf'],
            },
          },
        }),
        text: async (): Promise<string> => 'mock source json',
      }
    }

    // Fallback
    return {
      ok: false,
      status: 404,
      json: async (): Promise<unknown> => ({}),
      text: async (): Promise<string> => 'not found',
    }
  },
) as unknown as jest.Mock

describe('mojOrdnanceSurveyAuth middleware', () => {
  let app: Express
  const mockFetch = global.fetch as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    const testErrorHandler: express.ErrorRequestHandler = (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.log('[TEST caught error]', err)
      res.status(500).send(err.message)
    }

    const mockedGetAccessToken = getAccessToken as MockedFunction<typeof getAccessToken>
    const mockedRewriteStyleUrls = rewriteStyleUrls as MockedFunction<typeof rewriteStyleUrls>
    const mockedRewriteVectorSource = rewriteVectorSource as MockedFunction<typeof rewriteVectorSource>
    const mockedFetchFromOrdnanceSurvey = fetchFromOrdnanceSurvey as MockedFunction<typeof fetchFromOrdnanceSurvey>

    mockedGetAccessToken.mockResolvedValue('mock-token')

    mockedRewriteStyleUrls.mockImplementation(json => ({
      ...json,
      sources: {
        osSource: { url: '/os-map/vector/source' },
      },
    }))
    mockedRewriteVectorSource.mockImplementation(json => json)

    // Distinguish tile vs. asset routes
    mockedFetchFromOrdnanceSurvey.mockImplementation(async (req, res) => {
      if (req.path.includes('/tiles/')) {
        res.status(200).send('mock pbf tile bytes')
      } else {
        res.status(200).send('mock asset bytes')
      }
    })

    app = express()
    app.use(
      mojOrdnanceSurveyAuth({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        cacheExpiry: 0,
      }),
    )

    app.use(testErrorHandler)
  })

  // Style JSON fetch route
  describe('GET /os-map/vector/style', () => {
    it('returns rewritten style JSON', async () => {
      const res = await request(app).get('/os-map/vector/style')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('version', 8)
      expect(getAccessToken).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'test-key' }))
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/resources/styles'), expect.any(Object))
    })

    it('returns 500 if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      const res = await request(app).get('/os-map/vector/style')
      expect(res.status).toBe(500)
    })
  })

  // Vector fetch route
  describe('GET /os-map/vector/source', () => {
    it('returns rewritten vector source JSON', async () => {
      const res = await request(app).get('/os-map/vector/source')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('sources')
      expect(rewriteVectorSource).toHaveBeenCalled()
    })
  })

  // Tile fetch route
  describe('GET /os-map/vector/tiles/:z/:x/:y.pbf', () => {
    it('fetches a PBF tile and returns binary-like data', async () => {
      const res = await request(app).get('/os-map/vector/tiles/1/2/3.pbf')
      expect(res.status).toBe(200)
      expect(res.text).toContain('mock pbf tile')
      expect(getAccessToken).toHaveBeenCalled()
      expect(fetchFromOrdnanceSurvey).toHaveBeenCalled()
    })
  })

  // Assets fetch route
  describe('GET /os-map/vector/assets/:assetPath(*)', () => {
    it('fetches a font or sprite asset and returns it', async () => {
      const res = await request(app).get('/os-map/vector/assets/fonts/test/font.pbf')
      expect(res.status).toBe(200)
      expect(res.text).toContain('mock asset bytes')
      expect(getAccessToken).toHaveBeenCalled()
      expect(fetchFromOrdnanceSurvey).toHaveBeenCalled()
    })
  })
})
