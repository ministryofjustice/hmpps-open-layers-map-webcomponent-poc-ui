import Overlay from 'ol/Overlay'
import { Coordinate } from 'ol/coordinate'

export default class FeatureOverlay extends Overlay {
  private container: HTMLElement

  private content: HTMLElement

  private closeButton: HTMLButtonElement

  constructor(container: HTMLElement) {
    const header = container.querySelector('.app-map__overlay-header') as HTMLElement
    const content = container.querySelector('.app-map__overlay-body') as HTMLElement
    const closeButton = container.querySelector('.app-map__overlay-close') as HTMLButtonElement

    container.setAttribute('part', 'app-map__overlay')
    content.setAttribute('part', 'app-map__overlay-body')
    header.setAttribute('part', 'app-map__overlay-header')

    super({
      element: container,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      offset: [0, -22],
      positioning: 'bottom-center',
      stopEvent: true,
    })

    this.container = container
    this.content = content
    this.closeButton = closeButton

    this.closeButton.addEventListener('click', () => this.close())
  }

  showAtCoordinate(coordinate: Coordinate, data: Record<string, unknown>) {
    const templateId = data.overlayTemplateId
    const template = typeof templateId === 'string' ? document.getElementById(templateId) : null

    if (!(template instanceof HTMLTemplateElement)) {
      console.warn(`[FeatureOverlay] No valid template found for overlayTemplateId="${templateId}"`)
      return
    }

    const rawHtml = template.innerHTML
    const populatedHtml = rawHtml.replace(/{{(.*?)}}/g, (_, key) => {
      const value = data[key.trim()]
      return value !== undefined ? String(value) : ''
    })

    this.content.innerHTML = populatedHtml
    this.container.hidden = false
    this.setPosition(coordinate)

    this.container.dispatchEvent(new CustomEvent('map:overlay:open', { bubbles: true }))
  }

  close() {
    this.container.hidden = true
    this.setPosition(undefined)

    this.container.dispatchEvent(new CustomEvent('map:overlay:close', { bubbles: true }))
  }
}
