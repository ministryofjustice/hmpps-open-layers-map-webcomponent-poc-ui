import VectorTileLayer from 'ol/layer/VectorTile'
import { applyStyle } from 'ol-mapbox-style'

export class OrdnanceSurveyVectorTileLayer extends VectorTileLayer {
  constructor() {
    super({ declutter: true })
  }

  async applyVectorStyle(styleUrl: string): Promise<void> {
    // Strip trailing slash for consistency
    return applyStyle(this, styleUrl.replace(/\/$/, ''))
  }
}
