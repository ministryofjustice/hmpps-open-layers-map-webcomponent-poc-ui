import express, { Request, Response, NextFunction, Router } from 'express'
import superagent from 'superagent'
import qs from 'qs'

type OSMapsToken = {
  access_token: string
  expires_in: string
  issued_at: number
  token_type: string
}

let cachedToken: OSMapsToken | null = null

function isTokenExpired(token: OSMapsToken): boolean {
  const expiryTime = token.issued_at + parseInt(token.expires_in, 10) * 1000
  return Date.now() >= expiryTime - 60_000 // refresh 1 min before expiry
}

async function fetchNewToken(authUrl: string, apiKey: string, apiSecret: string): Promise<OSMapsToken> {
  const response = await superagent
    .post(authUrl)
    .auth(apiKey, apiSecret)
    .set({ 'Content-Type': 'application/x-www-form-urlencoded' })
    .send(qs.stringify({ grant_type: 'client_credentials' }))

  const token = response.body as OSMapsToken
  token.issued_at = Date.now()
  return token
}

export interface MojMapMiddlewareOptions {
  authUrl: string
  apiKey: string
  apiSecret: string
}

export function mojMapMiddleware({ authUrl, apiKey, apiSecret }: MojMapMiddlewareOptions): Router {
  if (!authUrl || !apiKey || !apiSecret) {
    throw new Error('Missing OS Maps credentials. Ensure authUrl, apiKey, and apiSecret are provided.')
  }

  const router = express.Router()

  router.get('/map/token', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!cachedToken || isTokenExpired(cachedToken)) {
        cachedToken = await fetchNewToken(authUrl, apiKey, apiSecret)
      }

      res.json({ access_token: cachedToken.access_token })
    } catch (error) {
      next(error)
    }
  })

  return router
}
