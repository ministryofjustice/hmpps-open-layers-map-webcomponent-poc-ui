# hmpps-open-layers-map-webcomponent-poc-ui

A native Web Component for rendering OpenLayers maps.

---

## Browser Support

| Browser         | Support |
| --------------- | ------- |
| Chrome          |         |
| Firefox         |         |
| Safari          |         |
| Edge (Chromium) |         |
| IE11            |         |

---

## Fallback Strategy

This component targets modern browsers only.

- IE11 is not supported due to lack of native Web Component APIs.
- Polyfills are not recommended for IE11 due to performance and compatibility issues.
- If legacy support is required, consider wrapping this component in a Nunjucks macro with a fallback view.

---

# Getting Started with `<moj-map>`

The `<moj-map>` web component provides an embeddable OpenLayers map using Ordnance Survey vector tiles by default, with optional overlays and a simple HTML templating system.

---

## Installation

Install the component from npm:

```bash
npm install hmpps-open-layers-map
```

---

## Minimum Usage in JavaScript

To ensure the component is defined, import the module in your app's JS entry point:

```ts
import 'hmpps-open-layers-map'
```

This registers the `<moj-map>` custom element with the browser.

In TypeScript, if your application needs to interact with the map using the OpenLayers API (e.g. to add layers or fit the view), you can optionally import the type:

```ts
import { MojMap } from 'hmpps-open-layers-map'
```

---

## Minimum Usage in HTML

```html
<moj-map
  points='[...]'
  lines='[...]'
  csp-nonce="your-csp-nonce"
></moj-map>
```

---

## Using with Nunjucks

You can also render the component via a Nunjucks macro:

Add `node_modules/hmpps-open-layers-map/nunjucks` to your Nunjucks configuration setup, e.g.

```js
nunjucks.configure([
  '*your-applications-views*',
  'node_modules/hmpps-open-layers-map/nunjucks'
])
```

```njk
{{ mojMap({
  cspNonce: params.cspNonce,
  geoData: {
    points: params.geoData.points,
    lines: params.geoData.lines
  }
}) }}
```

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

### Control Attributes

| Attribute              | Type / Values                                     | Default       | Description                                                                                          |
| ---------------------- | ------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `rotate-control`       | `false` \| `auto-hide` \| `true` (or omit)        | `true`        | Show the rotate/compass control. `auto-hide` hides it until the map is rotated.                      |
| `zoom-slider`          | boolean attribute (`''` to enable, `false` to disable) | not shown     | Show the zoom slider control between zoom-in and zoom-out.                                           |
| `scale-control`        | `bar` \| `line` \| `false` (or omit)              | not shown     | `bar` shows a segmented scale bar; `line` shows a simple scale line. Omit to hide.                   |
| `location-display`     | `dms` \| `latlon` \| `false` (or omit)            | not shown     | Show a coordinate readout near the scale bar. `dms` shows degrees/minutes/seconds; `latlon` shows decimal degrees with hemisphere suffixes. |
| `location-source`      | `pointer` \| `center`                              | `pointer`     | Where to read coordinates from. `pointer` updates as the mouse moves; `center` updates on pan/zoom end. |

Notes:
- Boolean attributes follow HTML rules: presence enables, `attribute="false"` disables.
- The location display and scale bar are positioned at the bottom by default and can be adjusted with CSS.

---

## Examples

### Basic map with controls (Nunjucks, new attributes)

```njk
{% from "moj-map/macro.njk" import mojMap %}

{{ mojMap({
  cspNonce: params.cspNonce,
  geoData: {
    points: params.geoData.points,
    lines: params.geoData.lines
  },
  usesInternalOverlays: true,

  controls: {
    scaleControl: 'bar',          // 'bar' | 'line'
    locationDisplay: 'dms',       // 'dms' | 'latlon'
    locationSource: 'pointer',    // 'pointer' (default) | 'center'
    rotateControl: 'auto-hide',   // 'false' | 'auto-hide' | 'true'
    zoomSlider: true
  }
}) }}
```

### Programmatic creation (dev example)

```ts
import 'hmpps-open-layers-map'

const map = document.createElement('moj-map')

// Core setup
map.setAttribute('vector-url', '/os/maps/vector/v1/vts')
map.setAttribute('tile-url', import.meta.env.VITE_OS_MAPS_TILE_URL!)
map.setAttribute('csp-nonce', '1234abcd')
map.setAttribute('uses-internal-overlays', '')
map.setAttribute('points', '[]')
map.setAttribute('lines', '[]')

// Control options
map.setAttribute('scale-control', 'bar')      // 'bar' | 'line' | omit
map.setAttribute('location-display', 'latlon') // 'dms' | 'latlon' | omit
// map.setAttribute('location-source', 'center') // default is 'pointer' if omitted
map.setAttribute('rotate-control', 'true')    // 'false' | 'auto-hide' | 'true'/omit
map.setAttribute('zoom-slider', 'true')       // enable zoom slider

document.body.appendChild(map)
```

