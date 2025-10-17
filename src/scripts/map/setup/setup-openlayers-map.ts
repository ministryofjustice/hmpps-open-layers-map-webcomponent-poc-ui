import { OLMapInstance, OLMapOptions } from '../open-layers-map-instance'
import { OrdnanceSurveyVectorTileLayer } from '../layers/ordnance-survey-vector'
import { FeaturePointerInteraction, MapPointerInteraction } from '../interactions'
import FeatureOverlay from '../overlays/feature-overlay'
import config from '../config'

type OLMapInstanceWithOverlay = OLMapInstance & { featureOverlay?: FeatureOverlay }

export async function setupOpenLayersMap(
  mapContainer: HTMLElement,
  options: OLMapOptions & {
    usesInternalOverlays: boolean
    vectorUrl?: string
    overlayEl?: HTMLElement | null
    grabCursor?: boolean
  },
): Promise<OLMapInstance> {
  const map = new OLMapInstance({
    target: mapContainer,
    layers: [],
    controls: options.controls,
  })

  const styleUrl = options.vectorUrl || config.tiles.urls.localVectorStyleUrl
  const vectorLayer = new OrdnanceSurveyVectorTileLayer()

  try {
    await vectorLayer.applyVectorStyle(styleUrl)
    map.addLayer(vectorLayer)
  } catch (err) {
    if (/^https?:\/\/localhost(:\d+)?\//i.test(styleUrl)) {
      console.warn('[moj-map] applyVectorStyle failed on localhost; keeping vector layer for tests.', err)
      map.addLayer(vectorLayer)
    } else {
      console.error('[moj-map] Failed to apply vector style.', err)
      throw err
    }
  }

  if (options.usesInternalOverlays && options.overlayEl instanceof HTMLElement) {
    const featureOverlay = new FeatureOverlay(options.overlayEl)
    map.addOverlay(featureOverlay)
    map.addInteraction(new FeaturePointerInteraction(featureOverlay))
    const mapWithOverlay: OLMapInstanceWithOverlay = map
    mapWithOverlay.featureOverlay = featureOverlay
  }

  if (options.controls?.grabCursor !== false) {
    map.addInteraction(new MapPointerInteraction())
    const viewportEl = map.getViewport()

    // Set initial cursor
    viewportEl.style.cursor = 'grab'
  }

  return map
}
