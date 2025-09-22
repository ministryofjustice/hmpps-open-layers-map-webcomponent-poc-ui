import type { FeatureCollection } from 'geojson'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import type Feature from 'ol/Feature'
import type Geometry from 'ol/geom/Geometry'
import { Style } from 'ol/style'
import { LocationsLayer } from './locations-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'

type OLVecSrc = VectorSource<Feature<Geometry>>
type OLVecLayer = VectorLayer<OLVecSrc>

const sampleGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 1 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-2.1, 53.5] }, properties: { id: 2 } },
  ],
}

describe('LocationLayer (OpenLayers library)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ignores non-Point features in a mixed FeatureCollection', () => {
    const mixed: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: {},
        },
      ],
    }

    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LocationsLayer({ geoJson: mixed, id: 'locations' })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    const source = added.getSource() as OLVecSrc
    expect(source.getFeatures().length).toBe(1)
  })

  it('attaches a VectorLayer with expected properties and features', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LocationsLayer({ geoJson: sampleGeoJson, id: 'locations', title: 'Locations' })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added).toBeInstanceOf(VectorLayer)

    const source = added.getSource() as OLVecSrc
    expect(source).toBeInstanceOf(VectorSource)
    expect(source.getFeatures().length).toBe(2)

    expect(added.get('title')).toBe('Locations')

    const style = added.getStyle()
    expect(style).toBeInstanceOf(Style)
  })

  it('respects placement options: visible=false and zIndex', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LocationsLayer({ geoJson: sampleGeoJson, id: 'locations' })

    layer.attach(adapter, { visible: false, zIndex: 10 })

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added.getVisible()).toBe(false)
    expect(added.getZIndex()).toBe(10)
  })

  it('detaches by removing the same VectorLayer from the map', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LocationsLayer({ geoJson: sampleGeoJson, id: 'locations' })

    layer.attach(adapter)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledTimes(1)
    const removed = olMapMock.removeLayer.mock.calls[0][0]
    expect(removed).toBe(added)
  })

  it('applies custom circle style location options', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LocationsLayer({
      geoJson: sampleGeoJson,
      id: 'locations',
      style: { radius: 8, fill: '#0b0c0c', stroke: { color: '#ffffff', width: 1 } },
    })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    const style = added.getStyle() as Style
    expect(style).toBeInstanceOf(Style)
    expect(style.getImage()).toBeDefined()
  })
})
