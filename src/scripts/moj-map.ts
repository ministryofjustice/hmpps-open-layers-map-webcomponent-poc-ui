import Map from 'ol/Map'
import BaseLayer from 'ol/layer/Base'
import VectorLayer from 'ol/layer/Vector'
import OrdnanceSurveyTileLayer from './map/tiles'
import LocationPointerInteraction from './map/location-pointer-interaction'
import MojMapInstance from './map/map-instance'
import FeatureOverlay from './map/feature-overlay'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import { fetchAccessToken } from './helpers/map'

//import 'ol/ol.css'
import styles from '../styles/moj-map.raw.css?raw'

type MojMapOptions = {
  tileUrl: string
  tokenUrl: string
  points?: string
  lines?: string
  showOverlay: boolean
  overlayTemplateId?: string
}

export class MojMap extends HTMLElement {
  mapNonce: string | null = null
  map!: Map
  vectorLayer?: VectorLayer
  shadow: ShadowRoot

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

  private parseAttributes(): MojMapOptions {
    return {
      tileUrl: this.getAttribute('tile-url') || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      tokenUrl: this.getAttribute('access-token-url') || '/map/token',
      points: this.getAttribute('points') || undefined,
      lines: this.getAttribute('lines') || undefined,
      showOverlay: this.getAttribute('show-overlay') === 'true',
      overlayTemplateId: this.getAttribute('overlay-template-id') || undefined,
    }
  }

  private async initializeMap() {
    const options = this.parseAttributes()

    let accessToken = ''
    try {
      if (options.tokenUrl.toLowerCase() !== 'none') {
        accessToken = await fetchAccessToken(options.tokenUrl)
      }
    } catch (err) {
      console.error('Failed to retrieve access token:', err)
    }

    const tileLayer = new OrdnanceSurveyTileLayer(options.tileUrl, accessToken)
    const layers: BaseLayer[] = [tileLayer]

    this.map = new MojMapInstance({
      target: this.shadow.querySelector('#map') as HTMLElement,
      osMapsTileUrl: options.tileUrl,
      osMapsAccessToken: accessToken,
      layers,
    })

    if (options.showOverlay && options.overlayTemplateId) {
      const template = document.getElementById(options.overlayTemplateId) as HTMLTemplateElement
      if (template) {
        const featureOverlay = new FeatureOverlay(template)
        this.map.addOverlay(featureOverlay)

        const pointerInteraction = new LocationPointerInteraction(featureOverlay)
        this.map.addInteraction(pointerInteraction)
      } else {
        console.warn(`No <template> found with id="${options.overlayTemplateId}"`)
      }
    }

    // Cypress event
    this.map.on('rendercomplete', () => {
      if (typeof window !== 'undefined' && (window as any).Cypress) {
        const root = this.getRootNode()
        if (root instanceof ShadowRoot) {
          const host = root.host as HTMLElement
          host.dispatchEvent(new CustomEvent('map:render:complete', {
            detail: { mapInstance: this.map },
          }))
        }
      }
    })
  }

  get points(): any | undefined {
    const points = this.getAttribute('points')
    if (!points) return []
    try {
      return JSON.parse(points)
    } catch {
      console.warn('Invalid JSON in points attribute')
      return []
    }
  }

  get lines(): any | undefined {
    const lines = this.getAttribute('lines')
    if (!lines) return []
    try {
      return JSON.parse(lines)
    } catch {
      console.warn('Invalid JSON in lines attribute')
      return []
    }
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
