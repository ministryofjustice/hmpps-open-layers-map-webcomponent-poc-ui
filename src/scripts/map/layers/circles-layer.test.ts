import type { FeatureCollection } from 'geojson'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style } from 'ol/style'
import type Feature from 'ol/Feature'
import type { Circle as CircleGeom } from 'ol/geom'
import { CirclesLayer } from './circles-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'

type OLCircleFeature = Feature<CircleGeom>
type OLVecSource = VectorSource<OLCircleFeature>
type OLVecLayer = VectorLayer<OLVecSource>

const sampleGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { confidence: 100 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 10] },
      properties: { confidence: 200 },
    },
  ],
}

describe('CirclesLayer (OpenLayers library)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attaches a VectorLayer with circle features from points', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new CirclesLayer({ geoJson: sampleGeoJson, id: 'circles' })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added).toBeInstanceOf(VectorLayer)

    const source = added.getSource() as OLVecSource
    expect(source.getFeatures().length).toBe(2)

    const geomTypes = source.getFeatures().map(f => f.getGeometry()?.getType())
    expect(geomTypes.every(t => t === 'Circle')).toBe(true)
  })

  it('respects visible=false and zIndex from options', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new CirclesLayer({ geoJson: sampleGeoJson, visible: false, zIndex: 99 })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added.getVisible()).toBe(false)
    expect(added.getZIndex()).toBe(99)
  })

  it('applies custom style when provided', () => {
    const customStyle = new Style({})
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new CirclesLayer({
      geoJson: sampleGeoJson,
      style: customStyle,
    })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer
    expect(added.getStyle()).toBe(customStyle)
  })

  it('detaches by removing the same VectorLayer', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new CirclesLayer({ geoJson: sampleGeoJson })

    layer.attach(adapter)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLVecLayer

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledTimes(1)
    expect(olMapMock.removeLayer).toHaveBeenCalledWith(added)
  })
})
