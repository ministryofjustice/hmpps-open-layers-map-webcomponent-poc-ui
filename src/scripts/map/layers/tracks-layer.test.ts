import { Layer } from 'ol/layer'
import { TracksLayer } from './tracks-layer'
import makeOpenLayersAdapter from '../../../../tests/utils/openlayers-adapter'
import Position from '../types/position'

const samplePositions: Array<Position> = []

describe('TracksLayer (OpenLayers library)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attaches a Layer and adds it to the map', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new TracksLayer({ positions: samplePositions })

    layer.attach(adapter)

    expect(olMapMock.addLayer).toHaveBeenCalledTimes(1)
    const added = olMapMock.addLayer.mock.calls[0][0]
    expect(added).toBeInstanceOf(Layer)
  })

  it('respects visible=false and zIndex options', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new TracksLayer({ positions: samplePositions, visible: false, zIndex: 5 })

    layer.attach(adapter)

    const added = olMapMock.addLayer.mock.calls[0][0] as Layer
    expect(added.getVisible()).toBe(false)
    expect(added.getZIndex()).toBe(5)
  })

  it('detaches by removing the Layer', () => {
    const { adapter, olMapMock } = makeOpenLayersAdapter()
    const layer = new TracksLayer({ positions: samplePositions })

    layer.attach(adapter)
    const added = olMapMock.addLayer.mock.calls[0][0]

    layer.detach(adapter)

    expect(olMapMock.removeLayer).toHaveBeenCalledWith(added)
  })
})
