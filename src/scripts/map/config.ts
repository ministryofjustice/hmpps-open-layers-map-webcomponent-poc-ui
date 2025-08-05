import { fromLonLat, transformExtent } from 'ol/proj'

// UK bounding box (approximate for OS tiles)
const ukProjectedBounds = [-9.01, 49.75, 2.01, 61.01]
const ukCenter = [-2.547855, 54.00366]

const config = {
  view: {
    zoom: {
      min: 5,
      max: 20,
    },
    default: {
      zoom: 13,
      extent: transformExtent(ukProjectedBounds, 'EPSG:4326', 'EPSG:3857'),
      center: fromLonLat(ukCenter),
    },
  },
  tiles: {
    zoom: {
      min: 7,
      max: 20,
    },
    urls: {
      vectorStyle: 'https://api.os.uk/maps/vector/v1/vts/resources/styles?srs=3857&key=',
      raster: 'https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}',
    },
    defaultTokenUrl: '/map/token',
  },
}

export default config