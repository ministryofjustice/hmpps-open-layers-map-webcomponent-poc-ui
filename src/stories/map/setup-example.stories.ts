import type { Meta, StoryObj, StoryContext } from '@storybook/web-components-vite'
import { setupMapDemo } from './setupMapDemo'
import positions from '../../components/map/fixtures/positions.json'

type SetupStoryArgs = {
  renderer: 'openlayers' | 'maplibre'
  enable3D: boolean
  positions: any[]
  usesInternalOverlays: boolean
  attribution: string
  attributionAllowHtml: boolean
  'controls.zoomControl': boolean
  'controls.zoomSlider': boolean
  'controls.rotate': 'true' | 'auto-hide' | 'false'
  'controls.olRotationMode': 'default' | 'right-drag'
  'controls.olRotateTooltip': boolean
  'controls.scale': 'bar' | 'line' | 'false'
  'controls.locationDisplay': 'dms' | 'latlon' | 'false'
  'controls.grabCursor': boolean
  'controls.constrainOnlyCenter': boolean

  'query.lat': string
  'query.lng': string
  'query.zoom': string
  'query.rotation': string
  'query.showInfoBar': boolean
}

const meta = {
  title: 'Components/Map/Setup',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    renderer: { control: 'select', options: ['openlayers', 'maplibre'] },
    enable3D: {
      control: 'boolean',
      if: { arg: 'renderer', eq: 'maplibre' },
      description: 'Only available for MapLibre renderer',
    },
    positions: {
      control: 'object',
      description: 'Array of positions (empty array simulates no data)',
    },
    usesInternalOverlays: {
      control: 'boolean',
      description: 'Enable click-to-open overlays (injects demo templates automatically)',
    },
    attribution: {
      control: 'text',
      table: { category: 'Attribution' },
      description: 'Declarative attribution text or sanitized HTML',
    },
    attributionAllowHtml: {
      control: 'boolean',
      table: { category: 'Attribution' },
      description: 'Allow sanitized HTML links in attribution',
    },
    'controls.zoomControl': {
      control: 'boolean',
      table: { category: 'Controls' },
    },
    'controls.zoomSlider': {
      control: 'boolean',
      table: { category: 'Controls' },
    },
    'controls.rotate': {
      control: 'select',
      options: ['true', 'auto-hide', 'false'],
      table: { category: 'Controls' },
    },
    'controls.olRotationMode': {
      control: 'select',
      options: ['default', 'right-drag'],
      description:
        'Rotation gesture mode. "default" = Alt+Shift + left-drag (OpenLayers). "right-drag" = right-drag or Ctrl + left-drag.',
      table: { category: 'Controls' },
    },
    'controls.olRotateTooltip': {
      control: 'boolean',
      description: 'Show rotate gesture tooltip when rotation control is visible',
      table: { category: 'Controls' },
    },
    'controls.scale': {
      control: 'select',
      options: ['bar', 'line', 'false'],
      table: { category: 'Controls' },
    },
    'controls.locationDisplay': {
      control: 'select',
      options: ['dms', 'latlon', 'false'],
      table: { category: 'Controls' },
    },
    'controls.grabCursor': {
      control: 'boolean',
      table: { category: 'Controls' },
    },
    'controls.constrainOnlyCenter': {
      control: 'boolean',
      description:
        'When true (default), only the view centre is constrained to the UK extent, allowing panning/zooming past the coastline with an elastic snap-back. When false, the whole viewport is constrained, blocking panning past the bounds more aggressively.',
      table: { category: 'Controls' },
    },

    'query.lat': {
      control: 'text',
      table: { category: 'Query params' },
      description: 'Initial latitude',
    },
    'query.lng': {
      control: 'text',
      table: { category: 'Query params' },
      description: 'Initial longitude',
    },
    'query.zoom': {
      control: 'text',
      table: { category: 'Query params' },
      description: 'Initial zoom',
    },
    'query.rotation': {
      control: 'text',
      table: { category: 'Query params' },
      description: 'Initial rotation',
    },
    'query.showInfoBar': {
      control: 'boolean',
      table: { category: 'Query params' },
      description: 'Show the query string preview bar above the map',
    },
  },
  render: args => {
    const storyArgs = args as SetupStoryArgs

    const wrapper = document.createElement('div')

    const info = document.createElement('div')
    info.className = 'map-demo-info'

    const container = document.createElement('div')
    container.classList.add('map-container')

    const params = new URLSearchParams()

    if (storyArgs['query.lat']) params.set('lat', storyArgs['query.lat'])
    if (storyArgs['query.lng']) params.set('lng', storyArgs['query.lng'])
    if (storyArgs['query.zoom']) params.set('zoom', storyArgs['query.zoom'])
    if (storyArgs['query.rotation']) params.set('rotation', storyArgs['query.rotation'])

    const queryString = params.toString()
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)

    info.textContent = storyArgs['query.showInfoBar']
      ? `Query params: ${queryString ? `?${queryString}` : '(none)'}`
      : ''

    setupMapDemo({
      container,
      positions: storyArgs.positions,
      renderer: storyArgs.renderer,
      enable3D: storyArgs.enable3D,
      usesInternalOverlays: storyArgs.usesInternalOverlays,
      attribution: storyArgs.attribution,
      attributionAllowHtml: storyArgs.attributionAllowHtml,
      controls: {
        zoomControl: storyArgs['controls.zoomControl'],
        zoomSlider: storyArgs['controls.zoomSlider'],
        rotate: storyArgs['controls.rotate'],
        olRotationMode: storyArgs['controls.olRotationMode'],
        olRotateTooltip: storyArgs['controls.olRotateTooltip'],
        scale: storyArgs['controls.scale'],
        locationDisplay: storyArgs['controls.locationDisplay'],
        grabCursor: storyArgs['controls.grabCursor'],
        constrainOnlyCenter: storyArgs['controls.constrainOnlyCenter'],
      },
      showPositions: true,
      showTracks: false,
      showText: false,
      showCircles: false,
    })

    if (storyArgs['query.showInfoBar']) {
      wrapper.appendChild(info)
    }
    wrapper.appendChild(container)

    return wrapper
  },
} satisfies Meta

