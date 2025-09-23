import Map from 'ol/Map'
import View from 'ol/View'
import { createOpenLayersAdapter } from './map-adapter'

describe('createOpenLayersAdapter', () => {
  let map: Map

  beforeEach(() => {
    map = new Map({ view: new View({ center: [0, 0], zoom: 1 }) })
  })

  it('should return an adapter with mapLibrary set to openlayers', () => {
    const adapter = createOpenLayersAdapter(document.createElement('div'), map)
    expect(adapter.mapLibrary).toBe('openlayers')
  })

  it('should expose the OpenLayers map instance', () => {
    const adapter = createOpenLayersAdapter(document.createElement('div'), map)
    expect(adapter.openlayers?.map).toBe(map)
  })

  it('should project lon/lat to map coords', () => {
    const adapter = createOpenLayersAdapter(document.createElement('div'), map)
    const [x, y] = adapter.project([0, 0])
    // EPSG:3857 projection puts lon=0, lat=0 at 0,0
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  it('should unproject map coords to lon/lat', () => {
    const adapter = createOpenLayersAdapter(document.createElement('div'), map)
    const [lon, lat] = adapter.unproject([0, 0])
    expect(lon).toBeCloseTo(0)
    expect(lat).toBeCloseTo(0)
  })

  it('should round-trip project/unproject', () => {
    const adapter = createOpenLayersAdapter(document.createElement('div'), map)
    const lonLat: [number, number] = [-0.1, 51.5]
    const coords = adapter.project(lonLat)
    const roundTrip = adapter.unproject(coords)
    expect(roundTrip[0]).toBeCloseTo(lonLat[0], 6)
    expect(roundTrip[1]).toBeCloseTo(lonLat[1], 6)
  })
})
