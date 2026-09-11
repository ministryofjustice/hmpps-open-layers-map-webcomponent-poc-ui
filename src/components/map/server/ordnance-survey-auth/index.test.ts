import express from 'express'
import request from 'supertest'
import { emOrdnanceSurveyAuth, type OrdnanceSurveyAuthOptions } from './index'
import { getAccessToken } from './auth'
import { fetchFromOrdnanceSurvey } from './fetch'

jest.mock('@map/scripts/core/config', () => ({
  __esModule: true,
  default: {
    tiles: {
      srs: '3857',
      urls: {
        localBasePath: '/os-map/vector',
        vectorSourceUrl: 'https://api.os.uk/maps/vector/v1/vts',
      },
      cacheExpirySeconds: 604800,
    },
  },
}))

jest.mock('./auth', () => ({
  getAccessToken: jest.fn(),
}))

jest.mock('./fetch', () => ({
  fetchFromOrdnanceSurvey: jest.fn(),
}))

const mockGetAccessToken = getAccessToken as jest.Mock
const mockFetchFromOrdnanceSurvey = fetchFromOrdnanceSurvey as jest.Mock

const options: OrdnanceSurveyAuthOptions = {
  apiKey: 'test-key',
  apiSecret: 'test-secret',
}

describe('emOrdnanceSurveyAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAccessToken.mockResolvedValue('mock-token')
    mockFetchFromOrdnanceSurvey.mockImplementation(async (_req, res) => {
      res.status(200).end()
    })
  })

  // The assets route previously used the Express v4.x
  // syntax `:assetPath(*)`, which throws a route-compilation error under Express v5.x
  it('does not throw when building the router (assets route pattern compiles)', () => {
    expect(() => emOrdnanceSurveyAuth(options)).not.toThrow()
  })

  it('joins multi-segment asset paths back into a single URL', async () => {
    const app = express()
    app.use(emOrdnanceSurveyAuth(options))

    await request(app).get('/os-map/vector/assets/fonts/Arial%20Bold/0-255.pbf').expect(200)

    expect(mockFetchFromOrdnanceSurvey).toHaveBeenCalledTimes(1)
    const [, , , url] = mockFetchFromOrdnanceSurvey.mock.calls[0]
    expect(url).toMatch(/\/resources\/fonts\/Arial Bold\/0-255\.pbf$/)
  })

  it('supports a single-segment asset path', async () => {
    const app = express()
    app.use(emOrdnanceSurveyAuth(options))

    await request(app).get('/os-map/vector/assets/sprite.json').expect(200)

    expect(mockFetchFromOrdnanceSurvey).toHaveBeenCalledTimes(1)
    const [, , , url] = mockFetchFromOrdnanceSurvey.mock.calls[0]
    expect(url).toMatch(/\/resources\/sprite\.json$/)
  })
})
