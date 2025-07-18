
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

## Getting Started with `<moj-map>`

The `moj-map` web component provides an embeddable OpenLayers map with Ordnance Survey tiles and optional GeoJSON overlays.

---

## Installation

Install the component from npm:

```bash
npm install hmpps-open-layers-map
```

---

## Using the Component in HTML

Add the following where you want the map to appear:

```html
<moj-map
  tile-url="https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}"
  access-token-url="/map/token"
  geojson='{"type": "FeatureCollection", "features": [...] }'
  show-overlay="true"
  overlay-template-id="map-overlay-template"
  csp-nonce="your-csp-nonce"
></moj-map>
```

---

## Using with Nunjucks

You can also render the component via Nunjucks using a macro:

Add 'node_modules/hmpps-open-layers-map/nunjucks' to your nunjucks configuration setup, e.g.

```
nunjucks.configure([
  '*your-applications-views*',
  'node_modules/hmpps-open-layers-map/nunjucks'
])
``

### `components/moj-map/template.njk`

```njk
<moj-map
  access-token-url="{{ params.accessTokenUrl | default('/map/token') }}"
  tile-url="{{ params.tileUrl | default('/map/tiles') }}"
  geojson='{{ params.geojson | dump | safe }}'
  show-overlay="{{ params.showOverlay | default(false) }}"
  overlay-template-id="{{ params.templateId | default('map-overlay-template') }}"
  csp-nonce="{{ cspNonce }}"
></moj-map>
```

### `components/moj-map/macro.njk`

```njk
{% macro mojMap(params = {}) %}
  {% include "components/moj-map/template.njk" with params %}
{% endmacro %}
```

---

## CSS Requirements

The map must be placed inside a container that has a defined height. If the container has `height: 0` or is not sized explicitly or implicitly, OpenLayers will not render correctly.

---

## Component Attributes

| Attribute              | Description                                                               |
|------------------------|---------------------------------------------------------------------------|
| `tile-url`             | Tile server URL (e.g. Ordnance Survey Raster Tiles).                      |
| `access-token-url`     | (Optional) URL to fetch an access token (your middleware endpoint).       |
| `geojson`              | (Optional) Stringified GeoJSON for displaying overlay features.           |
| `show-overlay`         | (Optional) `'true'` or `'false'` — toggles display of an overlay element. |
| `overlay-template-id`  | (Optional) ID of a `<template>` to render overlay content.                |

---

## Feature Overlay Templating

To enable overlays:

```html
<moj-map
  geojson='{"type":"FeatureCollection","features":[...]}'
  show-overlay="true"
  overlay-template-id="map-overlay-template"
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
- Missing tokens will render blank and optionally warn in dev console.

---

> **Note**: If you're embedding the overlay template in your Nunjucks page, wrap the content in `{% raw %}` to prevent token interpolation:

```njk
{% raw %}
<template id="map-overlay-template">
  <div>
    <strong>Speed:</strong> {{speed}} km/h
  </div>
</template>
{% endraw %}
```

---

## License

MIT
