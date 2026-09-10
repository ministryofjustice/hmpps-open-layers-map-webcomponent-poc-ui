import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?raw'
import type { FeatureCollection } from 'geojson'
import { boundingExtent, extend, isEmpty } from 'ol/extent'
import type { Extent } from 'ol/extent'
import { fromLonLat } from 'ol/proj'
import type BaseLayer from 'ol/layer/Base'
import { degreesToOpenLayersRotation } from './helpers/viewport'
import { OLMapInstance, OLMapOptions } from './core/open-layers-map-instance'
import { MapLibreMapInstance } from './core/maplibre-map-instance'
import { setupOpenLayersMap } from './core/setup/setup-openlayers-map'
import { setupMapLibreMap } from './core/setup/setup-maplibre-map'
import { createMapDOM, createScopedStyle, getMapNonce } from './helpers/dom'
import FeatureOverlay from './core/overlays/feature-overlay'
import type { ComposableLayer, LayerStateOptions } from './core/layers/base'
import {
  type AttributionOptions,
  type MapAdapter,
  type MapLibrary,
  createOpenLayersAdapter,
  createMapLibreAdapter,
} from './core/map-adapter'
import styles from '../styles/em-map.raw.css?raw'
import { Position } from './core/types/position'
import config from './core/config'

type NativeOlLayerGroup = BaseLayer & {
  getLayers(): { getArray(): BaseLayer[] }
}

type EmMapControls = OLMapOptions['controls'] & {
  enable3DBuildings?: boolean
  olRotationMode?: 'default' | 'right-drag'
  olRotateTooltip?: boolean
}

type EmMapOptions = {
  renderer: MapLibrary
  vectorUrl: string
  usesInternalOverlays: boolean
  overlayBodyTemplateId?: string
  overlayTitleTemplateId?: string
  attribution?: { value: string; options?: AttributionOptions }
}

type OLMapInstanceWithOverlay = OLMapInstance & { featureOverlay?: FeatureOverlay }

type FitTarget = { type: 'points'; points: Position[] } | { type: 'layer'; layerId: string }

type ViewportOptions = {
  padding?: number | [number, number, number, number]
  maxZoom?: number
  animate?: boolean
  durationMs?: number
}

type FitToOptions = ViewportOptions & {
  targets: FitTarget[]
}

type InitialViewport = {
  latitude?: number
  longitude?: number
  zoom?: number
  rotation?: number
}

export class EmMap extends HTMLElement {
  private mapNonce: string | null = null

  private adapter?: MapAdapter

  private layers = new Map<string, ComposableLayer<unknown>>()

  private shadow: ShadowRoot

  private featureOverlay?: FeatureOverlay

  private geoJson: FeatureCollection | null = null

  private positionData: Array<Position> = []

  private mapInstance!: OLMapInstance | MapLibreMapInstance

  private pendingAttribution?: { value: string; options?: AttributionOptions }

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
    this.applyInitialViewportFromQuery()

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

  public addLayerGroup(group: NativeOlLayerGroup, layerStateOptions?: LayerStateOptions): BaseLayer {
    if (!this.adapter) throw new Error('Map not ready')

    if (!this.isNativeOlLayerGroup(group)) {
      throw new Error('[EmMap] addLayerGroup expects a native OpenLayers LayerGroup')
    }

    if (this.adapter.mapLibrary !== 'openlayers') {
      console.warn('[EmMap] Native layer groups are only supported with OpenLayers')
      return group
    }

    const map = this.olMapInstance
    if (!map) throw new Error('OpenLayers map not available')

    if (layerStateOptions?.zIndex !== undefined) {
      group.setZIndex(layerStateOptions.zIndex)
    }

    if (layerStateOptions?.visible !== undefined) {
      group.setVisible(layerStateOptions.visible)
    }

    map.addLayer(group)

    return group
  }

  // Composable layer
  public addLayer<T>(layer: ComposableLayer<T>, layerStateOptions?: LayerStateOptions): ComposableLayer<T>

  // Native OpenLayers layer
  public addLayer(layer: BaseLayer, layerStateOptions?: LayerStateOptions): BaseLayer

