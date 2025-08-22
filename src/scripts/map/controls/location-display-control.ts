import Control from 'ol/control/Control'
import type Map from 'ol/Map'
import { transform } from 'ol/proj'
import { formatDMS, formatLatLon } from '../../helpers/coordinates'

type Mode = 'dms' | 'latlon'            // 'latlon' = decimal lat/lon
type Source = 'centre' | 'pointer'     // update from map centre or mouse pointer

type Options = {
  className?: string
  mode?: Mode                 // default: 'latlon'
  source?: Source             // default: 'pointer'
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right'
  latLonDecimalPlaces?: number          // decimals for 'latlon' mode, default: 5
}

export default class LocationDisplayControl extends Control {
  private el: HTMLDivElement
  private mapRef?: Map
  private mode: Mode
  private source: Source
  private latLonDecimalPlaces: number

  private static readonly PROJ_IN = 'EPSG:3857'
  private static readonly PROJ_OUT = 'EPSG:4326'

  constructor(opts: Options = {}) {
    const el = document.createElement('div')
    el.className =
      (opts.className ?? 'moj-map__location-dms') + ' ol-unselectable ol-control'
    super({ element: el })

    this.el = el
    this.mode = opts.mode ?? 'latlon'
    this.source = opts.source ?? 'pointer'
    this.latLonDecimalPlaces = opts.latLonDecimalPlaces ?? 5
  }

  setMap(map: Map | null): void {
    if (this.mapRef) {
      this.mapRef.un('moveend', this.onMoveEnd)
      this.mapRef.un('pointermove', this.onPointerMove)
    }
    super.setMap(map)
    this.mapRef = map ?? undefined
    if (!map) return

    if (this.source === 'pointer') {
      map.on('pointermove', this.onPointerMove)
    } else {
      map.on('moveend', this.onMoveEnd)
      this.onMoveEnd()
    }
  }

  private onMoveEnd = () => {
    if (!this.mapRef) return
    const centre = this.mapRef.getView().getCenter()
    if (!centre) return
    const [lon, lat] = transform(
      centre,
      LocationDisplayControl.PROJ_IN,
      LocationDisplayControl.PROJ_OUT
    )
    this.el.textContent = this.format(lat, lon)
  }

  private onPointerMove = (evt: any) => {
    if (!evt?.coordinate) return
    const [lon, lat] = transform(
      evt.coordinate,
      LocationDisplayControl.PROJ_IN,
      LocationDisplayControl.PROJ_OUT
    )
    this.el.textContent = this.format(lat, lon)
  }

  private format(lat: number, lon: number): string {
    if (this.mode === 'dms') {
      return formatDMS(lat, lon)
    }
    return formatLatLon(lat, lon, this.latLonDecimalPlaces)
  }
}
