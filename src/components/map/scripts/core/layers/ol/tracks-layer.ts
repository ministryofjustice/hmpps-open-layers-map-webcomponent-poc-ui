import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature, { FeatureLike } from 'ol/Feature'
import { Coordinate } from 'ol/coordinate'
import { Style } from 'ol/style'
import { LineString } from 'ol/geom'
import { fromLonLat } from 'ol/proj'

import {
  bearingToVector,
  calculateAngleOfInclination,
  calculateInterpolatedCoordinate,
  isCoordinateWithinDistance,
  extendCoordinate,
  normalise,
  getNumericProperty,
  toCoordinate,
} from '../../../helpers/geometry'
import LineStyle from '../../styles/line'
import { createLineStringFeatureCollectionFromPositions } from '../../features/line-string'
import { createGeodesicCirclePolygon } from '../../features/circle'
import { Position } from '../../types/position'
import ArrowStyle from '../../styles/arrow'

type DirectionUnits = 'degrees' | 'radians'

// Used to look up a numeric bearing/direction value on a Position. Can be a string or an
// object with distinct entry and exit property names for single point edge-cases.
type DirectionProperty = string | { entry?: string; exit?: string }

const resolveDirectionProperty = (
  property: DirectionProperty | undefined,
  end: 'entry' | 'exit',
): string | undefined => (typeof property === 'string' || property === undefined ? property : property[end])

type OLTracksLayerStyle = {
  stroke: {
    color: string
    lineDash?: number[]
  }
}

export type SegmentStyleContext = {
  positions: [Position, Position]
}

export type SegmentStyleResult = {
  stroke?: {
    lineDash?: number[]
    color?: string
  }
}

type OLTracksLayerOptions = {
  positions: Array<Position>
  style?: OLTracksLayerStyle
  title: string
  visible?: boolean
  zIndex?: number
  avoidPositions?: Array<Position>
  segmentStyle?: (context: SegmentStyleContext) => SegmentStyleResult
  entryExit?: {
    enabled?: boolean
    extensionDistanceMeters?: number
    direction?: {
      property?: DirectionProperty // e.g. "direction" or { entry: "entryBearing", exit: "exitBearing" }
      units?: DirectionUnits
    }
    centre?: [number, number]
    radiusMeters?: number
  }
}

const ARROW_COLLISION_DISTANCE = 20 // map units (adjust to match marker radius / precision)
const ARROW_SIZE_PX = 10
const MIN_SEGMENT_RENDERED_PX = 3 * ARROW_SIZE_PX // must have a least one arrow size either side to render arrows

/**
 * Entry rules:
 * - If direction.property is set AND first point has a numeric direction, use first point direction, reversed
 * - Otherwise fallback to first segment direction, reversed
 * - If only one point: fallback to entry from the North West 315°
 */
const getEntryVector = (
  positions: Position[],
  directionProperty?: string,
  directionUnits: DirectionUnits = 'degrees',
): [number, number] | null => {
  const position1 = positions[0]
  if (!position1) return null

  const directionValue = getNumericProperty(position1, directionProperty)

  // Use direction if available
  if (typeof directionValue === 'number') {
    const directionVector = bearingToVector(directionValue, directionUnits)
    return [-directionVector[0], -directionVector[1]]
  }

  // Fallback to line direction between points if possible
  const position2 = positions[1]
  if (position2) {
    const coordinate1 = toCoordinate(position1)
    const coordinate2 = toCoordinate(position2)
    const segmentVector = normalise(coordinate2[0] - coordinate1[0], coordinate2[1] - coordinate1[1])
    return segmentVector ? [-segmentVector[0], -segmentVector[1]] : null
  }

  // Fallback for single point
  const fallback = bearingToVector(315, directionUnits)
  return [-fallback[0], -fallback[1]]
}

/**
 * Exit rules:
 * - If direction.property is set AND last point has a numeric direction:
 *   use last point direction as-is
 * - Otherwise fallback to last segment direction
 * - If only one point: fallback to exit from the North East 45°
 */
const getExitVector = (
  positions: Position[],
  directionProperty?: string,
  directionUnits: DirectionUnits = 'degrees',
): [number, number] | null => {
  const pos = positions[positions.length - 1]
  if (!pos) return null

  const directionValue = getNumericProperty(pos, directionProperty)

  // Use direction if available
  if (typeof directionValue === 'number') {
    return bearingToVector(directionValue, directionUnits)
  }

  // Fallback to geometry if possible
  const position1 = positions[positions.length - 2]
  if (position1) {
    const coordinate1 = toCoordinate(position1)
    const coordinate2 = toCoordinate(pos)
    return normalise(coordinate2[0] - coordinate1[0], coordinate2[1] - coordinate1[1])
  }

  // fallback for single point
  return bearingToVector(45, directionUnits)
}