  // Implementation
  public addLayer<T>(
    layer: ComposableLayer<T> | BaseLayer,
    layerStateOptions?: LayerStateOptions,
  ): ComposableLayer<T> | BaseLayer {
    if (!this.adapter) throw new Error('Map not ready')

    if (this.isComposableLayer(layer)) {
      if (this.layers.has(layer.id)) this.removeLayer(layer.id)

      layer.attach(this.adapter, layerStateOptions)
      this.layers.set(layer.id, layer)
      return layer
    }

    if (this.adapter.mapLibrary !== 'openlayers') {
      console.warn('[EmMap] Native layers are only supported with OpenLayers')
      return layer
    }

    if (this.isNativeOlLayerGroup(layer)) {
      throw new Error('[EmMap] Use addLayerGroup() for native OpenLayers LayerGroup instances')
    }

    const map = this.olMapInstance
    if (!map) throw new Error('OpenLayers map not available')

    if (layerStateOptions?.zIndex !== undefined) {
      layer.setZIndex(layerStateOptions.zIndex)
    }

    if (layerStateOptions?.visible !== undefined) {
      layer.setVisible(layerStateOptions.visible)
    }

    map.addLayer(layer)

    return layer
  }

  public removeLayer(idOrTitle: string): void {
    if (!this.adapter) return

    // Try direct lookup by ID first
    let layer = this.layers.get(idOrTitle)
    let options: { title?: string } | undefined

    // Otherwise, look for a layer whose options.title matches the given name
    if (!layer) {
      for (const existingLayer of this.layers.values()) {
        const hasOptionsProperty =
          typeof existingLayer === 'object' && existingLayer !== null && 'options' in existingLayer

        if (hasOptionsProperty) {
          options = (existingLayer as { options?: { title?: string } }).options
        } else {
          options = undefined
        }

        if (options?.title === idOrTitle) {
          layer = existingLayer
          break
        }
      }
    }

    if (!layer) return

    layer.detach(this.adapter)
    this.layers.delete(layer.id)
  }

  public getLayer(id: string) {
    return this.layers.get(id)
  }

  public getNativeLayer(idOrTitle: string): BaseLayer | undefined {
    return this.findNativeLayersByIdOrTitle(idOrTitle)[0]
  }

  public closeOverlay() {
    this.featureOverlay?.close()
  }

  public setAttribution(value: string, options?: AttributionOptions): void {
    this.pendingAttribution = { value, options }

    if (!this.adapter) return

    this.adapter.setAttribution(value, options)
  }

  public setLayerVisibility(idOrTitle: string, visible: boolean): void {
    // Try composable layer first
    const composable = this.getLayer(idOrTitle)
    if (composable) {
      composable.getPrimaryLayer().setVisible(visible)
      return
    }

    // Fallback to native layers/groups
    const native = this.getNativeLayer(idOrTitle)
    if (native) {
      native.setVisible(visible)
    }
  }

  // Fits the map view to the given targets (layers or points), with options for padding, max zoom, and animation.
  public fitTo(options: FitToOptions) {
    if (!this.adapter) {
      requestAnimationFrame(() => this.fitTo(options))
      return
    }

    if (this.adapter.mapLibrary !== 'openlayers') {
      console.warn('[EmMap] fitTo not implemented for MapLibre yet')
      return
    }

    const { map } = this.adapter.openlayers!
    const view = map.getView()

    const extents: Extent[] = []

    for (const target of options.targets) {
      if (target.type === 'points' && target.points.length > 0) {
        const coords = target.points.map(position => fromLonLat([position.longitude, position.latitude]))
        extents.push(boundingExtent(coords))
      }

      if (target.type === 'layer') {
        const layer = this.layers.get(target.layerId)
        const extent = layer?.getExtent?.()

        if (extent) {
          extents.push(extent)
        } else {
          const nativeLayers = this.findNativeLayersByIdOrTitle(target.layerId)
          nativeLayers.forEach(nativeLayer => {
            const nativeExtent = this.getNativeLayerExtent(nativeLayer)
            if (nativeExtent) extents.push(nativeExtent)
          })
        }
      }
    }

    if (!extents.length) return

    const merged: Extent = extents.reduce((acc, ext) => extend(acc, ext))

    if (isEmpty(merged)) return

    // Handle single-point edge case
    const width = merged[2] - merged[0]
    const height = merged[3] - merged[1]

    const isSinglePoint = width === 0 && height === 0

    if (isSinglePoint) {
      const center: [number, number] = [(merged[0] + merged[2]) / 2, (merged[1] + merged[3]) / 2]

      view.animate({
        center,
        zoom: Math.min(options.maxZoom ?? 18, 16),
        duration: options.animate === false ? 0 : (options.durationMs ?? 500),
      })

      return
    }

    // If no animation, set view immediately and return
    if (options.animate === false) {
      const size = map.getSize()
      if (!size) return

      const padding = this.normalizePadding(options.padding ?? 40)

      // Adjust size for padding
      const paddedSize: [number, number] = [
        size[0] - padding[1] - padding[3], // width - left - right
        size[1] - padding[0] - padding[2], // height - top - bottom
      ]

      const resolution = view.getResolutionForExtent(merged, paddedSize)

      view.setCenter([(merged[0] + merged[2]) / 2, (merged[1] + merged[3]) / 2])

      if (resolution) {
        view.setResolution(resolution)
      }

      return
    }

    view.fit(merged, {
      padding: this.normalizePadding(options.padding ?? 40),
      maxZoom: options.maxZoom ?? 18,
      duration: options.durationMs ?? 500,
    })
  }

