import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { circular as circularPolygon } from 'ol/geom/Polygon'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style, RegularShape } from 'ol/style'
import { fromLonLat } from 'ol/proj'

import { EmMap } from '../../components/map/scripts/em-map'
import { CirclesLayer, LocationsLayer, TextLayer, TracksLayer } from '../../components/map/scripts/core/layers'
import config from '../../components/map/scripts/core/config'
import '../../components/map/styles/em-map.scss'

import defaultPositions from '../../components/map/fixtures/positions.json'
import type { MarkerOptions } from '../../components/map/scripts/core/layers/locations-layer'

const DEMO_CENTRE: [number, number] = [-2.2434, 53.48015]

type DirectionUnits = 'degrees' | 'radians'

interface MapDemoOptions {
  container?: HTMLElement
  positions?: any[]
  renderer?: 'openlayers' | 'maplibre'
  enable3D?: boolean
  controls?: {
    zoomControl?: boolean
    zoomSlider?: boolean
    rotate?: 'true' | 'auto-hide' | 'false'
    olRotationMode?: 'default' | 'right-drag'
    olRotateTooltip?: boolean
    scale?: 'bar' | 'line' | 'false'
    locationDisplay?: 'dms' | 'latlon' | 'false'
    grabCursor?: boolean
    constrainOnlyCenter?: boolean
  }
  showPositions?: boolean
  showText?: boolean
  showCircles?: boolean
  showTracks?: boolean
  entryExit?: {
    enabled?: boolean
    extensionDistanceMeters?: number
    direction?: {
      property?: string
      units?: DirectionUnits
    }
  }
  usesInternalOverlays?: boolean
  attribution?: string
  attributionAllowHtml?: boolean
  markerMode?: 'default' | 'pin' | 'pin-with-icon' | 'image' | 'mixed'
  includeViewportDemoLayers?: boolean
}

