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

`<moj-map>` is an embeddable map component. It uses Ordnance Survey tiles by default and provides a small, typed API for adding layers from your app code.

---

## Installation

```bash
npm install hmpps-open-layers-map
```

Register the custom element (once, in your app entry):

```ts
import 'hmpps-open-layers-map'
```

Optionally import types if you’ll interact with the map in TS:

```ts
import { MojMap } from 'hmpps-open-layers-map'
```

---

## Using with Nunjucks

Configure Nunjucks to include the component’s templates:

```js
nunjucks.configure(['<your-app-views>', 'node_modules/hmpps-open-layers-map/nunjucks'])
```

Render the element and include data:

```njk
{% from "components/moj-map/macro.njk" import mojMap %}

{{ mojMap({
  apiKey: params.apiKey,
  cspNonce: cspNonce,
  // Optional renderer: "openlayers" (default) or "maplibre"
  renderer: "openlayers",
  vectorUrl: "https://api.os.uk/maps/vector/v1/vts"
}) }}
```

---

## API Key and Vector Tiles

When using **vector tiles**, the Ordnance Survey API requires an access key.

`<moj-map>` enforces this:

- Either provide an **`apiKey`** attribute → the component will append `?key=...` to the `vectorUrl` automatically.
- Or provide a **`vectorUrl`** that already includes `?key=YOUR_KEY`.

### Example (using `apiKey`)

```njk
{{ mojMap({
  cspNonce: cspNonce,
  renderer: "openlayers",
  apiKey: params.apiKey
}) }}
```

### Example (using `vectorURL`)

```njk
{{ mojMap({
  cspNonce: cspNonce,
  renderer: "openlayers",
  vectorUrl: "https://api.os.uk/maps/vector/v1/vts/resources/styles?srs=3857&key=YOUR_KEY"
}) }}
```

---

## CSP (Content Security Policy)

- Inline **styles** added by the component use the `csp-nonce` attribute on `<moj-map>`. Ensure `style-src` includes `'nonce-<value>'`.
- The `<script type="application/json">` data block **does not execute**, so it **does not** require a nonce.
- Typical additions (OS tiles etc.) with Helmet:

```ts
router.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'", 'api.os.uk'],
        imgSrc: ["'self'", 'api.os.uk', 'data:', 'blob:'],
        styleSrc: ["'self'", 'cdn.jsdelivr.net', (_req, res) => `'nonce-${res.locals.cspNonce}'`],
        fontSrc: ["'self'", 'cdn.jsdelivr.net'],
        styleSrcAttr: ["'unsafe-inline'"],
      },
    },
  }),
)
```

---

## Choosing a Renderer (OpenLayers vs MapLibre)

- **OpenLayers** (default) — great for 2D overlays.
- **MapLibre GL** (`renderer="maplibre"`) — enables tilt/3D buildings, etc.

### Example (force MapLibre)

````njk
{% from "components/moj-map/macro.njk" import mojMap %}

{{ mojMap({
  cspNonce: cspNonce,
  geoJSON: geoJSON,
  renderer: "maplibre",             // force MapLibre instead of OpenLayers
  vectorUrl: "https://api.os.uk/maps/vector/v1/vts",
  enable3DBuildings: true,          // adds the buildings toggle button if using MapLibre
  controls: {
    scaleControl: "bar",
    locationDisplay: "latlon",
    rotateControl: "true",
    zoomSlider: true,
    grabCursor: false,
  }
}) }}

---

## Nunjucks Macro Parameters

The `mojMap()` macro accepts a config object using the following keys:

| Parameter               | Type / Values                                     | Description                                                                 |
|-------------------------|---------------------------------------------------|-----------------------------------------------------------------------------|
| `grabCursor`            | boolean                                           | If true (default), uses MapLibre-style `grab` / `grabbing` mouse cursor while panning. |
| `points`                | Array                                             | Optional array of point features.                                           |
| `lines`                 | Array                                             | Optional array of line features.                                            |
| `usesInternalOverlays`  | boolean                                           | If true, enables built-in overlay and pointer interaction.                  |
| `cspNonce`              | string                                            | Optional CSP nonce to allow inline styles.                                  |
| `tileType`              | `'vector'` \| `'raster'`                          | Optional. Defaults to `'vector'` if WebGL is supported.                     |
| `tileUrl`               | string                                            | Optional custom raster tile URL (`{z}/{x}/{y}`).                            |
| `vectorUrl`             | string                                            | Optional custom vector style base URL. The component appends `/resources/styles` internally. |
| `renderer`              | `'openlayers'` \| `'maplibre'`                    | Selects which rendering library to use. Default is `'openlayers'`.          |

