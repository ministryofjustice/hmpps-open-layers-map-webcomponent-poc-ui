
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
