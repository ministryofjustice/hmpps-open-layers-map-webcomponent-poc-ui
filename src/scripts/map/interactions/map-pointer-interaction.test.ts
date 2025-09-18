import MapPointerInteraction from './map-pointer-interaction'

describe('MapPointerInteraction', () => {
  let mapMock: any
  let viewport: HTMLElement
  let interaction: MapPointerInteraction

  beforeEach(() => {
    viewport = document.createElement('div')

    mapMock = {
      getViewport: jest.fn(() => viewport),
    }

    interaction = new MapPointerInteraction()
  })

  const makeEvent = (type: string, options: any = {}) =>
    ({
      type,
      map: mapMock,
      pixel: options.pixel ?? [0, 0],
      dragging: options.dragging ?? false,
    }) as any

  const callHandleEvent = (event: any) => interaction.handleEvent(event)

  it('sets cursor to grab on pointermove (when not dragging)', () => {
    callHandleEvent(makeEvent('pointermove'))
    expect(viewport.style.cursor).toBe('grab')
  })

  it('sets cursor to grabbing on pointermove when dragging', () => {
    callHandleEvent(makeEvent('pointermove', { dragging: true }))
    expect(viewport.style.cursor).toBe('grabbing')
  })

  it('sets cursor to grabbing on pointerdown', () => {
    callHandleEvent(makeEvent('pointerdown'))
    expect(viewport.style.cursor).toBe('grabbing')
  })

  it('resets cursor to grab on pointerup', () => {
    callHandleEvent(makeEvent('pointerup'))
    expect(viewport.style.cursor).toBe('grab')
  })

  it('resets cursor to grab on pointerleave', () => {
    callHandleEvent(makeEvent('pointerleave'))
    expect(viewport.style.cursor).toBe('grab')
  })
})
