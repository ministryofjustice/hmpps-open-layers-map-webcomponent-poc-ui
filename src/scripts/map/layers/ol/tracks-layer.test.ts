import { Style } from 'ol/style'
import ArrowStyle from '../../styles/arrow'
import LineStyle from '../../styles/line'
import { OLTracksLayer } from './tracks-layer'

const positions = [
  {
    latitude: 51.574865,
    longitude: 0.060977,
  },
  {
    latitude: 51.574153,
    longitude: 0.058536,
  },
  {
    latitude: 51.573248244162706,
    longitude: 0.05111371418603764,
  },
  {
    latitude: 51.574622,
    longitude: 0.048643,
  },
  {
    latitude: 51.57610341773559,
    longitude: 0.048391168020475,
  },
  {
    latitude: 51.576400900843375,
    longitude: 0.045439341454295505,
  },
]

describe('OLTracksLayer (OpenLayers library)', () => {
  it('should display a single line and arrow for each line segment when the resolution is large', () => {
    const resolution = 1500
    const layer = new OLTracksLayer(positions, '', true, 1)
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, resolution)) as Array<Array<Style>>

    expect(featureStyles).toHaveLength(5)
    expect(featureStyles[0]).toHaveLength(2)
    expect(featureStyles[0][0]).toBeInstanceOf(LineStyle)
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
    const layer = new OLTracksLayer(positions, '', true, 1)
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const featureStyles = features.map(feature => styleFunction(feature, resolution)) as Array<Array<Style>>

    expect(featureStyles).toHaveLength(5)
    expect(featureStyles[0]).toHaveLength(3)
    expect(featureStyles[0][0]).toBeInstanceOf(LineStyle)
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

  it('should make the layer visible', () => {
    const layer = new OLTracksLayer(positions, '', true, 1)

    expect(layer.getVisible()).toBeTruthy()
  })

  it('should make the layer hidden', () => {
    const layer = new OLTracksLayer(positions, '', false, 1)

    expect(layer.getVisible()).toBeFalsy()
  })
})
