import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import type Feature from 'ol/Feature'
import type { LineString } from 'ol/geom'
import type { ComposableLayer, LayerStateOptions } from './base'
import type { MapAdapter } from '../map-adapter'
import { OLLinesLayer } from './ol/lines-layer'
import Position from '../types/position'

type OLLineFeature = Feature<LineString>
type OLVecSource = VectorSource<OLLineFeature>
type OLVecLayer = VectorLayer<OLVecSource>

export type LinesLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: {
    stroke: {
      color: string
    }
  }
  positions: Array<Position>
}

export class LinesLayer implements ComposableLayer<OLVecLayer> {
  public readonly id: string

  private readonly options: LinesLayerOptions

  private olLayer?: OLVecLayer

  constructor(options: LinesLayerOptions) {
    this.options = options
    this.id = options.id ?? 'lines'
  }

  getNativeLayer(): OLVecLayer | undefined {
    return this.olLayer
  }

  attach(adapter: MapAdapter, layerStateOptions?: LayerStateOptions): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[LinesLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!

    this.olLayer = new OLLinesLayer({
      positions: this.options.positions,
      style: this.options.style,
      title: this.options.title ?? this.id,
      visible: layerStateOptions?.visible ?? this.options.visible,
      zIndex: layerStateOptions?.zIndex ?? this.options.zIndex,
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
