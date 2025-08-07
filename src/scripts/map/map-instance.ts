import Map from 'ol/Map'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import BaseLayer from 'ol/layer/Base'
import Overlay from 'ol/Overlay'
import { Interaction } from 'ol/interaction'
import { defaults as defaultControls } from 'ol/control';
import Rotate from 'ol/control/Rotate';
import createCtrlDragRotateInteraction from './ctrl-drag-rotate'
import DefaultView from './view'

interface MojMapInstanceOptions {
  target: HTMLElement
  layers?: BaseLayer[]
  overlays?: Overlay[]
  interactions?: Interaction[]
}

export default class MojMapInstance extends Map {
  constructor(options: MojMapInstanceOptions) {
    const layers = options.layers || []

    super({
      target: options.target,
      layers,
      overlays: options.overlays || [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
      }).extend([
        ...(options.interactions || []),
        createCtrlDragRotateInteraction(),
      ]),
      controls: defaultControls({ rotate: false }).extend([
        new Rotate({
          autoHide: false,
        }),
      ]),
      view: new DefaultView(),
    })
  }
}