  // Fits the map view to points from a specific layer, with options for padding, max zoom, and animation.
  public fitToLayer(layerOrId: string | ComposableLayer, options?: ViewportOptions) {
    const layerId = typeof layerOrId === 'string' ? layerOrId : layerOrId.id

    this.fitTo({
      ...options,
      targets: [{ type: 'layer', layerId }],
    })
  }

  // Fits the map view to points from specific layers, with options for padding, max zoom, and animation.
  public fitToLayers(layerIds: Array<string | ComposableLayer>, options?: ViewportOptions) {
    this.fitTo({
      ...options,
      targets: layerIds.map(layer => ({
        type: 'layer',
        layerId: typeof layer === 'string' ? layer : layer.id,
      })),
    })
  }

  // Fits the map view to specific points, with options for padding, max zoom, and animation.
  public fitToPoints(points: Position[], options?: ViewportOptions) {
    this.fitTo({
      ...options,
      targets: [{ type: 'points', points }],
    })
  }

  // Fits the map view to points from the position data slot, with options for padding, max zoom, and animation.
  public fitToPositions(options?: ViewportOptions) {
    this.fitToPoints(this.positionData, options)
  }

  // Fits the map view to all layers currently on the map, with options for padding, max zoom, and animation.
  public fitToAllLayers(options?: ViewportOptions) {
    const layerIds = new Set<string>(Array.from(this.layers.keys()))

    if (this.adapter?.mapLibrary === 'openlayers') {
      const { map } = this.adapter.openlayers!

      const visit = (layer: BaseLayer) => {
        const id = layer.get('id')
        const title = layer.get('title')

        if (typeof id === 'string' && id.length > 0) {
          layerIds.add(id)
        } else if (typeof title === 'string' && title.length > 0) {
          layerIds.add(title)
        }

        if (this.isNativeOlLayerGroup(layer)) {
          layer
            .getLayers()
            .getArray()
            .forEach(child => visit(child))
        }
      }

      map
        .getLayers()
        .getArray()
        .forEach(layer => visit(layer))
    }

    this.fitToLayers(Array.from(layerIds), options)
  }

  // Focuses the map view on a specific point, with options for zoom level, animation, and animation duration.
  public focusOn({
    center,
    zoom,
    animate = true,
    durationMs = 500,
  }: {
    center: Position
    zoom?: number
    animate?: boolean
    durationMs?: number
  }) {
    if (!this.adapter || this.adapter.mapLibrary !== 'openlayers') return

    const { map } = this.adapter.openlayers!
    const view = map.getView()

    const projected = fromLonLat([center.longitude, center.latitude])

    view.animate({
      center: projected,
      zoom: zoom ?? view.getZoom(),
      duration: animate ? durationMs : 0,
    })
  }

  // Zooms the map view to a specific zoom level, optionally animating the transition.
  public zoomTo({ zoom, animate = true, durationMs = 300 }: { zoom: number; animate?: boolean; durationMs?: number }) {
    if (!this.adapter || this.adapter.mapLibrary !== 'openlayers') return

    const view = this.adapter.openlayers!.map.getView()

    view.animate({
      zoom,
      duration: animate ? durationMs : 0,
    })
  }

  private isNativeOlLayerGroup(layer: unknown): layer is NativeOlLayerGroup {
    return (
      typeof layer === 'object' &&
      layer !== null &&
      'getLayers' in layer &&
      typeof (layer as { getLayers?: unknown }).getLayers === 'function'
    )
  }

  private isComposableLayer(layer: unknown): layer is ComposableLayer<unknown> {
    return (
      typeof layer === 'object' &&
      layer !== null &&
      'attach' in layer &&
      typeof (layer as { attach?: unknown }).attach === 'function'
    )
  }

