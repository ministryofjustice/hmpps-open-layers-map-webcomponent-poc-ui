import maplibregl from 'maplibre-gl'
import { MapLibreMapInstance } from '../maplibre-map-instance'
import { add3DBuildingsControl } from '../controls/maplibre-3d-buildings-control'
import config from '../config'

export async function setupMapLibreMap(
  target: HTMLElement,
  vectorUrl?: string,
  enable3DControls = false,
): Promise<MapLibreMapInstance> {
  const styleUrl = vectorUrl || `https://api.os.uk/maps/vector/v1/vts/resources/styles?key=${config.apiKey}`

  const map = new MapLibreMapInstance({
    target,
    styleUrl,
    enable3DControls,
    maxPitch: 60,
    minZoom: 6,
    maxZoom: 18,
    zoom: 15,
    pitch: 0,
    bearing: 0,
    center: [-0.125, 51.501],
    attributionControl: false,
  })

  // Built-in zoom + compass controls
  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

  // Custom 3D controls (view + extrude buildings)
  if (enable3DControls) {
    add3DBuildingsControl(map)
  }

  return map
}
