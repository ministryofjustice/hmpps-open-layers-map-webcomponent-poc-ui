import Position from '@scripts/map/types/position'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import CircleStyle from 'ol/style/Circle'
import { createPointFeatureCollectionFromPositions } from '../../features/point'

type OLLocationsLayerStyle = {
  fill: string
  radius: number
  stroke: {
    colour: string
    width: number
  }
}

type OLLocationsLayerOptions = {
  positions: Array<Position>
  style?: OLLocationsLayerStyle
  title: string
  visible?: boolean
  zIndex?: number
}

const DEFAULT_RADIUS = 6
const DEFAULT_FILL = '#d4351c'
const DEFAULT_STROKE_COLOUR = '#505a5f'
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_VISIBILITY = false
const DEFAULT_STYLE: OLLocationsLayerStyle = {
  fill: DEFAULT_FILL,
  radius: DEFAULT_RADIUS,
  stroke: {
    colour: DEFAULT_STROKE_COLOUR,
    width: DEFAULT_STROKE_WIDTH,
  },
}

export class OLLocationsLayer extends VectorLayer<VectorSource<Feature<Point>>> {
  constructor({
    positions,
    style = DEFAULT_STYLE,
    title,
    visible = DEFAULT_VISIBILITY,
    zIndex,
  }: OLLocationsLayerOptions) {
    super({
      properties: {
        title,
      },
      source: new VectorSource({
        features: createPointFeatureCollectionFromPositions(positions),
      }),
      style: new Style({
        image: new CircleStyle({
          radius: style.radius,
          fill: new Fill({ color: style.fill }),
          stroke: new Stroke({
            color: style.stroke.colour,
            width: style.stroke.width,
          }),
        }),
      }),
      visible,
      zIndex,
    })
  }
}
