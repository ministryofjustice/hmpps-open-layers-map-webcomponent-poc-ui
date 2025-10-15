import { fromLonLat, transformExtent } from 'ol/proj'

// UK projected extent and centre
const ukProjectedBounds = [-9.01, 49.75, 2.01, 61.01]
const ukCentre = [-2.547855, 54.00366]

const authUrl = import.meta.env.VITE_OS_MAPS_AUTH_URL || 'https://api.os.uk/oauth2/token/v1'
const OS_MAPS_VECTOR_BASE_URL = import.meta.env.VITE_OS_MAPS_VECTOR_BASE_URL || 'https://api.os.uk/maps/vector/v1'
const vectorRoot = `${OS_MAPS_VECTOR_BASE_URL.replace(/\/$/, '')}/vts`
const localBasePath = '/os-map/vector'

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
    srs: '3857',
    zoom: { min: 7, max: 20 },
    urls: {
      authUrl,
      localBasePath,
      localVectorStyleUrl: `${localBasePath}/style`,
      vectorStyleUrl: `${vectorRoot}/resources/styles?srs=3857`,
      vectorSourceUrl: vectorRoot,
    },
    cacheExpirySeconds: 604800, // 7 days
  },
}

export default config
