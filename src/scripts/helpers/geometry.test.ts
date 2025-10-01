import { Coordinate } from 'ol/coordinate'
import { calculateAngleOfInclination, calculateInterpolatedCoordinate } from './geometry'

describe('geometry', () => {
  describe('calculateInterpolatedCoordinate', () => {
    it.each([
      ['North', [10, 5], 5, 0, [10, 10]],
      ['East', [10, 5], 5, Math.PI / 2, [15, 5]],
      ['South', [10, 5], 5, Math.PI, [10, 0]],
      ['West', [10, 5], 5, (3 * Math.PI) / 2, [5, 5]],
      ['Zero distance', [10, 5], 0, Math.PI / 6, [10, 5]],
    ])(
      '[%s] calculateInterpolatedCoordinate(%s, %s, %s)',
      (_: string, coord: Coordinate, distance: number, azimuth: number, expected: Coordinate) => {
        const actual = calculateInterpolatedCoordinate(coord, distance, azimuth)

        expect(actual[0]).toBeCloseTo(expected[0])
        expect(actual[1]).toBeCloseTo(expected[1])
      },
    )
  })

  describe('calculateAngleOfInclination', () => {
    it.each([
      ['North', [5, 5], [5, 10], Math.PI / 2],
      ['East', [5, 5], [10, 5], 0],
      ['South', [5, 5], [5, 0], -Math.PI / 2],
      ['East', [5, 5], [0, 5], Math.PI],
    ])(
      '[%s] calculateAngleOfInclination(%s, %s, %s)',
      (_: string, start: Coordinate, end: Coordinate, expected: number) => {
        expect(calculateAngleOfInclination(start, end)).toBeCloseTo(expected)
      },
    )
  })
})
