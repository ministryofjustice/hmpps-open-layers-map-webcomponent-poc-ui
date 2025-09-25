import type { FeatureCollection, Feature, Point, LineString } from 'geojson'

export type MDSSPosition = {
  positionId: number
  latitude: number
  longitude: number
  precision: number
  speed: number
  direction: number
  timestamp: string
  geolocationMechanism: 'GPS' | 'RF' | 'LBS' | 'WIFI'
  sequenceNumber: number
}

// Convert MDSS positions into a GeoJSON FeatureCollection.
export function mdssPositionsToGeoJson(positions: MDSSPosition[] | null | undefined): FeatureCollection {
  if (!positions || positions.length === 0) {
    return { type: 'FeatureCollection', features: [] }
  }

  const pointFeatures: Feature<Point>[] = positions.map(pos => ({
    type: 'Feature',
    id: pos.positionId.toString(),
    geometry: {
      type: 'Point',
      coordinates: [pos.longitude, pos.latitude],
    },
    properties: {
      '@id': pos.positionId.toString(),
      confidence: pos.precision,
      speed: pos.speed,
      direction: pos.direction,
      timestamp: pos.timestamp,
      geolocationMechanism: pos.geolocationMechanism,
      sequenceNumber: pos.sequenceNumber,
      type: 'mdss-location',
    },
  }))

  const lineFeatures: Feature<LineString>[] = []
  positions.forEach((current, index) => {
    if (index < positions.length - 1) {
      const next = positions[index + 1]
      lineFeatures.push({
        type: 'Feature',
        id: `${current.positionId}-${next.positionId}`,
        geometry: {
          type: 'LineString',
          coordinates: [
            [current.longitude, current.latitude],
            [next.longitude, next.latitude],
          ],
        },
        properties: {
          '@id': `${current.positionId}-${next.positionId}`,
          direction: current.direction,
          type: 'mdss-line',
        },
      })
    }
  })

  return {
    type: 'FeatureCollection',
    features: [...pointFeatures, ...lineFeatures],
  }
}