const getRaySegmentIntersectionDistance = (
  origin: Coordinate,
  direction: [number, number],
  segmentStart: Coordinate,
  segmentEnd: Coordinate,
): number | null => {
  const segmentX = segmentEnd[0] - segmentStart[0]
  const segmentY = segmentEnd[1] - segmentStart[1]
  const determinant = direction[0] * segmentY - direction[1] * segmentX

  if (Math.abs(determinant) < Number.EPSILON) {
    return null
  }

  const offsetX = segmentStart[0] - origin[0]
  const offsetY = segmentStart[1] - origin[1]

  const rayDistance = (offsetX * segmentY - offsetY * segmentX) / determinant
  const segmentDistance = (offsetX * direction[1] - offsetY * direction[0]) / determinant

  if (rayDistance < 0 || segmentDistance < 0 || segmentDistance > 1) {
    return null
  }

  return rayDistance
}

const extendBeyondPolygonBoundary = (
  coord: Coordinate,
  direction: [number, number],
  boundary: Coordinate[],
  extensionMeters: number,
): Coordinate => {
  const boundarySegments = boundary.slice(0, -1)
  const closestIntersectionDistance = boundarySegments.reduce<number | null>((closest, segmentStart, index) => {
    const segmentEnd = boundary[index + 1]
    const intersectionDistance = getRaySegmentIntersectionDistance(coord, direction, segmentStart, segmentEnd)

    if (intersectionDistance === null) {
      return closest
    }

    if (closest === null || intersectionDistance < closest) {
      return intersectionDistance
    }

    return closest
  }, null)

  if (closestIntersectionDistance === null) {
    return extendCoordinate(coord, direction, extensionMeters)
  }

  const intersection: Coordinate = [
    coord[0] + direction[0] * closestIntersectionDistance,
    coord[1] + direction[1] * closestIntersectionDistance,
  ]

  return extendCoordinate(intersection, direction, extensionMeters)
}

/**
 * Extends a point in a given direction until it exits a geodesic perimeter,
 * then continues a bit further.
 *
 * Steps:
 * 1. Treat the direction as a ray starting from `coord`
 * 2. Find where that ray intersects the perimeter boundary
 * 3. Move to that boundary point, then extend beyond it
 *
 * If no intersection is found, just extend normally.
 */
const extendBeyondCircle = (
  coord: Coordinate,
  direction: [number, number],
  centre: [number, number],
  radiusMeters: number,
  extensionMeters: number,
): Coordinate => {
  const boundary = createGeodesicCirclePolygon(centre, radiusMeters).getCoordinates()[0]

  return extendBeyondPolygonBoundary(coord, direction, boundary, extensionMeters)
}

// Apply entry/exit line extensions
const applyEntryExitToFeatures = (
  features: Feature<LineString>[],
  positions: Position[],
  options?: OLTracksLayerOptions['entryExit'],
) => {
  if (!options?.enabled || !positions.length || !features.length) return

  const extensionDistance = options.extensionDistanceMeters ?? 50
  const entryProperty = resolveDirectionProperty(options.direction?.property, 'entry')
  const exitProperty = resolveDirectionProperty(options.direction?.property, 'exit')
  const directionUnits = options.direction?.units ?? 'degrees'

  const entryVector = getEntryVector(positions, entryProperty, directionUnits)
  const exitVector = getExitVector(positions, exitProperty, directionUnits)

  const centreCoordinates = options.centre
  const radius = options.radiusMeters

  const firstGeom = features[0].getGeometry()
  if (entryVector && firstGeom) {
    const coords = firstGeom.getCoordinates()
    const first = coords[0]

    const entry =
      centreCoordinates && radius !== undefined
        ? extendBeyondCircle(first, entryVector, centreCoordinates, radius, extensionDistance)
        : extendCoordinate(first, entryVector, extensionDistance)

    features.unshift(
      new Feature({
        geometry: new LineString([entry, first]),
      }),
    )
  }

  const lastFeature = features[features.length - 1]
  const lastGeom = lastFeature.getGeometry()
  if (exitVector && lastGeom) {
    const coords = lastGeom.getCoordinates()
    const last = coords[coords.length - 1]

    const exit =
      centreCoordinates && radius !== undefined
        ? extendBeyondCircle(last, exitVector, centreCoordinates, radius, extensionDistance)
        : extendCoordinate(last, exitVector, extensionDistance)

    features.push(
      new Feature({
        geometry: new LineString([last, exit]),
      }),
    )
  }
}

