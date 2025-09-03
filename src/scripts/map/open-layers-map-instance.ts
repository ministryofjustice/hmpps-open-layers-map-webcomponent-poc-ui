import Map from 'ol/Map'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import BaseLayer from 'ol/layer/Base'
import Overlay from 'ol/Overlay'
import { Interaction } from 'ol/interaction'
import { defaults as defaultControls, Rotate, ScaleLine, ZoomSlider } from 'ol/control'
import LocationDisplayControl from './controls/location-display-control'
import createCtrlDragRotateInteraction from './interactions/ctrl-drag-rotate'
import DefaultView from './view/default-view'

export interface OLMapOptions {
  target: HTMLElement
  layers?: BaseLayer[]
  overlays?: Overlay[]
  interactions?: Interaction[]
  controls?: {
    rotate?: boolean | { autoHide?: boolean }
    zoomSlider?: boolean
    scaleControl?: 'bar' | 'line'
    locationDisplay?: 'dms' | 'latlon'
    locationDisplaySource?: 'centre' | 'pointer'
    enable3DBuildings?: boolean
  }
}

export class OLMapInstance extends Map {
  constructor(options: OLMapOptions) {
    const layers = options.layers || []
    const controlOptions = options.controls || {}

    const controls = defaultControls({ rotate: false })

    // Rotate control
    if (controlOptions.rotate !== false) {
      const autoHide = typeof controlOptions.rotate === 'object' ? controlOptions.rotate.autoHide === true : false
      controls.extend([new Rotate({ autoHide })])
    }

    // Scale control
    if (controlOptions.scaleControl === 'bar') {
      controls.push(
        new ScaleLine({
          units: 'metric',
          bar: true,
          steps: 2,
          text: false,
          minWidth: 140,
        }),
      )
    } else if (controlOptions.scaleControl === 'line') {
      controls.push(new ScaleLine({ units: 'metric' }))
    }

    // Location display control
    if (controlOptions.locationDisplay === 'dms' || controlOptions.locationDisplay === 'latlon') {
      controls.push(
        new LocationDisplayControl({
          mode: controlOptions.locationDisplay,
          source: controlOptions.locationDisplaySource ?? 'pointer',
          position: 'bottom-center',
        }),
      )
    }

    // Zoom slider
    if (controlOptions.zoomSlider) {
      controls.push(new ZoomSlider())
    }

    super({
      target: options.target,
      layers,
      overlays: options.overlays || [],
      interactions: defaultInteractions({ altShiftDragRotate: false }).extend([
        ...(options.interactions || []),
        createCtrlDragRotateInteraction(),
      ]),
      controls,
      view: new DefaultView(),
    })
  }
}
