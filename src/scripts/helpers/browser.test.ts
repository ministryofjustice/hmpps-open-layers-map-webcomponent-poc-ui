import { supportsWebGL } from './browser'

// Helpers to safely manipulate window.WebGLRenderingContext
const setWebGL = (value: unknown) => {
  ;(window as { WebGLRenderingContext: unknown }).WebGLRenderingContext = value
}

const deleteWebGL = () => {
  delete (window as { WebGLRenderingContext: unknown }).WebGLRenderingContext
}

describe('supportsWebGL', () => {
  afterEach(() => {
    deleteWebGL()
    jest.restoreAllMocks()
  })

  it('returns true when WebGLRenderingContext exists and context can be created', () => {
    setWebGL(jest.fn())

    const getContext = jest.fn().mockReturnValue({})
    jest.spyOn(document, 'createElement').mockReturnValue({
      getContext,
    } as unknown as HTMLCanvasElement)

    expect(supportsWebGL()).toBe(true)
  })

  it('returns false when WebGLRenderingContext is missing', () => {
    deleteWebGL()
    expect(supportsWebGL()).toBe(false)
  })

  it('returns false when getContext fails', () => {
    setWebGL(jest.fn())

    const getContext = jest.fn().mockReturnValue(null)
    jest.spyOn(document, 'createElement').mockReturnValue({
      getContext,
    } as unknown as HTMLCanvasElement)

    expect(supportsWebGL()).toBe(false)
  })
})
