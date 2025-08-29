// Import the component to be tested
import { MojMap } from './moj-map'
import { resolveTileType } from './map/layers/ordnance-survey-vector'

// Mock OpenLayers and related modules
jest.mock('ol/Map', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addLayer: jest.fn(),
    addOverlay: jest.fn(),
    addInteraction: jest.fn(),
    on: jest.fn(),
    getView: jest.fn().mockReturnValue({ getCenter: jest.fn() }),
  })),
}))

jest.mock('./map/map-instance', () => ({
  __esModule: true,
  MojMapInstance: jest.fn().mockImplementation(() => ({
    addLayer: jest.fn(),
    addOverlay: jest.fn(),
    addInteraction: jest.fn(),
    on: jest.fn(),
  })),
}))

jest.mock('ol/geom/Point', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('ol/interaction/Pointer', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('ol/Feature', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('ol/coordinate', () => ({ __esModule: true, Coordinate: jest.fn() }))
jest.mock('ol/geom/Geometry', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('ol/MapBrowserEvent', () => ({ __esModule: true, default: jest.fn() }))

jest.mock('./map/interactions/location-pointer-interaction', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('./map/layers/ordnance-survey-image', () => ({
  __esModule: true,
  OrdnanceSurveyImageTileLayer: jest.fn().mockImplementation(() => ({
    updateToken: jest.fn(),
  })),
  isImageTileLayer: jest.fn().mockReturnValue(true),
}))

jest.mock('./map/layers/ordnance-survey-vector', () => ({
  __esModule: true,
  OrdnanceSurveyVectorTileLayer: jest.fn().mockImplementation(() => ({
    applyVectorStyle: jest.fn().mockResolvedValue(undefined),
  })),
  resolveTileType: jest.fn().mockReturnValue('raster'),
}))

jest.mock('./map/config', () => ({
  __esModule: true,
  default: {
    apiKey: 'fake-api-key',
    tiles: {
      urls: { tileUrl: 'default-tile-url', vectorUrl: 'default-vector-url' },
      defaultTokenUrl: 'default-token-url',
    },
  },
}))

jest.mock('./map/overlays/feature-overlay', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      close: jest.fn(),
    })),
  }
})

// Mock fetch for access token retrieval
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ access_token: 'test-token', expires_in: 3600 }),
})

type ParseAttributesResult = {
  tileType: string
  tileUrl: string
  vectorUrl: string
  tokenUrl: string
}

type ControlOptions = {
  rotate: boolean | { autoHide: boolean }
  scaleControl?: string
}

// Define a type that includes private members
type MojMapTest = Omit<InstanceType<typeof MojMap>, 'mapNonce' | 'featureOverlay'> & {
  mapNonce: string | null
  featureOverlay?: { close: jest.Mock }
  parseAttributes: () => ParseAttributesResult
  getControlOptions: () => ControlOptions
  render: () => void
}

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('MojMap component', () => {
  let el: MojMapTest

  beforeEach(() => {
    el = new MojMap() as unknown as MojMapTest
    document.body.appendChild(el)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  describe('points and lines getters', () => {
    it('returns [] when no attribute is set', () => {
      expect(el.points).toEqual([])
      expect(el.lines).toEqual([])
    })

    it('parses valid JSON in points and lines attributes', () => {
      el.setAttribute('points', '[{"x":1}]')
      el.setAttribute('lines', '[{"y":2}]')
      expect(el.points).toEqual([{ x: 1 }])
      expect(el.lines).toEqual([{ y: 2 }])
    })

    it('returns [] and warns on invalid JSON', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      el.setAttribute('points', 'not-json')
      expect(el.points).toEqual([])
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('parseAttributes', () => {
    it('falls back to default config values', () => {
      jest.mocked(resolveTileType).mockReturnValue('raster')
      const result = el.parseAttributes()
      expect(result.tileUrl).toBe('default-tile-url')
      expect(result.vectorUrl).toBe('default-vector-url')
      expect(result.tokenUrl).toBe('default-token-url')
    })

    it('uses provided attributes', () => {
      el.setAttribute('tile-type', 'vector')
      el.setAttribute('access-token-url', 'custom-token')
      el.setAttribute('tile-url', 'custom-tile')
      el.setAttribute('vector-url', 'custom-vector')

      jest.mocked(resolveTileType).mockReturnValue('vector')
      const result = el.parseAttributes()
      expect(result.tileType).toBe('vector')
      expect(result.tokenUrl).toBe('custom-token')
      expect(result.tileUrl).toBe('custom-tile')
      expect(result.vectorUrl).toBe('custom-vector')
    })

    it('sets tokenUrl to "none" for vector with no access-token-url', () => {
      el.setAttribute('tile-type', 'vector')
      jest.mocked(resolveTileType).mockReturnValue('vector')
      const result = el.parseAttributes()
      expect(result.tokenUrl).toBe('none')
    })
  })

  describe('getControlOptions', () => {
    it('applies rotate-control correctly', () => {
      el.setAttribute('rotate-control', 'false')
      let controls = el.getControlOptions()
      expect(controls.rotate).toBe(false)

      el.setAttribute('rotate-control', 'auto-hide')
      controls = el.getControlOptions()
      expect(controls.rotate).toEqual({ autoHide: true })

      el.removeAttribute('rotate-control')
      controls = el.getControlOptions()
      expect(controls.rotate).toEqual({ autoHide: false })
    })

    it('toggles host classes based on attributes', () => {
      el.setAttribute('scale-control', 'line')
      el.setAttribute('zoom-slider', 'true')
      el.setAttribute('location-display', 'dms')

      const controls = el.getControlOptions()

      expect(controls.scaleControl).toBe('line')
      expect(el.classList.contains('has-scale-control')).toBe(true)
      expect(el.classList.contains('has-zoom-slider')).toBe(true)
      expect(el.classList.contains('has-location-dms')).toBe(true)
    })
  })

  describe('render', () => {
    it('warns and does nothing when mapNonce is null', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      el.mapNonce = null
      el.render()
      expect(warnSpy).toHaveBeenCalled()
      expect(el.shadowRoot?.innerHTML).toBe('')
    })

    it('inserts style and map DOM when mapNonce is set', () => {
      el.mapNonce = 'abc123'
      el.render()
      const shadow = el.shadowRoot as ShadowRoot
      expect(shadow.querySelector('style')).not.toBeNull()
      expect(shadow.querySelector('#map')).not.toBeNull()
    })
  })

  describe('closeOverlay', () => {
    it('calls close on featureOverlay if present', () => {
      const fakeOverlay = { close: jest.fn() }
      el.featureOverlay = fakeOverlay
      el.closeOverlay()
      expect(fakeOverlay.close).toHaveBeenCalled()
    })
  })
})
