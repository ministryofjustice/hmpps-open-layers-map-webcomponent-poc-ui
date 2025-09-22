import type { MapAdapter } from '../map-adapter'

// Map-level placement hierarchy/display options for layers.
export type LayerStateOptions = {
  // MapLibre only: insert before this layer id. (OpenLayers ignores this)
  before?: string
  // OpenLayers only: z-order for the layer. (MapLibre uses order; no zIndex)
  zIndex?: number
  // Initial visibility. Defaults to true if omitted.
  visible?: boolean
}

// A layer that can be added/removed from a map via a MapAdapter.
export interface ComposableLayer<NativeLayer = unknown> {
  id: string
  attach(adapter: MapAdapter, options?: LayerStateOptions): void
  detach(adapter: MapAdapter): void
  getNativeLayer?(): NativeLayer | undefined
}
