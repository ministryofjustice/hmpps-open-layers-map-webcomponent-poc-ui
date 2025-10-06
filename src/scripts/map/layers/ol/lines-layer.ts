import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature, { FeatureLike } from 'ol/Feature'
import { Style } from 'ol/style'
import { LineString } from 'ol/geom'
import LineStyle from '../../styles/line'
import { createLineStringFeatureCollectionFromPositions } from '../../features/line-string'
import Position from '../../types/position'

type OLLinesLayerStyle = {
  stroke: {
    color: string
  }
}

type OLLinesLayerOptions = {
  positions: Array<Position>
  style?: OLLinesLayerStyle
  title: string
  visible?: boolean
  zIndex?: number
}

const createStyleFunction =
  (style: OLLinesLayerStyle) =>
  (_: FeatureLike, resolution: number): Style => {
    return new LineStyle(style.stroke.color, resolution)
  }

const DEFAULT_VISIBILITY = false
const DEFAULT_STROKE_COLOR = 'black'
const DEFAULT_STYLE: OLLinesLayerStyle = {
  stroke: {
    color: DEFAULT_STROKE_COLOR,
  },
}

export class OLLinesLayer extends VectorLayer<VectorSource<Feature<LineString>>> {
  constructor({ positions, style = DEFAULT_STYLE, title, visible = DEFAULT_VISIBILITY, zIndex }: OLLinesLayerOptions) {
    super({
      properties: {
        title,
      },
      source: new VectorSource({ features: createLineStringFeatureCollectionFromPositions(positions) }),
      style: createStyleFunction(style),
      visible,
      zIndex,
    })
  }
}
