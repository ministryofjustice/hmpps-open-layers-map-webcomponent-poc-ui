import type { Request, Response, NextFunction } from 'express'
import { TileCache, generateEtag } from './tile-cache'

function getMimeTypeFromUrl(url: string): string | undefined {
  if (url.endsWith('.pbf')) return 'application/x-protobuf'
  if (url.endsWith('.json')) return 'application/json'
  if (url.endsWith('.png')) return 'image/png'
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg'
  if (url.endsWith('.mvt')) return 'application/vnd.mapbox-vector-tile'
  return undefined
}

// Helper to securely fetch requests to the Ordnance Survey Maps API.
export async function fetchFromOrdnanceSurvey(
  req: Request,
  res: Response,
  next: NextFunction,
  ordnanceSurveyApiUrl: string,
  accessToken: string,
  options?: { cache?: TileCache; cacheKeyPrefix?: string },
) {
  try {
    const cache = options?.cache
    const prefix = options?.cacheKeyPrefix

    // Try cache first (if provided)
    if (cache && prefix) {
      const cacheKey = `${prefix}:${ordnanceSurveyApiUrl}`
      const cached = await cache.get(cacheKey)
      if (cached) {
        const etag = generateEtag(cached)
        if (req.headers['if-none-match'] === etag) {
          res.status(304).end()
          return
        }
        const fallbackType = getMimeTypeFromUrl(ordnanceSurveyApiUrl)
        if (fallbackType) res.setHeader('Content-Type', fallbackType)
        res.setHeader('ETag', etag)
        res.setHeader('Cache-Control', `public, max-age=${cache.expiry}`)
        res.status(200).send(cached)
        return
      }
    }

    const ordnanceSurveyResponse = await fetch(ordnanceSurveyApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!ordnanceSurveyResponse.ok) {
      throw new Error(
        `[os-auth] Ordnance Survey request failed: ${ordnanceSurveyResponse.status} ${ordnanceSurveyResponse.statusText}`,
      )
    }

    // Preserve correct content type (JSON, PBF, etc.)
    const responseContentType =
      ordnanceSurveyResponse.headers.get('content-type') ||
      getMimeTypeFromUrl(ordnanceSurveyApiUrl) ||
      'application/octet-stream'
    res.setHeader('Content-Type', responseContentType)

    const buffer = Buffer.from(await ordnanceSurveyResponse.arrayBuffer())

    // Optionally cache the new response
    if (cache && prefix) {
      const cacheKey = `${prefix}:${ordnanceSurveyApiUrl}`
      await cache.set(cacheKey, buffer)
      const etag = generateEtag(buffer)
      res.setHeader('ETag', etag)
      res.setHeader('Cache-Control', `public, max-age=${cache.expiry}`)
    }

    res.send(buffer)
  } catch (err) {
    console.error('[os-auth] Error fetching Ordnance Survey request:', err)
    next(err)
  }
}
