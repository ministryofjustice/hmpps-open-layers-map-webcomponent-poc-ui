import type Map from 'ol/Map'
import { fromLonLat, toLonLat } from 'ol/proj'
import type { Coordinate } from 'ol/coordinate'

export type MapLibrary = 'openlayers' | 'maplibre'

/*
  MapAdapter exposes a bridge between mapping libraries so
  layers/interactions can work without knowing which map library is used.
  Currently supports OpenLayers but stubs out an implementation for MapLibre.
  Other libraries could be added in future if needed.
*/
export interface MapAdapter {
  mapLibrary: MapLibrary
  hostElement: HTMLElement

  // Convert [lon,lat] (EPSG:4326) to the library's internal map coords.
  project: (lonLat: [number, number]) => [number, number]

  // Convert internal map coords back to [lon,lat] (EPSG:4326).
  unproject: (xy: Coordinate) => [number, number]

  // Exactly one of these will be defined based on mapLibrary:
  openlayers?: { map: Map }
  mapLibre?: { map: import('maplibre-gl').Map }
}

// Adapter for an OpenLayers-backed map instance.
export function createOpenLayersAdapter(hostElement: HTMLElement, map: Map): MapAdapter {
  return {
    mapLibrary: 'openlayers',
    hostElement,
    project: lonLat => fromLonLat(lonLat) as [number, number],
    unproject: xy => toLonLat(xy) as [number, number],
    openlayers: { map },
  }
}

// Adapter for an MapLibre-backed map instance.
export function createMapLibreAdapter(hostElement: HTMLElement, map: import('maplibre-gl').Map): MapAdapter {
  return {
    mapLibrary: 'maplibre',
    hostElement,
    project: lonLat => lonLat,
    unproject: xy => xy as [number, number],
    mapLibre: { map },
  }
}