// Demo crime layers (centre + 100m radius)
function addDemoCrimeLayers(map: any, centreLonLat: [number, number]) {
  const centre = fromLonLat(centreLonLat)

  // Marker
  const marker = new Feature({ geometry: new Point(centre) })
  marker.setStyle(
    new Style({
      image: new RegularShape({
        points: 4,
        radius: 10,
        angle: Math.PI / 4,
        fill: new Fill({ color: 'rgba(220,0,0,1)' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }),
  )

  const markerLayer = new VectorLayer({
    source: new VectorSource({ features: [marker] }),
  })
  markerLayer.setZIndex(10)
  map.addLayer(markerLayer)

  // Circle (100m)
  const geom = circularPolygon(centreLonLat, 100, 96).transform('EPSG:4326', map.getView().getProjection())

  const circleFeature = new Feature({ geometry: geom })
  circleFeature.setStyle(
    new Style({
      fill: new Fill({ color: 'rgba(0,0,0,0.1)' }),
      stroke: new Stroke({ color: 'rgba(0,0,0,0.5)', width: 2 }),
    }),
  )

  const circleLayer = new VectorLayer({
    source: new VectorSource({ features: [circleFeature] }),
  })
  circleLayer.setZIndex(0)
  map.addLayer(circleLayer)
}

function ensureOverlayTemplatesOnce() {
  const TITLE_ID = 'overlay-title-test-location'
  const BODY_ID = 'overlay-body-test-location'
  if (document.getElementById(TITLE_ID) && document.getElementById(BODY_ID)) return

  const titleTmpl = document.createElement('template')
  titleTmpl.id = TITLE_ID
  titleTmpl.innerHTML = `
    <div><strong>Name (NOMIS ID): {{personName}} ({{personNomisId}})</strong></div>
  `.trim()

  const bodyTmpl = document.createElement('template')
  bodyTmpl.id = BODY_ID
  bodyTmpl.innerHTML = `
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Speed </span><span class="app-map__overlay-value">{{displaySpeed}}</span></div>
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Direction </span><span class="app-map__overlay-value">{{displayDirection}}</span></div>
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Geolocation Mechanism </span><span class="app-map__overlay-value">{{displayGeolocationMechanism}}</span></div>
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Recorded </span><span class="app-map__overlay-value">{{displayTimestamp}}</span></div>
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Confidence </span><span class="app-map__overlay-value">{{displayConfidence}}</span></div>
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Latitude </span><span class="app-map__overlay-value">{{displayLatitude}}</span></div>
    <div class="app-map__overlay-row"><span class="app-map__overlay-label">Longitude </span><span class="app-map__overlay-value">{{displayLongitude}}</span></div>
  `.trim()

  document.body.appendChild(titleTmpl)
  document.body.appendChild(bodyTmpl)
}

// Helper to demo different marker styles in the LocationsLayer (used in LayersExample story)
function getMarkerForMode(mode: MapDemoOptions['markerMode'], index: number): MarkerOptions | undefined {
  if (mode === 'pin') {
    return {
      type: 'pin',
      pin: { color: '#d4351c' },
    }
  }

  if (mode === 'pin-with-icon') {
    return {
      type: 'pin',
      pin: {
        color: '#1d70b8',
        iconSrc: '/map-icons/house.png',
        scale: 1.4,
        iconScale: 0.9,
      },
    }
  }

  if (mode === 'image') {
    return {
      type: 'image',
      image: {
        src: '/map-icons/house.png',
      },
    }
  }

  if (mode === 'mixed') {
    const patterns: MarkerOptions[] = [
      {
        type: 'pin',
        pin: { color: '#d4351c' },
      },
      {
        type: 'pin',
        pin: {
          color: '#f2c94c',
          iconSrc: '/map-icons/person.png',
          scale: 1.4,
          iconScale: 0.9,
        },
      },
      {
        type: 'image',
        image: {
          src: '/map-icons/house.png',
        },
      },
      {
        type: 'image',
        image: {
          name: 'person',
        },
      },
    ]

    return patterns[index % patterns.length]
  }

  return undefined
}

// Creates and mounts a configured <em-map> element for Demos / Stories.
export function setupMapDemo({
  container = document.body,
  positions,
  renderer = 'openlayers',
  enable3D = true,
  controls = {
    grabCursor: true,
    scale: 'bar',
    locationDisplay: 'latlon',
    rotate: 'true',
    olRotationMode: 'default',
    olRotateTooltip: true,
    zoomControl: true,
    zoomSlider: true,
  },
  showPositions = true,
  showTracks = false,
  showText = false,
  showCircles = false,
  usesInternalOverlays = true,
  attribution,
  attributionAllowHtml = false,
  markerMode = 'default',
  includeViewportDemoLayers = false,
  entryExit,
}: MapDemoOptions = {}): HTMLElement {
  const map = document.createElement('em-map')
  const apiKey = import.meta.env.STORYBOOK_OS_MAPS_API_KEY_PUBLIC_DOCS || ''
  const vectorTestUrl = `${config.tiles.urls.vectorStyleUrl}${config.tiles.urls.vectorStyleUrl.includes('?') ? '&' : '?'}key=${apiKey}`

  // Core setup
  map.setAttribute('api-key', apiKey)
  map.setAttribute('csp-nonce', '1234abcd')
  map.setAttribute('vector-test-url', vectorTestUrl)

  // Toggle overlays on/off
  if (usesInternalOverlays) {
    map.setAttribute('uses-internal-overlays', '')
    ensureOverlayTemplatesOnce()
  }

  if (renderer === 'maplibre') map.setAttribute('renderer', 'maplibre')
  if (enable3D) map.setAttribute('enable-3d-buildings', '')

  // Controls
  if (controls.scale) map.setAttribute('scale-control', controls.scale)
  if (controls.locationDisplay) map.setAttribute('location-display', controls.locationDisplay)
  if (controls.rotate) map.setAttribute('rotate-control', controls.rotate)
  if (controls.olRotationMode) map.setAttribute('ol-rotation-mode', controls.olRotationMode)
  if (typeof controls.olRotateTooltip === 'boolean')
    map.setAttribute('ol-rotate-tooltip', String(controls.olRotateTooltip))
  if (typeof controls.zoomControl === 'boolean') map.setAttribute('zoom-control', String(controls.zoomControl))
  if (typeof controls.zoomSlider === 'boolean') map.setAttribute('zoom-slider', String(controls.zoomSlider))
  if (typeof controls.grabCursor === 'boolean') map.setAttribute('grab-cursor', String(controls.grabCursor))
  if (typeof controls.constrainOnlyCenter === 'boolean')
    map.setAttribute('constrain-only-center', String(controls.constrainOnlyCenter))

  if (attribution) map.setAttribute('attribution', attribution)
  if (attributionAllowHtml) map.setAttribute('attribution-allow-html', '')

  // Positions data
  const positionData = positions ?? defaultPositions
  const positionsScript = document.createElement('script')
  positionsScript.type = 'application/json'
  positionsScript.slot = 'position-data'
  positionsScript.textContent = JSON.stringify(positionData)
  map.appendChild(positionsScript)

  // Append + layer setup
  container.appendChild(map)

  map.addEventListener('map:ready', () => {
    const emMap = map as EmMap
    const olMap = emMap.olMapInstance
    let mapPositions = emMap.positions
    if (!olMap || !mapPositions?.length) return

    if (entryExit?.enabled) {
      mapPositions = mapPositions.slice(0, 5)
      addDemoCrimeLayers(olMap, DEMO_CENTRE)
    }

    const withMarkers = mapPositions.map((p, i) => {
      const marker = getMarkerForMode(markerMode, i)
      return marker ? { ...p, marker } : p
    })

    emMap.addLayer(
      new LocationsLayer({
        id: 'locations',
        title: 'locationsLayer',
        positions: withMarkers,
        visible: showPositions,
        zIndex: 4,
        style: {
          radius: 8,
          fill: '#d4351c',
        },
      }),
    )

    if (includeViewportDemoLayers) {
      const subsetOfPositions = mapPositions.slice(0, 5)
      const shiftedCoordinates = subsetOfPositions.map(position => ({
        ...position,
        latitude: position.latitude + 0.01,
        longitude: position.longitude + 0.01,
      }))

      emMap.addLayer(
        new LocationsLayer({
          id: 'locations-secondary',
          positions: shiftedCoordinates,
          visible: true,
          zIndex: 5,
          style: {
            radius: 6,
            fill: '#28a197',
          },
        }),
      )
    }

    emMap.addLayer(
      new TracksLayer({
        id: 'tracks',
        title: 'tracksLayer',
        positions: mapPositions,
        visible: showTracks,
        entryExit: {
          enabled: entryExit?.enabled,
          extensionDistanceMeters: entryExit?.extensionDistanceMeters,
          direction: entryExit?.direction,
          centre: DEMO_CENTRE,
          radiusMeters: 100,
        },
        zIndex: 1,
      }),
    )

    emMap.addLayer(
      new TextLayer({
        positions: withMarkers,
        textProperty: 'sequenceNumber',
        id: 'text',
        title: 'textLayer',
        visible: showText,
        zIndex: 3,
      }),
    )

    emMap.addLayer(
      new CirclesLayer({
        positions: mapPositions,
        id: 'confidence',
        title: 'confidenceLayer',
        visible: showCircles,
        zIndex: 2,
      }),
    )
  })

  return map
}
