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
    const styleUrl = `${baseUrl.replace(/\/$/, '')}/resources/styles?srs=3857&key=${apiKey}`
    return applyStyle(this, styleUrl)
  }
}
