import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature, { FeatureLike } from 'ol/Feature'
import { Coordinate } from 'ol/coordinate'
import { Style } from 'ol/style'
import { LineString } from 'ol/geom'
import { calculateAngleOfInclination, calculateInterpolatedCoordinate } from '../../helpers/geometry'
import LineStyle from '../styles/line'
import { createLineStringFeatureCollectionFromPositions } from '../features/line-string'
import Position from '../types/position'
import ArrowStyle from '../styles/arrow'

const getArrowStyles = (start: Coordinate, rotation: number, magnitude: number, resolution: number): Array<Style> => {
  const baseIntervalDistance = 50

  // As resolution increases (i.e. zoom out), distance between arrows increases
  const adjustedDistance = baseIntervalDistance * resolution

  // As distance between arrows increases, arrow count decreases
  // Always show at least 1 arrow
  const arrowCount = Math.max(Math.floor(magnitude / adjustedDistance), 1)

  // Space the arrows evenly along the line segment
  const spacing = magnitude / (arrowCount + 1)

  return [...Array(arrowCount).keys()].map(
    index =>
      new ArrowStyle(calculateInterpolatedCoordinate(start, spacing * (index + 1), rotation), resolution, rotation),
  )
}

const getLineSegmentStyles = (feature: FeatureLike, resolution: number): Array<Style> => {
  const geometry = (feature as Feature<LineString>).getGeometry()!
  const coordinates = geometry.getCoordinates()
  const magnitude = geometry.getLength()
  const start = coordinates[0]
  const end = coordinates[1]
  const rotation = -calculateAngleOfInclination(start, end) + Math.PI / 2

  return [new LineStyle(resolution), ...getArrowStyles(start, rotation, magnitude, resolution)]
}

export class TrackLinesLayer extends VectorLayer<VectorSource<Feature<LineString>>> {
  constructor(positions: Array<Position>) {
    super({
      source: new VectorSource({ features: createLineStringFeatureCollectionFromPositions(positions) }),
      style: getLineSegmentStyles,
      properties: {
        title: 'trackLinesLayer',
      },
    })
  }
}
