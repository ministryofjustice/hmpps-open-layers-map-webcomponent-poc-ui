import VectorLayer from 'ol/layer/Vector'
import { LinesLayer } from './lines-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'
import positions from '../../../../tests/fixtures/positions'

describe('LinesLayer', () => {
  it('attaches and adds a VectorLayer to the map', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LinesLayer({ positions })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const olLayer = olMapMock.addLayer.mock.calls[0][0]
    expect(olLayer).toBeInstanceOf(VectorLayer)
    expect(layer.getNativeLayer()).toBe(olLayer)
  })

  it('respects visible and zIndex options', () => {
    const { adapter } = makeOpenLayersAdapter()
    const layer = new LinesLayer({
      positions,
      visible: false,
      zIndex: 5,
    })

    layer.attach(adapter)

    const olLayer = layer.getNativeLayer()!
    expect(olLayer.getVisible()).toBe(false)
    expect(olLayer.getZIndex()).toBe(5)
  })

  it('layerStateOptions override constructor options', () => {
    const { adapter } = makeOpenLayersAdapter()
    const layer = new LinesLayer({
      positions,
      visible: true,
      zIndex: 2,
    })

    layer.attach(adapter, { visible: false, zIndex: 10 })

    const olLayer = layer.getNativeLayer()!
    expect(olLayer.getVisible()).toBe(false)
    expect(olLayer.getZIndex()).toBe(10)
  })

  it('detaches and removes the layer from the map', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new LinesLayer({ positions })
    layer.attach(adapter)

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledTimes(1)
    expect(layer.getNativeLayer()).toBeUndefined()
  })
})
