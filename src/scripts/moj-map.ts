import Map from 'ol/Map'
import { OrdnanceSurveyImageTileLayer, isImageTileLayer } from './map/layers/ordnance-survey-image'
import { OrdnanceSurveyVectorTileLayer, resolveTileType } from './map/layers/ordnance-survey-vector'
import LocationPointerInteraction from './map/interactions/location-pointer-interaction'
import { MojMapInstance, MojMapInstanceOptions } from './map/map-instance'
import FeatureOverlay from './map/overlays/feature-overlay'
import { startTokenRefresh, fetchAccessToken } from './map/token-refresh'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import config from './map/config'

import styles from '../styles/moj-map.raw.css?raw'

type TileType = 'vector' | 'raster'

type MojMapOptions = {
  tokenUrl: string
  tileType: TileType
  points?: string
  lines?: string
  usesInternalOverlays: boolean
  overlayTemplateId?: string
  tileUrl?: string
  vectorUrl?: string
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
    this.dispatchEvent(
      new CustomEvent('map:ready', {
        detail: { map: this.map },
        bubbles: true,
      }),
    )
  }

  disconnectedCallback() {
    this.stopTokenRefresh?.()
  }

  public get points(): unknown[] | [] {
    const points = this.getAttribute('points')
    if (!points) return []
    try {
      return JSON.parse(points)
    } catch {
      console.warn('Invalid JSON in points attribute')
      return []
    }
  }

  public get lines(): unknown[] | [] {
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
    const tileType = resolveTileType(this.getAttribute('tile-type'))
    const userTokenUrl = this.getAttribute('access-token-url')
    const tileUrlAttr = this.getAttribute('tile-url')
    const vectorUrlAttr = this.getAttribute('vector-url')

    const tileUrl = tileUrlAttr && tileUrlAttr.trim() !== '' ? tileUrlAttr : config.tiles.urls.tileUrl
    const vectorUrl = vectorUrlAttr && vectorUrlAttr.trim() !== '' ? vectorUrlAttr : config.tiles.urls.vectorUrl

    const tokenUrl = tileType === 'raster' ? userTokenUrl || config.tiles.defaultTokenUrl : userTokenUrl || 'none'

    return {
      tileType,
      tokenUrl,
      points: this.getAttribute('points') || undefined,
      lines: this.getAttribute('lines') || undefined,
      usesInternalOverlays: this.hasAttribute('uses-internal-overlays'),
      overlayTemplateId: this.getAttribute('overlay-template-id') || undefined,
      tileUrl,
      vectorUrl,
    }
  }

  private async initializeMap() {
    const options = this.parseAttributes()
    let accessToken = ''
    let expiresIn = 0
    const { apiKey } = config

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
      controls: this.getControlOptions(),
    })

    if (options.tileType === 'vector') {
      if (!apiKey) {
        console.warn('[moj-map] No API key configured in .env. Falling back to image tiles.')
        options.tileType = 'raster'
      } else {
        const vectorLayer = new OrdnanceSurveyVectorTileLayer()
        try {
          await vectorLayer.applyVectorStyle(apiKey, options.vectorUrl!)
          this.map.addLayer(vectorLayer)
        } catch (err) {
          console.warn('[moj-map] Failed to initialize vector layer. Falling back to image tiles.', err)
          const rasterLayer = new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken)
          this.map.addLayer(rasterLayer)
          this.imageTileLayer = rasterLayer
          options.tileType = 'raster'
        }
      }
    }

    if (options.tileType === 'raster' && !this.imageTileLayer) {
      const rasterLayer = new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken)
      this.map.addLayer(rasterLayer)
      this.imageTileLayer = rasterLayer
    }

    if (accessToken !== '' && expiresIn !== 0 && this.imageTileLayer && isImageTileLayer(this.imageTileLayer)) {
      this.stopTokenRefresh = startTokenRefresh({
        tokenUrl: options.tokenUrl,
        initialExpiresIn: expiresIn,
        onTokenUpdate: (newToken: string) => {
          this.imageTileLayer!.updateToken(newToken)
        },
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
      if (typeof window !== 'undefined' && (window as Window & { Cypress?: unknown }).Cypress) {
        this.dispatchEvent(
          new CustomEvent('map:render:complete', {
            detail: { mapInstance: this.map },
            bubbles: true,
            composed: true,
          }),
        )
      }
    })
  }

  private getControlOptions(): MojMapInstanceOptions['controls'] {
    const parseBool = (name: string): boolean => this.hasAttribute(name) && this.getAttribute(name) !== 'false'

    // rotate-control: 'false' | 'auto-hide' | anything/omitted -> autoHide: false (shown)
    const rotateAttr = this.getAttribute('rotate-control')
    let rotateOpt: false | { autoHide: boolean }
    if (rotateAttr === 'false') {
      rotateOpt = false
    } else if (rotateAttr === 'auto-hide') {
      rotateOpt = { autoHide: true }
    } else {
      rotateOpt = { autoHide: false }
    }

    const explicitScale = this.getAttribute('scale-control') as 'bar' | 'line' | null
    const legacyScaleLine = this.hasAttribute('scale-line') && this.getAttribute('scale-line') !== 'false'
    const scaleControl = explicitScale ?? (legacyScaleLine ? 'line' : undefined)
    const locationDisplay = (this.getAttribute('location-display') as 'dms' | 'latlon' | null) ?? undefined
    const locationDisplaySource = (this.getAttribute('location-source') as 'centre' | 'pointer' | null) ?? undefined

    const zoomSlider = parseBool('zoom-slider')

    // Host classes for conditional CSS
    this.classList.toggle('has-rotate-control', rotateOpt !== false)
    this.classList.toggle('has-zoom-slider', zoomSlider)
    this.classList.toggle('has-scale-control', !!scaleControl)
    this.classList.toggle('has-location-dms', locationDisplay === 'dms')

    return {
      rotate: rotateOpt,
      zoomSlider,
      scaleControl,
      locationDisplay,
      locationDisplaySource,
    }
  }

  render() {
    if (this.mapNonce === null) {
      console.warn('Warning: No CSP nonce provided. Styles may not be applied correctly.')
      return
    }

    this.shadow.innerHTML = ''
    this.shadow.appendChild(createScopedStyle(styles, this.mapNonce))
    this.shadow.appendChild(createMapDOM())
  }
}

customElements.define('moj-map', MojMap)
