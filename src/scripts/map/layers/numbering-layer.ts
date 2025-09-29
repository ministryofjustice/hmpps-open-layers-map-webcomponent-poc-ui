import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Fill, Stroke, Text, Style } from 'ol/style'
import type Feature from 'ol/Feature'
import type Geometry from 'ol/geom/Geometry'
import type { FeatureCollection } from 'geojson'
import type { ComposableLayer } from './base'
import type { MapAdapter } from '../map-adapter'

type OLVecSource = VectorSource<Feature<Geometry>>
type OLVecLayer = VectorLayer<OLVecSource>

export type NumberingLayerOptions = {
  id?: string
  title?: string
  visible?: boolean
  zIndex?: number
  font?: string
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  offsetX?: number
  offsetY?: number
  numberProperty?: string
  geoJson: FeatureCollection
}

// Style function that renders numbers from a feature property
function createNumberingStyle(
  value: string,
  options: Omit<NumberingLayerOptions, 'id' | 'title' | 'visible' | 'zIndex' | 'geoJson'>,
) {
  return new Style({
    text: new Text({
      textAlign: 'left',
      textBaseline: 'middle',
      font: options.font ?? 'bold 14px "GDS Transport", system-ui, sans-serif',
      fill: new Fill({ color: options.fillColor ?? 'black' }),
      stroke: new Stroke({
        color: options.strokeColor ?? 'white',
        width: options.strokeWidth ?? 2,
      }),
      text: value,
      offsetX: options.offsetX ?? 12,
      offsetY: options.offsetY ?? 1,
    }),
  })
}

function toOlSource(geoJson: FeatureCollection): OLVecSource {
  const formatter = new GeoJSON()
  const features = formatter.readFeatures(geoJson, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
  return new VectorSource({ features })
}

export class NumberingLayer implements ComposableLayer<OLVecLayer> {
  public readonly id: string

  private readonly options: NumberingLayerOptions

  private olLayer?: OLVecLayer

  constructor(options: NumberingLayerOptions) {
    this.options = options
    this.id = options.id ?? 'numbering'
  }

  getNativeLayer(): OLVecLayer | undefined {
    return this.olLayer
  }

  attach(adapter: MapAdapter): void {
    if (adapter.mapLibrary !== 'openlayers') {
      console.warn(`[NumberingLayer] MapLibre support is not implemented yet (layer "${this.id}")`)
      return
    }

    const { map } = adapter.openlayers!
    const property = this.options.numberProperty ?? 'sequenceNumber'

    const vectorLayer = new VectorLayer({
      source: toOlSource(this.options.geoJson),
      style: feature => {
        const value = feature.get(property)
        return value ? createNumberingStyle(String(value), this.options) : undefined
      },
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
