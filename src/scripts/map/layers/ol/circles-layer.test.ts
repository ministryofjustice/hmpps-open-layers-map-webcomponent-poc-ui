import { Style } from 'ol/style'
import { Circle } from 'ol/geom'
import { Feature } from 'ol'
import { OLCirclesLayer } from './circles-layer'
import positions from '../../../../../tests/fixtures/positions'

describe('OLCirclesLayer (OpenLayers library)', () => {
  it('should display a single circle using the precision as radius for each position', () => {
    const layer = new OLCirclesLayer({
      positions,
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []

    expect(features).toHaveLength(6)
    expect(features.map(feature => (feature as Feature<Circle>).getGeometry()?.getRadius())).toEqual([
      100, 400, 25, 10, 0, 20,
    ])
  })

  it('should use the default style by default', () => {
    const layer = new OLCirclesLayer({
      positions,
      title: '',
    })
    const style = layer.getStyle() as Style

    expect(style.getFill()?.getColor()).toBe('rgba(255, 165, 0, 0.1)')
    expect(style.getStroke()?.getColor()).toBe('orange')
    expect(style.getStroke()?.getWidth()).toBe(2)
  })

  it('should override the default style settings', () => {
    const layer = new OLCirclesLayer({
      positions,
      style: {
        fill: '#fff',
        stroke: {
          color: '#000',
          width: 1,
        },
      },
      title: '',
    })
    const style = layer.getStyle() as Style

    expect(style.getFill()?.getColor()).toBe('#fff')
    expect(style.getStroke()?.getColor()).toBe('#000')
    expect(style.getStroke()?.getWidth()).toBe(1)
  })

  it('should be hidden by default', () => {
    const layer = new OLCirclesLayer({
      positions,
      title: '',
    })

    expect(layer.getVisible()).toBeFalsy()
  })

  it('should override the default visibility', () => {
    const layer = new OLCirclesLayer({
      positions,
      title: '',
      visible: true,
    })

    expect(layer.getVisible()).toBeTruthy()
  })
})
