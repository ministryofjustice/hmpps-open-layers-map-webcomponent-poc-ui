/// <reference types="@testing-library/jest-dom" />

import { createMapDOM, createScopedStyle, getMapNonce } from './dom'

describe('dom helpers', () => {
  describe('createMapDOM', () => {
    it('creates a fragment with a map viewport div', () => {
      const frag = createMapDOM()
      const map = frag.querySelector('#map')
      expect(map).toBeInstanceOf(HTMLElement)
      expect(map?.className).toBe('app-map__viewport')
    })

    it('creates a hidden overlay with close button', () => {
      const frag = createMapDOM()
      const overlay = frag.querySelector('.app-map__overlay')
      expect(overlay).toBeInstanceOf(HTMLElement)
      expect((overlay as HTMLElement).hidden).toBe(true)

      const closeBtn = overlay?.querySelector('.app-map__overlay-close')
      expect(closeBtn).toBeInstanceOf(HTMLElement)
      expect(closeBtn).toHaveAttribute('aria-label', 'Close overlay')
    })

    it('creates an overlay header with title container', () => {
      const frag = createMapDOM()
      const overlay = frag.querySelector('.app-map__overlay') as HTMLElement

      const header = overlay.querySelector('.app-map__overlay-header')
      expect(header).toBeInstanceOf(HTMLElement)

      const title = overlay.querySelector('.app-map__overlay-title')
      expect(title).toBeInstanceOf(HTMLElement)
      expect(title?.textContent).toBe('')
    })
  })

  describe('createScopedStyle', () => {
    it('creates a <style> element with provided CSS', () => {
      const styleEl = createScopedStyle('.foo { color: red; }')
      expect(styleEl).toBeInstanceOf(HTMLStyleElement)
      expect(styleEl.textContent).toContain('.foo { color: red; }')
    })

    it('adds a nonce attribute when provided', () => {
      const styleEl = createScopedStyle('.foo { color: red; }', 'test-nonce')
      expect(styleEl).toHaveAttribute('nonce', 'test-nonce')
    })

    it('does not add a nonce when not provided', () => {
      const styleEl = createScopedStyle('.bar { color: blue; }')
      expect(styleEl).not.toHaveAttribute('nonce')
    })
  })

  describe('getMapNonce', () => {
    it('returns the csp-nonce attribute when set', () => {
      const el = document.createElement('div')
      el.setAttribute('csp-nonce', 'test-nonce')
      expect(getMapNonce(el)).toBe('test-nonce')
    })

    it('returns null when no csp-nonce is set', () => {
      const el = document.createElement('div')
      expect(getMapNonce(el)).toBeNull()
    })
  })
})
