import config from '../map/config'
import type { CachedToken, OrdnanceSurveyAuthOptions } from './index'

let cachedToken: CachedToken | null = null

// Check if the token is expired or about to expire (within 60 seconds)
export function isTokenExpired(token: { issued_at: number; expires_in: number }): boolean {
  const expiryTime = token.issued_at + token.expires_in * 1000
  return Date.now() >= expiryTime - 60_000
}

// Fetch a new OAuth2 access token from Ordnance Survey
async function fetchNewToken(apiKey: string, apiSecret: string) {
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

  const token = await res.json()
  token.issued_at = Date.now()
  return token
}

// Get a valid OS access token, refreshing if expired
export async function getAccessToken(options: OrdnanceSurveyAuthOptions): Promise<string> {
  const { apiKey, apiSecret } = options
  if (!cachedToken || isTokenExpired(cachedToken)) {
    cachedToken = await fetchNewToken(apiKey, apiSecret)
  }
  return cachedToken!.access_token
}
