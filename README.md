
# `hmpps-open-layers-map-webcomponent-poc-ui`

A native Web Component for rendering OpenLayers maps.

---

### 🌐 Browser Support

Native Web Components are supported in:

- ✅ **Chrome** 54+
- ✅ **Firefox** 63+
- ✅ **Safari** 10.1+
- ✅ **Edge** 79+ (Chromium-based)
- ❌ **Internet Explorer 11** – _not supported without polyfills (not recommended)_

---

### 🔄 Fallback Strategy

This component targets **modern browsers only**.

- ❌ **IE11 is not supported** due to lack of native Web Component APIs.
- ⚠️ We do **Polyfills are not recommend for use ** for IE11 due to performance and compatibility issues.
- If legacy support is required, consider wrapping this component in a Nunjucks macro with a fallback view.

---

## 🚀 Getting Started with `<moj-map>`

The `moj-map` web component provides an embeddable OpenLayers map with Ordnance Survey tiles and optional GeoJSON overlays.

---

### 📦 Installation

Install the component from npm:

```bash
npm install hmpps-open-layers-map
```

---

### 🧱 Using the Component in HTML

Add the following where you want the map to appear:

```html
<moj-map
  tile-url="https://api.os.uk/maps/raster/v1/zxy/Road_3857/{z}/{x}/{y}"
  access-token-url="/map/token"
  geojson='{"type": "FeatureCollection", "features": [...] }'
></moj-map>
```

---

### 💡 CSS Requirements

The map must be placed inside a container that has a defined height. If the container has `height: 0` or is not sized explicitly or implicitly, OpenLayers will not render correctly.

---

### 🔧 Component Attributes

| Attribute          | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `tile-url`         | Tile server URL (e.g. Ordnance Survey Raster Tiles).                      |
| `access-token-url` | (Optional) URL to fetch an access token (your middleware endpoint).       |
| `geojson`          | (Optional) Stringified GeoJSON for displaying overlay features.           |
| `show-overlay`     | (Optional) `'true'` or `'false'` — toggles display of an overlay element. |

---

## 🧩 Feature Overlay Templating

The `<moj-map>` component supports displaying an overlay with custom HTML content when a feature is clicked.

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

### 🧠 Notes

- The `overlay-template-id` should match the `id` of a `<template>` element in your DOM.
- Your template can include `{{property}}` tokens that will be replaced with the feature's properties.
- Missing properties will render as empty.
- In development, missing tokens can emit a warning in the console.

Example console warning if properties are missing:
```bash
Overlay template references missing properties: direction, altitude
```

The component handles only basic token replacement and leaves formatting and structure entirely to the consuming team.
