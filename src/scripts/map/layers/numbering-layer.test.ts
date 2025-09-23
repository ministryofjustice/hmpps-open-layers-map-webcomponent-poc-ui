import type { FeatureCollection } from 'geojson'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Text } from 'ol/style'
import type Feature from 'ol/Feature'
import type Geometry from 'ol/geom/Geometry'
import { NumberingLayer } from './numbering-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'

type OLVecSource = VectorSource<Feature<Geometry>>
type OLVecLayer = VectorLayer<OLVecSource>

const sampleGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { sequenceNumber: 1 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 10] },
      properties: { sequenceNumber: 2 },
    },
  ],
}

describe('NumberingLayer (OpenLayers library)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attaches a VectorLayer with text styles from the numberProperty', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new NumberingLayer({ geoJson: sampleGeoJson, id: 'numbering' })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added).toBeInstanceOf(VectorLayer)

    const source = added.getSource() as OLVecSource
    expect(source.getFeatures().length).toBe(2)

    const styleFn = added.getStyle() as (f: Feature<Geometry>) => Style | undefined
    const first = source.getFeatures()[0]
    const style = styleFn(first)!
    expect(style).toBeInstanceOf(Style)
    expect(style.getText()).toBeInstanceOf(Text)
    expect(style.getText()?.getText()).toBe('1')
  })

  it('respects visible=false and zIndex from options', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new NumberingLayer({ geoJson: sampleGeoJson, visible: false, zIndex: 42 })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added.getVisible()).toBe(false)
    expect(added.getZIndex()).toBe(42)
  })

  it('uses custom numberProperty when provided', () => {
    const customGeoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { label: 'A' } }],
    }
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new NumberingLayer({ geoJson: customGeoJson, numberProperty: 'label' })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    const source = added.getSource() as OLVecSource
    const styleFn = added.getStyle() as (f: Feature<Geometry>) => Style | undefined
    const style = styleFn(source.getFeatures()[0])!
    expect(style.getText()?.getText()).toBe('A')
  })

  it('detaches by removing the same VectorLayer from the map', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new NumberingLayer({ geoJson: sampleGeoJson })

    layer.attach(adapter)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledWith(added)
  })
})
