import express, { Request, Response, NextFunction, Router } from 'express'
import superagent from 'superagent'
import qs from 'qs'
import dotenv from 'dotenv'

dotenv.config()

type OSMapsToken = {
  access_token: string
  expires_in: string
  issued_at: number
  token_type: string
}

let cachedToken: OSMapsToken | null = null

function isTokenExpired(token: OSMapsToken): boolean {
  const expiryTime = token.issued_at + parseInt(token.expires_in, 10) * 1000
  return Date.now() >= expiryTime - 60_000
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

export function mojMapMiddleware(): Router {
  const authUrl = process.env.OS_MAPS_AUTH_URL
  const apiKey = process.env.OS_MAPS_API_KEY
  const apiSecret = process.env.OS_MAPS_API_SECRET

  if (!authUrl || !apiKey || !apiSecret) {
    throw new Error(
      'Missing OS Maps credentials. Ensure OS_MAPS_AUTH_URL, OS_MAPS_API_KEY, and OS_MAPS_API_SECRET are set.'
    )
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
