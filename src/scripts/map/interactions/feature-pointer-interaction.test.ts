import Point from 'ol/geom/Point'
import Feature from 'ol/Feature'
import FeaturePointerInteraction from './feature-pointer-interaction'

jest.mock('ol/interaction/Pointer', () => {
  class MockPointerInteraction {
    constructor(opts: any) {
      Object.assign(this, opts)
    }
  }
  return { __esModule: true, default: MockPointerInteraction }
})

jest.mock('ol/Feature', () =>
  jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    getProperties: jest.fn(),
    getGeometry: jest.fn(),
  })),
)

jest.mock('ol/geom/Point', () => {
  return {
    __esModule: true,
    default: class MockPoint {
      private coords: number[]

      constructor(coords: number[]) {
        this.coords = coords
      }

      getCoordinates() {
        return this.coords
      }
    },
  }
})

describe('FeaturePointerInteraction', () => {
  let overlay: { showAtCoordinate: jest.Mock; close: jest.Mock }
  let interaction: FeaturePointerInteraction
  let mapMock: any
  let targetEl: HTMLElement

  beforeEach(() => {
    overlay = {
      showAtCoordinate: jest.fn(),
      close: jest.fn(),
    }
    interaction = new FeaturePointerInteraction(overlay)

    targetEl = document.createElement('div')
    mapMock = {
      getFeaturesAtPixel: jest.fn(),
      getTargetElement: jest.fn(() => targetEl),
      getViewport: jest.fn(() => targetEl),
    }

    jest.clearAllMocks()
  })

  const makeEvent = (type: string, opts: any = {}) =>
    ({
      type,
      map: mapMock,
      pixel: opts.pixel ?? [0, 0],
      dragging: opts.dragging ?? false,
    }) as any

  const callHandleEvent = (event: any) => (interaction as any).handleEvent(event)

  describe('pointermove', () => {
    it('sets cursor to pointer when intersecting feature with valid template', () => {
      const feature = new (Feature as any)()
      const f = feature as unknown as { get: jest.Mock }
      f.get.mockReturnValue('tpl1')

      document.body.innerHTML = `<template id="tpl1"></template>`
      mapMock.getFeaturesAtPixel.mockReturnValue([feature])

      callHandleEvent(makeEvent('pointermove'))

      expect(targetEl.style.cursor).toBe('pointer')
    })

    it('resets cursor when no valid feature', () => {
      mapMock.getFeaturesAtPixel.mockReturnValue([])
      callHandleEvent(makeEvent('pointermove'))
      expect(targetEl.style.cursor).toBe('')
    })

    it('ignores drag events', () => {
      const event = makeEvent('pointermove', { dragging: true })
      const result = callHandleEvent(event)
      expect(result).toBe(true)
      expect(targetEl.style.cursor).toBe('')
    })
  })

  describe('pointerdown / pointerup', () => {
    it('records downPixel and triggers overlay.showAtCoordinate on click', () => {
      callHandleEvent(makeEvent('pointerdown', { pixel: [10, 10] }))

      const feature = new (Feature as any)()
      const f = feature as unknown as {
        get: jest.Mock
        getProperties: jest.Mock
        getGeometry: jest.Mock
      }
      f.get.mockImplementation((key: string) => {
        if (key === 'overlayBodyTemplateId') return 'tpl2'
        return undefined
      })
      f.getProperties.mockReturnValue({ foo: 'bar' })

      const point = new (Point as any)([100, 200])
      f.getGeometry.mockReturnValue(point)

      document.body.innerHTML = `<template id="tpl2"></template>`
      mapMock.getFeaturesAtPixel.mockReturnValue([feature])

      callHandleEvent(makeEvent('pointerup', { pixel: [12, 12] }))

      expect(overlay.showAtCoordinate).toHaveBeenCalledWith([100, 200], { foo: 'bar' })
    })

    it('calls overlay.close when no valid location', () => {
      ;(interaction as any).downPixel = [10, 10]
      mapMock.getFeaturesAtPixel.mockReturnValue([])

      callHandleEvent(makeEvent('pointerup', { pixel: [11, 11] }))

      expect(overlay.close).toHaveBeenCalled()
    })

    it('ignores clicks beyond threshold distance', () => {
      ;(interaction as any).downPixel = [0, 0]
      const result = callHandleEvent(makeEvent('pointerup', { pixel: [100, 100] }))
      expect(result).toBe(true)
      expect(overlay.showAtCoordinate).not.toHaveBeenCalled()
      expect(overlay.close).not.toHaveBeenCalled()
    })
  })

  it('ignores pointerup with no prior pointerdown', () => {
    callHandleEvent(makeEvent('pointerup', { pixel: [0, 0] }))
    expect(overlay.showAtCoordinate).not.toHaveBeenCalled()
    expect(overlay.close).not.toHaveBeenCalled()
  })
})
