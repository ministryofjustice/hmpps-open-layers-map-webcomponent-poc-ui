import Point from 'ol/geom/Point'
import PointerInteraction from 'ol/interaction/Pointer'
import type { MapBrowserEvent } from 'ol'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import type { Coordinate } from 'ol/coordinate'

interface LocationOverlay {
  showAtCoordinate: (coord: Coordinate, properties: Record<string, unknown>) => void
  close: () => void
}

export default class FeaturePointerInteraction extends PointerInteraction {
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

  private getIntersectingFeature(
    event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>,
  ): Feature<Geometry> | undefined {
    const features = event.map.getFeaturesAtPixel(event.pixel)
    return features.find((feature): feature is Feature<Geometry> => {
      const templateId = feature?.get('overlayBodyTemplateId')
      if (!templateId || typeof templateId !== 'string') return false
      const template = document.getElementById(templateId)
      return template instanceof HTMLTemplateElement
    })
  }

  private handlePointerEvent(event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>): boolean {
    const viewport = event.map.getViewport()

    switch (event.type) {
      case 'pointermove': {
        if (event.dragging) return true
        const feature = this.getIntersectingFeature(event)
        // Only this interaction is allowed to set 'pointer'
        if (feature) viewport.style.cursor = 'pointer'
        // Do NOT reset to '' here; MapPointerInteraction will set 'grab'
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

        if (distance < FeaturePointerInteraction.CLICK_DISTANCE_THRESHOLD) {
          const feature = this.getIntersectingFeature(event)
          const geometry = feature?.getGeometry()
          const coordinate = geometry instanceof Point ? geometry.getCoordinates() : undefined
          const properties = feature?.getProperties() ?? {}

          if (feature && coordinate) {
            this.overlay.showAtCoordinate(coordinate, properties)
          } else {
            this.overlay.close()
          }
        }

        this.downPixel = null
        break
      }

      default: {
        break
      }
    }
    return true
  }
}
