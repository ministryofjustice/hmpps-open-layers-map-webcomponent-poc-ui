import { clamp } from './math'

describe('math', () => {
  describe('clamp', () => {
    it.each([
      ['min', 0, 1, 5, 1],
      ['max', 6, 1, 5, 5],
      ['mid', 3, 1, 5, 3],
    ])('[%s] clamp(%s, %s, %s)', (_: string, value: number, min: number, max: number, expected: number) => {
      expect(clamp(value, min, max)).toEqual(expected)
    })
  })
})
