import './scripts/moj-map'
import config from './scripts/map/config'

const map = document.createElement('moj-map')

// Use MapLibre (not OpenLayers)
// map.setAttribute('renderer', 'maplibre')

// Add this so the 3D Buildings button shows up
map.setAttribute('enable-3d-buildings', '')

// Core setup
map.setAttribute('vector-url', config.tiles.urls.vectorUrl)
map.setAttribute('tile-url', config.tiles.urls.tileUrl)
map.setAttribute('csp-nonce', '1234abcd')
map.setAttribute('uses-internal-overlays', '')
map.setAttribute('points', '[]')
map.setAttribute('lines', '[]')

// Control options
map.setAttribute('scale-control', 'bar')
// Options:
//   'bar'   → shows an OpenLayers ScaleBar (segmented ruler-style, better for visualising distances)
//   'line'  → shows an OpenLayers ScaleLine (simple line + text label)
//   omit    → no scale control shown
//   'false' → explicitly disables scale control

map.setAttribute('location-display', 'latlon')
// Options:
//   'dms'   → shows coordinates in degrees/minutes/seconds (e.g. 51°28'40"N 0°0'5"W)
//   'latlon'  → shows coordinates in Lat/Long (e.g. 51.4778°N 0.0014°W)
//   'false' → explicitly disables coordinate display
//   omit    → no coordinate display control

map.setAttribute('rotate-control', 'true')
// Options:
//   'false'     → disables rotate control
//   'auto-hide' → hides rotate control until the map is rotated
//   default     → always shows rotate control

map.setAttribute('zoom-slider', 'true')
// Enables zoom slider control

map.setAttribute('grab-cursor', 'true')
// Enables MapLibre-style grab/grabbing cursor
// Options:
//   'true' (default) → show grab/grabbing cursor
//   'false'          → disable custom cursor, fallback to browser default

document.body.appendChild(map)
