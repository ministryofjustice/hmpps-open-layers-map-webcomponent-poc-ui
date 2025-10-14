import express, { Request, Response, NextFunction, Router } from 'express'
import config from '../map/config'

interface MapboxStyle {
  version?: number
  sprite?: string
  glyphs?: string
  sources?: Record<string, MapboxSource>
  layers?: unknown[]
}

interface MapboxSource {
  type?: string
  url?: string
  tiles?: string[]
  [key: string]: unknown
}

export interface OrdnanceSurveyAuthOptions {
  apiKey: string
  apiSecret: string
}

type CachedToken = {
  access_token: string
  expires_in: number
  issued_at: number
  token_type: string
}

let cachedToken: CachedToken | null = null
const BASE_PATH = config.tiles.urls.localBasePath

// Check if the token is expired or about to expire (within 60 seconds)
function isTokenExpired(token: CachedToken): boolean {
  const expiryTime = token.issued_at + token.expires_in * 1000
  return Date.now() >= expiryTime - 60_000
}

// Fetch a new OAuth2 access token from Ordnance Survey
async function fetchNewToken(apiKey: string, apiSecret: string): Promise<CachedToken> {
  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`

  const res = await fetch(config.tiles.urls.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authHeader,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })

  if (!res.ok) {
    throw new Error(`Token request failed (${res.status} ${res.statusText})`)
  }

  const token = (await res.json()) as CachedToken
  token.issued_at = Date.now()
  return token
}

// Get a valid OS access token, refreshing if expired
async function getAccessToken(options: OrdnanceSurveyAuthOptions): Promise<string> {
  const { apiKey, apiSecret } = options
  if (!cachedToken || isTokenExpired(cachedToken)) {
    cachedToken = await fetchNewToken(apiKey, apiSecret)
  }
  return cachedToken.access_token
}

// Helper to securely fetch requests to the Ordnance Survey Maps API
async function fetchFromOrdnanceSurvey(
  req: Request,
  res: Response,
  next: NextFunction,
  ordnanceSurveyApiUrl: string,
  accessToken: string,
) {
  try {
    const ordnanceSurveyResponse = await fetch(ordnanceSurveyApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!ordnanceSurveyResponse.ok) {
      throw new Error(
        `[os-auth] Ordnance Survey request failed: ${ordnanceSurveyResponse.status} ${ordnanceSurveyResponse.statusText}`,
      )
    }

    // Preserve correct content type (JSON, PBF, etc.)
    res.setHeader('Content-Type', ordnanceSurveyResponse.headers.get('content-type') || 'application/octet-stream')

    // Convert binary data to a Node Buffer and send
    const buffer = Buffer.from(await ordnanceSurveyResponse.arrayBuffer())
    res.send(buffer)
  } catch (err) {
    console.error('[os-auth] Error fetching Ordnance Survey request:', err)
    next(err)
  }
}

// Express middleware for securely fetching Ordnance Survey vector tiles and assets via OAuth2
export function mojOrdnanceSurveyAuth(options: OrdnanceSurveyAuthOptions): Router {
  const vectorBaseUrl = config.tiles.urls.vectorSourceUrl.replace(/\/vts$/, '')
  const vectorRoot = `${vectorBaseUrl}/vts`

  const router = express.Router()

  // Style JSON endpoint
  router.get(`${BASE_PATH}/style`, async (_req, res, next) => {
    try {
      const styleUrl = `${vectorRoot}/resources/styles?srs=3857`
      const token = await getAccessToken(options)
      const response = await fetch(styleUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch style JSON (${response.status})`)
      }

      const style = (await response.json()) as MapboxStyle

      // Rewrite source + assets URLs to the local middleware endpoints
      if (style.sources) {
        for (const source of Object.values(style.sources)) {
          if (typeof source.url === 'string') {
            source.url = `${BASE_PATH}/source`
          }
          if (Array.isArray(source.tiles)) {
            source.tiles = source.tiles.map(tile =>
              tile.replace(/^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/tile/, `${BASE_PATH}/tiles`),
            )
          }
        }
      }

      if (style.sprite) {
        style.sprite = style.sprite.replace(
          /^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/resources/,
          `${BASE_PATH}/assets`,
        )
      }
      if (style.glyphs) {
        style.glyphs = style.glyphs.replace(
          /^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/resources/,
          `${BASE_PATH}/assets`,
        )
      }

      res.json(style)
    } catch (err) {
      console.error('[os-auth] Failed to fetch or rewrite OS style:', err)
      next(err)
    }
  })

  // Vector source endpoint
  router.get(`${BASE_PATH}/source`, async (_req, res, next) => {
    try {
      const token = await getAccessToken(options)

      // Fetch the style first to discover the correct source URL
      const styleUrl = `${vectorRoot}/resources/styles?srs=3857`
      const styleRes = await fetch(styleUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!styleRes.ok) {
        const text = await styleRes.text()
        console.error(`[os-auth] Error fetching Ordnance Survey style JSON (${styleRes.status}): ${text}`)
        return res.status(styleRes.status).send(text)
      }

      const style = (await styleRes.json()) as MapboxStyle
      const firstSource = Object.values(style.sources || {})[0]
      if (!firstSource || typeof firstSource.url !== 'string') {
        throw new Error('Could not determine vector source URL from style JSON')
      }

      const sourceUrl = firstSource.url
      console.log('[os-auth] Fetching vector source from:', sourceUrl)

      // Fetch that source directly
      const osRes = await fetch(sourceUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!osRes.ok) {
        const text = await osRes.text()
        console.error(`[os-auth] Vector source fetch failed (${osRes.status}): ${text}`)
        return res.status(osRes.status).send(text)
      }

      // Rewrite tile URLs
      const json = await osRes.json()
      if (json.tiles && Array.isArray(json.tiles)) {
        json.tiles = json.tiles.map((tile: string) =>
          tile.replace(/^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/tile/, `${BASE_PATH}/tiles`),
        )
      }

      return res.json(json)
    } catch (err) {
      console.error('[os-auth] Failed to fetch vector source:', err)
      return next(err)
    }
  })

  // Tile endpoint
  router.get(`${BASE_PATH}/tiles/:z/:x/:y.pbf`, async (req, res, next) => {
    const { z, x, y } = req.params
    const srs = req.query.srs || '3857'
    const token = await getAccessToken(options)
    const url = `${vectorRoot}/tile/${z}/${x}/${y}.pbf?srs=${srs}`
    await fetchFromOrdnanceSurvey(req, res, next, url, token)
  })

  // Assets endpoint (fonts and resources)
  router.get(`${BASE_PATH}/assets/*`, async (req: Request<{ 0: string }>, res, next) => {
    const assetPath = req.params[0]
    const token = await getAccessToken(options)
    const url = `${vectorRoot}/resources/${assetPath}`
    await fetchFromOrdnanceSurvey(req, res, next, url, token)
  })

  return router
}
