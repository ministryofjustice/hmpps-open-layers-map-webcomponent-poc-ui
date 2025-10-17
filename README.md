# hmpps-open-layers-map-webcomponent-poc-ui

A native Web Component for rendering maps with **OpenLayers** (default) or **MapLibre GL**.  
Includes a small layer API for common overlays (locations, tracks, circles, numbering).

---

## Browser Support

| Browser             | Support |
| ------------------- | ------- |
| Chrome (evergreen)  | ✅      |
| Firefox (evergreen) | ✅      |
| Safari 15+          | ✅      |
| Edge (Chromium)     | ✅      |
| IE11                | ❌      |

### Fallback Strategy

This component targets modern browsers only.

- IE11 is **not supported** (no native Web Components).
- Polyfilling for IE11 is **not recommended** (performance/compat issues).
- If legacy support is required, render a fallback view from your server-side templates.

---

# Getting Started with `<moj-map>`

`<moj-map>` is an embeddable map component. It uses Ordnance Survey **vector tiles** by default via a small server middleware and provides a typed API for adding layers from your app code.

---

## 1) Install

```bash
npm install hmpps-open-layers-map
```

Register the custom element once (e.g. in your client entry file):

```ts
import 'hmpps-open-layers-map'
```

Optionally import types if you’ll interact with the map in TypeScript:

```ts
import type { MojMap } from 'hmpps-open-layers-map'
```

---

## 2) Server middleware (Ordnance Survey Vector Tiles API)

This package exports an Express middleware that securely proxies Ordnance Survey Vector Tiles (OAuth2 + caching).  
Mount it in your server app, e.g.:

```ts
// server/os-vector.ts
import express from 'express'
import { mojOrdnanceSurveyAuth } from 'hmpps-open-layers-map/server'

const router = express.Router()

router.use(
  mojOrdnanceSurveyAuth({
    apiKey: process.env.OS_API_KEY!, // from OS
    apiSecret: process.env.OS_API_SECRET!, // from OS
    // Optional: Redis cache + expiry override
    // redisClient: connectedRedisClient, // connected redis client
    // cacheExpiry: 3600, // seconds; default is 7 days in production, 0 in dev
  }),
)

export default router
```

Then mount that router in your app:

```ts
// server/app.ts
import express from 'express'
import osVector from './os-vector'

const app = express()
app.use(osVector)
```

### Notes

- **cacheExpiry**: In production the default is **7 days** (can be overridden). In development it defaults to **0** (no caching) unless you set a value.
- If you provide a redisClient, the middleware enables server-side caching for tiles and static assets (glyphs/sprites).

It also sets ETag and Cache-Control headers so browsers can handle their own client-side caching and revalidation.

---

## 3) Nunjucks setup

Point Nunjucks at the component templates:

```ts
// e.g. server/utils/nunjucksSetup.ts
nunjucks.configure(['<your-app-views>', 'node_modules/hmpps-open-layers-map/nunjucks'])
```

Render the element with the macro:

```njk
{% raw %}
{% from "components/moj-map/macro.njk" import mojMap %}

{{ mojMap({
  alerts: params.alerts,
  cspNonce: params.cspNonce
}) }}
{% endraw %}
```

Ensure the host element has a **non-zero height** (OpenLayers won’t render otherwise).

**Host CSS height example:**

```scss
.map-container {
  height: 450px;
}
```

---

## 4) CSP (Content Security Policy)

In your `server/app.ts`, update the Helmet configuration to include `cdn.jsdelivr.net` in both the `style-src` and `font-src` directives, and allow inline styles for OpenLayers’ dynamic controls (e.g. scale bar updates):

```ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
        styleSrc: ["'self'", 'cdn.jsdelivr.net', "'unsafe-inline'"], // Change this
        fontSrc: ["'self'", 'cdn.jsdelivr.net'], // Change this
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  }),
)
```

### Why this is needed

- **`cdn.jsdelivr.net`** — allows the browser to load OpenLayers’ `@fontsource` CSS and font files.
- **`'unsafe-inline'`** — required because OpenLayers applies small inline `style` attributes (e.g. updating the width of the scale bar dynamically).

This configuration keeps security strict for scripts (the `script-src` directive remains nonce-based) while allowing OpenLayers and MapLibre to function correctly.

---

## Macro Parameters (updated)

