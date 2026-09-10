import Map from 'ol/Map.js'
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js'
import DragPan from 'ol/interaction/DragPan.js'
import Collection from 'ol/Collection.js'
import Interaction from 'ol/interaction/Interaction.js'
import BaseLayer from 'ol/layer/Base.js'
import Overlay from 'ol/Overlay.js'
import { defaults as defaultControls, Rotate, ScaleLine, ZoomSlider } from 'ol/control.js'
import LocationDisplayControl from './controls/location-display-control'
import createDragPanWithKinetic from './interactions/drag-pan-with-kinetic'
import DefaultView from './view/default-view'

export interface OLMapOptions {
  target: HTMLElement
  layers?: BaseLayer[]
  overlays?: Overlay[]
  interactions?: Interaction[]
  controls?: {
    grabCursor?: boolean
    rotate?: boolean | { autoHide?: boolean }
    olRotationMode?: 'default' | 'right-drag'
    olRotateTooltip?: boolean
    zoomSlider?: boolean
    zoomControl?: boolean
    scaleControl?: 'bar' | 'line'
    locationDisplay?: 'dms' | 'latlon'
    locationDisplaySource?: 'centre' | 'pointer'
    enable3DBuildings?: boolean
    constrainOnlyCenter?: boolean
  }
}

export class OLMapInstance extends Map {
  constructor(options: OLMapOptions) {
    const layers = options.layers || []
    const controlOptions = options.controls || {}

    const zoomControl = controlOptions.zoomSlider || controlOptions.zoomControl !== false

    const controls = defaultControls({
      rotate: false,
      attribution: false,
      zoom: zoomControl,
    })

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

    // Interactions

    // Ensure defaultInteractions() is always an array, even though OL v10.6.1 types claim it
    // returns Interaction[], in some contexts (e.g. Jest) it actually returns Collection<Interaction>,
    // so this unwraps it if needed:
    function normalizeInteractions(value: unknown): Interaction[] {
      if (Array.isArray(value)) return value
      if (value instanceof Collection) {
        return (value as Collection<Interaction>).getArray()
      }
      return []
    }

    // OpenLayers Alt+Shift rotate is ON unless we explicitly choose 'right-drag' mode.
    const enableAltShiftRotate = controlOptions.olRotationMode !== 'right-drag'

    const baseInteractions = normalizeInteractions(
      defaultInteractions({ altShiftDragRotate: enableAltShiftRotate }),
    ).filter((i: Interaction) => !(i instanceof DragPan))

    const interactions = [
      ...baseInteractions.filter((i: Interaction) => !(i instanceof DragPan)),
      createDragPanWithKinetic(),
      ...(options.interactions || []),
    ]

    super({
      target: options.target,
      layers,
      overlays: options.overlays || [],
      interactions,
      controls,
      view: new DefaultView({ constrainOnlyCenter: controlOptions.constrainOnlyCenter }),
    })
  }
}
