import LayerGroup from 'ol/layer/Group'
import type { FeatureCollection } from 'geojson'
import { TracksLayer } from './tracks-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'

jest.mock('./lines-layer', () => {
  const linesConstructor = jest.fn().mockImplementation(() => ({
    attach: jest.fn(),
    detach: jest.fn(),
    getNativeLayer: jest.fn(() => ({ type: 'mock-lines-layer' })),
  }))
  return { LinesLayer: linesConstructor }
})

jest.mock('./arrows-layer', () => {
  const arrowsConstructor = jest.fn().mockImplementation(() => ({
    attach: jest.fn(),
    detach: jest.fn(),
    getNativeLayer: jest.fn(() => ({ type: 'mock-arrows-layer' })),
  }))
  return { ArrowsLayer: arrowsConstructor }
})

const sampleGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

describe('TracksLayer (OpenLayers library)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attaches a LayerGroup and adds it to the map', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new TracksLayer({ geoJson: sampleGeoJson })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const added = olMapMock.addLayer.mock.calls[0][0]
    expect(added).toBeInstanceOf(LayerGroup)
  })

  it('respects visible=false and zIndex options', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new TracksLayer({ geoJson: sampleGeoJson, visible: false, zIndex: 5 })

    layer.attach(adapter)

    const group = olMapMock.addLayer.mock.calls[0][0] as LayerGroup
    expect(group.getVisible()).toBe(false)
    expect(group.getZIndex()).toBe(5)
  })

  it('detaches by removing the LayerGroup', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new TracksLayer({ geoJson: sampleGeoJson })

    layer.attach(adapter)
    const group = olMapMock.addLayer.mock.calls[0][0]

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledWith(group)
  })
})
