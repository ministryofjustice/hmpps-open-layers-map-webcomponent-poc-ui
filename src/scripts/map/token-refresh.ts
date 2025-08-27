// helpers/map.ts
export function startTokenRefresh({
  tokenUrl,
  initialExpiresIn,
  onTokenUpdate,
}: {
  tokenUrl: string
  initialExpiresIn: number
  onTokenUpdate: (newToken: string) => void
}): () => void {
  let timer: ReturnType<typeof setTimeout>
  const CHECK_INTERVAL = 30_000
  const MAX_DRIFT = 60_000

  let lastChecked = Date.now()

  const scheduleRefresh = async () => {
    try {
      const { token, expiresIn } = await fetchAccessToken(tokenUrl)
      onTokenUpdate(token)

      const refreshDelay = Math.max((expiresIn - 60) * 1000, 10_000)
      timer = setTimeout(scheduleRefresh, refreshDelay)
      lastChecked = Date.now()
    } catch (err) {
      console.error('Failed to refresh OS access token:', err)
    }
  }

  const initialDelay = Math.max((initialExpiresIn - 60) * 1000, 10_000)
  timer = setTimeout(scheduleRefresh, initialDelay)

  const detectIdleInterval = setInterval(() => {
    const now = Date.now()
    const drift = now - lastChecked
    if (drift > CHECK_INTERVAL + MAX_DRIFT) {
      console.warn('[map] Detected system sleep or long pause. Forcing early token refresh.')
      clearTimeout(timer)
      scheduleRefresh()
    }
    lastChecked = now
  }, CHECK_INTERVAL)

  return () => {
    clearTimeout(timer)
    clearInterval(detectIdleInterval)
  }
}

export async function fetchAccessToken(url: string): Promise<{ token: string; expiresIn: number }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`)
  }

  const { access_token: accessToken, expires_in: initialExpiresIn } = await response.json()

  const expiresIn = Number(initialExpiresIn)
  if (!accessToken || Number.isNaN(expiresIn)) {
    throw new Error(`Invalid access_token or expires_in from token response`)
  }

  return { token: accessToken, expiresIn }
}
