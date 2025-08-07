import './scripts/moj-map.ts'

const map = document.createElement('moj-map')

map.setAttribute('api-key', import.meta.env.VITE_OS_API_KEY!)
map.setAttribute('vector-url', '/os/maps/vector/v1/vts');
map.setAttribute('csp-nonce', '1234abcd')
map.setAttribute('tile-url', import.meta.env.VITE_OS_MAPS_TILE_URL!)
map.setAttribute('uses-internal-overlays', '')
map.setAttribute('points', '[]')
map.setAttribute('lines', '[]')

document.body.appendChild(map)

