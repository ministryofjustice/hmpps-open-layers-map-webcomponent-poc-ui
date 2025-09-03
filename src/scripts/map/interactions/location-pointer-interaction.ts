import Point from 'ol/geom/Point'
import PointerInteraction from 'ol/interaction/Pointer'
import { MapBrowserEvent } from 'ol'
import Feature from 'ol/Feature'
import { Coordinate } from 'ol/coordinate'
import Geometry from 'ol/geom/Geometry'

interface LocationOverlay {
  showAtCoordinate: (coord: Coordinate, properties: Record<string, unknown>) => void
  close: () => void
}

export default class LocationPointerInteraction extends PointerInteraction {
  private static readonly CLICK_DISTANCE_THRESHOLD = 5

  private overlay: LocationOverlay

  private downPixel: [number, number] | null = null

  constructor(overlay: LocationOverlay) {
    super({
      handleEvent: (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) =>
        this.handlePointerEvent(event),
    })

    this.overlay = overlay
  }

  private getIntersectingLocation(
    event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>,
  ): Feature<Geometry> | undefined {
    const features = event.map.getFeaturesAtPixel(event.pixel)
    return features.find((feature): feature is Feature<Geometry> => {
      const templateId = feature?.get('overlayTemplateId')
      if (!templateId || typeof templateId !== 'string') return false
      const template = document.getElementById(templateId)
      return template instanceof HTMLTemplateElement
    })
  }

  private handlePointerEvent(event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>): boolean {
    switch (event.type) {
      case 'pointermove': {
        if (event.dragging) return true
        const location = this.getIntersectingLocation(event)
        const target = event.map.getTargetElement() as HTMLElement
        target.style.cursor = location ? 'pointer' : ''
        break
      }

      case 'pointerdown': {
        if (event.pixel.length >= 2) {
          this.downPixel = [event.pixel[0], event.pixel[1]]
        }
        break
      }

      case 'pointerup': {
        if (!this.downPixel) break

        const dx = event.pixel[0] - this.downPixel[0]
        const dy = event.pixel[1] - this.downPixel[1]
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < LocationPointerInteraction.CLICK_DISTANCE_THRESHOLD) {
          const location = this.getIntersectingLocation(event)
          const geometry = location?.getGeometry()
          const coordinate = geometry instanceof Point ? geometry.getCoordinates() : undefined
          const properties = location?.getProperties() ?? {}

          if (location && coordinate) {
            this.overlay.showAtCoordinate(coordinate, properties)
          } else {
            this.overlay.close()
          }
        }

        this.downPixel = null
        break
      }
      default:
        break
    }

    return true
  }
}
