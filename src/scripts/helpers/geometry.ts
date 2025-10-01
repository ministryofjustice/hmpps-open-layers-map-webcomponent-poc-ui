import { Coordinate } from 'ol/coordinate'

const calculateAngleOfInclination = (start: Coordinate, end: Coordinate): number => {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return Math.atan2(dy, dx)
}

const calculateInterpolatedCoordinate = (start: Coordinate, distance: number, azimuth: number): Coordinate => {
  const dx = distance * Math.sin(azimuth)
  const dy = distance * Math.cos(azimuth)

  return [start[0] + dx, start[1] + dy]
}

export { calculateAngleOfInclination, calculateInterpolatedCoordinate }