| Parameter              | Type / Values                | Description                                                               |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `positions`            | Array                        | **New** input data for the map                                            |
| `usesInternalOverlays` | boolean                      | If true, enables built-in overlay and pointer interaction.                |
| `cspNonce`             | string                       | Optional CSP nonce used by inline styles.                                 |
| `renderer`             | `'openlayers' \| 'maplibre'` | Select rendering library (default `'openlayers'`).                        |
| `controls`             | object                       | Map controls config (see below).                                          |
| `enable3DBuildings`    | boolean                      | MapLibre only: adds a 🏙 toggle for 3D buildings.                         |
| `alerts`               | array                        | Optional list of Moj Design System alerts to render into the alerts slot. |

### `controls` object

| Property          | Type / Values                  | Description                                                              |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `grabCursor`      | boolean                        | If true (default), shows MapLibre-style `grab`/`grabbing` cursor on pan. |
| `rotateControl`   | `true \| false \| 'auto-hide'` | Show the rotate/compass control; `'auto-hide'` hides it until rotated.   |
| `zoomSlider`      | boolean                        | Show the zoom slider.                                                    |
| `scaleControl`    | `'bar' \| 'line' \| false`     | Scale bar/line.                                                          |
| `locationDisplay` | `'dms' \| 'latlon' \| false`   | Coordinate readout at the bottom near the scale bar.                     |

---

## Component Attributes (for raw HTML)

| Attribute                | Type / Values                | Description                                     |
| ------------------------ | ---------------------------- | ----------------------------------------------- |
| `uses-internal-overlays` | boolean                      | Enables built-in overlay + pointer interaction. |
| `csp-nonce`              | string                       | Nonce for inline styles.                        |
| `renderer`               | `openlayers \| maplibre`     | Renderer choice (default `openlayers`).         |
| `rotate-control`         | `false \| auto-hide \| true` | Rotate/compass control.                         |
| `zoom-slider`            | boolean (presence enables)   | Zoom slider control.                            |
| `scale-control`          | `bar \| line`                | Scale control style.                            |
| `location-display`       | `dms \| latlon`              | Coordinate readout style.                       |
| `enable-3d-buildings`    | boolean (presence enables)   | MapLibre only: toggle for 3D buildings.         |
| `grab-cursor`            | boolean (presence enables)   | MapLibre-style panning cursor.                  |

---

## Example (Nunjucks)

```njk
{% raw %}
{% from "components/moj-map/macro.njk" import mojMap %}

{{ mojMap({
  alerts: params.alerts,
  cspNonce: params.cspNonce,
  positions: params.positions,
  usesInternalOverlays: true,
  renderer: 'maplibre',
  controls: {
    scaleControl: 'bar',
    locationDisplay: 'dms',
    rotateControl: 'auto-hide',
    zoomSlider: true,
    grabCursor: false
  },
  enable3DBuildings: true
}) }}
{% endraw %}
```

---

## Map Lifecycle (`map:ready`)

The component fires **`map:ready`** once initialised:

```ts
import type { MojMap } from 'hmpps-open-layers-map'

const mojMap = document.querySelector('moj-map') as MojMap

await new Promise<void>(resolve => {
  mojMap.addEventListener('map:ready', () => resolve(), { once: true })
})

// OpenLayers map instance (if using OpenLayers renderer)
const map = mojMap.olMapInstance

// The positions payload you provided
const positions = mojMap.positions
```

---

## Adding Layers (OpenLayers renderer)

Import layer classes from `hmpps-open-layers-map/layers`.

Each layer accepts:

- `geoJson` — your `FeatureCollection`
- `visible?: boolean`
- `zIndex?: number`
- Other layer-specific options

### Available layers

- `LocationsLayer` — renders **Point** features as circles.
- `TracksLayer` — composite layer for **LineString** data:
  - lines (`LinesLayer`), and
  - optional arrows (`ArrowsLayer`) indicating direction.
- `CirclesLayer` — renders **Point** features as **Circle** geometries with radius read from a property (e.g. `"confidence"`).
- `NumberingLayer` — paints numbers as text labels next to points.

### Full example

