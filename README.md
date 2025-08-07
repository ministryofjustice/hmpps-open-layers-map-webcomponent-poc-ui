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

This component targets **modern browsers only**.

- IE11 is **not supported** due to lack of native Web Component APIs.
- Polyfills are **not recommended** for IE11 due to performance and compatibility issues.
- If legacy support is required, consider wrapping this component in a **Nunjucks macro** with a fallback view.

---

# Getting Started with `<moj-map>`

The `<moj-map>` web component provides an embeddable [OpenLayers](https://openlayers.org/) map using Ordnance Survey vector tiles by default, with optional overlays and a simple HTML templating system.

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

Add 'node\_modules/hmpps-open-layers-map/nunjucks' to your nunjucks configuration setup, e.g.

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

| Attribute                | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `points`                 | (Optional) JSON array of point features.                                   |
| `lines`                  | (Optional) JSON array of line features.                                    |
| `uses-internal-overlays` | (Optional) If present, enables built-in overlay and pointer interaction.   |
| `csp-nonce`              | (Optional) Nonce value to allow inline styles under CSP.                   |
| `tile-type`              | (Optional) Set to `raster` to force raster mode instead of default vector. |
| `tile-url`               | (Optional) Custom raster tile URL. Useful for testing or stubbing tiles.   |
| `vector-url`             | (Optional) Custom vector tile URL. Useful for testing or stubbing tiles.   |

> ⚠️ `uses-internal-overlays` is a boolean attribute: if it exists, internal overlays will be used. Omit entirely if you want to manage overlays yourself from outside the component.

---

## Optional: Using Raster Tiles or Supporting Fallback

By default, this component uses **Ordnance Survey vector tiles**. However, if you need to:

- **Fallback to image tiles**, or
- **Force raster mode** for browser compatibility,

you will need to configure your application to retrieve an access token from the OS Maps API.

This requires middleware to support the `access-token-url` mechanism:

```ts
app.get('/map/token', async (_req, res) => {
  const response = await got.post('https://api.os.uk/oauth2/token/v1', {
    form: {
      grant_type: 'client_credentials',
      client_id: process.env.OS_CLIENT_ID,
      client_secret: process.env.OS_CLIENT_SECRET,
    },
    responseType: 'json',
  })

  res.json({ access_token: response.body.access_token })
})
```

Then use the `access-token-url`, `tile-type="raster"`, `tile-url`, and `vector-url` attributes as needed.

You can also pass stubbed URLs for local development or testing purposes:

```env
OS_MAPS_TILE_URL=http://localhost:9091/map-tiles/Road_3857/{z}/{x}/{y}
OS_MAPS_VECTOR_URL=http://localhost:9091/maps/vector/v1/vts
```

---

## CSP Policy (Content Security Policy)

To use this component safely in production, especially when enabling inline styles or scripts, your CSP should allow the relevant domains and use a nonce.

If you're using the HMPPS Typescript Template, add the following in your server config at /server/middleware
/setUpWebSecurity.ts:

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

Once the map has loaded, it dispatches a `map:ready` event. You can wait for this either using `await` or a callback:

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

A common usage of OpenLayers maps is to allow the user to select a map feature, triggering an anchored overlay that displays feature-specific data.

### How it works

To enable overlays:

1. **Each feature** in your `points` array must include a `overlayTemplateId` property.
2. **The page view** must contain a matching `<template>` element with that ID.
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

> Example point feature in JSON:
>
> ```json
> {
>   "overlayTemplateId": "overlay-template-location-point",
>   "displaySpeed": "12.5 km/h",
>   "displayTimestamp": "2025-07-23 12:00:00"
> }
> ```

- The `overlayTemplateId` determines which `<template>` to use.
- The values inside `{{ ... }}` in the template are replaced with top-level keys from the feature object.
- Only features with a valid `overlayTemplateId` and a matching template in the DOM will trigger overlay behavior.

---

> **Note**: If you're embedding the overlay template in Nunjucks, wrap the content in `{% raw %}` to prevent token interpolation:

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

## Styling the Map Overlay (from your app)

You can customise the map overlay using regular CSS or Sass. The `<moj-map>` web component exposes parts of the overlay using `::part`, which allows you to style them from outside the Shadow DOM.

### Example SCSS

```scss
moj-map::part(app-map__overlay) { ... }
moj-map::part(app-map__overlay)::before { ... }
moj-map::part(app-map__overlay)::after { ... }
moj-map::part(app-map__overlay-header) { ... }
moj-map::part(app-map__overlay-header) .app-map__overlay-close { ... }
moj-map::part(app-map__overlay-body) { ... }
```

---

## Styling Overlay Content Passed via Templates

If you use the `overlay-template-id` attribute to define custom overlay content, the HTML inside your `<template>` is rendered inside the component's **Shadow DOM**. This means **normal CSS selectors from outside the component will not apply** unless you explicitly expose elements using `part`.

### Why class selectors don’t work alone

This **won’t work**:

```css
moj-map::part(app-map__overlay-body) .app-map__overlay-row {
  /* This selector will NOT apply */
}
```

### Correct approach using `part`

Update your template like this:

```html
<template id="map-overlay-template">
  <div part="app-map__overlay-row"><strong>Speed: </strong><span>{{ speed }} km/h</span></div>
  <div part="app-map__overlay-row"><strong>Direction: </strong><span>{{ direction }}&deg;</span></div>
</template>
```

Then you can style it from your application:

```css
moj-map::part(app-map__overlay-row) {
  display: contents;
  font-size: 16px;
  gap: 4px 12px;
}
```

> These styles should be added to your app’s main SCSS/CSS bundle — they’ll automatically apply to overlays rendered by the map component.
