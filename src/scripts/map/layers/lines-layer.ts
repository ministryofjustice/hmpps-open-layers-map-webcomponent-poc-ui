import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Stroke, Style } from 'ol/style'
import type Feature from 'ol/Feature'
import type { LineString } from 'ol/geom'
import type { FeatureCollection } from 'geojson'
import type { ComposableLayer, LayerStateOptions } from './base'
import type { MapAdapter } from '../map-adapter'

type OLLineFeature = Feature<LineString>
type OLVecSource = VectorSource<OLLineFeature>
type OLVecLayer = VectorLayer<OLVecSource>

export type LinesLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: {
    width?: number
    color?: string
  }
}

export type LinesLayerConstructorOptions = LinesLayerOptions & {
  geoJson: FeatureCollection
}

function buildOlStyle(style?: LinesLayerOptions['style']) {
  return new Style({
    stroke: new Stroke({
      width: style?.width ?? 2,
      color: style?.color ?? 'black',
    }),
  })
}

function filterToLineFeatures(geoJson: FeatureCollection): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: geoJson.features.filter(f => f.geometry?.type === 'LineString'),
  }
}

function toOlSource(geoJson: FeatureCollection): OLVecSource {
  const onlyLines = filterToLineFeatures(geoJson)
  const formatter = new GeoJSON()
  const features = formatter.readFeatures(onlyLines, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  }) as OLLineFeature[]
  return new VectorSource<OLLineFeature>({ features })
}

export class LinesLayer implements ComposableLayer<OLVecLayer> {
  public readonly id: string

  private readonly options: LinesLayerConstructorOptions

  private olLayer?: OLVecLayer

  constructor(options: LinesLayerConstructorOptions) {
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
    const layer = new VectorLayer({
      source: toOlSource(this.options.geoJson),
      style: buildOlStyle(this.options.style),
      properties: { title: this.options.title ?? this.id },
    }) as OLVecLayer

    const resolvedVisible = layerStateOptions?.visible ?? this.options.visible ?? true
    const resolvedZIndex = layerStateOptions?.zIndex ?? this.options.zIndex

    layer.setVisible(resolvedVisible)
    if (resolvedZIndex !== undefined) layer.setZIndex(resolvedZIndex)

    map.addLayer(layer)
    this.olLayer = layer
  }

  detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') return
    if (this.olLayer) {
      adapter.openlayers!.map.removeLayer(this.olLayer)
      this.olLayer = undefined
    }
  }
}
