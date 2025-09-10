import type { FeatureCollection, Feature, Point, LineString } from 'geojson'

export type MDSSPosition = {
  locationRef: number
  point: {
    latitude: number
    longitude: number
  }
  confidenceCircle: number
  speed: number
  direction: number
  timestamp: string
  geolocationMechanism: number
  sequenceNumber: number
}

// Convert MDSS positions into a GeoJSON FeatureCollection.
export function mdssPositionsToGeoJson(positions: MDSSPosition[] | null | undefined): FeatureCollection {
  if (!positions || positions.length === 0) {
    return { type: 'FeatureCollection', features: [] }
  }

  const pointFeatures: Feature<Point>[] = positions.map(pos => ({
    type: 'Feature',
    id: pos.locationRef.toString(),
    geometry: {
      type: 'Point',
      coordinates: [pos.point.longitude, pos.point.latitude],
    },
    properties: {
      '@id': pos.locationRef.toString(),
      confidence: pos.confidenceCircle,
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
        id: `${current.locationRef}-${next.locationRef}`,
        geometry: {
          type: 'LineString',
          coordinates: [
            [current.point.longitude, current.point.latitude],
            [next.point.longitude, next.point.latitude],
          ],
        },
        properties: {
          '@id': `${current.locationRef}-${next.locationRef}`,
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
