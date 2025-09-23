import PointerInteraction from 'ol/interaction/Pointer'
import type { MapBrowserEvent } from 'ol'

export default class MapPointerInteraction extends PointerInteraction {
  constructor() {
    super()
  }

  handleEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    const viewport = event.map.getViewport()

    if (event.type === 'pointerdown') {
      viewport.style.cursor = 'grabbing'
      return true
    }

    if (event.type === 'pointermove') {
      viewport.style.cursor = event.dragging ? 'grabbing' : 'grab'
      return true
    }

    if (event.type === 'pointerup' || event.type === 'pointerleave') {
      viewport.style.cursor = 'grab'
      return true
    }

    return true
  }
}
