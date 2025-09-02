import maplibregl from 'maplibre-gl'

export interface MapLibreMapOptions extends Omit<maplibregl.MapOptions, 'container' | 'style'> {
  target: HTMLElement
  styleUrl: string
  enable3DControls?: boolean
}

export class MapLibreMapInstance extends maplibregl.Map {
  constructor(options: MapLibreMapOptions) {
    super({
      container: options.target,
      style: options.styleUrl,
      antialias: true,
      ...options,
    } as maplibregl.MapOptions & { antialias: boolean })
  }
}
