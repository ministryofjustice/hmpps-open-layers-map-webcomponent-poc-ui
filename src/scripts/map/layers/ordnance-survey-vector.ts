import VectorTileLayer from 'ol/layer/VectorTile'
import { applyStyle } from 'ol-mapbox-style'
import { supportsWebGL } from '../../helpers/browser'

export type TileType = 'vector' | 'raster'

export function resolveTileType(requested: string | null): TileType {
  if (requested === 'vector' || requested === 'raster') return requested
  return supportsWebGL() ? 'vector' : 'raster'
}

export class OrdnanceSurveyVectorTileLayer extends VectorTileLayer {
  constructor() {
    super({
      declutter: true,
    })
  }

  async applyVectorStyle(apiKey: string, baseUrl: string): Promise<void> {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const separator = cleanBaseUrl.includes('?') ? '&' : '?'
    const styleUrl = `${cleanBaseUrl}${separator}key=${apiKey}`
    return applyStyle(this, styleUrl)
  }
}
