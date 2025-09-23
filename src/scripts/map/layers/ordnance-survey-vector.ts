import VectorTileLayer from 'ol/layer/VectorTile'
import { applyStyle } from 'ol-mapbox-style'
import { supportsWebGL } from '../../helpers/browser'

export type TileType = 'vector' | 'raster'

export function resolveTileType(requested: string | null): TileType {
  if (requested === 'vector' || requested === 'raster') return requested
  return supportsWebGL() ? 'vector' : 'raster'
}

function formatVectorURL(styleBaseUrl: string, apiKey?: string): string {
  const clean = styleBaseUrl.replace(/\/$/, '')
  if (!apiKey) return clean
  const url = new URL(clean, window.location.origin)
  if (!url.searchParams.has('key')) url.searchParams.set('key', apiKey)
  return url.toString()
}

export class OrdnanceSurveyVectorTileLayer extends VectorTileLayer {
  constructor() {
    super({ declutter: true })
  }

  async applyVectorStyle(apiKey: string | undefined, styleBaseUrl: string): Promise<void> {
    return applyStyle(this, formatVectorURL(styleBaseUrl, apiKey))
  }
}
