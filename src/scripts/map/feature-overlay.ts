import Overlay from 'ol/Overlay'

export default class FeatureOverlay extends Overlay {
  private container: HTMLElement
  private content: HTMLElement
  private closeButton: HTMLButtonElement
  private template: HTMLTemplateElement

  constructor(template: HTMLTemplateElement) {
    // Create outer container
    const wrapper = document.createElement('div')
    wrapper.className = 'app-map__overlay'

    // Create close button
    const closeBtn = document.createElement('button')
    closeBtn.className = 'app-map__overlay__close'
    closeBtn.type = 'button'
    closeBtn.textContent = '×'

    // Create content area
    const content = document.createElement('div')
    content.className = 'app-map__overlay__content'

    // Append everything
    wrapper.appendChild(closeBtn)
    wrapper.appendChild(content)

    super({
      element: wrapper,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -12],
    })

    this.container = wrapper
    this.content = content
    this.closeButton = closeBtn
    this.template = template

    // Close handler
    this.closeButton.addEventListener('click', () => {
      this.close()
    })
  }

  showAtCoordinate(coordinate: number[], data: Record<string, unknown>) {
    // Basic Mustache-like templating: {{key}}
    const rawHtml = this.template.innerHTML
    const populatedHtml = rawHtml.replace(/{{(.*?)}}/g, (_, key) => {
      const value = data[key.trim()]
      return value !== undefined ? String(value) : ''
    })

    this.content.innerHTML = populatedHtml
    this.container.hidden = false
    this.setPosition(coordinate)
  }

  close() {
    this.container.hidden = true
    this.setPosition(undefined)
  }
}
