import FeatureOverlay from './feature-overlay'

jest.mock('ol/Overlay', () => {
  return class MockOverlay {
    opts: Record<string, unknown>

    setPosition = jest.fn()

    constructor(opts: Record<string, unknown>) {
      this.opts = opts
    }
  }
})

describe('FeatureOverlay', () => {
  let container: HTMLElement
  let header: HTMLElement
  let title: HTMLElement
  let body: HTMLElement
  let close: HTMLButtonElement
  let overlay: FeatureOverlay

  beforeEach(() => {
    document.body.innerHTML = `
    <div id="overlay">
      <div class="app-map__overlay-header">
        <div class="app-map__overlay-title"></div>
        <button class="app-map__overlay-close"></button>
      </div>
      <div class="app-map__overlay-body"></div>
      <button class="app-map__overlay-close"></button>
    </div>
    <template id="title-template"><p>Device: {{deviceId}}</p></template>
    <template id="content-template"><p>Latitude: {{lat}}</p></template>
    `
    container = document.getElementById('overlay') as HTMLElement
    header = container.querySelector('.app-map__overlay-header')!
    title = container.querySelector('.app-map__overlay-title')!
    body = container.querySelector('.app-map__overlay-body')!
    close = container.querySelector('.app-map__overlay-close')!

    overlay = new FeatureOverlay(container)
  })

  it('applies part attributes in constructor', () => {
    expect(container.getAttribute('part')).toBe('app-map__overlay')
    expect(header.getAttribute('part')).toBe('app-map__overlay-header')
    expect(title.getAttribute('part')).toBe('app-map__overlay-title')
    expect(body.getAttribute('part')).toBe('app-map__overlay-body')
  })

  it('showAtCoordinate replaces template placeholders', () => {
    const coord: [number, number] = [10, 20]
    overlay.showAtCoordinate(coord, {
      overlayTitleTemplateId: 'title-template',
      overlayBodyTemplateId: 'content-template',
      deviceId: '12345',
      lat: '53.45445',
    })

    expect(title.innerHTML).toContain('Device: 12345')
    expect(body.innerHTML).toContain('Latitude: 53.45445')
    expect(container.hidden).toBe(false)
    expect((overlay as any).setPosition).toHaveBeenCalledWith(coord)
  })

  it('showAtCoordinate skips header if no template', () => {
    const coord: [number, number] = [10, 20]
    overlay.showAtCoordinate(coord, {
      overlayBodyTemplateId: 'content-template',
      lat: '51.5007',
    })

    expect(title?.innerHTML).toBe('')
    expect(body.innerHTML).toContain('Latitude: 51.5007')
  })

  it('showAtCoordinate warns if no valid template', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    overlay.showAtCoordinate([0, 0], { overlayBodyTemplateId: 'does-not-exist' })
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('close hides and clears position', () => {
    const dispatchSpy = jest.spyOn(container, 'dispatchEvent')
    overlay.close()
    expect(container.hidden).toBe(true)
    expect((overlay as any).setPosition).toHaveBeenCalledWith(undefined)
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent))
  })

  it('clicking close button calls close()', () => {
    const spy = jest.spyOn(overlay, 'close')
    close.click()
    expect(spy).toHaveBeenCalled()
  })
})
