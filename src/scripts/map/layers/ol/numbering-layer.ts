import Position from '@scripts/map/types/position'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style, Text } from 'ol/style'
import { FeatureLike } from 'ol/Feature'
import { createPointFeatureCollectionFromPositions } from '../../features/point'

type OLNumberingLayerStyle = {
  fill: string
  font: string
  offset: {
    x: number
    y: number
  }
  stroke: {
    color: string
    width: number
  }
}

type OLNumberingLayerOptions = {
  numberProperty?: string
  positions: Array<Position>
  style?: OLNumberingLayerStyle
  title: string
  visible?: boolean
  zIndex?: number
}

const DEFAULT_NUMBER_PROPERTY = 'sequenceNumber'
const DEFAULT_FONT = 'bold 14px "GDS Transport", system-ui, sans-serif'
const DEFAULT_FILL = 'black'
const DEFAULT_STROKE_COLOR = 'white'
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_OFFSET_X = 12
const DEFAULT_OFFSET_Y = 1
const DEFAULT_VISIBILITY = false
const DEFAULT_STYLE: OLNumberingLayerStyle = {
  fill: DEFAULT_FILL,
  font: DEFAULT_FONT,
  offset: {
    x: DEFAULT_OFFSET_X,
    y: DEFAULT_OFFSET_Y,
  },
  stroke: {
    color: DEFAULT_STROKE_COLOR,
    width: DEFAULT_STROKE_WIDTH,
  },
}

const createStyleFunction =
  (style: OLNumberingLayerStyle, property: string) =>
  (feature: FeatureLike): Array<Style> => {
    const value = feature.get(property)

    console.log(feature)

    if (value !== undefined) {
      return [
        new Style({
          text: new Text({
            textAlign: 'left',
            textBaseline: 'middle',
            font: style.font,
            fill: new Fill({ color: style.fill }),
            stroke: new Stroke({
              color: style.stroke.color,
              width: style.stroke.width,
            }),
            text: String(feature.get(property)),
            offsetX: style.offset.x,
            offsetY: style.offset.y,
          }),
        }),
      ]
    }

    return []
  }

export class OLNumberingLayer extends VectorLayer<VectorSource<Feature<Point>>> {
  constructor({
    numberProperty = DEFAULT_NUMBER_PROPERTY,
    positions,
    style = DEFAULT_STYLE,
    title,
    visible = DEFAULT_VISIBILITY,
    zIndex,
  }: OLNumberingLayerOptions) {
    super({
      properties: {
        title,
      },
      source: new VectorSource({
        features: createPointFeatureCollectionFromPositions(positions),
      }),
      style: createStyleFunction(style, numberProperty),
      visible,
      zIndex,
    })
  }
}
