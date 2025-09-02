import maplibregl from 'maplibre-gl'

export function add3DBuildingsControl(map: maplibregl.Map): void {
  map.addControl(new Buildings3DControl(), 'top-right')
}

class Buildings3DControl implements maplibregl.IControl {
  private map?: maplibregl.Map

  private container?: HTMLElement

  private button?: HTMLButtonElement

  private enabled = false

  private readonly LAYER_ID = 'OS/TopographicArea_2/Building/1_3D'

  private readonly MIN_ZOOM = 15

  onAdd(map: maplibregl.Map): HTMLElement {
    this.map = map

    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'

    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.textContent = '🏙'
    this.button.disabled = map.getZoom() < this.MIN_ZOOM
    this.button.addEventListener('click', () => this.toggleExtrusions())

    this.container.appendChild(this.button)

    // Watch zoom to enable/disable button
    map.on('zoom', () => {
      if (!this.button) return
      this.button.disabled = map.getZoom() < this.MIN_ZOOM
    })

    return this.container
  }

  onRemove(): void {
    this.container?.remove()
    this.map = undefined
  }

  private toggleExtrusions(): void {
    if (!this.map || !this.button) return

    if (this.map.getLayer(this.LAYER_ID)) {
      this.map.removeLayer(this.LAYER_ID)
      this.enabled = false
      this.button.classList.remove('active')
    } else {
      if (!this.map.isStyleLoaded()) {
        this.map.once('style.load', () => this.addExtrusionLayer())
      } else {
        this.addExtrusionLayer()
      }
      this.enabled = true
      this.button.classList.add('active')
    }
  }

  private addExtrusionLayer(): void {
    if (!this.map || this.map.getLayer(this.LAYER_ID)) return

    const fillColor = (this.map.getPaintProperty('OS/TopographicArea_2/Building/1', 'fill-color') ?? '#aaa') as
      | maplibregl.ExpressionSpecification
      | string

    this.map.addLayer({
      id: this.LAYER_ID,
      type: 'fill-extrusion',
      source: 'esri',
      'source-layer': 'TopographicArea_2',
      filter: ['==', '_symbol', 4], // 4 = buildings
      minzoom: this.MIN_ZOOM,
      paint: {
        'fill-extrusion-color': fillColor,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          this.MIN_ZOOM,
          0,
          this.MIN_ZOOM + 0.05,
          ['get', 'RelHMax'],
        ],
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], this.MIN_ZOOM, 0, this.MIN_ZOOM + 1, 0.9],
      },
    })
  }
}
