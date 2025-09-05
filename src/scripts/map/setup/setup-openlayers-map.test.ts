import { setupOpenLayersMap } from './setup-openlayers-map'
import { OLMapInstance } from '../open-layers-map-instance'

jest.mock('../open-layers-map-instance')

jest.mock('../config', () => ({
  apiKey: 'fake-key',
  tiles: {
    zoom: { min: 0, max: 20 },
    urls: { tileUrl: 'http://fake-tiles', vectorUrl: 'http://fake-vector' },
    defaultTokenUrl: 'http://fake-token',
  },
}))

jest.mock('ol-mapbox-style', () => ({
  applyStyle: jest.fn(),
}))

jest.mock('ol/layer/VectorTile', () => {
  return jest.fn().mockImplementation(() => ({
    setSource: jest.fn(),
  }))
})

const MockedOLMapInstance = OLMapInstance as jest.MockedClass<typeof OLMapInstance>

const mockViewport = document.createElement('div')

MockedOLMapInstance.mockImplementation(
  () =>
    ({
      getViewport: () => mockViewport,
      addLayer: jest.fn(),
      addOverlay: jest.fn(),
      addInteraction: jest.fn(),
    }) as unknown as OLMapInstance,
)

describe('setupOpenLayersMap', () => {
  let target: HTMLElement

  beforeEach(() => {
    jest.clearAllMocks()
    target = document.createElement('div')
    mockViewport.style.cursor = ''
  })

  it('applies grab cursor by default', async () => {
    await setupOpenLayersMap(target, {
      target,
      tokenUrl: 'none',
      tileType: 'vector',
      tileUrl: '',
      vectorUrl: '',
      usesInternalOverlays: false,
      controls: {},
    })
    expect(mockViewport.style.cursor).toBe('grab')
  })

  it('respects grabCursor = false', async () => {
    await setupOpenLayersMap(target, {
      target,
      tokenUrl: 'none',
      tileType: 'vector',
      tileUrl: '',
      vectorUrl: '',
      usesInternalOverlays: false,
      controls: { grabCursor: false } as any,
    })
    expect(mockViewport.style.cursor).toBe('')
  })
})
