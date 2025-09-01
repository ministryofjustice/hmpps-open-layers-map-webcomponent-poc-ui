import TileState from 'ol/TileState'
import axios from 'axios'
import { ordnanceSurveyImageTileLoader, OrdnanceSurveyImageTileLayer, isImageTileLayer } from './ordnance-survey-image'
import config from '../config'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../config', () => ({
  apiKey: 'fake-key',
  tiles: {
    zoom: { min: 0, max: 20 },
    urls: { tileUrl: 'http://fake-tiles', vectorUrl: 'http://fake-vector' },
    defaultTokenUrl: 'http://fake-token',
  },
}))

jest.mock('ol/layer/Tile', () => {
  return class MockTileLayer {
    private source: any

    constructor(opts: any) {
      this.source = opts.source
    }

    getSource() {
      return this.source
    }
  }
})

jest.mock('ol/source', () => {
  return {
    XYZ: class MockXYZ {
      minZoom!: number

      maxZoom!: number

      url!: string

      tileLoadFunction: any

      constructor(opts: any) {
        Object.assign(this, opts)
      }

      setTileLoadFunction = jest.fn(fn => {
        this.tileLoadFunction = fn
      })

      refresh = jest.fn()

      getUrls = () => [this.url]
    },
  }
})

jest.mock('ol/TileState', () => ({
  default: {
    IDLE: 0,
    LOADING: 1,
    LOADED: 2,
    ERROR: 3,
  },
}))

global.URL.createObjectURL = jest.fn(() => 'blob://mock-url')
const revokeObjectURLSpy = jest.fn()
global.URL.revokeObjectURL = revokeObjectURLSpy

describe('ordnanceSurveyImageTileLoader', () => {
  let mockTile: any
  let mockImage: HTMLImageElement

  beforeEach(() => {
    jest.clearAllMocks()
    mockImage = document.createElement('img')
    mockTile = {
      getImage: jest.fn(() => mockImage),
      setState: jest.fn(),
    }
  })

  it('fetches tile image with Authorization header', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: new Blob() })
    const loader = ordnanceSurveyImageTileLoader('test-token')
    await loader(mockTile, 'http://example.com/tile.png')

    expect(mockedAxios.get).toHaveBeenCalledWith('http://example.com/tile.png', {
      headers: { Authorization: 'Bearer test-token' },
      responseType: 'blob',
    })
  })

  it('sets image src when tile image is HTMLImageElement', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: new Blob() })
    const loader = ordnanceSurveyImageTileLoader('token')
    await loader(mockTile, 'url')

    expect(mockImage.src).toBe('blob://mock-url')
    mockImage.onload?.(new Event('load'))
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob://mock-url')
  })

  it('sets tile state ERROR if image is not HTMLImageElement', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: new Blob() })
    mockTile.getImage.mockReturnValue({})
    const loader = ordnanceSurveyImageTileLoader('token')
    await loader(mockTile, 'url')

    expect(mockTile.setState).toHaveBeenCalledWith(TileState.ERROR)
  })

  it('sets tile state ERROR on request failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('fail'))
    const loader = ordnanceSurveyImageTileLoader('token')
    await loader(mockTile, 'url')
    expect(mockTile.setState).toHaveBeenCalledWith(TileState.ERROR)
  })
})

describe('OrdnanceSurveyImageTileLayer', () => {
  it('creates an XYZ source with correct options', () => {
    const layer = new OrdnanceSurveyImageTileLayer('http://tiles', 'tok')
    const source = layer.getSource() as any
    expect(source.getUrls()).toContain('http://tiles')
    expect(source.tileLoadFunction).toBeDefined()
    expect(source.maxZoom).toBe(config.tiles.zoom.max)
    expect(source.minZoom).toBe(config.tiles.zoom.min)
  })

  it('updateToken replaces tileLoadFunction and refreshes', () => {
    const layer = new OrdnanceSurveyImageTileLayer('url', 'tok')
    const source = layer.getSource() as any
    source.setTileLoadFunction = jest.fn()
    source.refresh = jest.fn()

    layer.updateToken('newTok')
    expect(source.setTileLoadFunction).toHaveBeenCalled()
    expect(source.refresh).toHaveBeenCalled()
  })
})

describe('isImageTileLayer', () => {
  it('returns true for OrdnanceSurveyImageTileLayer', () => {
    const layer = new OrdnanceSurveyImageTileLayer('url', 'tok')
    expect(isImageTileLayer(layer)).toBe(true)
  })

  it('returns false for non-matching layer', () => {
    const fakeLayer = { some: 'thing' } as any
    expect(isImageTileLayer(fakeLayer)).toBe(false)
  })
})
