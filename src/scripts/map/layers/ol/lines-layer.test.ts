import { Style } from 'ol/style'
import LineStyle from '../../styles/line'
import { OLLinesLayer } from './lines-layer'
import positions from '../../../../../tests/fixtures/positions'

describe('OLTracksLayer (OpenLayers library)', () => {
  it('should display a single thin line for each line segment when the resolution is large', () => {
    const resolution = 1500
    const layer = new OLLinesLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, resolution)) as Array<Style>

    expect(featureStyles).toHaveLength(5)
    expect(featureStyles[0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[0].getStroke()?.getWidth()).toBe(1.25)
    expect(featureStyles[1]).toBeInstanceOf(LineStyle)
    expect(featureStyles[1].getStroke()?.getWidth()).toBe(1.25)
    expect(featureStyles[2]).toBeInstanceOf(LineStyle)
    expect(featureStyles[2].getStroke()?.getWidth()).toBe(1.25)
    expect(featureStyles[3]).toBeInstanceOf(LineStyle)
    expect(featureStyles[3].getStroke()?.getWidth()).toBe(1.25)
    expect(featureStyles[4]).toBeInstanceOf(LineStyle)
    expect(featureStyles[4].getStroke()?.getWidth()).toBe(1.25)
  })

  it('should display a single line and one or more arrows for each line segment when the resolution is small', () => {
    const resolution = 0.15
    const layer = new OLLinesLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, resolution)) as Array<Style>

    expect(featureStyles).toHaveLength(5)
    expect(featureStyles[0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[0].getStroke()?.getWidth()).toBe(2)
    expect(featureStyles[0].getStroke()?.getColor()).toBe('black')
    expect(featureStyles[1]).toBeInstanceOf(LineStyle)
    expect(featureStyles[1].getStroke()?.getWidth()).toBe(2)
    expect(featureStyles[1].getStroke()?.getColor()).toBe('black')
    expect(featureStyles[2]).toBeInstanceOf(LineStyle)
    expect(featureStyles[2].getStroke()?.getWidth()).toBe(2)
    expect(featureStyles[2].getStroke()?.getColor()).toBe('black')
    expect(featureStyles[3]).toBeInstanceOf(LineStyle)
    expect(featureStyles[3].getStroke()?.getWidth()).toBe(2)
    expect(featureStyles[3].getStroke()?.getColor()).toBe('black')
    expect(featureStyles[4]).toBeInstanceOf(LineStyle)
    expect(featureStyles[4].getStroke()?.getWidth()).toBe(2)
    expect(featureStyles[4].getStroke()?.getColor()).toBe('black')
  })

  it('should override the default style settings', () => {
    const layer = new OLLinesLayer({
      positions,
      style: {
        stroke: {
          color: 'red',
        },
      },
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const style = styleFunction(features[0], 0) as Style

    expect(style.getStroke()?.getColor()).toBe('red')
  })

  it('should be hidden by default', () => {
    const layer = new OLLinesLayer({
      positions,
      title: '',
    })

    expect(layer.getVisible()).toBeFalsy()
  })

  it('should override the default visibility', () => {
    const layer = new OLLinesLayer({
      positions,
      title: '',
      visible: true,
    })

    expect(layer.getVisible()).toBeTruthy()
  })
})