  private isSourceBackedLayer(
    layer: BaseLayer,
  ): layer is BaseLayer & { getSource(): { getExtent(): Extent } | null | undefined } {
    return 'getSource' in layer && typeof (layer as { getSource?: unknown }).getSource === 'function'
  }

  private findNativeLayersByIdOrTitle(idOrTitle: string): BaseLayer[] {
    if (!this.adapter || this.adapter.mapLibrary !== 'openlayers') return []

    const { map } = this.adapter.openlayers!
    const matches: BaseLayer[] = []

    const visit = (layer: BaseLayer) => {
      const id = layer.get('id')
      const title = layer.get('title')

      if ((typeof id === 'string' && id === idOrTitle) || (typeof title === 'string' && title === idOrTitle)) {
        matches.push(layer)
      }

      if (this.isNativeOlLayerGroup(layer)) {
        layer
          .getLayers()
          .getArray()
          .forEach(child => visit(child))
      }
    }

    map
      .getLayers()
      .getArray()
      .forEach(layer => visit(layer))
    return matches
  }

  private getNativeLayerExtent(layer: BaseLayer): Extent | null {
    if (this.isNativeOlLayerGroup(layer)) {
      const childExtents = layer
        .getLayers()
        .getArray()
        .map(child => this.getNativeLayerExtent(child))
        .filter((extent): extent is Extent => !!extent && !isEmpty(extent))

      if (!childExtents.length) return null

      return childExtents.reduce((acc, ext) => extend(acc, ext))
    }

    if (this.isSourceBackedLayer(layer)) {
      const source = layer.getSource()
      if (!source || !('getExtent' in source) || typeof source.getExtent !== 'function') return null

      const extent = source.getExtent()
      return extent && !isEmpty(extent) ? extent : null
    }

    return null
  }

  // Use padding to specify extra space (in pixels) around the target when fitting the view.
  private normalizePadding(padding: number | [number, number, number, number]): [number, number, number, number] {
    if (typeof padding === 'number') {
      return [padding, padding, padding, padding]
    }
    return padding
  }

  private parseAttributes(): EmMapOptions {
    const renderer: MapLibrary = this.getAttribute('renderer') === 'maplibre' ? 'maplibre' : 'openlayers'

    const vectorAttr = this.getAttribute('vector-url') || this.getAttribute('vector-test-url')
    const vectorUrl = vectorAttr && vectorAttr.trim() ? vectorAttr : config.tiles.urls.localVectorStyleUrl
    const attributionValue = this.getAttribute('attribution')?.trim() || ''
    const attributionAllowHtml =
      this.hasAttribute('attribution-allow-html') && this.getAttribute('attribution-allow-html') !== 'false'

    return {
      renderer,
      vectorUrl,
      usesInternalOverlays: this.hasAttribute('uses-internal-overlays'),
      overlayBodyTemplateId: this.getAttribute('overlay-body-template-id') || undefined,
      overlayTitleTemplateId: this.getAttribute('overlay-title-template-id') || undefined,
      attribution: attributionValue
        ? {
            value: attributionValue,
            options: { allowHtml: attributionAllowHtml },
          }
        : undefined,
    }
  }

  private parseGeoJsonFromSlot(): FeatureCollection | null {
    const script = this.querySelector('script[type="application/json"][slot="geojson-data"]')
    if (script?.textContent) {
      try {
        return JSON.parse(script.textContent) as FeatureCollection
      } catch (e) {
        console.warn('Invalid GeoJSON passed to <em-map>', e)
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
        console.warn('Invalid position data passed to <em-map>', e)
      }
    }
    return []
  }

  private parseInitialViewportFromQuery(): InitialViewport | null {
    const params = new URLSearchParams(window.location.search)

    const parseNumber = (value: string | null): number | undefined => {
      if (value === null || value.trim() === '') return undefined

      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }

    const latitude = parseNumber(params.get('lat'))
    const longitude = parseNumber(params.get('lng'))
    const zoom = parseNumber(params.get('zoom'))
    const rotation = parseNumber(params.get('rotation'))

    const hasCentre = latitude !== undefined && longitude !== undefined
    const hasZoom = zoom !== undefined
    const hasRotation = rotation !== undefined

    if (!hasCentre && !hasZoom && !hasRotation) {
      return null
    }

    if ((latitude !== undefined && longitude === undefined) || (latitude === undefined && longitude !== undefined)) {
      console.warn('[EmMap] Ignoring partial centre from query params. Both lat and lng are required to set centre.')
    }

    return {
      latitude,
      longitude,
      zoom,
      rotation,
    }
  }

