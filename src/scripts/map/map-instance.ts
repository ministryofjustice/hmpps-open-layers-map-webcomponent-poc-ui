import Map from 'ol/Map'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import BaseLayer from 'ol/layer/Base'
import Overlay from 'ol/Overlay'
import { Interaction } from 'ol/interaction'
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
      interactions: defaultInteractions().extend(options.interactions || []),
      view: new DefaultView(),
    })
  }
}
