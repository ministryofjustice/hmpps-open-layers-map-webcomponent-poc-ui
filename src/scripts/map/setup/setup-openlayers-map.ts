import { OLMapInstance, OLMapOptions } from '../open-layers-map-instance'
import { OrdnanceSurveyImageTileLayer, isImageTileLayer } from '../layers/ordnance-survey-image'
import { OrdnanceSurveyVectorTileLayer } from '../layers/ordnance-survey-vector'
import { FeaturePointerInteraction, MapPointerInteraction } from '../interactions'
import FeatureOverlay from '../overlays/feature-overlay'
import { startTokenRefresh, fetchAccessToken } from '../token-refresh'

export async function setupOpenLayersMap(
  mapContainer: HTMLElement,
  options: OLMapOptions & {
    tileType?: 'vector' | 'raster'
    tokenUrl: string
    tileUrl: string
    vectorUrl: string
    apiKey?: string
    usesInternalOverlays: boolean
    overlayEl?: HTMLElement | null
    grabCursor?: boolean
  },
): Promise<OLMapInstance> {
  let accessToken = ''
  let expiresIn = 0

  // Fetch token if configured (for raster)
  try {
    if (options.tokenUrl.toLowerCase() !== 'none') {
      const tokenResponse = await fetchAccessToken(options.tokenUrl)
      accessToken = tokenResponse.token
      expiresIn = tokenResponse.expiresIn
    }
  } catch (err) {
    console.error('Failed to retrieve access token:', err)
  }

  const map = new OLMapInstance({
    target: mapContainer,
    layers: [],
    controls: options.controls,
  })

  const appliedTileType = options.tileType || 'vector'

  if (appliedTileType === 'vector') {
    const hasKeyInUrl = /\bkey=/.test(options.vectorUrl)
    if (!options.apiKey && !hasKeyInUrl) {
      console.warn('[moj-map] No apiKey provided and vectorUrl has no key. Falling back to image tiles.')
      map.addLayer(new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken))
    } else {
      const vectorLayer = new OrdnanceSurveyVectorTileLayer()
      try {
        await vectorLayer.applyVectorStyle(options.apiKey, options.vectorUrl!)
        map.addLayer(vectorLayer)
      } catch (err) {
        console.warn('[moj-map] Failed to initialise vector layer. Falling back to image tiles.', err)
        map.addLayer(new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken))
      }
    }
  } else {
    const rasterLayer = new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken)
    map.addLayer(rasterLayer)

    if (accessToken && expiresIn && isImageTileLayer(rasterLayer)) {
      startTokenRefresh({
        tokenUrl: options.tokenUrl,
        initialExpiresIn: expiresIn,
        onTokenUpdate: newToken => rasterLayer.updateToken(newToken),
      })
    }
  }

  if (options.usesInternalOverlays && options.overlayEl instanceof HTMLElement) {
    const featureOverlay = new FeatureOverlay(options.overlayEl)
    map.addOverlay(featureOverlay)

    // Add interaction for grab/grabbing cursor
    map.addInteraction(new FeaturePointerInteraction(featureOverlay))
  }

  if (options.controls?.grabCursor !== false) {
    map.addInteraction(new MapPointerInteraction())
    const viewport = map.getViewport()
    viewport.style.cursor = 'grab'
    viewport.addEventListener('pointerdown', () => {
      viewport.style.cursor = 'grabbing'
    })
    viewport.addEventListener('pointerup', () => {
      viewport.style.cursor = 'grab'
    })

    // Reset when the pointer leaves the map area
    viewport.addEventListener('pointerleave', () => {
      viewport.style.cursor = 'grab'
    })
  }

  return map
}
