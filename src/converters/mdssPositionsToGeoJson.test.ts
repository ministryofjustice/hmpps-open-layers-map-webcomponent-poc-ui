import type { FeatureCollection, Feature, Point, LineString } from 'geojson'
import { mdssPositionsToGeoJson, MDSSPosition } from './mdssPositionsToGeoJson'

describe('mdssPositionsToGeoJson', () => {
  const positions: MDSSPosition[] = [
    {
      positionId: 1,
      latitude: 51.5,
      longitude: -0.1,
      precision: 30,
      speed: 5,
      direction: 1.2,
      timestamp: '2025-01-01T12:00:00Z',
      geolocationMechanism: 'GPS',
      sequenceNumber: 1,
    },
    {
      positionId: 2,
      latitude: 51.6,
      longitude: -0.2,
      precision: 40,
      speed: 10,
      direction: 2.3,
      timestamp: '2025-01-01T12:05:00Z',
      geolocationMechanism: 'GPS',
      sequenceNumber: 2,
    },
    {
      positionId: 3,
      latitude: 51.7,
      longitude: -0.3,
      precision: 50,
      speed: 15,
      direction: 3.4,
      timestamp: '2025-01-01T12:10:00Z',
      geolocationMechanism: 'GPS',
      sequenceNumber: 3,
    },
  ]

  it('converts positions to a FeatureCollection with points and lines', () => {
    const geoJson: FeatureCollection = mdssPositionsToGeoJson(positions)

    expect(geoJson.type).toBe('FeatureCollection')
    expect(Array.isArray(geoJson.features)).toBe(true)

    // Point features
    const pointFeatures = geoJson.features.filter(feature => feature.geometry.type === 'Point') as Feature<Point>[]
    expect(pointFeatures).toHaveLength(3)
    expect(pointFeatures[0].id).toBe('1')
    expect(pointFeatures[0].geometry.coordinates).toEqual([-0.1, 51.5])
    expect(pointFeatures[0].properties?.type).toBe('mdss-location')

    // Line features
    const lineFeatures = geoJson.features.filter(
      feature => feature.geometry.type === 'LineString',
    ) as Feature<LineString>[]
    expect(lineFeatures).toHaveLength(2)
    expect(lineFeatures[0].id).toBe('1-2')
    expect(lineFeatures[1].id).toBe('2-3')
    expect(lineFeatures[0].properties?.type).toBe('mdss-line')
  })

  it('creates one less line than points', () => {
    const geoJson = mdssPositionsToGeoJson(positions)
    const points = geoJson.features.filter(feature => feature.geometry.type === 'Point')
    const lines = geoJson.features.filter(feature => feature.geometry.type === 'LineString')

    expect(points.length).toBe(3)
    expect(lines.length).toBe(2)
  })

  it('returns an empty FeatureCollection for an empty array', () => {
    const geoJson = mdssPositionsToGeoJson([])
    expect(geoJson).toEqual({ type: 'FeatureCollection', features: [] })
  })

  it('returns an empty FeatureCollection for null or undefined', () => {
    expect(mdssPositionsToGeoJson(null)).toEqual({ type: 'FeatureCollection', features: [] })
    expect(mdssPositionsToGeoJson(undefined)).toEqual({ type: 'FeatureCollection', features: [] })
  })
})
