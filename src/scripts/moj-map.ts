import Map from 'ol/Map'
import BaseLayer from 'ol/layer/Base'
import { OrdnanceSurveyTileLayer, ordnanceSurveyTileLoader } from './map/tiles'
import LocationPointerInteraction from './map/location-pointer-interaction'
import MojMapInstance from './map/map-instance'
import FeatureOverlay from './map/feature-overlay'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import { startTokenRefresh, fetchAccessToken } from './helpers/map'

import styles from '../styles/moj-map.raw.css?raw'

type MojMapOptions = {
  tileUrl: string
  tokenUrl: string
  points?: string
  lines?: string
  usesInternalOverlays: boolean
  overlayTemplateId?: string
}

export class MojMap extends HTMLElement {
  private static readonly DEFAULT_TILE_URL = 'https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}'
  private static readonly DEFAULT_TOKEN_URL = '/map/token'
  private mapNonce: string | null = null
  private map!: Map
  private tileLayer!: OrdnanceSurveyTileLayer
  private stopTokenRefresh: (() => void) | null = null
  private shadow: ShadowRoot
  private featureOverlay?: FeatureOverlay

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  async connectedCallback() {
    this.mapNonce = getMapNonce(this)
    this.render()
    await this.initializeMap()
    this.dispatchEvent(new CustomEvent('map:ready', {
      detail: { map: this.map },
      bubbles: true,
    }))
  }

  disconnectedCallback() {
    this.stopTokenRefresh?.()
  }

  // Access geoJSON points object by attribute e.g. mojMap.points
  public get points(): any | undefined {
    const points = this.getAttribute('points')
    if (!points) return []
    try {
      return JSON.parse(points)
    } catch {
      console.warn('Invalid JSON in points attribute')
      return []
    }
  }

  // Access geoJSON lines object by attribute e.g. mojMap.lines
  public get lines(): any | undefined {
    const lines = this.getAttribute('lines')
    if (!lines) return []
    try {
      return JSON.parse(lines)
    } catch {
      console.warn('Invalid JSON in lines attribute')
      return []
    }
  }

  public closeOverlay() {
    this.featureOverlay?.close()
  }

  private parseAttributes(): MojMapOptions {
    return {
      tileUrl: this.getAttribute('tile-url') || MojMap.DEFAULT_TILE_URL,
      tokenUrl: this.getAttribute('access-token-url') || MojMap.DEFAULT_TOKEN_URL,
      points: this.getAttribute('points') || undefined,
      lines: this.getAttribute('lines') || undefined,
      usesInternalOverlays: this.hasAttribute('uses-internal-overlays'),
      overlayTemplateId: this.getAttribute('overlay-template-id') || undefined,
    }
  }

  private async initializeMap() {
    const options = this.parseAttributes()
    let accessToken = ''
    let expiresIn = 0

    // Fetch OS Maps access token (if token URL is provided)
    try {
      if (options.tokenUrl.toLowerCase() !== 'none') {
        const tokenResponse = await fetchAccessToken(options.tokenUrl)
        accessToken = tokenResponse.token
        expiresIn = tokenResponse.expiresIn
      }
    } catch (err) {
      console.error('Failed to retrieve access token:', err)
    }

    // Create the main tile layer using the current token
    this.tileLayer = new OrdnanceSurveyTileLayer(options.tileUrl, accessToken)
    const layers: BaseLayer[] = [this.tileLayer]

    // Create and initialize the map instance
    this.map = new MojMapInstance({
      target: this.shadow.querySelector('#map') as HTMLElement,
      osMapsTileUrl: options.tileUrl,
      osMapsAccessToken: accessToken,
      layers,
    })

    // Start token refresh loop (updates tile loader with fresh token)
    if (accessToken !== '' && expiresIn !== 0) {
      this.stopTokenRefresh = startTokenRefresh({
        tokenUrl: options.tokenUrl,
        initialExpiresIn: expiresIn,
        onTokenUpdate: (newToken: string) => {
          const source = this.tileLayer.getSource()
          if (source) {
            source.setTileLoadFunction(ordnanceSurveyTileLoader(newToken))
            source.refresh()
          }
        },
      })
    }

    // Add overlays internally if enabled
    if (options.usesInternalOverlays && options.overlayTemplateId) {
      const template = document.getElementById(options.overlayTemplateId)
      const overlayEl = this.shadow.querySelector('.app-map__overlay')

      if (template instanceof HTMLTemplateElement && overlayEl instanceof HTMLElement) {
        this.featureOverlay = new FeatureOverlay(template, overlayEl)
        this.map.addOverlay(this.featureOverlay)

        const pointerInteraction = new LocationPointerInteraction(this.featureOverlay)
        this.map.addInteraction(pointerInteraction)
      } else {
        console.warn('[moj-map] Internal overlays enabled but template or overlay element not found.')
      }
    }

    // Fire custom event when the map is ready (for Cypress testing support)
    this.map.on('rendercomplete', () => {
      if (typeof window !== 'undefined' && (window as any).Cypress) {
        this.dispatchEvent(new CustomEvent('map:render:complete', {
          detail: { mapInstance: this.map },
          bubbles: true,
          composed: true,
        }))
      }
    })
  }

  render() {
    if (this.mapNonce === null) {
      console.log('Warning: No CSP nonce provided. Styles may not be applied correctly.')
      return
    }

    this.shadow.innerHTML = ''
    this.shadow.appendChild(createScopedStyle(styles, this.mapNonce))
    this.shadow.appendChild(createMapDOM())
  }
}

customElements.define('moj-map', MojMap)
