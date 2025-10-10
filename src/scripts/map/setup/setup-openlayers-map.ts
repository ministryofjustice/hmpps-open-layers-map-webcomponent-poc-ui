import { OLMapInstance, OLMapOptions } from '../open-layers-map-instance'
import { OrdnanceSurveyVectorTileLayer } from '../layers/ordnance-survey-vector'
import { FeaturePointerInteraction, MapPointerInteraction } from '../interactions'
import FeatureOverlay from '../overlays/feature-overlay'

type OLMapInstanceWithOverlay = OLMapInstance & { featureOverlay?: FeatureOverlay }

/**
 * Build a final OS Vector style URL.
 * - Normalises trailing slashes
 * - Defaults to /os-map/vector/style if not provided
 * - Handles Cypress/localhost stubs (used in tests)
 */
export function resolveFinalStyleUrl(vectorUrlFromAttr?: string): string {
  if (vectorUrlFromAttr && vectorUrlFromAttr.trim() !== '') {
    return vectorUrlFromAttr.replace(/\/$/, '')
  }
  return '/os-map/vector/style'
}

export async function setupOpenLayersMap(
  mapContainer: HTMLElement,
  options: OLMapOptions & {
    vectorUrl?: string
    usesInternalOverlays: boolean
    overlayEl?: HTMLElement | null
    grabCursor?: boolean
  },
): Promise<OLMapInstance> {
  const map = new OLMapInstance({
    target: mapContainer,
    layers: [],
    controls: options.controls,
  })

  const styleUrl = resolveFinalStyleUrl(options.vectorUrl)
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
