export function toDMS(deg: number) {
  const a = Math.abs(deg)
  const d = Math.floor(a)
  const mFloat = (a - d) * 60
  const m = Math.floor(mFloat)
  const s = (mFloat - m) * 60
  return { d, m, s }
}

export function formatDMS(lat: number, lon: number) {
  const latH = lat >= 0 ? 'N' : 'S'
  const lonH = lon >= 0 ? 'E' : 'W'
  const { d: ld, m: lm, s: ls } = toDMS(lat)
  const { d: od, m: om, s: os } = toDMS(lon)
  return (
    `${String(ld).padStart(2, '0')} ${String(lm).padStart(2, '0')} ${ls.toFixed(2).padStart(5, '0')}${latH} ` +
    `${String(od).padStart(3, '0')} ${String(om).padStart(2, '0')} ${os.toFixed(2).padStart(5, '0')}${lonH}`
  )
}

export function formatLatLon(lat: number, lon: number, latLonDecimalPlaces = 4): string {
  const fmt = (v: number) => Math.abs(v).toFixed(latLonDecimalPlaces)
  const hemiLat = lat >= 0 ? 'N' : 'S'
  const hemiLon = lon >= 0 ? 'E' : 'W'
  return `${fmt(lat)}°${hemiLat} ${fmt(lon)}°${hemiLon}`
}
