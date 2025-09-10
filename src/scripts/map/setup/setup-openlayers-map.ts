import { OLMapInstance, OLMapOptions } from '../open-layers-map-instance'
import { OrdnanceSurveyImageTileLayer, isImageTileLayer } from '../layers/ordnance-survey-image'
import { OrdnanceSurveyVectorTileLayer } from '../layers/ordnance-survey-vector'
import { FeaturePointerInteraction, MapPointerInteraction } from '../interactions'
import FeatureOverlay from '../overlays/feature-overlay'
import { startTokenRefresh, fetchAccessToken } from '../token-refresh'
import config from '../config'

export async function setupOpenLayersMap(
  mapContainer: HTMLElement,
  options: OLMapOptions & {
    tileType?: 'vector' | 'raster'
    tokenUrl: string
    tileUrl: string
    vectorUrl: string
    usesInternalOverlays: boolean
    overlayEl?: HTMLElement | null
    grabCursor?: boolean
  },
): Promise<OLMapInstance> {
  let accessToken = ''
  let expiresIn = 0
  const { apiKey } = config

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
    if (!apiKey) {
      console.warn('[moj-map] No API key configured in .env. Falling back to image tiles.')
      const rasterLayer = new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken)
      map.addLayer(rasterLayer)
    } else {
      const vectorLayer = new OrdnanceSurveyVectorTileLayer()
      try {
        await vectorLayer.applyVectorStyle(apiKey, options.vectorUrl!)
        map.addLayer(vectorLayer)
      } catch (err) {
        console.warn('[moj-map] Failed to initialise vector layer. Falling back to image tiles.', err)
        const rasterLayer = new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken)
        map.addLayer(rasterLayer)
      }
    }
  } else if (appliedTileType === 'raster') {
    const rasterLayer = new OrdnanceSurveyImageTileLayer(options.tileUrl!, accessToken)
    map.addLayer(rasterLayer)

    if (accessToken && expiresIn && isImageTileLayer(rasterLayer)) {
      startTokenRefresh({
        tokenUrl: options.tokenUrl,
        initialExpiresIn: expiresIn,
        onTokenUpdate: newToken => {
          rasterLayer.updateToken(newToken)
        },
      })
    }
  }

  if (options.usesInternalOverlays && options.overlayEl instanceof HTMLElement) {
    const featureOverlay = new FeatureOverlay(options.overlayEl)
    map.addOverlay(featureOverlay)

    // Add interaction for overlay features
    map.addInteraction(new FeaturePointerInteraction(featureOverlay))
    // Add interaction for overlay features
    map.addInteraction(new FeaturePointerInteraction(featureOverlay))
  }

  if (options.controls?.grabCursor !== false) {
    // Add interaction for grab/grabbing cursor
    map.addInteraction(new MapPointerInteraction())
  }

  if (options.controls?.grabCursor !== false) {
    const viewport = map.getViewport()
    viewport.style.cursor = 'grab'

    viewport.addEventListener('pointerdown', () => {
      viewport.style.cursor = 'grabbing'
    })

    viewport.addEventListener('pointerup', () => {
      viewport.style.cursor = 'grab'
    })

    // Reset when the pointer leaves the map
    viewport.addEventListener('pointerleave', () => {
      viewport.style.cursor = 'grab'
    })
  }

  return map
}
