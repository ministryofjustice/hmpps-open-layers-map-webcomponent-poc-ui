import { applyStyle } from 'ol-mapbox-style'
import { OrdnanceSurveyVectorTileLayer } from './ordnance-survey-vector'

jest.mock('ol-mapbox-style', () => ({
  applyStyle: jest.fn().mockResolvedValue('STYLE_APPLIED'),
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

describe('OrdnanceSurveyVectorTileLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initialises with declutter = true', () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    expect(layer).toBeInstanceOf(OrdnanceSurveyVectorTileLayer)
    expect(layer.get('declutter')).toBe(true)
  })

  it('strips a single trailing slash before passing to applyStyle', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    await layer.applyVectorStyle('https://api.os.uk/maps/vector/v1/vts/resources/styles/')
    expect(applyStyle).toHaveBeenCalledWith(layer, 'https://api.os.uk/maps/vector/v1/vts/resources/styles')
  })

  it('returns the result of applyStyle', async () => {
    const layer = new OrdnanceSurveyVectorTileLayer()
    const result = await layer.applyVectorStyle('https://api.os.uk/maps/vector/v1/vts/resources/styles/os.json')
    expect(result).toBe('STYLE_APPLIED')
  })
})
