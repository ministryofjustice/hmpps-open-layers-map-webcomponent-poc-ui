import ImageTile from 'ol/ImageTile'
import TileState from 'ol/TileState'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeoJSON from 'ol/format/GeoJSON'
import axios from 'axios'

export async function ordnanceTileLoader(tile: ImageTile, src: string, accessToken: string): Promise<void> {
  try {
    const response = await axios.get(src, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'blob',
    })

    const blob = response.data
    const image = tile.getImage?.()
    if (image instanceof HTMLImageElement) {
      const url = URL.createObjectURL(blob)
      image.src = url
      image.onload = () => {
        URL.revokeObjectURL(url)
      }
    } else {
      tile.setState(TileState.ERROR)
    }
  } catch (error) {
    console.error('Tile load error (axios):', error)
    tile.setState(TileState.ERROR)
  }
}

export function parseGeoJSON(data: string): VectorSource<Feature<Geometry>> {
  const features = new GeoJSON().readFeatures(JSON.parse(data), {
    featureProjection: 'EPSG:3857',
  })

  return new VectorSource<Feature<Geometry>>({
    features,
  })
}

export async function fetchAccessToken(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`)
  }

  const { access_token } = await response.json()
  if (!access_token) {
    throw new Error(`No access_token returned from ${url}`)
  }

  return access_token
}

