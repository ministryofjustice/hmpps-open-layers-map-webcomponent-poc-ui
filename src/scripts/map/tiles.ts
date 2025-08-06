import BaseLayer from 'ol/layer/Base'
import TileLayer from 'ol/layer/Tile'
import VectorTileLayer from 'ol/layer/VectorTile'
import { XYZ } from 'ol/source'
import TileState from 'ol/TileState'
import { Tile as OlTile } from 'ol'
import ImageTile from 'ol/ImageTile'
import { applyStyle } from 'ol-mapbox-style'
import axios from 'axios'
import config from './config'
import { supportsWebGL } from '../helpers/browser'

type TileType = 'vector' | 'raster'

export const ordnanceSurveyImageTileLoader = (token: string) => {
  return (tile: OlTile, src: string) => {
    const imageTile = tile as ImageTile
    axios
      .get(src, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      .then(response => {
        const image = imageTile.getImage()
        if (image instanceof HTMLImageElement) {
          const url = URL.createObjectURL(response.data)
          image.src = url
          image.onload = () => URL.revokeObjectURL(url)
        } else {
          imageTile.setState(TileState.ERROR)
        }
      })
      .catch(() => {
        imageTile.setState(TileState.ERROR)
      })
  }
}

export function isImageTileLayer(layer: BaseLayer): layer is OrdnanceSurveyImageTileLayer {
  return layer instanceof OrdnanceSurveyImageTileLayer
}

export function resolveTileType(requested: string | null): TileType {
  if (requested === 'vector' || requested === 'raster') return requested
  return supportsWebGL() ? 'vector' : 'raster'
}

export class OrdnanceSurveyImageTileLayer extends TileLayer<XYZ> {
  constructor(tileUrl: string, token: string) {
    super({
      source: new XYZ({
        minZoom: config.tiles.zoom.min,
        maxZoom: config.tiles.zoom.max,
        url: tileUrl,
        tileLoadFunction: ordnanceSurveyImageTileLoader(token),
      }),
    })
  }

  updateToken(newToken: string) {
    const source = this.getSource()
    if (source) {
      source.setTileLoadFunction(ordnanceSurveyImageTileLoader(newToken))
      source.refresh()
    }
  }
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

