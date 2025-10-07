import { Style } from 'ol/style'
import ArrowStyle from '../../styles/arrow'
import LineStyle from '../../styles/line'
import { OLTracksLayer } from './tracks-layer'
import positions from '../../../../../tests/fixtures/positions'

describe('OLTracksLayer (OpenLayers library)', () => {
  it('should display a single line and arrow for each line segment when the resolution is large', () => {
    const resolution = 1500
    const layer = new OLTracksLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, resolution)) as Array<Array<Style>>

    expect(featureStyles).toHaveLength(5)
    expect(featureStyles[0]).toHaveLength(2)
    expect(featureStyles[0][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[0][0].getStroke()?.getWidth()).toBe(1.25)
    expect(featureStyles[0][0].getStroke()?.getColor()).toBe('black')
    expect(featureStyles[0][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[1]).toHaveLength(2)
    expect(featureStyles[1][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[1][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[2]).toHaveLength(2)
    expect(featureStyles[2][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[2][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[3]).toHaveLength(2)
    expect(featureStyles[3][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[3][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[4]).toHaveLength(2)
    expect(featureStyles[4][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[4][1]).toBeInstanceOf(ArrowStyle)
  })

  it('should display a single line and one or more arrows for each line segment when the resolution is small', () => {
    const resolution = 3
    const layer = new OLTracksLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, resolution)) as Array<Array<Style>>

    expect(featureStyles).toHaveLength(5)
    expect(featureStyles[0]).toHaveLength(3)
    expect(featureStyles[0][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[0][0].getStroke()?.getWidth()).toBeCloseTo(1.78)
    expect(featureStyles[0][0].getStroke()?.getColor()).toBe('black')
    expect(featureStyles[0][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[0][2]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[1]).toHaveLength(6)
    expect(featureStyles[1][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[1][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[1][2]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[1][3]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[1][4]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[1][5]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[2]).toHaveLength(3)
    expect(featureStyles[2][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[2][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[2][2]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[3]).toHaveLength(2)
    expect(featureStyles[3][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[3][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[4]).toHaveLength(3)
    expect(featureStyles[4][0]).toBeInstanceOf(LineStyle)
    expect(featureStyles[4][1]).toBeInstanceOf(ArrowStyle)
    expect(featureStyles[4][2]).toBeInstanceOf(ArrowStyle)
  })

  it('should override the default style settings', () => {
    const layer = new OLTracksLayer({
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
    const style = styleFunction(features[0], 1) as Array<Style>

    expect(style[0].getStroke()?.getColor()).toBe('red')
  })

  it('should be hidden by default', () => {
    const layer = new OLTracksLayer({
      positions,
      title: '',
    })

    expect(layer.getVisible()).toBeFalsy()
  })

  it('should override the default visibility', () => {
    const layer = new OLTracksLayer({
      positions,
      title: '',
      visible: true,
    })

    expect(layer.getVisible()).toBeTruthy()
  })
})
