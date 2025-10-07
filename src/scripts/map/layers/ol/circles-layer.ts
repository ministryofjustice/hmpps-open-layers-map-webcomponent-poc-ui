import { Feature } from 'ol'
import { Circle } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import Position from '../../types/position'
import { createCircleFeatureCollectionFromPositions } from '../../features/circle'

type OLCirclesLayerStyle = {
  fill: string
  stroke: {
    color: string
    width: number
  }
}

type OLCirclesLayerOptions = {
  positions: Array<Position>
  style?: OLCirclesLayerStyle
  title: string
  visible?: boolean
  zIndex?: number
}

const DEFAULT_FILL = 'rgba(255, 165, 0, 0.1)'
const DEFAULT_STROKE_COLOR = 'orange'
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_VISIBILITY = false
const DEFAULT_STYLE: OLCirclesLayerStyle = {
  fill: DEFAULT_FILL,
  stroke: {
    color: DEFAULT_STROKE_COLOR,
    width: DEFAULT_STROKE_WIDTH,
  },
}

export class OLCirclesLayer extends VectorLayer<VectorSource<Feature<Circle>>> {
  constructor({
    positions,
    style = DEFAULT_STYLE,
    title,
    visible = DEFAULT_VISIBILITY,
    zIndex,
  }: OLCirclesLayerOptions) {
    super({
      properties: {
        title,
      },
      source: new VectorSource({
        features: createCircleFeatureCollectionFromPositions(positions),
      }),
      style: new Style({
        fill: new Fill({ color: style.fill }),
        stroke: new Stroke({
          color: style.stroke.color,
          width: style.stroke.width,
        }),
      }),
      visible,
      zIndex,
    })
  }
}
