import Point from 'ol/geom/Point'
import PointerInteraction from 'ol/interaction/Pointer'
import { MapBrowserEvent } from 'ol'
import Feature from 'ol/Feature'
import { Coordinate } from 'ol/coordinate'
import Geometry from 'ol/geom/Geometry'

interface LocationOverlay {
  showAtCoordinate: (coord: Coordinate, properties: Record<string, any>) => void
  close: () => void
}

export default class LocationPointerInteraction extends PointerInteraction {
  private overlay: LocationOverlay

  constructor(overlay: LocationOverlay) {
    super()
    this.overlay = overlay
  }

  private getIntersectingLocation(event: MapBrowserEvent<PointerEvent>): Feature<Geometry> | undefined {
    const features = event.map.getFeaturesAtPixel(event.pixel)
    return features.find(
      (feature): feature is Feature<Geometry> => feature?.get('type') === 'location-point'
    )
  }

  override handleMoveEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    const { dragging, map } = event

    if (dragging) return true

    const location = this.getIntersectingLocation(event)
    map.getTargetElement().style.cursor = location ? 'pointer' : ''

    return true
  }

  override handleDownEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    const location = this.getIntersectingLocation(event)
    const geometry = location?.getGeometry()
    const coordinate = geometry instanceof Point ? geometry.getCoordinates() : undefined
    const properties = location?.getProperties() ?? {}

    if (location && coordinate) {
      this.overlay.showAtCoordinate(coordinate, properties)
      return true
    }

    this.overlay.close()
    return false
  }
}
