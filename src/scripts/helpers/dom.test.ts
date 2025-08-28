import { createMapDOM, createScopedStyle, getMapNonce } from './dom'

describe('dom helpers', () => {
  describe('createMapDOM', () => {
    it('creates a fragment with a map viewport div', () => {
      const frag = createMapDOM()
      const map = frag.querySelector('#map')
      expect(map).not.toBeNull()
      expect(map?.className).toBe('app-map__viewport')
    })

    it('creates a hidden overlay with close button and slot', () => {
      const frag = createMapDOM()
      const overlay = frag.querySelector('.app-map__overlay') as HTMLElement

      expect(overlay).not.toBeNull()
      expect(overlay.hidden).toBe(true)

      const closeBtn = overlay.querySelector('.app-map__overlay-close')
      expect(closeBtn).not.toBeNull()
      expect(closeBtn).toHaveAttribute('aria-label', 'Close overlay')

      const slot = overlay.querySelector('slot[name="overlay"]')
      expect(slot).not.toBeNull()
    })
  })

  describe('createScopedStyle', () => {
    it('creates a <style> element with provided CSS', () => {
      const styleEl = createScopedStyle('.foo { color: red; }')
      expect(styleEl.tagName).toBe('STYLE')
      expect(styleEl.textContent).toContain('.foo { color: red; }')
    })

    it('adds a nonce attribute when provided', () => {
      const styleEl = createScopedStyle('.foo { color: red; }', 'test-nonce')
      expect(styleEl.getAttribute('nonce')).toBe('test-nonce')
    })

    it('does not add a nonce when not provided', () => {
      const styleEl = createScopedStyle('.bar { color: blue; }')
      expect(styleEl.getAttribute('nonce')).toBeNull()
    })
  })

  describe('getMapNonce', () => {
    it('returns the csp-nonce attribute when set', () => {
      const el = document.createElement('div')
      el.setAttribute('csp-nonce', 'abc123')
      expect(getMapNonce(el)).toBe('abc123')
    })

    it('returns null when no csp-nonce is set', () => {
      const el = document.createElement('div')
      expect(getMapNonce(el)).toBeNull()
    })
  })
})