### Control Parameters

| Parameter            | Type / Values                         | Description                                                                 |
|----------------------|----------------------------------------|-----------------------------------------------------------------------------|
| `grab-cursor`        | boolean attribute (`''` to enable, `false` to disable) | shown by default | Enables MapLibre-style `grab` / `grabbing` cursor while dragging the map. Disable to fall back to browser defaults. |
| `rotateControl`      | `true` \| `'auto-hide'` \| `false`     | Show the rotate/compass control. `'auto-hide'` hides it unless rotated.     |
| `zoomSlider`         | boolean                                | If true, shows the zoom slider.                                             |
| `scaleControl`       | `'bar'` \| `'line'` \| `false`         | If defined, shows a scale bar or line.                                      |
| `locationDisplay`    | `'dms'` \| `'latlon'` \| `false`       | Shows a coordinate readout near the scale bar.                              |
| `locationSource`     | `'pointer'` \| `'centre'`              | Where to read coordinates from. `'pointer'` tracks the mouse.               |
| `enable3DBuildings`  | boolean                                | MapLibre only: adds a 🏙 control button to toggle 3D building extrusions on/off. |

---

*For raw HTML component usage and attribute-level control, see [Component Attributes](#component-attributes).*

---

## Component Attributes

| Attribute                | Type / Values                                     | Description                                                                 |
| ------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `points`                 | JSON string                                       | Optional array of point features.                                           |
| `lines`                  | JSON string                                       | Optional array of line features.                                            |
| `uses-internal-overlays` | boolean attribute                                 | If present, enables built-in overlay and pointer interaction.               |
| `csp-nonce`              | string                                            | Optional nonce value to allow inline styles under CSP.                      |
| `tile-type`              | `vector` \| `raster`                              | Optional. Set `raster` to force raster mode; default resolves to `vector` if WebGL is available. |
| `tile-url`               | URL template                                      | Optional custom raster tile URL (`{z}/{x}/{y}`).                            |
| `vector-url`             | URL                                               | Optional custom vector style base URL (the component appends the style path and key). |
| `renderer`               | `openlayers` \| `maplibre`                        | Selects which rendering library to use. Default is `openlayers`.            |

### Control Attributes

| Attribute               | Type / Values                                     | Default       | Description                                                                                          |
| ----------------------- | ------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `rotate-control`        | `false` \| `auto-hide` \| `true` (or omit)        | `true`        | Show the rotate/compass control. `auto-hide` hides it until the map is rotated.                      |
| `zoom-slider`           | boolean attribute (`''` to enable, `false` to disable) | not shown     | Show the zoom slider control between zoom-in and zoom-out.                                           |
| `scale-control`         | `bar` \| `line` \| `false` (or omit)              | not shown     | `bar` shows a segmented scale bar; `line` shows a simple scale line. Omit to hide.                   |
| `location-display`      | `dms` \| `latlon` \| `false` (or omit)            | not shown     | Show a coordinate readout near the scale bar. `dms` shows degrees/minutes/seconds; `latlon` shows decimal degrees with hemisphere suffixes. |
| `location-source`       | `pointer` \| `centre`                              | `pointer`     | Where to read coordinates from. `pointer` updates as the mouse moves; `centre` updates on pan/zoom end. |
| `enable-3d-buildings`   | boolean attribute                                 | not shown     | MapLibre only: adds a 🏙 control button to toggle 3D building extrusions on/off.                      |

Notes:
- Boolean attributes follow HTML rules: presence enables, `attribute="false"` disables.
- The location display and scale bar are positioned at the bottom by default and can be adjusted with CSS.

---

## Examples

### Basic map with controls (Nunjucks)

```njk
{% from "moj-map/macro.njk" import mojMap %}

{{ mojMap({
  cspNonce: params.cspNonce,
  geoData: {
    points: params.geoData.points,
    lines: params.geoData.lines
  },
  usesInternalOverlays: true,

  // Choose renderer: 'openlayers' (default) or 'maplibre'
  renderer: 'maplibre',

  controls: {
    scaleControl: 'bar',          // 'bar' | 'line'
    locationDisplay: 'dms',       // 'dms' | 'latlon'
    locationSource: 'pointer',    // 'pointer' (default) | 'centre'
    rotateControl: 'auto-hide',   // 'false' | 'auto-hide' | 'true'
    zoomSlider: true,
    grabCursor: false,
    enable3DBuildings: true       // MapLibre only: adds 🏙 button to toggle 3D buildings
  }
}) }}
````

---

## Map Lifecycle (`map:ready`)

The component fires **`map:ready`** once initialised:

```ts
import { MojMap } from 'hmpps-open-layers-map'

const mojMap = document.querySelector('moj-map') as MojMap

await new Promise<void>(resolve => {
  mojMap.addEventListener('map:ready', () => resolve(), { once: true })
})

const map = mojMap.olMapInstance // OpenLayers Map (if OL renderer)
const geoJson = mojMap.geojson // OpenLayers FeatureCollection
```

---

## Adding Layers

Import layer classes from `hmpps-open-layers-map/layers`.

Each layer accepts:

- `geoJson` — your `FeatureCollection`
- `visible?: boolean` — default varies per layer (see below)
- `zIndex?: number` — draw order (higher draws on top)
- Other layer-specific options

### Available layers

- `LocationsLayer` — renders **Point** features as circles.
- `TracksLayer` — composite layer for **LineString** data:
  - lines (`LinesLayer`), and
  - optional arrows (`ArrowsLayer`) indicating direction.
- `CirclesLayer` — renders **Point** features as **Circle** geometries with radius read from a property (e.g. `"confidence"`).
- `NumberingLayer` — paints numbers as text labels next to points.

### Full example (end-to-end)

```ts
import { MojMap } from 'hmpps-open-layers-map'
import { LocationsLayer, TracksLayer, CirclesLayer, NumberingLayer } from 'hmpps-open-layers-map/layers'
import { isEmpty } from 'ol/extent'

const mojMap = document.querySelector('moj-map') as MojMap

await new Promise<void>(resolve => {
  mojMap.addEventListener('map:ready', () => resolve(), { once: true })
})

const map = mojMap.olMapInstance!
const geoJson = mojMap.geojson
if (!geoJson) throw new Error('No GeoJSON in <moj-map>')

// 1) Locations (points)
const locationsLayer = mojMap.addLayer(
  new LocationsLayer({
    geoJson,
  }),
)!

// 2) Tracks (lines + arrows grouped together)
const tracksLayer = mojMap.addLayer(
  new TracksLayer({
    geoJson,
    visible: false,
    lines: {},
    arrows: { enabled: true },
  }),
)!

// 3) Confidence circles (radius from feature property)
const confidenceLayer = mojMap.addLayer(
  new CirclesLayer({
    geoJson,
    id: 'confidence',
    title: 'Confidence circles',
    radiusProperty: 'confidence',
    visible: false,
    zIndex: 20,
  }),
)

// 4) Numbering (labels from feature property)
const numbersLayer = mojMap.addLayer(
  new NumberingLayer({
    geoJson,
    numberProperty: 'sequenceNumber',
    title: 'Location numbering',
    visible: false,
    zIndex: 30,
  }),
)

// Fit view to locations (if any)
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

## Overlay Templating (optional)

If you enable internal overlays (click to open), add a `<template>` in your page and set a property like `overlayTemplateId` on features you want clickable. The component will fill `{{ ... }}` tokens with top-level properties from the feature.

```html
<template id="overlay-template-location-point">
  <div>
    <strong>Speed:</strong> {{ displaySpeed }}<br />
    <strong>Timestamp:</strong> {{ displayTimestamp }}
  </div>
</template>
```

Feature example:

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [-2.1, 53.5] },
  "properties": {
    "overlayTemplateId": "overlay-template-location-point",
    "displaySpeed": "12.5 km/h",
    "displayTimestamp": "2025-07-23 12:00:00"
  }
}
```

If using Nunjucks, wrap the template body with `{% raw %}…{% endraw %}` to avoid server-side interpolation.

---

## CSS Requirements

Make sure the host element has a **non-zero height**; otherwise OpenLayers can’t render.

Some useful hooks:

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

## TypeScript: Accessing Native Layers

`mojMap.addLayer()` returns the **native** OpenLayers layer instance (e.g. `VectorLayer` or `LayerGroup`) so you can toggle visibility or attach your own controls easily:

```ts
const tracksGroup = mojMap.addLayer(new TracksLayer({ geoJson, visible: false }))!
// Later:
tracksGroup.setVisible(true)
```

---

## Example UI Toggle

```ts
import type Layer from 'ol/layer/Layer'
import type LayerGroup from 'ol/layer/Group'
import { MojMap } from 'hmpps-open-layers-map'

function createLayerVisibilityToggle(selector: string, layer: Layer | LayerGroup, mojMap?: MojMap) {
  const element = document.querySelector(selector) as HTMLInputElement | null
  if (!element) return

  element.addEventListener('change', () => {
    const visible = layer.getVisible()
    if (visible && mojMap) mojMap.closeOverlay?.()
    layer.setVisible(!visible)
  })
}
```
