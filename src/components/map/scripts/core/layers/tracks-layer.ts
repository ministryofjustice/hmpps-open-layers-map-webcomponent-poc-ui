import BaseLayer from 'ol/layer/Base'
import type { ComposableLayer, LayerStateOptions } from './base'
import type { MapAdapter } from '../map-adapter'
import { OLTracksLayer, SegmentStyleContext, SegmentStyleResult } from './ol/tracks-layer'
import { Position } from '../types/position'

export type DirectionUnits = 'degrees' | 'radians'

/**
 * Used to look up a numeric bearing/direction value on a Position. Not a fixed set of values —
 * it's just the name of whichever field on the consumers Position objects holds that bearing, e.g.
 * "direction", "bearing" or "heading". Can be a single string (used for both entry and exit
 * lookups) or an object with distinct entry and exit property names, e.g.
 * { bearing: "entryBearing", exit: "exitBearing" }, for single point edge-cases where one
 * position needs two different bearing values. The value found is interpreted using
 * direction.units ("degrees" or "radians"), which is separate from this property name.
 */
export type DirectionProperty = string | { entry?: string; exit?: string }

export type TracksLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: {
    stroke: {
      color: string
      lineDash?: number[]
    }
  }
  avoidPositions?: Array<Position>
  positions: Array<Position>
  segmentStyle?: (context: SegmentStyleContext) => SegmentStyleResult
  entryExit?: {
    enabled?: boolean
    extensionDistanceMeters?: number
    direction?: {
      property?: DirectionProperty // e.g. "direction" or { entry: "entryBearing", exit: "exitBearing" }
      units?: DirectionUnits
    }
    centre?: [number, number]
    radiusMeters?: number
  }
}

export class TracksLayer implements ComposableLayer<BaseLayer[]> {
  public readonly id: string

  private readonly options: TracksLayerOptions

  private olLayers: BaseLayer[] = []

  constructor(options: TracksLayerOptions) {
    this.options = options
    this.id = options.id ?? 'tracks'
  }

  private createLayers(): BaseLayer[] {
    return [
      new OLTracksLayer({
        positions: this.options.positions,
        style: this.options.style,
        title: this.options.title ?? this.id,
        visible: this.options.visible,
        zIndex: this.options.zIndex,
        avoidPositions: this.options.avoidPositions,
        entryExit: this.options.entryExit,
        segmentStyle: this.options.segmentStyle,
      }),
    ]
  }

  public getLayers(): BaseLayer[] {
    if (this.olLayers.length === 0) {
      this.olLayers = this.createLayers()
    }
    return this.olLayers
  }

  public getNativeLayer(): BaseLayer[] {
    return this.getLayers()
  }

  public getPrimaryLayer(): BaseLayer {
    return this.getLayers()[0]
  }

  public attach(adapter: MapAdapter, layerStateOptions?: LayerStateOptions): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[TracksLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!
    const layers = this.getLayers()
    const visible = layerStateOptions?.visible ?? this.options.visible ?? true

    layers.forEach(layer => {
      layer.setVisible(visible)

      if (layerStateOptions?.zIndex !== undefined) {
        const existingZIndex = layer.getZIndex() ?? 0
        const baseZIndex = this.options.zIndex ?? 0
        const relativeOffset = existingZIndex - baseZIndex
        layer.setZIndex(layerStateOptions.zIndex + relativeOffset)
      }

      map.addLayer(layer)
    })
  }

  public detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') return

    this.getLayers().forEach(layer => {
      adapter.openlayers!.map.removeLayer(layer)
    })

    this.olLayers = []
  }
}
