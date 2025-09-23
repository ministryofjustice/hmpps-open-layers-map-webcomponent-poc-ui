import PointerInteraction from 'ol/interaction/Pointer'
import { MapBrowserEvent } from 'ol'

export default class MapPointerInteraction extends PointerInteraction {
  constructor() {
    super()
  }

  handleEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    const { map } = event
    const viewport = map.getViewport()

    if (event.type === 'pointermove' && !event.dragging) {
      const hasFeature = map.hasFeatureAtPixel(event.pixel)
      viewport.style.cursor = hasFeature ? 'pointer' : 'grab'
    }

    if (event.type === 'pointerdown') {
      viewport.style.cursor = 'grabbing'
    }

    if (event.type === 'pointerup' || event.type === 'pointerleave') {
      viewport.style.cursor = 'grab'
    }

    return true
  }
}
