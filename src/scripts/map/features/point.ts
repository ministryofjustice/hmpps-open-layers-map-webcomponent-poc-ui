import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import Position from '../types/position'

const createPointFeatureFromPosition = (position: Position): Feature<Point> => {
  return new Feature({
    geometry: new Point(fromLonLat([position.longitude, position.latitude])),
    ...position,
  })
}

const createPointFeatureCollectionFromPositions = (positions: Array<Position>): Array<Feature<Point>> => {
  return positions.map(createPointFeatureFromPosition)
}

export { createPointFeatureFromPosition, createPointFeatureCollectionFromPositions }