  private applyInitialViewportFromQuery() {
    const initialViewport = this.parseInitialViewportFromQuery()

    if (!initialViewport || !this.adapter) return

    if (this.adapter.mapLibrary !== 'openlayers') {
      console.warn('[EmMap] Query param viewport initialisation not implemented for MapLibre yet')
      return
    }

    const map = this.olMapInstance!
    const view = map.getView()

    const { latitude } = initialViewport
    const { longitude } = initialViewport

    if (latitude !== undefined && longitude !== undefined) {
      view.setCenter(fromLonLat([longitude, latitude]))
    }

    if (initialViewport.zoom !== undefined) {
      view.setZoom(initialViewport.zoom)
    }

    if (initialViewport.rotation !== undefined) {
      view.setRotation(degreesToOpenLayersRotation(initialViewport.rotation))
    }
  }

  private async initialiseMap() {
    const options = this.parseAttributes()
    const mapContainer = this.shadow.querySelector('#map') as HTMLElement
    const overlayEl = (this.shadow.querySelector('.app-map__overlay') as HTMLElement) ?? null

    if (!this.pendingAttribution && options.attribution) {
      this.pendingAttribution = options.attribution
    }

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

    if (this.pendingAttribution) {
      this.adapter.setAttribution(this.pendingAttribution.value, this.pendingAttribution.options)
    }
  }

  private getControlOptions(): EmMapControls {
    const parseBool = (name: string): boolean => this.hasAttribute(name) && this.getAttribute(name) !== 'false'

    const rotateButtonAttr = this.getAttribute('rotate-control')
    let rotateButtonOpt: false | { autoHide: boolean }
    if (rotateButtonAttr === 'false') rotateButtonOpt = false
    else if (rotateButtonAttr === 'auto-hide') rotateButtonOpt = { autoHide: true }
    else rotateButtonOpt = { autoHide: false }
    const olRotateTooltip = this.hasAttribute('ol-rotate-tooltip')
      ? this.getAttribute('ol-rotate-tooltip') !== 'false'
      : true

    const legacyScaleLine = this.hasAttribute('scale-line') && this.getAttribute('scale-line') !== 'false'
    const scaleAttr = this.getAttribute('scale-control')
    const locationDisplay = (this.getAttribute('location-display') as 'dms' | 'latlon' | null) ?? undefined
    const locationDisplaySource = (this.getAttribute('location-source') as 'centre' | 'pointer' | null) ?? undefined
    const zoomSlider = parseBool('zoom-slider')
    const zoomControl =
      zoomSlider || !this.hasAttribute('zoom-control') || this.getAttribute('zoom-control') !== 'false'
    const grabCursor = parseBool('grab-cursor')
    const constrainOnlyCenter = !this.hasAttribute('constrain-only-center')
      ? true
      : this.getAttribute('constrain-only-center') !== 'false'
    let scaleControl: 'bar' | 'line' | undefined

    if (scaleAttr === 'bar' || scaleAttr === 'line') {
      scaleControl = scaleAttr
    } else if (scaleAttr === 'false') {
      scaleControl = undefined
    } else if (legacyScaleLine) {
      scaleControl = 'line'
    }

    const rendererAttr = this.getAttribute('renderer')
    const isOpenLayers = rendererAttr !== 'maplibre'
    let olRotationMode: 'default' | 'right-drag' | undefined

    if (isOpenLayers) {
      const rotationModeAttr = this.getAttribute('ol-rotation-mode')
      if (rotationModeAttr === 'right-drag') {
        olRotationMode = 'right-drag'
      } else {
        olRotationMode = 'default'
      }
    }

    this.classList.toggle('has-rotate-control', rotateButtonOpt !== false)
    this.classList.toggle('has-zoom-control', zoomControl)
    this.classList.toggle('has-zoom-slider', zoomSlider)
    this.classList.toggle('has-scale-control', !!scaleControl)
    this.classList.toggle('has-location-dms', locationDisplay === 'dms')
    this.classList.toggle('ol-rotation-mode', olRotationMode === 'right-drag')
    this.classList.toggle('ol-rotate-tooltip', olRotateTooltip)

    return {
      grabCursor,
      rotate: rotateButtonOpt,
      olRotateTooltip,
      olRotationMode,
      zoomControl,
      zoomSlider,
      scaleControl,
      locationDisplay,
      locationDisplaySource,
      enable3DBuildings: parseBool('enable-3d-buildings'),
      constrainOnlyCenter,
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

customElements.define('em-map', EmMap)
