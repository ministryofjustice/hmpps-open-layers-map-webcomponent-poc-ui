import type { FeatureCollection } from 'geojson'
import LayerGroup from 'ol/layer/Group'
import BaseLayer from 'ol/layer/Base'
import type { ComposableLayer } from './base'
import type { MapAdapter } from '../map-adapter'
import { LinesLayer, type LinesLayerOptions, type LinesLayerConstructorOptions } from './lines-layer'
import { ArrowsLayer, type ArrowsLayerOptions, type ArrowsLayerConstructorOptions } from './arrows-layer'

export type TracksLayerOptions = {
  id?: string
  title?: string
  visible?: boolean

  // Base z-index for the lines; arrows will be placed at `zIndex + 1`.
  zIndex?: number

  // The data to render (required)
  geoJson: FeatureCollection

  // Options passed to the Lines sub-layer.
  lines?: LinesLayerOptions

  // Options passed to the Arrows sub-layer
  // - set `enabled: false` to skip arrows entirely
  // - can also control arrow layer visibility independently via `visible`
  arrows?: ArrowsLayerOptions & { enabled?: boolean; visible?: boolean }
}

type HasNative = { getNativeLayer?: () => unknown }

export class TracksLayer implements ComposableLayer<LayerGroup> {
  public readonly id: string

  private readonly options: TracksLayerOptions

  private sublayers: ComposableLayer<unknown>[] = []

  private olGroup?: LayerGroup

  constructor(options: TracksLayerOptions) {
    this.options = options
    this.id = options.id ?? 'tracks'
  }

  getNativeLayer(): LayerGroup | undefined {
    return this.olGroup
  }

  attach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[TracksLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!
    const resolvedVisible = this.options.visible ?? false
    const resolvedZIndex = this.options.zIndex

    const group = new LayerGroup({
      properties: { title: this.options.title ?? this.id },
      visible: resolvedVisible,
    })
    if (resolvedZIndex !== undefined) group.setZIndex(resolvedZIndex)

    map.addLayer(group)

    // Lines sub-layer
    const lines = new LinesLayer({
      geoJson: this.options.geoJson,
      ...(this.options.lines ?? {}),
      id: `${this.id}-lines`,
      title: this.options.lines?.title ?? 'linesLayer',
    } as LinesLayerConstructorOptions)

    lines.attach(adapter)

    const nativeLines = lines.getNativeLayer()
    if (nativeLines instanceof BaseLayer) {
      const linesVisible = this.options.lines?.visible ?? true
      nativeLines.setVisible(linesVisible)
      if (resolvedZIndex !== undefined) nativeLines.setZIndex(resolvedZIndex)
    }

    this.sublayers.push(lines)

    // Arrows sub-layer
    const arrowsEnabled = this.options.arrows?.enabled !== false
    if (arrowsEnabled) {
      const arrows = new ArrowsLayer({
        geoJson: this.options.geoJson,
        ...(this.options.arrows ?? {}),
        id: `${this.id}-arrows`,
        title: this.options.arrows?.title ?? 'arrowsLayer',
      } as ArrowsLayerConstructorOptions)

      arrows.attach(adapter)

      const nativeArrows = arrows.getNativeLayer()
      if (nativeArrows instanceof BaseLayer) {
        const arrowsVisible = this.options.arrows?.visible ?? true
        nativeArrows.setVisible(arrowsVisible)
        if (resolvedZIndex !== undefined) nativeArrows.setZIndex(resolvedZIndex + 1)
      }
      this.sublayers.push(arrows)
    }

    // Move sublayers from map into the group for group visibility control
    for (const s of this.sublayers) {
      const native = (s as HasNative).getNativeLayer?.()
      if (native instanceof BaseLayer) {
        map.removeLayer(native)
        group.getLayers().push(native)
      }
    }

    this.olGroup = group
  }

  detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') return

    const { map } = adapter.openlayers!

    for (let i = this.sublayers.length - 1; i >= 0; i -= 1) {
      this.sublayers[i].detach(adapter)
    }
    this.sublayers = []

    if (this.olGroup) {
      map.removeLayer(this.olGroup)
      this.olGroup = undefined
    }
  }
}
