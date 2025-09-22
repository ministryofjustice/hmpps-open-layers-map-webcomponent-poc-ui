import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import { LineString, Point } from 'ol/geom'
import { GeoJSON } from 'ol/format'
import { unByKey } from 'ol/Observable'
import type { EventsKey } from 'ol/events'
import type { FeatureCollection } from 'geojson'
import type { ComposableLayer, LayerStateOptions } from './base'
import type { MapAdapter } from '../map-adapter'
import { generateArrowFeatures } from '../../helpers/map-features'

type OLLineSource = VectorSource<Feature<LineString>>
type OLPointSource = VectorSource<Feature<Point>>
type OLPointLayer = VectorLayer<OLPointSource>

function createLineSource(geoJson: FeatureCollection): OLLineSource {
  const onlyLines = {
    type: 'FeatureCollection',
    features: geoJson.features.filter(f => f.geometry?.type === 'LineString'),
  } as FeatureCollection

  const formatter = new GeoJSON()
  const features = formatter.readFeatures(onlyLines, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  }) as Array<Feature<LineString>>

  return new VectorSource<Feature<LineString>>({ features })
}

export type ArrowsLayerOptions = {
  id?: string
  title?: string
  arrowGenerator?: (zoom: number, lineSource: OLLineSource) => Array<Feature<Point>>
  visible?: boolean
  zIndex?: number
  enabled?: boolean
}

export type ArrowsLayerConstructorOptions = ArrowsLayerOptions & {
  geoJson: FeatureCollection
}

export class ArrowsLayer implements ComposableLayer<OLPointLayer> {
  public readonly id: string

  private readonly options: ArrowsLayerConstructorOptions

  private olLayer?: OLPointLayer

  private moveEndKey?: EventsKey

  constructor(options: ArrowsLayerConstructorOptions) {
    this.options = options
    this.id = options.id ?? 'arrows'
  }

  getNativeLayer(): OLPointLayer | undefined {
    return this.olLayer
  }

  attach(adapter: MapAdapter, layerStateOptions?: LayerStateOptions): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[ArrowsLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!
    const lineSource = createLineSource(this.options.geoJson)

    const arrowsSource = new VectorSource<Feature<Point>>()
    const arrowsLayer = new VectorLayer({
      source: arrowsSource,
      properties: { title: this.options.title ?? this.id },
    }) as OLPointLayer

    const renderArrows = () => {
      const zoom = map.getView().getZoom() ?? 0
      const generateArrows = this.options.arrowGenerator ?? generateArrowFeatures
      arrowsSource.clear()
      arrowsSource.addFeatures(generateArrows(zoom, lineSource))
    }

    this.moveEndKey = map.on('moveend', renderArrows)
    renderArrows()

    const resolvedVisible = layerStateOptions?.visible ?? this.options.visible ?? true
    const resolvedZIndex = layerStateOptions?.zIndex ?? this.options.zIndex

    arrowsLayer.setVisible(resolvedVisible)
    if (resolvedZIndex !== undefined) arrowsLayer.setZIndex(resolvedZIndex)

    map.addLayer(arrowsLayer)
    this.olLayer = arrowsLayer
  }

  detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') return
    if (this.moveEndKey) {
      unByKey(this.moveEndKey)
      this.moveEndKey = undefined
    }
    if (this.olLayer) {
      adapter.openlayers!.map.removeLayer(this.olLayer)
      this.olLayer = undefined
    }
  }
}