```ts
import type { MojMap } from 'hmpps-open-layers-map'
import { LocationsLayer, TracksLayer, CirclesLayer, NumberingLayer } from 'hmpps-open-layers-map/layers'
import { isEmpty } from 'ol/extent'

const mojMap = document.querySelector('moj-map') as MojMap

await new Promise<void>(resolve => {
  mojMap.addEventListener('map:ready', () => resolve(), { once: true })
})

const map = mojMap.olMapInstance!
const geoJson = mojMap.geojson // if your positions are exposed as GeoJSON
if (!geoJson) throw new Error('No GeoJSON/positions provided to <moj-map>')

// 1) Locations
const locationsLayer = mojMap.addLayer(new LocationsLayer({ geoJson }))!

// 2) Tracks (lines + arrows)
const tracksLayer = mojMap.addLayer(
  new TracksLayer({
    geoJson,
    visible: false,
    lines: {},
    arrows: { enabled: true },
  }),
)!

// 3) Circles
mojMap.addLayer(
  new CirclesLayer({
    geoJson,
    id: 'confidence',
    title: 'Confidence circles',
    radiusProperty: 'confidence',
    visible: false,
    zIndex: 20,
  }),
)

// 4) Numbering
mojMap.addLayer(
  new NumberingLayer({
    geoJson,
    numberProperty: 'sequenceNumber',
    title: 'Location numbering',
    visible: false,
    zIndex: 30,
  }),
)

// Fit view to locations
const source = locationsLayer?.getSource()
if (source) {
  const extent = source.getExtent()
  if (!isEmpty(extent)) {
    map.getView().fit(extent, {
      maxZoom: 16,
      padding: [30, 30, 30, 30],
      size: map.getSize(),
    })
  }
}
```

**Visibility defaults**

- `LocationsLayer`: `visible: true`
- `TracksLayer`: `visible: false`
- `CirclesLayer`: `visible: false`
- `NumberingLayer`: `visible: false`

**zIndex**

- Higher z-index draws above lower ones.
- `TracksLayer` puts **arrows** at `zIndex + 1` so they render above lines.

---

## Layer Reference

### `LocationsLayer(options)`

- `geoJson: FeatureCollection` (required)
- `id?: string` (default: `"locations"`)
- `title?: string`
- `visible?: boolean` (default: `true`)
- `zIndex?: number`
- `style?: { radius?: number; fill?: string; stroke?: { color?: string; width?: number } }`

### `TracksLayer(options)`

- `geoJson: FeatureCollection` (required)
- `id?: string` (default: `"tracks"`)
- `title?: string`
- `visible?: boolean` (default: `true`)
- `zIndex?: number` (applied to lines; arrows are `zIndex + 1`)
- `lines?: LinesLayerOptions`
- `arrows?: ArrowsLayerOptions & { enabled?: boolean; visible?: boolean }`

> Internally creates a `LayerGroup`. `addLayer()` returns that group.

### `CirclesLayer(options)`

- `geoJson: FeatureCollection` (required; **Point** features)
- `id?: string` (default: `"circles"`)
- `title?: string`
- `visible?: boolean` (default: `false`)
- `zIndex?: number`
- `radiusProperty?: string` (default: `"confidence"`)
- `style?: ol/style/Style` (optional custom style)

### `NumberingLayer(options)`

- `geoJson: FeatureCollection` (required; **Point** features)
- `id?: string` (default: `"numbering"`)
- `title?: string`
- `visible?: boolean` (default: `false`)
- `zIndex?: number`
- `numberProperty?: string` (default: `"sequenceNumber"`)
- `font?`, `fillColor?`, `strokeColor?`, `strokeWidth?`, `offsetX?`, `offsetY?`

---

## CSS Hooks

- Host classes toggled by attributes:
  - `.has-rotate-control`
  - `.has-zoom-slider`
  - `.has-scale-control`
  - `.has-location-dms`
- CSS custom property:
  - `--moj-scale-bar-bottom` — bottom offset for scale + location readout.

Example:

```css
moj-map {
  --moj-scale-bar-bottom: 16px;
}
```

---

## Troubleshooting

- **“No map visible because the map container's width or height are 0.”**  
  Ensure the host container has an explicit height (e.g. `450px`).

- **CSP errors**  
  Ensure you pass a `cspNonce` and include `'nonce-<value>'` in `style-src`.

- **Vector tiles not loading**  
  Confirm the server middleware is mounted and OS credentials are set. The UI talks to the local proxy automatically.

---
