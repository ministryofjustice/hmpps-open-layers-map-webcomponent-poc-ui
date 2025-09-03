import { toDMS, formatDMS, formatLatLon } from './coordinates'

describe('coordinates helpers', () => {
  const lat = 53.4808
  const lon = -2.2426

  describe('toDMS', () => {
    it('converts positive latitude correctly', () => {
      const result = toDMS(lat)
      expect(result.d).toBe(53)
      expect(result.m).toBe(28)
      expect(result.s).toBeCloseTo(50.88, 2)
    })

    it('converts negative longitude correctly', () => {
      const result = toDMS(lon)
      expect(result.d).toBe(2)
      expect(result.m).toBe(14)
      expect(result.s).toBeCloseTo(33.36, 2)
    })
  })

  describe('formatDMS', () => {
    it('formats latitude/longitude as DMS with hemisphere', () => {
      const result = formatDMS(lat, lon)
      expect(result).toBe('53 28 50.88N 002 14 33.36W')
    })
  })

  describe('formatLatLon', () => {
    it('formats decimal degrees with hemispheres', () => {
      const result = formatLatLon(lat, lon, 4)
      expect(result).toBe('53.4808°N 2.2426°W')
    })

    it('defaults to 4 decimal places when not provided', () => {
      const result = formatLatLon(lat, lon)
      expect(result).toBe('53.4808°N 2.2426°W')
    })
  })
})
