import Map from 'ol/Map'
import { applyStyle } from 'ol-mapbox-style'
import { OrdnanceSurveyImageTileLayer, OrdnanceSurveyVectorTileLayer, isImageTileLayer, resolveTileType } from './map/tiles'
import LocationPointerInteraction from './map/location-pointer-interaction'
import MojMapInstance from './map/map-instance'
import FeatureOverlay from './map/feature-overlay'
import { startTokenRefresh, fetchAccessToken } from './map/token-refresh'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import config from '../scripts/map/config'

import styles from '../styles/moj-map.raw.css?raw'

type TileType = 'vector' | 'raster'

type MojMapOptions = {
  tokenUrl: string
  tileType: TileType
  points?: string
  lines?: string
  usesInternalOverlays: boolean
  overlayTemplateId?: string
}

export class MojMap extends HTMLElement {
  private mapNonce: string | null = null
  private map!: Map
  private imageTileLayer?: OrdnanceSurveyImageTileLayer
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
    let tileType = resolveTileType(this.getAttribute('tile-type'))
    const tokenUrl = this.getAttribute('access-token-url') || config.tiles.defaultTokenUrl

    if (tileType === 'vector' && !this.hasAttribute('api-key')) {
      console.warn(
        `[moj-map] tile-type="vector" was requested (or auto-detected) but no api-key provided. Falling back to raster tiles.`
      )
      tileType = 'raster'
    }

    return {
      tileType,
      tokenUrl,
      points: this.getAttribute('points') || undefined,
      lines: this.getAttribute('lines') || undefined,
      usesInternalOverlays: this.hasAttribute('uses-internal-overlays'),
    }
  }

  private async initializeMap() {
    const options = this.parseAttributes()
    let accessToken = ''
    let expiresIn = 0

    try {
      if (options.tokenUrl.toLowerCase() !== 'none') {
        const tokenResponse = await fetchAccessToken(options.tokenUrl)
        accessToken = tokenResponse.token
        expiresIn = tokenResponse.expiresIn
      }
    } catch (err) {
      console.error('Failed to retrieve access token:', err)
    }

    this.map = new MojMapInstance({
      target: this.shadow.querySelector('#map') as HTMLElement,
      layers: [],
    })

    if (options.tileType === 'vector') {
      const apiKey = this.getAttribute('api-key')!
      const vectorLayer = new OrdnanceSurveyVectorTileLayer()

      try {
        await vectorLayer.applyVectorStyle(apiKey)
        this.map.addLayer(vectorLayer)
      } catch (err) {
        console.warn('[moj-map] Failed to initialize vector layer. Falling back to raster.', err)
        const rasterLayer = new OrdnanceSurveyImageTileLayer(config.tiles.urls.raster, accessToken)
        this.map.addLayer(rasterLayer)
        this.imageTileLayer = rasterLayer
        options.tileType = 'raster'
      }
    }

    if (options.tileType === 'raster' && !this.imageTileLayer) {
      const rasterLayer = new OrdnanceSurveyImageTileLayer(config.tiles.urls.raster, accessToken)
      this.map.addLayer(rasterLayer)
      this.imageTileLayer = rasterLayer
    }

    if (
      accessToken !== '' &&
      expiresIn !== 0 &&
      this.imageTileLayer &&
      isImageTileLayer(this.imageTileLayer)
    ) {
      this.stopTokenRefresh = startTokenRefresh({
        tokenUrl: options.tokenUrl,
        initialExpiresIn: expiresIn,
        onTokenUpdate: (newToken: string) => {
          this.imageTileLayer!.updateToken(newToken)
        }
      })
    }

    if (options.usesInternalOverlays) {
      const overlayEl = this.shadow.querySelector('.app-map__overlay')

      if (overlayEl instanceof HTMLElement) {
        this.featureOverlay = new FeatureOverlay(overlayEl)
        this.map.addOverlay(this.featureOverlay)

        const pointerInteraction = new LocationPointerInteraction(this.featureOverlay)
        this.map.addInteraction(pointerInteraction)
      } else {
        console.warn('[moj-map] Internal overlays enabled but overlay container element not found.')
      }
    }

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