import { fromLonLat, transformExtent } from 'ol/proj'

const ukProjectedBounds = [-9.01, 49.75, 2.01, 61.01]
const ukCentre = [-2.547855, 54.00366]

const VITE_OS_MAPS_TILE_URL =
  import.meta.env.VITE_OS_MAPS_TILE_URL ?? 'https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}'
const VITE_OS_MAPS_VECTOR_ROOT = (
  import.meta.env.VITE_OS_MAPS_VECTOR_URL ?? 'https://api.os.uk/maps/vector/v1/vts'
).replace(/\/$/, '')

const config = {
  view: {
    zoom: { min: 5, max: 20 },
    default: {
      zoom: 6,
      extent: transformExtent(ukProjectedBounds, 'EPSG:4326', 'EPSG:3857'),
      centre: fromLonLat(ukCentre),
    },
  },
  tiles: {
    zoom: { min: 7, max: 20 },
    urls: {
      vectorStyleUrl: `${VITE_OS_MAPS_VECTOR_ROOT}/resources/styles?srs=3857`,
      vectorSourceUrl: `${VITE_OS_MAPS_VECTOR_ROOT}`,
      tileUrl: VITE_OS_MAPS_TILE_URL,
    },
    defaultTokenUrl: '/map/token',
  },
}

export default config
