import crypto from 'crypto'

export interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { EX?: number }): Promise<void | string | null>
  connect?(): Promise<void | CacheClient>
}

// Optional shared cache for OS resources (tiles, styles, glyphs, sprites).
export class TileCache {
  private readonly client?: CacheClient

  private readonly cacheExpiry: number

  constructor(options: { redisClient?: CacheClient; cacheExpiry?: number } = {}) {
    this.client = options.redisClient
    this.cacheExpiry = typeof options.cacheExpiry === 'number' ? options.cacheExpiry : 600
  }

  // Retrieve a cached Buffer by key (tile URL, style URL, etc).
  async get(key: string): Promise<Buffer | null> {
    if (!this.client) return null
    try {
      const base64 = await this.client.get(key)
      if (!base64) return null
      return Buffer.from(base64, 'base64')
    } catch {
      return null
    }
  }

  // Store a Buffer in the cache with cacheExpiry.
  async set(key: string, value: Buffer): Promise<void> {
    if (!this.client) return
    try {
      const base64 = value.toString('base64')
      await this.client.set(key, base64, { EX: this.cacheExpiry })
    } catch {
      // Graceful fallback
    }
  }

  // Expose cache expiry (used for setting Cache-Control headers).
  get expiry(): number {
    return this.cacheExpiry
  }
}

// Generate a strong ETag for a Buffer. Use the same function for styles, tiles, fonts, etc.
export function generateEtag(buffer: Buffer): string {
  return crypto.createHash('sha1').update(buffer).digest('hex')
}
