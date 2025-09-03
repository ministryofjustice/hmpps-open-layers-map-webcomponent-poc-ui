import { transform } from 'ol/proj'
import type OlMap from 'ol/Map'
import type View from 'ol/View'
import LocationDisplayControl from './location-display-control'
import { formatDMS, formatLatLon } from '../../helpers/coordinates'

jest.mock('ol/control/Control', () => {
  return class MockControl {
    element: HTMLElement

    private _map: OlMap | null = null

    constructor(opts: { element: HTMLElement }) {
      this.element = opts.element
    }

    setMap(map: OlMap | null) {
      this._map = map
    }
  }
})

jest.mock('../../helpers/coordinates', () => ({
  formatDMS: jest.fn(() => 'DMS_FORMAT'),
  formatLatLon: jest.fn(() => 'LATLON_FORMAT'),
}))

jest.mock('ol/proj', () => ({
  transform: jest.fn(coords => coords),
}))

describe('LocationDisplayControl', () => {
  let mapMock: Partial<OlMap>
  let viewMock: Partial<View>

  beforeEach(() => {
    jest.clearAllMocks()

    viewMock = {
      getCenter: jest.fn().mockReturnValue([10, 20]),
    }

    mapMock = {
      on: jest.fn(),
      un: jest.fn(),
      getView: jest.fn(() => viewMock as View),
    }
  })

  it('defaults to latlon mode and pointer source', () => {
    const ctrl = new LocationDisplayControl()
    const internal = ctrl as unknown as { mode: string; source: string }
    expect(internal.mode).toBe('latlon')
    expect(internal.source).toBe('pointer')
  })

  it('subscribes to pointermove when source=pointer', () => {
    const ctrl = new LocationDisplayControl({ source: 'pointer' })
    ctrl.setMap(mapMock as OlMap)
    expect(mapMock.on).toHaveBeenCalledWith('pointermove', expect.any(Function))
  })

  it('subscribes to moveend when source=centre', () => {
    const ctrl = new LocationDisplayControl({ source: 'centre' })
    ctrl.setMap(mapMock as OlMap)
    expect(mapMock.on).toHaveBeenCalledWith('moveend', expect.any(Function))
  })

  it('updates text on moveend in latlon mode', () => {
    const ctrl = new LocationDisplayControl({ source: 'centre', mode: 'latlon' })
    ctrl.setMap(mapMock as OlMap)

    const internal = ctrl as unknown as { onMoveEnd: () => void; el: HTMLElement }
    internal.onMoveEnd()

    expect(transform).toHaveBeenCalledWith([10, 20], 'EPSG:3857', 'EPSG:4326')
    expect(formatLatLon).toHaveBeenCalled()
    expect(internal.el.textContent).toBe('LATLON_FORMAT')
  })

  it('updates text on pointermove in dms mode', () => {
    const ctrl = new LocationDisplayControl({ source: 'pointer', mode: 'dms' })
    ctrl.setMap(mapMock as OlMap)

    const evt = { coordinate: [30, 40] }
    const internal = ctrl as unknown as {
      onPointerMove: (e: { coordinate: number[] }) => void
      el: HTMLElement
    }
    internal.onPointerMove(evt)

    expect(transform).toHaveBeenCalledWith([30, 40], 'EPSG:3857', 'EPSG:4326')
    expect(formatDMS).toHaveBeenCalled()
    expect(internal.el.textContent).toBe('DMS_FORMAT')
  })

  it('cleans up listeners when map is unset', () => {
    const ctrl = new LocationDisplayControl()
    ctrl.setMap(mapMock as OlMap)
    ctrl.setMap(null)
    expect(mapMock.un).toHaveBeenCalled()
  })
})
