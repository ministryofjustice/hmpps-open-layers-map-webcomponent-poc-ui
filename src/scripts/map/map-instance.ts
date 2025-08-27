import Map from 'ol/Map'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import BaseLayer from 'ol/layer/Base'
import Overlay from 'ol/Overlay'
import { Interaction } from 'ol/interaction'
import LocationDisplayControl from './controls/location-display-control'
import { defaults as defaultControls, Rotate, ScaleLine, ZoomSlider } from 'ol/control'
import createCtrlDragRotateInteraction from './interactions/ctrl-drag-rotate'
import DefaultView from './view/default-view'

export interface MojMapInstanceOptions {
  target: HTMLElement
  layers?: BaseLayer[]
  overlays?: Overlay[]
  interactions?: Interaction[]
  controls?: {
    rotate?: boolean | { autoHide?: boolean }
    zoomSlider?: boolean
    scaleControl?: 'bar' | 'line'
    /** 'dms' → Degrees/Minutes/Seconds, 'latlon' → decimal lat/lon */
    locationDisplay?: 'dms' | 'latlon'
    /** where to read coordinates from */
    locationDisplaySource?: 'centre' | 'pointer'
  }
}

export class MojMapInstance extends Map {
  constructor(options: MojMapInstanceOptions) {
    const layers = options.layers || []
    const controlOptions = options.controls || {}

    const controls = defaultControls({ rotate: false })

    // Rotate control
    if (controlOptions.rotate !== false) {
      const autoHide =
        typeof controlOptions.rotate === 'object'
          ? controlOptions.rotate.autoHide === true
          : false
      controls.extend([new Rotate({ autoHide })])
    }

    // Scale control (ScaleBar via ScaleLine with bar: true)
    if (controlOptions.scaleControl === 'bar') {
      controls.push(
        new ScaleLine({
          units: 'metric',
          bar: true,
          steps: 2,
          text: false,
          minWidth: 140,
        })
      )
    } else if (controlOptions.scaleControl === 'line') {
      controls.push(new ScaleLine({ units: 'metric' }))
    }

    // Location display (DMS or Lat/Long), from centre or pointer
    if (controlOptions.locationDisplay === 'dms' || controlOptions.locationDisplay === 'latlon') {
      controls.push(
        new LocationDisplayControl({
          mode: controlOptions.locationDisplay,                         // 'dms' | 'latlon'
          source: controlOptions.locationDisplaySource ?? 'pointer',     // 'centre' | 'pointer'
          position: 'bottom-center',
        })
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
