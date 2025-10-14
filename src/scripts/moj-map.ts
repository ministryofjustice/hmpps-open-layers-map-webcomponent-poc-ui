import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?raw'
import type { FeatureCollection } from 'geojson'
import { OLMapInstance, OLMapOptions } from './map/open-layers-map-instance'
import { MapLibreMapInstance } from './map/maplibre-map-instance'
import { setupOpenLayersMap } from './map/setup/setup-openlayers-map'
import { setupMapLibreMap } from './map/setup/setup-maplibre-map'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import FeatureOverlay from './map/overlays/feature-overlay'
import type { ComposableLayer, LayerStateOptions } from './map/layers/base'
import { type MapAdapter, type MapLibrary, createOpenLayersAdapter, createMapLibreAdapter } from './map/map-adapter'
import styles from '../styles/moj-map.raw.css?raw'
import Position from './map/types/position'
import config from './map/config'

type MojMapControls = OLMapOptions['controls'] & {
  enable3DBuildings?: boolean
}

type MojMapOptions = {
  renderer: MapLibrary
  vectorUrl: string
  usesInternalOverlays: boolean
  overlayBodyTemplateId?: string
  overlayTitleTemplateId?: string
}

type OLMapInstanceWithOverlay = OLMapInstance & { featureOverlay?: FeatureOverlay }

export class MojMap extends HTMLElement {
  private mapNonce: string | null = null

  private adapter?: MapAdapter

  private layers = new Map<string, ComposableLayer>()

  private shadow: ShadowRoot

  private featureOverlay?: FeatureOverlay

  private geoJson: FeatureCollection | null = null

  private positionData: Array<Position> = []

  private mapInstance!: OLMapInstance | MapLibreMapInstance

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  async connectedCallback() {
    this.mapNonce = getMapNonce(this)
    this.render()
    this.geoJson = this.parseGeoJsonFromSlot()
    this.positionData = this.parsePositionDataFromSlot()
    await this.initialiseMap()

    this.dispatchEvent(
      new CustomEvent('map:ready', {
        detail: { map: this.map, geoJson: this.geoJson },
        bubbles: true,
        composed: true,
      }),
    )
  }

  public get geojson(): FeatureCollection | null {
    return this.geoJson
  }

  public get positions(): Array<Position> {
    return this.positionData
  }

  public get map(): unknown {
    return this.mapInstance
  }

  public get olMapInstance(): OLMapInstance | null {
    return this.mapInstance instanceof OLMapInstance ? this.mapInstance : null
  }

  public get maplibreMapInstance(): MapLibreMapInstance | null {
    return this.mapInstance instanceof MapLibreMapInstance ? this.mapInstance : null
  }

  public addLayer<LNative>(
    layer: ComposableLayer<LNative>,
    layerStateOptions?: LayerStateOptions,
  ): LNative | undefined {
    if (!this.adapter) throw new Error('Map not ready')
    if (this.layers.has(layer.id)) this.removeLayer(layer.id)
    layer.attach(this.adapter, layerStateOptions)
    this.layers.set(layer.id, layer)
    return typeof layer.getNativeLayer === 'function' ? layer.getNativeLayer() : undefined
  }

  public removeLayer(id: string) {
    if (!this.adapter) return
    const layer = this.layers.get(id)
    if (!layer) return
    layer.detach(this.adapter)
    this.layers.delete(id)
  }

  public getLayer(id: string) {
    return this.layers.get(id)
  }

  public closeOverlay() {
    this.featureOverlay?.close()
  }

  private parseAttributes(): MojMapOptions {
    const renderer: MapLibrary = this.getAttribute('renderer') === 'maplibre' ? 'maplibre' : 'openlayers'
    const vectorAttr = this.getAttribute('vector-url') || this.getAttribute('vector-test-url')
    const vectorUrl = vectorAttr && vectorAttr.trim() ? vectorAttr : config.tiles.urls.localVectorStyleUrl

    return {
      renderer,
      vectorUrl,
      usesInternalOverlays: this.hasAttribute('uses-internal-overlays'),
      overlayBodyTemplateId: this.getAttribute('overlay-body-template-id') || undefined,
      overlayTitleTemplateId: this.getAttribute('overlay-title-template-id') || undefined,
    }
  }

  private parseGeoJsonFromSlot(): FeatureCollection | null {
    const script = this.querySelector('script[type="application/json"][slot="geojson-data"]')
    if (script?.textContent) {
      try {
        return JSON.parse(script.textContent) as FeatureCollection
      } catch (e) {
        console.warn('Invalid GeoJSON passed to <moj-map>', e)
      }
    }
    return null
  }

  private parsePositionDataFromSlot(): Array<Position> {
    const script = this.querySelector('script[type="application/json"][slot="position-data"]')
    if (script?.textContent) {
      try {
        return JSON.parse(script.textContent) as Array<Position>
      } catch (e) {
        console.warn('Invalid position data passed to <moj-map>', e)
      }
    }
    return []
  }

  private async initialiseMap() {
    const options = this.parseAttributes()
    const mapContainer = this.shadow.querySelector('#map') as HTMLElement
    const overlayEl = (this.shadow.querySelector('.app-map__overlay') as HTMLElement) ?? null

    if (options.renderer === 'maplibre') {
      this.mapInstance = await setupMapLibreMap(
        mapContainer,
        options.vectorUrl,
        this.getControlOptions().enable3DBuildings ?? false,
      )
      this.adapter = createMapLibreAdapter(this, this.mapInstance as import('maplibre-gl').Map)
    } else {
      this.mapInstance = await setupOpenLayersMap(mapContainer, {
        target: mapContainer,
        vectorUrl: options.vectorUrl,
        usesInternalOverlays: options.usesInternalOverlays,
        overlayEl,
        controls: this.getControlOptions(),
      })
      this.adapter = createOpenLayersAdapter(this, this.mapInstance as import('ol/Map').default)

      const withOverlay: OLMapInstanceWithOverlay = this.mapInstance as OLMapInstanceWithOverlay
      this.featureOverlay = withOverlay.featureOverlay
    }
  }

  private getControlOptions(): MojMapControls {
    const parseBool = (name: string): boolean => this.hasAttribute(name) && this.getAttribute(name) !== 'false'
    const rotateAttr = this.getAttribute('rotate-control')
    let rotateOpt: false | { autoHide: boolean }
    if (rotateAttr === 'false') rotateOpt = false
    else if (rotateAttr === 'auto-hide') rotateOpt = { autoHide: true }
    else rotateOpt = { autoHide: false }

    const explicitScale = this.getAttribute('scale-control') as 'bar' | 'line' | null
    const legacyScaleLine = this.hasAttribute('scale-line') && this.getAttribute('scale-line') !== 'false'
    const scaleControl = explicitScale ?? (legacyScaleLine ? 'line' : undefined)
    const locationDisplay = (this.getAttribute('location-display') as 'dms' | 'latlon' | null) ?? undefined
    const locationDisplaySource = (this.getAttribute('location-source') as 'centre' | 'pointer' | null) ?? undefined
    const zoomSlider = parseBool('zoom-slider')
    const grabCursor = parseBool('grab-cursor')

    this.classList.toggle('has-rotate-control', rotateOpt !== false)
    this.classList.toggle('has-zoom-slider', zoomSlider)
    this.classList.toggle('has-scale-control', !!scaleControl)
    this.classList.toggle('has-location-dms', locationDisplay === 'dms')

    return {
      grabCursor,
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