---

## Optional: Using Raster Tiles or Supporting Fallback

By default, this component uses Ordnance Survey vector tiles. To fallback to image tiles or force raster mode, configure your application to retrieve an access token from the OS Maps API.

Example Express middleware:

```ts
  app.use(
    '/tile-token-proxy',
    mojMapMiddleware({
      authUrl: config.maps.authUrl,
      apiKey: config.maps.apiKey,
      apiSecret: config.maps.apiSecret,
    }),
  )
```

Use the `access-token-url`, `tile-type="raster"`, `tile-url`, and `vector-url` attributes as needed. For local development you can stub URLs via environment variables.

---

## CSP Policy (Content Security Policy)

To use this component safely in production, especially when enabling inline styles or scripts, your CSP should allow the relevant domains and use a nonce.

If you're using the HMPPS Typescript Template, add the following:

```ts
router.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'api.os.uk'],
        imgSrc: ["'self'", 'api.os.uk', 'data:', 'blob:'],
        // @ts-expect-error mismatch response
        scriptSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
        // @ts-expect-error mismatch response
        styleSrc: ["'self'", 'cdn.jsdelivr.net', (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
        fontSrc: ["'self'", 'cdn.jsdelivr.net'],
        formAction: [`'self' ${config.apis.hmppsAuth.externalUrl}`],
      },
    },
  })
)
```

---

## Accessing the Map API (e.g. to add layers)

Once the map has loaded, it dispatches a `map:ready` event.

### Await the event

```ts
const mojMap = document.querySelector('moj-map') as MojMap

await new Promise<void>(resolve => {
  mojMap.addEventListener('map:ready', () => resolve(), { once: true })
})

// Now safe to use mojMap.map (the OpenLayers Map instance)
```

### Or use a callback

```ts
mojMap.addEventListener('map:ready', (event) => {
  const mapInstance = event.detail.map
  // Do something with mapInstance
})
```

---

## Example: Adding a Layer and Fitting to Extent

```ts
mojMap.map.addLayer(locationsLayer)

mojMap.map.getView().fit(locationsLayer.getSource().getExtent(), {
  maxZoom: 16,
  padding: [30, 30, 30, 30],
  size: mojMap.map.getSize(),
})
```

---

## CSS Requirements

The map must be placed inside a container that has a defined height. If the container has `height: 0` or is not sized explicitly or implicitly, OpenLayers will not render correctly.

---

## Feature Overlay Templating

To enable overlays:

1. Each feature in your `points` array must include an `overlayTemplateId` property.
2. The page view must contain a matching `<template>` element with that ID.
3. The map component will show the overlay when the user clicks on a matching feature.

### Example usage

```html
<moj-map
  points='[...]'
  lines='[...]'
  uses-internal-overlays
  csp-nonce="your-csp-nonce"
></moj-map>

<template id="overlay-template-location-point">
  <div>
    <strong>Speed:</strong> {{ displaySpeed }}<br />
    <strong>Timestamp:</strong> {{ displayTimestamp }}
  </div>
</template>
```

Example point feature:

```json
{
  "overlayTemplateId": "overlay-template-location-point",
  "displaySpeed": "12.5 km/h",
  "displayTimestamp": "2025-07-23 12:00:00"
}
```

- The `overlayTemplateId` determines which `<template>` to use.
- The values inside `{{ ... }}` in the template are replaced with top-level keys from the feature object.
- Only features with a valid `overlayTemplateId` and a matching template in the DOM will trigger overlay behavior.

Note for Nunjucks: wrap the template content in `{% raw %}` to prevent token interpolation.

```njk
{% raw %}
<template id="map-overlay-template">
  <div>
    <strong>Speed:</strong> {{speed}} km/h
    <strong>Timestamp:</strong> {{recordedAt}}
  </div>
</template>
{% endraw %}
```

---

## Styling and CSS Hooks

All OpenLayers controls are inside the component’s Shadow DOM. The component exposes useful hooks:

- Host CSS classes toggled by attributes:
  - `.has-rotate-control`
  - `.has-zoom-slider`
  - `.has-scale-control`
  - `.has-location-dms` (true for `location-display="dms"` or `latlon`)

- CSS custom property:
  - `--moj-scale-bar-bottom`: controls the bottom offset for the scale bar and location display. Example:
    ```css
    moj-map { --moj-scale-bar-bottom: govuk-spacing(3); }
    ```

- Parts exposed for overlay styling from outside the Shadow DOM:
  ```css
  moj-map::part(app-map__overlay) { ... }
  moj-map::part(app-map__overlay)::before { ... }
  moj-map::part(app-map__overlay)::after { ... }
  moj-map::part(app-map__overlay-header) { ... }
  moj-map::part(app-map__overlay-body) { ... }
  ```

You can also place the coordinate readout above it with component-scoped CSS. Adjust via `--moj-scale-bar-bottom` if needed.

---
