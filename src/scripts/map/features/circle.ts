import { Feature } from 'ol'
import { Circle } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import Position from '../types/position'

const createCircleFeatureFromPosition = (position: Position): Feature<Circle> => {
  return new Feature({
    geometry: new Circle(fromLonLat([position.longitude, position.latitude]), position.precision),
  })
}

const createCircleFeatureCollectionFromPositions = (positions: Array<Position>): Array<Feature<Circle>> => {
  return positions.map(createCircleFeatureFromPosition)
}

export { createCircleFeatureFromPosition, createCircleFeatureCollectionFromPositions }
