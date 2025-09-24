import { setupOpenLayersMap } from './setup-openlayers-map'
import { OLMapInstance } from '../open-layers-map-instance'
import type { OLMapOptions } from '../open-layers-map-instance'
import MapPointerInteraction from '../interactions/map-pointer-interaction'

jest.mock('../open-layers-map-instance')
jest.mock('../config', () => ({
  tiles: {
    zoom: { min: 0, max: 20 },
    urls: {
      tileUrl: 'http://fake-tiles',
      vectorStyleUrl: 'http://fake-vector/resources/styles?srs=3857',
    },
    defaultTokenUrl: 'http://fake-token',
  },
}))
jest.mock('ol-mapbox-style', () => ({ applyStyle: jest.fn() }))
jest.mock('ol/layer/VectorTile', () => {
  return jest.fn().mockImplementation(() => ({ setSource: jest.fn() }))
})

const MockedOLMapInstance = OLMapInstance as jest.MockedClass<typeof OLMapInstance>

const addInteraction = jest.fn()
MockedOLMapInstance.mockImplementation(
  () =>
    ({
      getViewport: jest.fn(() => document.createElement('div')),
      addLayer: jest.fn(),
      addOverlay: jest.fn(),
      addInteraction,
    }) as unknown as OLMapInstance,
)

describe('setupOpenLayersMap', () => {
  let target: HTMLElement

  beforeEach(() => {
    jest.clearAllMocks()
    target = document.createElement('div')
  })

  it('adds MapPointerInteraction by default', async () => {
    await setupOpenLayersMap(target, {
      target,
      tokenUrl: 'none',
      tileType: 'vector',
      tileUrl: '',
      vectorUrl: '',
      usesInternalOverlays: false,
      controls: {},
    })

    expect(addInteraction).toHaveBeenCalled()
    expect(addInteraction.mock.calls[0][0]).toBeInstanceOf(MapPointerInteraction)
  })

  it('does not add MapPointerInteraction when grabCursor = false', async () => {
    await setupOpenLayersMap(target, {
      target,
      tokenUrl: 'none',
      tileType: 'vector',
      tileUrl: '',
      vectorUrl: '',
      usesInternalOverlays: false,
      controls: { grabCursor: false } as unknown as OLMapOptions['controls'],
    })

    expect(addInteraction).not.toHaveBeenCalledWith(expect.any(MapPointerInteraction))
  })
})
