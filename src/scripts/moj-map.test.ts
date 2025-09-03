import { applyStyle } from 'ol-mapbox-style'
import { resolveTileType, OrdnanceSurveyVectorTileLayer } from './map/layers/ordnance-survey-vector'
import { supportsWebGL } from './helpers/browser'

jest.mock('ol/layer/VectorTile', () => {
  return class MockVectorTileLayer {
    props: Record<string, unknown>

    constructor(opts: Record<string, unknown> = {}) {
      this.props = opts
    }

    get(key: string) {
      return this.props[key]
    }
  }
})

jest.mock('./helpers/browser', () => ({
  supportsWebGL: jest.fn(),
}))

jest.mock('ol-mapbox-style', () => ({
  applyStyle: jest.fn(),
}))

describe('resolveTileType', () => {
  it('returns vector when explicitly requested', () => {
    expect(resolveTileType('vector')).toBe('vector')
  })

  it('returns raster when explicitly requested', () => {
    expect(resolveTileType('raster')).toBe('raster')
  })

  it('defaults to vector when WebGL is supported', () => {
    ;(supportsWebGL as jest.Mock).mockReturnValue(true)
    expect(resolveTileType(null)).toBe('vector')
  })

  it('defaults to raster when WebGL is not supported', () => {
    ;(supportsWebGL as jest.Mock).mockReturnValue(false)
    expect(resolveTileType(null)).toBe('raster')
  })
})

describe('OrdnanceSurveyVectorTileLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('constructs with declutter option', () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    expect(layer.get('declutter')).toBe(true)
  })

  it('calls applyStyle with correct URL', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('fake-key', 'https://tiles.os.uk/path')

    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://tiles.os.uk/path?key=fake-key')
  })

  it('removes trailing slash before applying style', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('fake-key', 'https://tiles.os.uk/path/')

    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://tiles.os.uk/path?key=fake-key')
  })

  it('adds &key= when baseUrl already has a query string', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('fake-key', 'https://tiles.os.uk/path?foo=bar')

    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://tiles.os.uk/path?foo=bar&key=fake-key')
  })
})
