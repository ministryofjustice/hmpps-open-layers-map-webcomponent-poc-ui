import { rewriteStyleUrls, rewriteVectorSource } from './rewrite-os-urls'

describe('rewriteStyleUrls', () => {
  const BASE_PATH = '/os-map/vector'

  it('rewrites source URLs and tiles correctly', () => {
    const input = {
      version: 8,
      sources: {
        osSource: {
          url: 'https://api.os.uk/maps/vector/v1/vts/source.json',
          tiles: ['https://api.os.uk/maps/vector/v1/vts/tile/{z}/{x}/{y}.pbf'],
        },
      },
    }

    const result = rewriteStyleUrls(input, BASE_PATH)

    expect(result.sources!.osSource.url).toBe(`${BASE_PATH}/source`)
    expect(result.sources!.osSource.tiles![0]).toContain(`${BASE_PATH}/tiles`)
  })

  it('rewrites sprite and glyph URLs correctly', () => {
    const input = {
      sprite: 'https://api.os.uk/maps/vector/v1/vts/resources/sprites/sprite@2x.png',
      glyphs: 'https://api.os.uk/maps/vector/v1/vts/resources/fonts/{fontstack}/{range}.pbf',
    }

    const result = rewriteStyleUrls(input, BASE_PATH)

    expect(result.sprite).toBe(`${BASE_PATH}/assets/sprites/sprite@2x.png`)
    expect(result.glyphs).toBe(`${BASE_PATH}/assets/fonts/{fontstack}/{range}.pbf`)
  })

  it('returns the same object if no URLs to rewrite', () => {
    const input = { version: 8 }
    const result = rewriteStyleUrls(input, BASE_PATH)
    expect(result).toEqual(input)
  })
})

describe('rewriteVectorSource', () => {
  const BASE_PATH = '/os-map/vector'

  it('rewrites tile URLs to local endpoint', () => {
    const input = {
      tiles: ['https://api.os.uk/maps/vector/v1/vts/tile/1/2/3.pbf'],
    }

    const result = rewriteVectorSource(input, BASE_PATH)
    expect(result.tiles![0]).toBe(`${BASE_PATH}/tiles/1/2/3.pbf`)
  })

  it('returns original JSON if no tiles array', () => {
    const input = { url: 'https://example.com/source.json' }
    const result = rewriteVectorSource(input, BASE_PATH)
    expect(result).toEqual(input)
  })
})