const getArrowStyles = (
  start: Coordinate,
  rotation: number,
  magnitude: number,
  resolution: number,
  avoidCoordinates?: Array<Coordinate>,
): Array<Style> => {
  // Skip arrows for very short segments
  const minSegmentLength = MIN_SEGMENT_RENDERED_PX * resolution
  if (magnitude < minSegmentLength) {
    return []
  }

  const baseIntervalDistance = 50

  // As resolution increases (i.e. zoom out), distance between arrows increases
  const adjustedDistance = baseIntervalDistance * resolution

  // As distance between arrows increases, arrow count decreases
  // Always show at least 1 arrow unless the segment is extremely short
  const arrowCount = Math.max(Math.floor(magnitude / adjustedDistance), 1)

  // Space the arrows evenly along the line segment
  const spacing = magnitude / (arrowCount + 1)

  // If spacing < arrow size, skip arrows to maintain endpoint margins
  if (spacing < ARROW_SIZE_PX * resolution) {
    return []
  }

  const adjustedCollisionDistance = ARROW_COLLISION_DISTANCE * resolution

  return [...Array(arrowCount).keys()].reduce<Style[]>((acc, i) => {
    const coord = calculateInterpolatedCoordinate(start, spacing * (i + 1), rotation)

    if (avoidCoordinates?.length && isCoordinateWithinDistance(coord, avoidCoordinates, adjustedCollisionDistance)) {
      return acc
    }

    acc.push(new ArrowStyle(coord, resolution, rotation))
    return acc
  }, [])
}

const createStyleFunction =
  (
    style: OLTracksLayerStyle,
    segmentStyle?: (ctx: SegmentStyleContext) => SegmentStyleResult,
    avoidCoordinates?: Array<Coordinate>,
  ) =>
  (feature: FeatureLike, resolution: number): Array<Style> => {
    const geometry = (feature as Feature<LineString>).getGeometry()!
    const coords = geometry.getCoordinates()
    const magnitude = geometry.getLength()
    const start = coords[0]
    const end = coords[1]
    const rotation = -calculateAngleOfInclination(start, end) + Math.PI / 2

    let { lineDash } = style.stroke
    let { color } = style.stroke

    if (segmentStyle) {
      const from = (feature as Feature).get('fromPosition') as Position
      const to = (feature as Feature).get('toPosition') as Position
      const result = segmentStyle({ positions: [from, to] })
      lineDash = result.stroke?.lineDash ?? lineDash
      color = result.stroke?.color ?? color
    }

    return [
      new LineStyle(color, resolution, lineDash),
      ...getArrowStyles(start, rotation, magnitude, resolution, avoidCoordinates),
    ]
  }

const DEFAULT_VISIBILITY = false
const DEFAULT_STYLE: OLTracksLayerStyle = {
  stroke: { color: 'black' },
}

export class OLTracksLayer extends VectorLayer<VectorSource<Feature<LineString>>> {
  constructor({
    positions,
    style = DEFAULT_STYLE,
    title,
    visible = DEFAULT_VISIBILITY,
    zIndex,
    avoidPositions,
    entryExit,
    segmentStyle,
  }: OLTracksLayerOptions) {
    // If avoidPositions array has been passed, merge with position data
    const allPositions = [...positions, ...(avoidPositions ?? [])]

    // Existing positions could have been duplicated in avoidPositions, so remove duplicates
    const uniquePositions = Array.from(
      new Map(allPositions.map(position => [`${position.longitude},${position.latitude}`, position])).values(),
    )

    const isProjectedCoordinate = (lon: number, lat: number) => Math.abs(lon) > 180 || Math.abs(lat) > 90

    const avoid = uniquePositions.map(position =>
      isProjectedCoordinate(position.longitude, position.latitude)
        ? [position.longitude, position.latitude]
        : fromLonLat([position.longitude, position.latitude]),
    )

    const featureCollection = createLineStringFeatureCollectionFromPositions(positions)
    const features = featureCollection.getArray()

    applyEntryExitToFeatures(features, positions, entryExit)

    super({
      properties: { title },
      source: new VectorSource({ features }),
      style: createStyleFunction(style, segmentStyle, avoid),
      visible,
      zIndex,
    })
  }
}

export { getEntryVector, getExitVector, extendBeyondCircle, applyEntryExitToFeatures }
