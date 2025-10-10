export function createMapDOM(): DocumentFragment {
  const fragment = document.createDocumentFragment()

  const mapDiv = document.createElement('div')
  mapDiv.id = 'map'
  mapDiv.className = 'app-map__viewport'
  fragment.appendChild(mapDiv)

  const overlay = document.createElement('div')
  overlay.className = 'app-map__overlay'
  overlay.hidden = true
  overlay.innerHTML = `
    <div class="app-map__overlay-header">
      <div class="app-map__overlay-title"></div>
      <button class="app-map__overlay-close" aria-label="Close overlay">&times;</button>
    </div>
    <div class="app-map__overlay-body"></div>
  `
  fragment.appendChild(overlay)

  const alertsSlot = document.createElement('slot')
  alertsSlot.name = 'alerts'
  fragment.appendChild(alertsSlot)

  return fragment
}

export function createScopedStyle(styles: string, nonce?: string): HTMLStyleElement {
  const styleEl = document.createElement('style')
  if (nonce) {
    styleEl.setAttribute('nonce', nonce)
  }
  styleEl.textContent = styles
  return styleEl
}

export function getMapNonce(mapEl: HTMLElement): string | null {
  return mapEl?.getAttribute('csp-nonce') || null
}
