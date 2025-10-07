import { Style } from 'ol/style'
import { OLNumberingLayer } from './numbering-layer'
import positions from '../../../../../tests/fixtures/positions'

describe('OLNumberingLayer (OpenLayers library)', () => {
  it('should display a single text style for each position', () => {
    const layer = new OLNumberingLayer({
      positions,
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, 0)) as Array<Array<Style>>

    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[0]).toHaveLength(1)
    expect(featureStyles[0][0].getText()?.getText()).toBe('0')
    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[1]).toHaveLength(1)
    expect(featureStyles[1][0].getText()?.getText()).toBe('1')
    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[2]).toHaveLength(1)
    expect(featureStyles[2][0].getText()?.getText()).toBe('2')
    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[3]).toHaveLength(1)
    expect(featureStyles[3][0].getText()?.getText()).toBe('3')
    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[4]).toHaveLength(1)
    expect(featureStyles[4][0].getText()?.getText()).toBe('4')
    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[5]).toHaveLength(1)
    expect(featureStyles[5][0].getText()?.getText()).toBe('5')
  })

  it('should not display a style if the numbering property is undefined', () => {
    const layer = new OLNumberingLayer({
      numberProperty: 'unknown',
      positions,
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, 0)) as Array<Array<Style>>

    expect(featureStyles).toHaveLength(6)
    expect(featureStyles[0]).toHaveLength(0)
    expect(featureStyles[1]).toHaveLength(0)
    expect(featureStyles[2]).toHaveLength(0)
    expect(featureStyles[3]).toHaveLength(0)
    expect(featureStyles[4]).toHaveLength(0)
    expect(featureStyles[5]).toHaveLength(0)
  })

  it('should use the default style by default', () => {
    const layer = new OLNumberingLayer({
      positions,
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const style = styleFunction(features[0], 0) as Array<Style>

    expect(style[0].getText()?.getFill()?.getColor()).toBe('black')
    expect(style[0].getText()?.getStroke()?.getColor()).toBe('white')
    expect(style[0].getText()?.getStroke()?.getWidth()).toBe(2)
    expect(style[0].getText()?.getOffsetX()).toBe(12)
    expect(style[0].getText()?.getOffsetY()).toBe(1)
    expect(style[0].getText()?.getFont()).toBe('bold 14px "GDS Transport", system-ui, sans-serif')
  })

  it('should override the default style settings', () => {
    const layer = new OLNumberingLayer({
      positions,
      style: {
        fill: '#fff',
        font: 'sans-serif',
        offset: {
          x: 20,
          y: 10,
        },
        stroke: {
          color: '#000',
          width: 1,
        },
      },
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const style = styleFunction(features[0], 0) as Array<Style>

    expect(style[0].getText()?.getFill()?.getColor()).toBe('#fff')
    expect(style[0].getText()?.getStroke()?.getColor()).toBe('#000')
    expect(style[0].getText()?.getStroke()?.getWidth()).toBe(1)
    expect(style[0].getText()?.getOffsetX()).toBe(20)
    expect(style[0].getText()?.getOffsetY()).toBe(10)
    expect(style[0].getText()?.getFont()).toBe('sans-serif')
  })

  it('should be hidden by default', () => {
    const layer = new OLNumberingLayer({
      positions,
      title: '',
    })

    expect(layer.getVisible()).toBeFalsy()
  })

  it('should override the default visibility', () => {
    const layer = new OLNumberingLayer({
      positions,
      title: '',
      visible: true,
    })

    expect(layer.getVisible()).toBeTruthy()
  })
})
