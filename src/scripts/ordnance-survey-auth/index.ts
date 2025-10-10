import express, { Request, Response, NextFunction, Router } from 'express'
import superagent from 'superagent'
import qs from 'qs'

interface MapboxSource {
  type?: string
  url?: string
  tiles?: string[]
  [key: string]: unknown
}

export interface OrdnanceSurveyAuthOptions {
  authUrl: string
  apiKey: string
  apiSecret: string
  upstreamBase: string // Base URL for the vector service (e.g. https://api.os.uk/maps/vector/v1)
}

type CachedToken = {
  access_token: string
  expires_in: number
  issued_at: number
  token_type: string
}

let cachedToken: CachedToken | null = null

// Check if the token is expired or about to expire within 60 seconds.
function isTokenExpired(token: CachedToken): boolean {
  const expiryTime = token.issued_at + token.expires_in * 1000
  return Date.now() >= expiryTime - 60_000
}

// Fetch a new OAuth2 access token from Ordnance Survey.
async function fetchNewToken(authUrl: string, apiKey: string, apiSecret: string): Promise<CachedToken> {
  const response = await superagent
    .post(authUrl)
    .auth(apiKey, apiSecret)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send(qs.stringify({ grant_type: 'client_credentials' }))

  const token = response.body as CachedToken
  token.issued_at = Date.now()
  return token
}

// Get a valid OS access token, refreshing if expired.
async function getAccessToken(opts: OrdnanceSurveyAuthOptions): Promise<string> {
  if (!cachedToken || isTokenExpired(cachedToken)) {
    cachedToken = await fetchNewToken(opts.authUrl, opts.apiKey, opts.apiSecret)
  }
  return cachedToken.access_token
}

// Express middleware for securely fetching Ordnance Survey vector tiles and assets via OAuth2.
export function mojOrdnanceSurveyAuth(options: OrdnanceSurveyAuthOptions): Router {
  const { authUrl, apiKey, apiSecret, upstreamBase } = options
  if (!authUrl || !apiKey || !apiSecret || !upstreamBase) {
    throw new Error('Missing Ordnance Survey credentials or upstreamBase URL.')
  }

  const router = express.Router()
  const vectorRoot = `${upstreamBase.replace(/\/$/, '')}/vts`

  // Helper to forward a request to OS with the current Bearer token.
  async function fetchFromOrdnanceSurvey(req: Request, res: Response, next: NextFunction, upstreamUrl: string) {
    try {
      const token = await getAccessToken(options)
      const response = await superagent
        .get(upstreamUrl)
        .set('Authorization', `Bearer ${token}`)
        .responseType('blob')
        .buffer(true)

      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream')
      res.send(response.body)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[os-auth] Proxy error:', message)
      next(error)
    }
  }

  // Style JSON endpoint
  router.get('/vector/style', async (req, res, next) => {
    try {
      const styleUrl = `${vectorRoot}/resources/styles?srs=3857`
      const token = await getAccessToken(options)
      const response = await superagent.get(styleUrl).set('Authorization', `Bearer ${token}`).accept('application/json')

      const style = response.body

      // Rewrite URLs to go via middleware
      if (style.sources) {
        for (const source of Object.values(style.sources) as MapboxSource[]) {
          if (typeof source.url === 'string') {
            source.url = '/os-map/vector/source'
          }
          if (Array.isArray(source.tiles)) {
            source.tiles = source.tiles.map(tile =>
              tile.replace(/^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts/, '/os-map/vector/tiles'),
            )
          }
        }
      }

      res.json(style)
    } catch (error) {
      console.error('[os-auth] Failed to fetch or rewrite OS style:', error)
      next(error)
    }
  })

  // Tile endpoint (e.g. /os-map/vector/tiles/{z}/{x}/{y}.pbf?srs=3857)
  router.get('/vector/tiles/:z/:x/:y.pbf', async (req, res, next) => {
    const { z, x, y } = req.params
    const srs = req.query.srs || '3857'
    const url = `${vectorRoot}/tile/${z}/${y}/${x}.pbf?srs=${srs}`
    await fetchFromOrdnanceSurvey(req, res, next, url)
  })

  // Assets endpoint (fonts and resources, etc.)
  router.get('/vector/assets/*', async (req: Request<{ 0: string }>, res, next) => {
    const assetPath = req.params[0]
    const url = `${vectorRoot}/resources/${assetPath}`
    await fetchFromOrdnanceSurvey(req, res, next, url)
  })

  return router
}
