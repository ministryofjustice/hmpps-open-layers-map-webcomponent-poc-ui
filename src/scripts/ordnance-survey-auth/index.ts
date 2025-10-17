import express, { Router } from 'express'
import config from '../map/config'
import { getAccessToken } from './auth'
import { fetchFromOrdnanceSurvey } from './fetch'
import { rewriteStyleUrls, rewriteVectorSource } from './rewrite-os-urls'
import { TileCache, type CacheClient } from './tile-cache'

export interface MapboxStyle {
  version?: number
  sprite?: string
  glyphs?: string
  sources?: Record<string, MapboxSource>
  layers?: unknown[]
}

export interface MapboxSource {
  type?: string
  url?: string
  tiles?: string[]
  [key: string]: unknown
}

export interface OrdnanceSurveyAuthOptions {
  apiKey: string
  apiSecret: string
  redisClient?: CacheClient
  cacheExpiry?: number
}

export type CachedToken = {
  access_token: string
  expires_in: number
  issued_at: number
  token_type: string
}

const BASE_PATH = config.tiles.urls.localBasePath

// Express middleware for securely fetching Ordnance Survey vector tiles and assets via OAuth2
export function mojOrdnanceSurveyAuth(options: OrdnanceSurveyAuthOptions): Router {
  const isProduction = process.env.NODE_ENV === 'production'
  const vectorBaseUrl = config.tiles.urls.vectorSourceUrl.replace(/\/vts$/, '')
  const vectorRoot = `${vectorBaseUrl}/vts`
  const router = express.Router()

  // Determine cache expiry (use app override or map config default)
  const defaultExpiry = isProduction ? (config.tiles.cacheExpirySeconds ?? 604800) : 0
  const cacheExpiry = typeof options.cacheExpiry === 'number' ? options.cacheExpiry : defaultExpiry
  const cache = cacheExpiry > 0 ? new TileCache({ redisClient: options.redisClient, cacheExpiry }) : undefined

  // Style JSON endpoint
  router.get(`${BASE_PATH}/style`, async (_req, res, next) => {
    try {
      const styleUrl = `${vectorRoot}/resources/styles?srs=${config.tiles.srs}`
      const token = await getAccessToken(options)
      const response = await fetch(styleUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch style JSON (${response.status})`)
      }

      const style = rewriteStyleUrls(await response.json(), BASE_PATH)
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
      const styleUrl = `${vectorRoot}/resources/styles?srs=${config.tiles.srs}`
      const styleResponse = await fetch(styleUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!styleResponse.ok) {
        const text = await styleResponse.text()
        console.error(`[os-auth] Error fetching Ordnance Survey style JSON (${styleResponse.status}): ${text}`)
        return res.status(styleResponse.status).send(text)
      }

      const style = (await styleResponse.json()) as MapboxStyle
      const firstSource = Object.values(style.sources || {})[0]
      if (!firstSource || typeof firstSource.url !== 'string') {
        throw new Error('Could not determine vector source URL from style JSON')
      }

      const sourceUrl = firstSource.url
      console.log('[os-auth] Fetching vector source from:', sourceUrl)

      // Fetch that source directly
      const ordnanceSurveyResponse = await fetch(sourceUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!ordnanceSurveyResponse.ok) {
        const text = await ordnanceSurveyResponse.text()
        console.error(`[os-auth] Vector source fetch failed (${ordnanceSurveyResponse.status}): ${text}`)
        return res.status(ordnanceSurveyResponse.status).send(text)
      }

      // Rewrite tile URLs
      const json = rewriteVectorSource(await ordnanceSurveyResponse.json(), BASE_PATH)

      return res.json(json)
    } catch (err) {
      console.error('[os-auth] Failed to fetch vector source:', err)
      return next(err)
    }
  })

  // Tile endpoint
  router.get(`${BASE_PATH}/tiles/:z/:x/:y.pbf`, async (req, res, next) => {
    const { z, x, y } = req.params
    const srs = req.query.srs || config.tiles.srs
    const token = await getAccessToken(options)
    const url = `${vectorRoot}/tile/${z}/${x}/${y}.pbf?srs=${srs}`
    await fetchFromOrdnanceSurvey(req, res, next, url, token, { cache, cacheKeyPrefix: 'tile' })
  })

  // Assets endpoint (fonts and resources)
  router.get(`${BASE_PATH}/assets/:assetPath(*)`, async (req, res, next) => {
    const assetPath = req.params[0]
    const token = await getAccessToken(options)
    const url = `${vectorRoot}/resources/${assetPath}`
    await fetchFromOrdnanceSurvey(req, res, next, url, token, { cache, cacheKeyPrefix: 'tile' })
  })

  return router
}

export type { CacheClient } from './tile-cache'
