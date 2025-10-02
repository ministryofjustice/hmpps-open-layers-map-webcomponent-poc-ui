import { Coordinate } from 'ol/coordinate'
import { Point } from 'ol/geom'
import { Fill, RegularShape, Style } from 'ol/style'
import { clamp } from '../../helpers/math'

const MIN_RESOLUTION = 10
const MIN_RADIUS = 4
const MAX_RESOLUTION = 0.15
const MAX_RADIUS = 6

// Scale the arrow radius linearly using a line of form y=mx+c
const scaleArrowRadiusWithResolution = (resolution: number): number => {
  const slope = (MAX_RADIUS - MIN_RADIUS) / (MAX_RESOLUTION - MIN_RESOLUTION)
  const intercept = MIN_RADIUS - MIN_RESOLUTION * slope

  return clamp(slope * resolution + intercept, MIN_RADIUS, MAX_RADIUS)
}

class ArrowStyle extends Style {
  constructor(coordinate: Coordinate, resolution: number, rotation: number) {
    super({
      geometry: new Point(coordinate),
      image: new RegularShape({
        points: 3,
        radius: scaleArrowRadiusWithResolution(resolution),
        fill: new Fill({ color: 'black' }),
        rotation,
        rotateWithView: true,
      }),
    })
  }
}

export default ArrowStyle
