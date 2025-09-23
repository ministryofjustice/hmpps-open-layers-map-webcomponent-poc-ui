import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import type Feature from 'ol/Feature'
import type Geometry from 'ol/geom/Geometry'

import type { FeatureCollection } from 'geojson'
import type { ComposableLayer, LayerStateOptions } from './base'
import type { MapAdapter } from '../map-adapter'

type OLVecSrc = VectorSource<Feature<Geometry>>
type OLVecLayer = VectorLayer<OLVecSrc>

export type LocationsLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: {
    radius?: number
    fill?: string
    stroke?: { color?: string; width?: number }
  }
  geoJson: FeatureCollection
}

function buildOlStyle(style?: LocationsLayerOptions['style']) {
  return new Style({
    image: new CircleStyle({
      radius: style?.radius ?? 6,
      fill: new Fill({ color: style?.fill ?? '#d4351c' }),
      stroke: new Stroke({
        color: style?.stroke?.color ?? '#505a5f',
        width: style?.stroke?.width ?? 2,
      }),
    }),
  })
}

function filterToPointFeatures(geoJson: FeatureCollection): FeatureCollection {
  const features = geoJson.features.filter(f => f.geometry?.type === 'Point')
  return { type: 'FeatureCollection', features }
}

function toOlSource(geoJson: FeatureCollection) {
  const onlyPoints = filterToPointFeatures(geoJson)
  const formatter = new GeoJSON()
  const features = formatter.readFeatures(onlyPoints, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  }) as Array<Feature<Geometry>>
  return new VectorSource<Feature<Geometry>>({ features })
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
    if (adapter.mapLibrary === 'openlayers') {
      const { map } = adapter.openlayers!
      const source = toOlSource(this.options.geoJson)
      const vectorLayer = new VectorLayer({
        source,
        style: buildOlStyle(this.options.style),
        properties: { title: this.options.title ?? this.id },
      }) as OLVecLayer

      const resolvedVisible = layerStateOptions?.visible ?? this.options.visible ?? true
      const resolvedZIndex = layerStateOptions?.zIndex ?? this.options.zIndex

      vectorLayer.setVisible(resolvedVisible)
      if (resolvedZIndex !== undefined) vectorLayer.setZIndex(resolvedZIndex)

      map.addLayer(vectorLayer)
      this.olLayer = vectorLayer
      return
    }

    // MapLibre stub
    console.warn(`[LocationLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
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
