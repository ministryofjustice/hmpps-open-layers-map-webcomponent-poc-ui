import { Stroke, Style } from 'ol/style'
import { clamp } from '../../helpers/math'

const MIN_RESOLUTION = 10
const MIN_WIDTH = 1.25
const MAX_RESOLUTION = 0.15
const MAX_WIDTH = 2

// Scale the line width linearly using a line of form y=mx+c
const scaleLineWidthWithResolution = (resolution: number): number => {
  const slope = (MAX_WIDTH - MIN_WIDTH) / (MAX_RESOLUTION - MIN_RESOLUTION)
  const intercept = MIN_WIDTH - MIN_RESOLUTION * slope

  return clamp(slope * resolution + intercept, MIN_WIDTH, MAX_WIDTH)
}

class LineStyle extends Style {
  constructor(strokeColor: string, resolution: number) {
    super({
      stroke: new Stroke({
        width: scaleLineWidthWithResolution(resolution),
        color: strokeColor,
      }),
    })
  }
}

export default LineStyle
