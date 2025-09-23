import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Fill, Stroke, Style } from 'ol/style'
import { Circle as CircleGeom, Point } from 'ol/geom'
import Feature from 'ol/Feature'

import type { FeatureCollection } from 'geojson'
import type { ComposableLayer } from './base'
import type { MapAdapter } from '../map-adapter'

type OLCircleFeature = Feature<CircleGeom>
type OLVecSource = VectorSource<OLCircleFeature>
type OLVecLayer = VectorLayer<OLVecSource>

export type CirclesLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  style?: Style
  radiusProperty?: string
  geoJson: FeatureCollection
}

const defaultStyle = new Style({
  stroke: new Stroke({
    color: 'orange',
    width: 2,
  }),
  fill: new Fill({
    color: 'rgba(255, 165, 0, 0.1)',
  }),
})

function toOlSource(geoJson: FeatureCollection, radiusProperty: string): OLVecSource {
  const formatter = new GeoJSON()
  const pointFeatures = formatter.readFeatures(geoJson, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  }) as Array<Feature<Point>>

  const circleFeatures = pointFeatures.map(feature => {
    const geom = feature.getGeometry() as Point
    const coords = geom.getCoordinates()
    const radius = feature.get(radiusProperty)
    const circle = new CircleGeom(coords, radius)

    return new Feature({ geometry: circle }) as OLCircleFeature
  })

  return new VectorSource<OLCircleFeature>({ features: circleFeatures })
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
    const radiusProp = this.options.radiusProperty ?? 'confidence'

    const vectorLayer = new VectorLayer({
      source: toOlSource(this.options.geoJson, radiusProp),
      style: this.options.style ?? defaultStyle,
      properties: { title: this.options.title ?? this.id },
    }) as OLVecLayer

    const resolvedVisible = this.options.visible ?? false
    const resolvedZIndex = this.options.zIndex

    vectorLayer.setVisible(resolvedVisible)
    if (resolvedZIndex !== undefined) vectorLayer.setZIndex(resolvedZIndex)

    map.addLayer(vectorLayer)
    this.olLayer = vectorLayer
  }

  detach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') return
    if (this.olLayer) {
      adapter.openlayers!.map.removeLayer(this.olLayer)
      this.olLayer = undefined
    }
  }
}
