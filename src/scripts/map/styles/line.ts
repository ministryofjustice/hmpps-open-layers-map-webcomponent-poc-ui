import { Stroke, Style } from 'ol/style'

class LineStyle extends Style {
  constructor(width: number) {
    super({
      stroke: new Stroke({
        width,
        color: 'black',
      }),
    })
  }
}

export default LineStyle
