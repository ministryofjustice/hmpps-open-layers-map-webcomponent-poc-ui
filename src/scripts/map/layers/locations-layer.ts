import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import type Feature from 'ol/Feature'
import type Geometry from 'ol/geom/Geometry'
import { OLLocationsLayer } from './ol/locations-layer'

import type { ComposableLayer, LayerStateOptions } from './base'
import type { MapAdapter } from '../map-adapter'
import Position from '../types/position'

type OLVecSrc = VectorSource<Feature<Geometry>>
type OLVecLayer = VectorLayer<OLVecSrc>

export type LocationsLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: {
    radius: number
    fill: string
    stroke: { color: string; width: number }
  }
  // The data to render (required)
  positions: Array<Position>
}

export class LocationsLayer implements ComposableLayer<OLVecLayer> {
  public readonly id: string

  private readonly options: LocationsLayerOptions

  private olLayer?: OLVecLayer

  constructor(options: LocationsLayerOptions) {
    this.options = options
    this.id = options.id ?? 'locations'
  }

  getNativeLayer(): OLVecLayer | undefined {
    return this.olLayer
  }

  attach(adapter: MapAdapter, layerStateOptions?: LayerStateOptions): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[TracksLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!

    this.olLayer = new OLLocationsLayer({
      positions: this.options.positions,
      style: this.options.style,
      title: this.options.title ?? this.id,
      visible: layerStateOptions?.visible ?? this.options.visible,
      zIndex: layerStateOptions?.zIndex ?? this.options.zIndex,
    })

    map.addLayer(this.olLayer)
  }

  detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary === 'openlayers') {
      if (this.olLayer) {
        adapter.openlayers!.map.removeLayer(this.olLayer)
        this.olLayer = undefined
      }
      return
    }

    // MapLibre stub
    console.warn(`[LocationLayer] MapLibre detach is not implemented yet (layer "${this.id}")`)
  }
}
