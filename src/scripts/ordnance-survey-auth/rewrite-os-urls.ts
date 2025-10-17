import type { MapboxStyle, MapboxSource } from './index'

// Rewrite source + assets URLs to point to the local middleware endpoints
export function rewriteStyleUrls(style: MapboxStyle, BASE_PATH: string): MapboxStyle {
  const styleToUpdate = { ...style }

  if (styleToUpdate.sources) {
    for (const source of Object.values(styleToUpdate.sources)) {
      if (typeof source.url === 'string') {
        source.url = `${BASE_PATH}/source`
      }
      if (Array.isArray(source.tiles)) {
        source.tiles = source.tiles.map(tile =>
          tile.replace(/^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/tile/, `${BASE_PATH}/tiles`),
        )
      }
    }
  }

  if (styleToUpdate.sprite) {
    styleToUpdate.sprite = styleToUpdate.sprite.replace(
      /^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/resources/,
      `${BASE_PATH}/assets`,
    )
  }

  if (styleToUpdate.glyphs) {
    styleToUpdate.glyphs = styleToUpdate.glyphs.replace(
      /^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/resources/,
      `${BASE_PATH}/assets`,
    )
  }

  return styleToUpdate
}

export function rewriteVectorSource(json: MapboxSource, BASE_PATH: string): MapboxSource {
  const JsonToUpdate = { ...json }

  if (JsonToUpdate.tiles && Array.isArray(JsonToUpdate.tiles)) {
    JsonToUpdate.tiles = JsonToUpdate.tiles.map(tile =>
      tile.replace(/^https:\/\/api\.os\.uk\/maps\/vector\/v1\/vts\/tile/, `${BASE_PATH}/tiles`),
    )
  }
  return JsonToUpdate
}
