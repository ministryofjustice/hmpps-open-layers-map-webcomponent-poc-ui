import { Style } from 'ol/style'
import { Point, LineString } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import { Coordinate } from 'ol/coordinate'
import Feature from 'ol/Feature'
import ArrowStyle from '../../styles/arrow'
import LineStyle from '../../styles/line'
import {
  OLTracksLayer,
  getEntryVector,
  getExitVector,
  extendBeyondCircle,
  applyEntryExitToFeatures,
} from './tracks-layer'
import positions from '../../../../fixtures/positions.json'

describe('OLTracksLayer (OpenLayers library)', () => {
  it('should display a line, and arrows only when the segment is long enough at large resolution', () => {
    const resolution = 1500
    const layer = new OLTracksLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!

    // Short segment
    const shortFeature = features[1]
    const styles = styleFunction(shortFeature, resolution) as Array<Style>

    // Should only have a line, no arrows
    expect(styles[0]).toBeInstanceOf(LineStyle)
    const arrows = styles.filter(s => s instanceof ArrowStyle)
    expect(arrows.length).toBe(0)
  })

  it('should display a line, and one or more arrows for longer line segments when the resolution is small', () => {
    const resolution = 3
    const layer = new OLTracksLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!

    // Long segment
    const longFeature = features[4]
    const styles = styleFunction(longFeature, resolution) as Array<Style>

    expect(styles[0]).toBeInstanceOf(LineStyle)

    // Should include arrows
    const arrowStyles = styles.filter(s => s instanceof ArrowStyle)
    expect(arrowStyles.length).toBeGreaterThan(0)

    const line = styles[0] as LineStyle
    expect(line.getStroke()?.getWidth()).toBeCloseTo(1.78)
    expect(line.getStroke()?.getColor()).toBe('black')
  })

  it('should override the default style settings', () => {
    const layer = new OLTracksLayer({
      positions,
      style: { stroke: { color: 'red' } },
      title: '',
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!
    const style = styleFunction(features[0], 1) as Array<Style>
    expect(style[0].getStroke()?.getColor()).toBe('red')
  })

  it('should be hidden by default', () => {
    const layer = new OLTracksLayer({ positions, title: '' })
    expect(layer.getVisible()).toBeFalsy()
  })

  it('should override the default visibility', () => {
    const layer = new OLTracksLayer({ positions, title: '', visible: true })
    expect(layer.getVisible()).toBeTruthy()
  })

  it('should skip arrows that are within the collision distance of avoidCoordinates', () => {
    const resolution = 3
    const layer = new OLTracksLayer({ positions, title: '' })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!

    // Long segment
    const longFeature = features[4]
    const styles = styleFunction(longFeature, resolution) as Array<Style>
    const arrowStyles = styles.filter(s => s instanceof ArrowStyle)
    expect(arrowStyles.length).toBeGreaterThan(0)

    // pick an arrow coordinate to block
    const arrowPoint = arrowStyles[0].getGeometry() as Point
    const avoidPosition = arrowPoint.getCoordinates()
    const toPosition = (coord: Coordinate) => ({
      longitude: coord[0],
      latitude: coord[1],
      precision: 0,
    })

    // Re-create layer with avoidPositions containing that coordinate
    const avoidLayer = new OLTracksLayer({
      positions,
      title: '',
      avoidPositions: [toPosition(avoidPosition)],
    })
    const avoidSource = avoidLayer.getSource()
    const avoidFeatures = avoidSource?.getFeatures() || []
    const avoidStyleFunction = avoidLayer.getStyleFunction()!
    const avoidStyles = avoidStyleFunction(avoidFeatures[4], resolution) as Array<Style>
    const avoidArrowStyles = avoidStyles.filter(s => s instanceof ArrowStyle)

    // Expect one less arrow
    expect(avoidArrowStyles.length).toBe(arrowStyles.length - 1)
  })

  it('draws no arrows on the entry line and exactly one arrow at the tip of the exit line', () => {
    const resolution = 3
    const layer = new OLTracksLayer({
      positions,
      title: '',
      entryExit: { enabled: true, extensionDistanceMeters: 50 },
    })
    const source = layer.getSource()
    const features = source?.getFeatures() || []
    const styleFunction = layer.getStyleFunction()!

    // applyEntryExitToFeatures tags the entry/exit features; VectorSource does not preserve insertion order
    const entryFeature = features.find(f => f.get('trackSegmentType') === 'entry')!
    const exitFeature = features.find(f => f.get('trackSegmentType') === 'exit')!

    expect(entryFeature).toBeDefined()
    expect(exitFeature).toBeDefined()

    const entryStyles = styleFunction(entryFeature, resolution) as Array<Style>
    expect(entryStyles[0]).toBeInstanceOf(LineStyle)
    expect(entryStyles.filter(s => s instanceof ArrowStyle).length).toBe(0)

    const exitStyles = styleFunction(exitFeature, resolution) as Array<Style>
    expect(exitStyles[0]).toBeInstanceOf(LineStyle)
    const exitArrows = exitStyles.filter(s => s instanceof ArrowStyle)
    expect(exitArrows.length).toBe(1)

    // The arrow should sit at the tip (end) of the exit line, not drawn at intervals part way along it
    const exitGeometry = exitFeature.getGeometry()!
    const exitCoords = exitGeometry.getCoordinates()
    const tip = exitCoords[exitCoords.length - 1]
    const arrowCoord = (exitArrows[0].getGeometry() as Point).getCoordinates()
    expect(arrowCoord[0]).toBeCloseTo(tip[0])
    expect(arrowCoord[1]).toBeCloseTo(tip[1])
  })
})

describe('Entry / Exit vector logic', () => {
  it('getEntryVector uses direction property (reversed)', () => {
    const testPositions = [{ longitude: 0, latitude: 0, direction: 90 }] as any

    const result = getEntryVector(testPositions, 'direction', 'degrees')

    expect(result![0]).toBeCloseTo(-1)
    expect(result![1]).toBeCloseTo(0)
  })

  it('getEntryVector falls back to segment direction', () => {
    const testPositions = [
      { longitude: 0, latitude: 0 },
      { longitude: 10, latitude: 0 },
    ] as any

    const result = getEntryVector(testPositions)

    expect(result![0]).toBeCloseTo(-1)
  })

  it('getExitVector uses direction property', () => {
    const testPositions = [{ longitude: 0, latitude: 0, direction: 90 }] as any

    const result = getExitVector(testPositions, 'direction', 'degrees')

    expect(result![0]).toBeCloseTo(1)
    expect(result![1]).toBeCloseTo(0)
  })

  it('getExitVector falls back to segment direction', () => {
    const testPositions = [
      { longitude: 0, latitude: 0 },
      { longitude: 10, latitude: 0 },
    ] as any

    const result = getExitVector(testPositions)

    expect(result![0]).toBeCloseTo(1)
  })
})

describe('extendBeyondCircle', () => {
  it('extends beyond geodesic polygon boundary when intersecting', () => {
    const centre: [number, number] = [0, 0]
    const coord = fromLonLat([0, 0])
    const direction: [number, number] = [1, 0]

    const result = extendBeyondCircle(coord, direction, centre, 100, 5)

    expect(result[0]).toBeGreaterThan(coord[0])
  })

  it('falls back when no intersection', () => {
    const centre: [number, number] = [0, 10]
    const coord = fromLonLat([0, 0])
    const direction: [number, number] = [1, 0]

    const result = extendBeyondCircle(coord, direction, centre, 5, 5)

    expect(result[0]).toBeGreaterThan(coord[0])
  })
})

describe('applyEntryExitToFeatures', () => {
  it('adds entry and exit features', () => {
    const features = [
      new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 0],
        ]),
      }),
    ]

    const testPositions = [
      { longitude: 0, latitude: 0 },
      { longitude: 10, latitude: 0 },
    ] as any

    applyEntryExitToFeatures(features, testPositions, {
      enabled: true,
      extensionDistanceMeters: 10,
    })

    expect(features.length).toBe(3)
  })

  it('supports a single shared property name for entry and exit (string form, backwards compatible)', () => {
    const features = [
      new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 0],
        ]),
      }),
    ]

    const testPositions = [
      { longitude: 0, latitude: 0, direction: 90 },
      { longitude: 10, latitude: 0, direction: 90 },
    ] as any

    applyEntryExitToFeatures(features, testPositions, {
      enabled: true,
      extensionDistanceMeters: 10,
      direction: { property: 'direction', units: 'degrees' },
    })

    expect(features.length).toBe(3)

    const entryCoords = features[0].getGeometry()!.getCoordinates()
    const exitCoords = features[2].getGeometry()!.getCoordinates()

    // direction: 90° (East) → entry tail extends West (reversed), exit tail extends East (as-is)
    expect(entryCoords[0][0]).toBeLessThan(entryCoords[1][0])
    expect(exitCoords[1][0]).toBeGreaterThan(exitCoords[0][0])
  })

  it('does nothing when disabled', () => {
    const features = [
      new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 0],
        ]),
      }),
    ]

    const testPositions = [
      { longitude: 0, latitude: 0 },
      { longitude: 10, latitude: 0 },
    ] as any

    applyEntryExitToFeatures(features, testPositions, { enabled: false })

    expect(features.length).toBe(1)
  })

  it('supports separate entry/exit property names (single point)', () => {
    const features = [
      new Feature({
        geometry: new LineString([[0, 0]]),
      }),
    ]

    // A single point can carry distinct entry and exit bearings simultaneously,
    // which a single shared property name could not represent.
    const testPositions = [{ longitude: 0, latitude: 0, entryBearing: 90, exitBearing: 180 }] as any

    applyEntryExitToFeatures(features, testPositions, {
      enabled: true,
      extensionDistanceMeters: 10,
      direction: { property: { entry: 'entryBearing', exit: 'exitBearing' }, units: 'degrees' },
    })

    expect(features.length).toBe(3)

    const entryCoords = features[0].getGeometry()!.getCoordinates()
    const exitCoords = features[2].getGeometry()!.getCoordinates()

    // Entry tail extends opposite the entry bearing (90° = East), exit tail extends along the exit bearing (180° = South)
    expect(entryCoords[0][0]).toBeLessThan(entryCoords[1][0])
    expect(exitCoords[1][1]).toBeLessThan(exitCoords[0][1])
  })
})
