import { Collection, Feature } from 'ol'
import { LineString } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import Position from '../types/position'

const createLineStringFeatureFromPosition = (position: Position, nextPosition: Position): Feature<LineString> => {
  return new Feature({
    geometry: new LineString([
      fromLonLat([position.longitude, position.latitude]),
      fromLonLat([nextPosition.longitude, nextPosition.latitude]),
    ]),
  })
}

const createLineStringFeatureCollectionFromPositions = (
  positions: Array<Position>,
): Collection<Feature<LineString>> => {
  return new Collection(
    positions.reduce(
      (acc, position, index) => {
        if (index !== positions.length - 1) {
          acc.push(createLineStringFeatureFromPosition(position, positions[index + 1]))
        }
        return acc
      },
      [] as Array<Feature<LineString>>,
    ),
  )
}

export { createLineStringFeatureFromPosition, createLineStringFeatureCollectionFromPositions }
