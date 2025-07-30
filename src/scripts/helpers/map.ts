// OS map tokens expire after a period so refresh the token a minute before expiry
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
  let detectIdleInterval: ReturnType<typeof setInterval>
  const CHECK_INTERVAL = 30_000 
  const MAX_DRIFT = 60_000 // If system clock jumps more than 1 minute, trigger early refresh

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

  // Schedule first refresh from initial token
  const initialDelay = Math.max((initialExpiresIn - 60) * 1000, 10_000)
  timer = setTimeout(scheduleRefresh, initialDelay)

  // Detect if laptop was asleep or tab suspended or another reason for JS timer drift
  detectIdleInterval = setInterval(() => {
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

// Fetch a token and its expiry from the token service.
export async function fetchAccessToken(url: string): Promise<{ token: string, expiresIn: number }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`)
  }

  const { access_token, expires_in } = await response.json()

  const expiresIn = Number(expires_in)
  if (!access_token || isNaN(expiresIn)) {
    throw new Error(`Invalid access_token or expires_in from token response`)
  }

  return { token: access_token, expiresIn }
}
