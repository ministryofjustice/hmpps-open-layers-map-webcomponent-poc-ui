import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle } from 'ol/geom'
import Feature from 'ol/Feature'

import type { ComposableLayer } from './base'
import type { MapAdapter } from '../map-adapter'
import { OLCirclesLayer } from './ol/circles-layer'
import Position from '../types/position'

type OLCircleFeature = Feature<Circle>
type OLVecSource = VectorSource<OLCircleFeature>
type OLVecLayer = VectorLayer<OLVecSource>

export type CirclesLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: {
    fill: string
    stroke: { color: string; width: number }
  }
  // The data to render (required)
  positions: Array<Position>
}

export class CirclesLayer implements ComposableLayer<OLVecLayer> {
  public readonly id: string

  private readonly options: CirclesLayerOptions

  private olLayer?: OLVecLayer

  constructor(options: CirclesLayerOptions) {
    this.options = options
    this.id = options.id ?? 'circles'
  }

  getNativeLayer(): OLVecLayer | undefined {
    return this.olLayer
  }

  attach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[CirclesLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!

    this.olLayer = new OLCirclesLayer({
      positions: this.options.positions,
      style: this.options.style,
      title: this.options.title ?? this.id,
      visible: this.options.visible,
      zIndex: this.options.zIndex,
    })

    map.addLayer(this.olLayer)
  }

  detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') return
    if (this.olLayer) {
      adapter.openlayers!.map.removeLayer(this.olLayer)
      this.olLayer = undefined
    }
  }
}
