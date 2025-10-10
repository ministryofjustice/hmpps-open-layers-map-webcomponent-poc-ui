import { MojMap } from './moj-map'
import * as dom from './helpers/dom'
import { setupOpenLayersMap } from './map/setup/setup-openlayers-map'
import { setupMapLibreMap } from './map/setup/setup-maplibre-map'

jest.mock('./helpers/dom', () => ({
  createMapDOM: jest.fn(),
  createScopedStyle: jest.fn(),
  getMapNonce: jest.fn(),
}))

jest.mock('./map/config', () => ({
  default: {
    tiles: {
      urls: {
        vectorStyleUrl: 'https://mock-vector',
      },
      defaultTokenUrl: 'https://mock-token',
    },
  },
}))

jest.mock('./map/setup/setup-openlayers-map', () => ({
  setupOpenLayersMap: jest.fn().mockResolvedValue({ addLayer: jest.fn() }),
}))

jest.mock('./map/setup/setup-maplibre-map', () => ({
  setupMapLibreMap: jest.fn().mockResolvedValue({ addLayer: jest.fn() }),
}))

jest.mock('maplibre-gl', () => ({
  Map: jest.fn().mockImplementation(() => ({
    addControl: jest.fn(),
    addLayer: jest.fn(),
    on: jest.fn(),
  })),
}))

describe('MojMap', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()

    const getMapNonceMock = dom.getMapNonce as jest.Mock
    getMapNonceMock.mockReturnValue('test-nonce')

    const createScopedStyleMock = dom.createScopedStyle as jest.Mock
    createScopedStyleMock.mockImplementation(() => document.createElement('style'))

    const createMapDOMMock = dom.createMapDOM as jest.Mock
    createMapDOMMock.mockImplementation(() => {
      const frag = document.createDocumentFragment()
      const wrapper = document.createElement('div')
      const mapDiv = document.createElement('div')
      mapDiv.id = 'map'
      wrapper.appendChild(mapDiv)
      frag.appendChild(wrapper)
      return frag
    })
  })

  it('uses OpenLayers setup by default and passes expected options', async () => {
    const mojMap = document.createElement('moj-map') as MojMap
    mojMap.setAttribute('renderer', 'openlayers')
    mojMap.setAttribute('vector-url', 'https://attr-vector')
    mojMap.setAttribute('access-token-url', 'none')
    mojMap.setAttribute('api-key', 'API_KEY')

    const ready = new Promise<void>(resolve => {
      mojMap.addEventListener('map:ready', () => resolve(), { once: true })
    })

    document.body.appendChild(mojMap)
    await ready

    expect(setupOpenLayersMap).toHaveBeenCalledTimes(1)
    const [container, opts] = (setupOpenLayersMap as jest.Mock).mock.calls[0]
    expect(container instanceof HTMLElement).toBe(true)
    expect(opts).toEqual(
      expect.objectContaining({
        vectorUrl: 'https://attr-vector',
        usesInternalOverlays: false,
        controls: expect.any(Object),
      }),
    )
  })

  it('uses MapLibre setup when renderer="maplibre"', async () => {
    const mojMap = document.createElement('moj-map') as MojMap
    mojMap.setAttribute('renderer', 'maplibre')
    mojMap.setAttribute('vector-url', 'https://attr-vector')
    mojMap.setAttribute('access-token-url', 'none')
    mojMap.setAttribute('api-key', 'API_KEY')

    const ready = new Promise<void>(resolve => {
      mojMap.addEventListener('map:ready', () => resolve(), { once: true })
    })

    document.body.appendChild(mojMap)
    await ready

    expect(setupMapLibreMap).toHaveBeenCalledTimes(1)
    const [container, vectorUrl, enable3D] = (setupMapLibreMap as jest.Mock).mock.calls[0]
    expect(container instanceof HTMLElement).toBe(true)
    expect(vectorUrl).toBe('https://attr-vector')
    expect(typeof enable3D).toBe('boolean')
  })

  it('fires map:ready and exposes .map', async () => {
    const mojMap = document.createElement('moj-map') as MojMap
    mojMap.setAttribute('renderer', 'openlayers')
    mojMap.setAttribute('vector-url', 'https://attr-vector')
    mojMap.setAttribute('access-token-url', 'none')
    mojMap.setAttribute('api-key', 'API_KEY')

    const ready = new Promise<unknown>(resolve => {
      mojMap.addEventListener('map:ready', e => resolve((e as CustomEvent).detail.map), { once: true })
    })

    document.body.appendChild(mojMap)
    const map = await ready

    expect(map).toBeDefined()
    expect(mojMap.map).toBeDefined()
  })

  it('addLayer attaches via adapter, and removeLayer detaches', async () => {
    const mojMap = document.createElement('moj-map') as MojMap
    mojMap.setAttribute('renderer', 'openlayers')
    mojMap.setAttribute('vector-url', 'https://attr-vector')
    mojMap.setAttribute('access-token-url', 'none')
    mojMap.setAttribute('api-key', 'API_KEY')

    await new Promise<void>(resolve => {
      mojMap.addEventListener('map:ready', () => resolve(), { once: true })
      document.body.appendChild(mojMap)
    })

    const attach = jest.fn()
    const detach = jest.fn()
    const fakeLayer = { id: 'test', attach, detach }

    mojMap.addLayer(fakeLayer)
    expect(attach).toHaveBeenCalledTimes(1)
    expect(attach.mock.calls[0][0]).toHaveProperty('mapLibrary', 'openlayers')

    mojMap.removeLayer('test')
    expect(detach).toHaveBeenCalledTimes(1)
    expect(detach.mock.calls[0][0]).toHaveProperty('mapLibrary', 'openlayers')
  })

  it('closeOverlay delegates to featureOverlay.close()', () => {
    const mojMap = new MojMap()
    const closeFn = jest.fn()
    Object.defineProperty(mojMap, 'featureOverlay', { value: { close: closeFn } })
    mojMap.closeOverlay()
    expect(closeFn).toHaveBeenCalled()
  })
})
