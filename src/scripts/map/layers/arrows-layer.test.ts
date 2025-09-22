import type { FeatureCollection } from 'geojson'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import { ArrowsLayer } from './arrows-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'

type OLPointSource = VectorSource<Feature<Point>>
type OLPointLayer = VectorLayer<OLPointSource>

const sampleGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
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

describe('ArrowsLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attaches a VectorLayer with expected properties', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new ArrowsLayer({ geoJson: sampleGeoJson, id: 'arrows', title: 'Arrows' })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLPointLayer
    expect(added).toBeInstanceOf(VectorLayer)
    expect(added.get('title')).toBe('Arrows')

    const source = added.getSource() as OLPointSource
    expect(source.getFeatures().length).toBeGreaterThan(0)
  })

  it('respects layerStateOptions: visible=false and zIndex', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new ArrowsLayer({ geoJson: sampleGeoJson })

    layer.attach(adapter, { visible: false, zIndex: 99 })

    const added = olMapMock.addLayer.mock.calls[0][0] as OLPointLayer
    expect(added.getVisible()).toBe(false)
    expect(added.getZIndex()).toBe(99)
  })

  it('detaches by removing the VectorLayer', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new ArrowsLayer({ geoJson: sampleGeoJson })

    layer.attach(adapter)
    const added = olMapMock.addLayer.mock.calls[0][0] as OLPointLayer

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledTimes(1)
    expect(olMapMock.removeLayer).toHaveBeenCalledWith(added)
  })

  it('uses a custom arrow generator if provided', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const customArrow = jest.fn(() => [new Feature(new Point([0, 0]))])

    const layer = new ArrowsLayer({
      geoJson: sampleGeoJson,
      arrowGenerator: customArrow,
    })

    layer.attach(adapter)

    expect(customArrow).toHaveBeenCalled()
    const added = olMapMock.addLayer.mock.calls[0][0] as OLPointLayer
    const source = added.getSource() as OLPointSource
    expect(source.getFeatures().length).toBe(1)
  })
})
