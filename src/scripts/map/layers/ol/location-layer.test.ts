import { Style } from 'ol/style'
import CircleStyle from 'ol/style/Circle'
import { OLLocationsLayer } from './locations-layer'
import positions from '../../../../../tests/fixtures/positions'

describe('OLLocationsLayer (OpenLayers library)', () => {
  it('should display a single point for each position', () => {
    const layer = new OLLocationsLayer({
      positions,
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []

    expect(features).toHaveLength(6)
  })

  it('should use the default style by default', () => {
    const layer = new OLLocationsLayer({
      positions,
      title: '',
    })
    const style = layer.getStyle() as Style
    const image = style.getImage() as CircleStyle

    expect(image).toBeInstanceOf(CircleStyle)
    expect(image.getRadius()).toBe(6)
    expect(image.getFill()?.getColor()).toBe('#d4351c')
    expect(image.getStroke()?.getColor()).toBe('#505a5f')
    expect(image.getStroke()?.getWidth()).toBe(2)
  })

  it('should override the default style settings', () => {
    const layer = new OLLocationsLayer({
      positions,
      style: {
        fill: '#fff',
        radius: 10,
        stroke: {
          color: '#000',
          width: 1,
        },
      },
      title: '',
    })
    const style = layer.getStyle() as Style
    const image = style.getImage() as CircleStyle

    expect(image).toBeInstanceOf(CircleStyle)
    expect(image.getRadius()).toBe(10)
    expect(image.getFill()?.getColor()).toBe('#fff')
    expect(image.getStroke()?.getColor()).toBe('#000')
    expect(image.getStroke()?.getWidth()).toBe(1)
  })

  it('should be hidden by default', () => {
    const layer = new OLLocationsLayer({
      positions,
      title: '',
    })

    expect(layer.getVisible()).toBeFalsy()
  })

  it('should override the default visibility', () => {
    const layer = new OLLocationsLayer({
      positions,
      title: '',
      visible: true,
    })

    expect(layer.getVisible()).toBeTruthy()
  })
})