export default meta
type Story = StoryObj<SetupStoryArgs>

export const Example: Story = {
  args: {
    renderer: 'openlayers',
    enable3D: true,
    positions,
    usesInternalOverlays: true,
    attribution: "<a href='https://example.test'>© Ordnance Survey</a>",
    attributionAllowHtml: true,

    'controls.zoomControl': true,
    'controls.zoomSlider': false,
    'controls.rotate': 'false',
    'controls.olRotationMode': 'default',
    'controls.olRotateTooltip': true,
    'controls.scale': 'false',
    'controls.locationDisplay': 'false',
    'controls.grabCursor': true,
    'controls.constrainOnlyCenter': true,

    'query.lat': '51.5074',
    'query.lng': '-0.1278',
    'query.zoom': '12',
    'query.rotation': '0',
    'query.showInfoBar': true,
  },
  parameters: {
    docs: {
      source: {
        language: 'njk',
        transform: (_src: string, context: StoryContext) => {
          const args = context.args as Record<string, any>
          const enable3D = args.renderer === 'maplibre' ? `\n  enable3DBuildings: ${args.enable3D},` : ''
          const attribution = String(args.attribution || '').replaceAll("'", "\\\\'")

          const queryParams = new URLSearchParams()
          if (args['query.lat']) queryParams.set('lat', args['query.lat'])
          if (args['query.lng']) queryParams.set('lng', args['query.lng'])
          if (args['query.zoom']) queryParams.set('zoom', args['query.zoom'])
          if (args['query.rotation']) queryParams.set('rotation', args['query.rotation'])

          const queryPrefix = queryParams.toString() ? `?${queryParams.toString()}\n\n` : ''

          return `${queryPrefix}{% from "em-map/macro.njk" import emMap %}

{# Overlay templates defined elsewhere on the page (required when usesInternalOverlays=true) #}
<template id="overlay-title-test-location">
  <div><strong>Name (NOMIS ID): {{personName}} ({{personNomisId}})</strong></div>
</template>

<template id="overlay-body-test-location">
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Speed </span><span class="app-map__overlay-value">{{displaySpeed}}</span></div>
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Direction </span><span class="app-map__overlay-value">{{displayDirection}}</span></div>
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Geolocation Mechanism </span><span class="app-map__overlay-value">{{displayGeolocationMechanism}}</span></div>
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Recorded </span><span class="app-map__overlay-value">{{displayTimestamp}}</span></div>
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Confidence </span><span class="app-map__overlay-value">{{displayConfidence}}</span></div>
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Latitude </span><span class="app-map__overlay-value">{{displayLatitude}}</span></div>
  <div class="app-map__overlay-row"><span class="app-map__overlay-label">Longitude </span><span class="app-map__overlay-value">{{displayLongitude}}</span></div>
</template>

{{ emMap({
  alerts: alerts,
  cspNonce: cspNonce,
  positions: positions,
  renderer: '${args.renderer}',${enable3D}
  usesInternalOverlays: ${args.usesInternalOverlays},
  attribution: '${attribution}',
  attributionAllowHtml: ${args.attributionAllowHtml},
  controls: {
    scaleControl: '${args['controls.scale']}',
    locationDisplay: '${args['controls.locationDisplay']}',
    rotateControl: '${args['controls.rotate']}',
    olRotationMode: '${args['controls.olRotationMode']}',
    olRotateTooltip: ${args['controls.olRotateTooltip']},
    zoomControl: ${args['controls.zoomControl']},
    zoomSlider: ${args['controls.zoomSlider']},
    grabCursor: ${args['controls.grabCursor']},
    constrainOnlyCenter: ${args['controls.constrainOnlyCenter']}
  }
}) }}`
        },
      },
    },
  },
}
