import Map from 'ol/Map'
import BaseLayer from 'ol/layer/Base'
import VectorLayer from 'ol/layer/Vector'
import OrdnanceSurveyTileLayer from './map/tiles'
import MojMapInstance from './map/map-instance'
import { createMapDOM, createScopedStyle, getRawNonce } from './helpers/dom'
import { parseGeoJSON, fetchAccessToken } from './helpers/map'

import 'ol/ol.css'
import styles from '../styles/moj-map.raw.css?raw'

export class MojMap extends HTMLElement {
  rawNonce: string | null = null
  map!: Map
  vectorLayer?: VectorLayer
  shadow: ShadowRoot

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  async connectedCallback() {
    this.rawNonce = getRawNonce(this)
    this.render()
    await this.initializeMap()
    this.dispatchEvent(new CustomEvent('map:ready', {
      detail: { map: this.map },
      bubbles: true
    }))
  }

  private async initializeMap() {
    const tileUrl = this.getAttribute('tile-url') || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const tokenUrl = this.getAttribute('access-token-url') || '/map/token'
    const geojsonData = this.getAttribute('geojson')
    const showOverlay = this.getAttribute('show-overlay') === 'true'

    let accessToken = ''
    try {
      if (tokenUrl.toLowerCase() !== 'none') {
        accessToken = await fetchAccessToken(tokenUrl)
      }
    } catch (err) {
      console.error('Failed to retrieve access token:', err)
    }

    const tileLayer = new OrdnanceSurveyTileLayer(tileUrl, accessToken)
    const layers: BaseLayer[] = [tileLayer]

    if (geojsonData) {
      const vectorSource = parseGeoJSON(geojsonData)
      if (vectorSource) {
        this.vectorLayer = new VectorLayer({ source: vectorSource })
        layers.push(this.vectorLayer)
      }
    }

    this.map = new MojMapInstance({
      target: this.shadow.querySelector('#map') as HTMLElement,
      osMapsTileUrl: tileUrl,
      osMapsAccessToken: accessToken,
      layers,
      // overlays: [], // To be added later
      // interactions: [] // To be added later
    })

    const overlay = this.shadow.querySelector('.app-map__overlay') as HTMLElement
    if (overlay) {
      overlay.hidden = !showOverlay
    }
  }

  render() {
    if (this.rawNonce === null) {
      console.log('Warning: No CSP nonce provided. Styles may not be applied correctly.')
      return
    }

    this.shadow.innerHTML = ''
    this.shadow.appendChild(createScopedStyle(styles, this.rawNonce))
    this.shadow.appendChild(createMapDOM())
  }
}

customElements.define('moj-map', MojMap)
