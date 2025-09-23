import type OLMap from 'ol/Map'
import type View from 'ol/View'
import type { Coordinate } from 'ol/coordinate'
import type { MapAdapter } from '../../src/scripts/map/map-adapter'

export default function makeOpenLayersAdapter() {
  const olMapMock = {
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'moveend') {
        handler({})
      }
      return 'mockKey'
    }),
    getView: jest.fn(() => ({ getZoom: () => 5 }) as unknown as View),
  }

  const adapter: MapAdapter = {
    mapLibrary: 'openlayers',
    hostElement: document.createElement('div'),
    project: (lonLat: [number, number]): [number, number] => lonLat,
    unproject: (xy: Coordinate): [number, number] => xy as [number, number],
    openlayers: { map: olMapMock as unknown as OLMap },
  }

  return { adapter, olMapMock }
}
