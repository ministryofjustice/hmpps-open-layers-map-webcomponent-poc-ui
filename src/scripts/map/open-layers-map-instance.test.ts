import * as olControl from 'ol/control'
import { OLMapInstance } from './open-layers-map-instance'

import * as locationDisplayControl from './controls/location-display-control'
import * as ctrlDragRotate from './interactions/ctrl-drag-rotate'
import * as defaultView from './view/default-view'

const mockExtend = jest.fn()
const mockPush = jest.fn()

jest.mock('ol/Map', () =>
  jest.fn().mockImplementation(options => ({
    type: 'Map',
    options,
  })),
)

jest.mock('ol/interaction/defaults', () => ({
  defaults: jest.fn(() => ({
    extend: mockExtend,
  })),
}))

jest.mock('ol/control', () => ({
  defaults: jest.fn(() => ({
    extend: mockExtend,
    push: mockPush,
  })),
  Rotate: jest.fn().mockImplementation(opts => ({ type: 'Rotate', ...opts })),
  ScaleLine: jest.fn().mockImplementation(opts => ({ type: 'ScaleLine', ...opts })),
  ZoomSlider: jest.fn().mockImplementation(() => ({ type: 'ZoomSlider' })),
}))

jest.mock('./controls/location-display-control', () =>
  jest.fn().mockImplementation(opts => ({ type: 'LocationDisplayControl', ...opts })),
)

jest.mock('./interactions/ctrl-drag-rotate', () => jest.fn(() => ({ type: 'CtrlDragRotate' })))
jest.mock('./view/default-view', () => jest.fn(() => ({ type: 'DefaultView' })))

describe('MojMapInstance', () => {
  let target: HTMLElement

  beforeEach(() => {
    jest.clearAllMocks()
    target = document.createElement('div')
  })

  it('adds Rotate control when rotate option enabled', () => {
    new OLMapInstance({ target, controls: { rotate: true } })
    expect(olControl.Rotate).toHaveBeenCalledWith({ autoHide: false })
  })

  it('adds Rotate control with autoHide when specified', () => {
    new OLMapInstance({ target, controls: { rotate: { autoHide: true } } })
    expect(olControl.Rotate).toHaveBeenCalledWith({ autoHide: true })
  })

  it('does not add Rotate control when rotate = false', () => {
    new OLMapInstance({ target, controls: { rotate: false } })
    expect(olControl.Rotate).not.toHaveBeenCalled()
  })

  it('adds ScaleLine with bar option when scaleControl = bar', () => {
    new OLMapInstance({ target, controls: { scaleControl: 'bar' } })
    expect(olControl.ScaleLine).toHaveBeenCalledWith(expect.objectContaining({ bar: true, units: 'metric' }))
  })

  it('adds ScaleLine simple line when scaleControl = line', () => {
    new OLMapInstance({ target, controls: { scaleControl: 'line' } })
    expect(olControl.ScaleLine).toHaveBeenCalledWith(expect.objectContaining({ units: 'metric' }))
  })

  it('adds LocationDisplayControl when locationDisplay specified', () => {
    new OLMapInstance({ target, controls: { locationDisplay: 'dms', locationDisplaySource: 'centre' } })
    expect(locationDisplayControl.default).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'dms',
        source: 'centre',
        position: 'bottom-center',
      }),
    )
  })

  it('adds ZoomSlider when zoomSlider = true', () => {
    new OLMapInstance({ target, controls: { zoomSlider: true } })
    expect(olControl.ZoomSlider).toHaveBeenCalled()
  })

  it('always extends interactions with ctrl-drag-rotate', () => {
    const spy = jest.spyOn(ctrlDragRotate, 'default')
    new OLMapInstance({ target })
    expect(spy).toHaveBeenCalled()
  })

  it('uses DefaultView', () => {
    new OLMapInstance({ target })
    expect(defaultView.default).toHaveBeenCalled()
  })
})
