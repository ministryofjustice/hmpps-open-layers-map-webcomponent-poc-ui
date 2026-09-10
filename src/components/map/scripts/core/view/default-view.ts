import { View } from 'ol'
import config from '../config'

type DefaultViewOptions = {
  /**
   * When true (default), only the view's center point is constrained to the UK extent,
   * allowing the visible viewport to pan/zoom past the coastline (with elastic snap-back).
   * When false, the entire viewport is constrained within the extent, which more aggressively
   * blocks panning/zooming past the UK bounds.
   */
  constrainOnlyCenter?: boolean
}

// The view is set up to display the entire UK
// The extent / centre / zoom will be updated when map is populated with features
class DefaultView extends View {
  constructor({ constrainOnlyCenter = true }: DefaultViewOptions = {}) {
    super({
      projection: 'EPSG:3857',
      extent: config.view.default.extent,
      constrainOnlyCenter,
      showFullExtent: true,
      minZoom: config.view.zoom.min,
      maxZoom: config.view.zoom.max,
      center: config.view.default.centre,
      zoom: config.view.default.zoom,
      constrainRotation: false,
    })
  }
}

export default DefaultView
export type { DefaultViewOptions }
