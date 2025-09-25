import maplibregl from 'maplibre-gl'
import { MapLibreMapInstance } from '../maplibre-map-instance'

function signIfNeeded(styleBaseUrl: string, apiKey?: string): string {
  const clean = styleBaseUrl.replace(/\/$/, '')
  if (!apiKey) return clean
  const url = new URL(clean, window.location.origin)
  if (!url.searchParams.has('key')) url.searchParams.set('key', apiKey)
  return url.toString()
}

export async function setupMapLibreMap(
  target: HTMLElement,
  vectorUrl?: string,
  enable3DControls = false,
  apiKey?: string,
): Promise<MapLibreMapInstance> {
  const styleUrlBase = vectorUrl || 'https://api.os.uk/maps/vector/v1/resources/styles?srs=3857'
  const styleUrl = signIfNeeded(styleUrlBase, apiKey)

  const map = new MapLibreMapInstance({
    target,
    styleUrl,
    enable3DControls,
    minZoom: 6,
    maxZoom: 18,
    zoom: 15,
    pitch: 0,
    bearing: 0,
    center: [-0.125, 51.501],
    attributionControl: false,
  })

  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

  if (enable3DControls) {
    const { add3DBuildingsControl } = await import('../controls/maplibre-3d-buildings-control')
    add3DBuildingsControl(map)
  }

  return map
}
