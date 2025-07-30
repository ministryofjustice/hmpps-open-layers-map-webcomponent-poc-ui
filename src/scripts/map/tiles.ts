import axios from 'axios'
import TileLayer from 'ol/layer/Tile'
import TileState from 'ol/TileState'
import { XYZ } from 'ol/source'
import { Tile as OlTile } from 'ol'
import ImageTile from 'ol/ImageTile'
import config from './config'

type TileLoadFunction = (tile: OlTile, src: string) => void

export const ordnanceSurveyTileLoader = (token: string): TileLoadFunction => {
  return (tile: OlTile, src: string) => {
    const imageTile = tile as ImageTile

    axios
      .get(src, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      })
      .then(response => {
        const image = imageTile.getImage()

        if (image instanceof HTMLImageElement) {
          const objectUrl = URL.createObjectURL(response.data)
          image.src = objectUrl

          image.onload = () => {
            URL.revokeObjectURL(objectUrl)
          }
        } else {
          imageTile.setState(TileState.ERROR)
        }
      })
      .catch(() => {
        imageTile.setState(TileState.ERROR)
      })
  }
}

export class OrdnanceSurveyTileLayer extends TileLayer<XYZ> {
  constructor(tileUrl: string, token: string) {
    super({
      source: new XYZ({
        minZoom: config.tiles.zoom.min,
        maxZoom: config.tiles.zoom.max,
        url: tileUrl,
        tileLoadFunction: ordnanceSurveyTileLoader(token),
      }),
    })
  }
}
