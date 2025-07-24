
# hmpps-open-layers-map-webcomponent-poc-ui

A native Web Component for rendering OpenLayers maps.

---

## Browser Support

| Browser   | Support |
|-----------|---------|
| Chrome    | ![Chrome](https://img.shields.io/badge/support-yes-brightgreen) |
| Firefox   | ![Firefox](https://img.shields.io/badge/support-yes-brightgreen) |
| Safari    | ![Safari](https://img.shields.io/badge/support-yes-brightgreen) |
| Edge (Chromium) | ![Edge Chromium](https://img.shields.io/badge/support-yes-brightgreen) |
| IE11      | ![IE11](https://img.shields.io/badge/support-no-red) |

---

## Fallback Strategy

This component targets **modern browsers only**.

- IE11 is **not supported** due to lack of native Web Component APIs.
- Polyfills are **not recommended** for IE11 due to performance and compatibility issues.
- If legacy support is required, consider wrapping this component in a **Nunjucks macro** with a fallback view.

---

# Getting Started with `<moj-map>`

The `<moj-map>` web component provides an embeddable [OpenLayers](https://openlayers.org/) map using Ordnance Survey tiles, optional overlays, and a simple HTML templating system.

---

## Installation

Install the component from npm:

```bash
npm install hmpps-open-layers-map
```

---

## Usage in JavaScript

To ensure the component is defined, import the module in your app's JS entry point:

```ts
import 'hmpps-open-layers-map'
```

This registers the `<moj-map>` custom element with the browser.

In TypeScript, if your application needs to interact with the map using the OpenLayers API (e.g. to add layers or fit the view), you can optionally import the type:

```ts
import { MojMap } from 'hmpps-open-layers-map'
```
----

## Using the Component in HTML

Add the component to your page with required attributes:

```html
<moj-map
  tile-url="https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}"
  access-token-url="/map/token"
  points='[...]'
  lines='[...]'
  uses-internal-overlays
  overlay-template-id="map-overlay-template"
  csp-nonce="your-csp-nonce"
></moj-map>

<template id="map-overlay-template">
  <div>
    <strong>Speed:</strong> {{speed}} km/h<br />
    <strong>Timestamp:</strong> {{timestamp}}
  </div>
</template>
```
---

## Using with Nunjucks

You can also render the component via a Nunjucks macro:

```njk
{{ mojMap({
  accessTokenUrl: '/map/token',
  cspNonce: cspNonce,
  tileUrl: 'https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}',
  geoData: {
    points: points,
    lines: lines
  },
  usesInternalOverlays: true,
  templateId: 'map-overlay-template'
}) }}
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

## Component Attributes

| Attribute                | Description                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| `tile-url`               | URL of the tile server used for the basemap (e.g. Ordnance Survey Raster). |
| `access-token-url`       | (Optional) Endpoint to fetch an access token. Set to `'none'` to skip.      |
| `points`                 | (Optional) JSON array of point features.                        |
| `lines`                  | (Optional) JSON array of line features.                         |
| `uses-internal-overlays`| (Optional) If present, enables built-in overlay and pointer interaction.     |
| `overlay-template-id`    | (Optional) ID of a `<template>` element in the DOM used for overlay content.|
| `csp-nonce`              | (Optional) Nonce value to allow inline styles under CSP.                    |

> ⚠️ `uses-internal-overlays` is a boolean attribute: if it exists, internal overlays will be used. Omit entirely if you want to manage overlays yourself from outside the component.


---

## Feature Overlay Templating

A common usage of OpenLayers maps is to allow the user to select a map feature which will show an anchored overlay containing data associated with that feature.

To enable overlays add a HTML template with an ID and pass the ID to the component to render using the **overlay-template-id** attribute:

```html
<moj-map
  tile-url="https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}"
  access-token-url="/map/token"
  points='[...]'
  lines='[...]'
  uses-internal-overlays
  overlay-template-id="map-overlay-template"
  csp-nonce="your-csp-nonce"
></moj-map>

<template id="map-overlay-template">
  <div>
    <strong>Speed:</strong> {{speed}} km/h<br />
    <strong>Timestamp:</strong> {{recordedAt}}
  </div>
</template>
```

- The template will be used when a feature is clicked.
- Tokens like `{{speed}}` are dynamically replaced with matching feature properties.
- These feature properties are passed in the `points` array as plain objects. Each object should include the keys (e.g. `speed`, `timestamp`, etc.) that your overlay template expects.

> Example point feature in JSON:
> ```json
> {
>   "type": "location-point",
>   "speed": 12.5,
>   "timestamp": "2025-07-23T12:00:00Z"
> }
> ```

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

### Styling the Map Overlay (from your app)

You can customise the map overlay using regular CSS or Sass. The `<moj-map>` web component exposes parts of the overlay using `::part`, which allows you to style them from outside the Shadow DOM.

#### Example SCSS

```scss
/* Overlay container */
moj-map::part(app-map__overlay) {
  position: relative;
  background-color: govuk-colour("white");
  border: 1px solid govuk-colour("black");
  min-width: 180px;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(govuk-colour("black"), 0.1);
}

/* Arrow border */
moj-map::part(app-map__overlay)::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -25px;
  transform: translateX(-50%);
  border-width: 12px;
  border-style: solid;
  border-color: govuk-colour("black") transparent transparent transparent;
  z-index: -1;
}

/* Arrow fill */
moj-map::part(app-map__overlay)::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -21px;
  transform: translateX(-50%);
  border-width: 11px;
  border-style: solid;
  border-color: govuk-colour("white") transparent transparent transparent;
  z-index: 1;
}

/* Overlay header */
moj-map::part(app-map__overlay-header) {
  display: flex;
  justify-content: flex-end;
  background-color: govuk-colour("light-grey");
  padding: 4px 8px;
  border-bottom: 1px solid $govuk-border-colour;
}

/* Close button */
moj-map::part(app-map__overlay-header) .app-map__overlay-close {
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: $govuk-text-colour;
}

/* Container for any HTML passed in using a template */
moj-map::part(app-map__overlay-body) {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  font-size: 16px;
  padding: 10px;
}

/* Example of how to access any selectors passed to the map component in the HTML template */
moj-map::part(app-map__overlay-body) .example-child-selector {
  display: contents;
}
```

> These styles should be added to your app’s main SCSS/CSS bundle — they’ll automatically apply to overlays rendered by the map component.

---

## License

MIT
