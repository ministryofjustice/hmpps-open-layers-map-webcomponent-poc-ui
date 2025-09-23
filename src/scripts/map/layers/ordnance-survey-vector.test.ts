import { applyStyle } from 'ol-mapbox-style'
import { OrdnanceSurveyVectorTileLayer, resolveTileType } from './ordnance-survey-vector'
import { supportsWebGL } from '../../helpers/browser'

jest.mock('ol-mapbox-style', () => ({
  applyStyle: jest.fn().mockResolvedValue('STYLE_APPLIED'),
}))

jest.mock('../../helpers/browser', () => ({
  supportsWebGL: jest.fn(),
}))

jest.mock('ol/layer/VectorTile', () => {
  return {
    __esModule: true,
    default: class MockVectorTileLayer {
      private props: Record<string, unknown>

      constructor(opts: Record<string, unknown> = {}) {
        this.props = opts
      }

      get(key: string) {
        return this.props[key]
      }
    },
  }
})

describe('resolveTileType', () => {
  it('returns vector if explicitly requested', () => {
    expect(resolveTileType('vector')).toBe('vector')
  })

  it('returns raster if explicitly requested', () => {
    expect(resolveTileType('raster')).toBe('raster')
  })

  it('returns vector when supportsWebGL = true', () => {
    ;(supportsWebGL as jest.Mock).mockReturnValue(true)
    expect(resolveTileType(null)).toBe('vector')
  })

  it('returns raster when supportsWebGL = false', () => {
    ;(supportsWebGL as jest.Mock).mockReturnValue(false)
    expect(resolveTileType(null)).toBe('raster')
  })
})

describe('OrdnanceSurveyVectorTileLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initialises with declutter = true', () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    expect(layer).toBeInstanceOf(OrdnanceSurveyVectorTileLayer)
    expect(layer.get('declutter')).toBe(true) // ✅ no `as any`
  })

  it('calls applyStyle with ?key= when no query params exist', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('APIKEY', 'https://tiles.os.uk/styles/os.json')
    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://tiles.os.uk/styles/os.json?key=APIKEY')
  })

  it('calls applyStyle with &key= when query params exist', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('APIKEY', 'https://tiles.os.uk/styles/os.json?foo=bar')
    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://tiles.os.uk/styles/os.json?foo=bar&key=APIKEY')
  })

  it('strips trailing slash before appending', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('APIKEY', 'https://tiles.os.uk/styles/')
    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://tiles.os.uk/styles?key=APIKEY')
  })

  it('returns the result of applyStyle', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    const result = await layer.applyVectorStyle('APIKEY', 'https://tiles.os.uk/styles/os.json')
    expect(result).toBe('STYLE_APPLIED')
  })

  it('does not duplicate existing key', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('APIKEY', 'https://api.os.uk/maps/vector/v1/resources/styles?srs=3857&key=PRESENT')
    expect(applyStyle).toHaveBeenCalledWith(
      layer,
      'https://api.os.uk/maps/vector/v1/resources/styles?srs=3857&key=PRESENT',
    )
  })
})
