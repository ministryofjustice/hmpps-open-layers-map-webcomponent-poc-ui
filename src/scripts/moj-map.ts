import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?raw'
import { OLMapOptions } from './map/open-layers-map-instance'
import { setupOpenLayersMap } from './map/setup/setup-openlayers-map'
import { setupMapLibreMap } from './map/setup/setup-maplibre-map'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import config from './map/config'
import FeatureOverlay from './map/overlays/feature-overlay'

import styles from '../styles/moj-map.raw.css?raw'

type TileType = 'vector' | 'raster'
type MapRenderer = 'openlayers' | 'maplibre'

type MojMapControls = OLMapOptions['controls'] & {
  enable3DBuildings?: boolean
}

type MojMapOptions = {
  renderer: MapRenderer
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

  private map!: unknown

  private shadow: ShadowRoot

  private featureOverlay?: FeatureOverlay

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  async connectedCallback() {
    this.mapNonce = getMapNonce(this)
    this.render()
    await this.initialiseMap()
    this.dispatchEvent(
      new CustomEvent('map:ready', {
        detail: { map: this.map },
        bubbles: true,
      }),
    )
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
    const rendererAttr = this.getAttribute('renderer')
    const renderer: MapRenderer = rendererAttr === 'maplibre' ? 'maplibre' : 'openlayers'
    const tileType = this.getAttribute('tile-type') as TileType
    const userTokenUrl = this.getAttribute('access-token-url')
    const tileUrlAttr = this.getAttribute('tile-url')
    const vectorUrlAttr = this.getAttribute('vector-url')

    const tileUrl = tileUrlAttr && tileUrlAttr.trim() !== '' ? tileUrlAttr : config.tiles.urls.tileUrl
    const vectorUrl = vectorUrlAttr && vectorUrlAttr.trim() !== '' ? vectorUrlAttr : config.tiles.urls.vectorUrl

    const tokenUrl = tileType === 'raster' ? userTokenUrl || config.tiles.defaultTokenUrl : userTokenUrl || 'none'

    return {
      renderer,
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

  private async initialiseMap() {
    const options = this.parseAttributes()
    const mapContainer = this.shadow.querySelector('#map') as HTMLElement

    if (options.renderer === 'maplibre') {
      this.map = await setupMapLibreMap(
        mapContainer,
        options.vectorUrl,
        this.getControlOptions().enable3DBuildings ?? false,
      )
    } else {
      const overlayCandidate = this.shadow.querySelector('.app-map__overlay')
      const overlayEl = overlayCandidate instanceof HTMLElement ? overlayCandidate : null

      this.map = await setupOpenLayersMap(mapContainer, {
        target: mapContainer,
        tileType: options.tileType,
        tokenUrl: options.tokenUrl,
        tileUrl: options.tileUrl!,
        vectorUrl: options.vectorUrl!,
        usesInternalOverlays: options.usesInternalOverlays,
        overlayEl,
        controls: this.getControlOptions(),
      })
    }
  }

  private getControlOptions(): MojMapControls {
    const parseBool = (name: string): boolean => this.hasAttribute(name) && this.getAttribute(name) !== 'false'

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
      enable3DBuildings: parseBool('enable-3d-buildings'),
    }
  }

  render() {
    if (this.mapNonce === null) {
      console.warn('Warning: No CSP nonce provided. Styles may not be applied correctly.')
      return
    }

    this.shadow.innerHTML = ''
    this.shadow.appendChild(createScopedStyle(styles, this.mapNonce))
    this.shadow.appendChild(createScopedStyle(maplibreCss, this.mapNonce))
    this.shadow.appendChild(createMapDOM())
  }
}

customElements.define('moj-map', MojMap)
