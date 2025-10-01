import { Coordinate } from 'ol/coordinate'
import { Point } from 'ol/geom'
import { Fill, RegularShape, Style } from 'ol/style'

class ArrowStyle extends Style {
  constructor(coordinate: Coordinate, radius: number, rotation: number) {
    super({
      geometry: new Point(coordinate),
      image: new RegularShape({
        points: 3,
        radius,
        fill: new Fill({ color: 'black' }),
        rotation,
        rotateWithView: true,
      }),
    })
  }
}

export default ArrowStyle
