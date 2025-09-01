import DragRotate from 'ol/interaction/DragRotate'
import { mouseActionButton } from 'ol/events/condition'
import createCtrlDragRotateInteraction, { ctrlOrCmdDragCondition } from './ctrl-drag-rotate'

jest.mock('ol/interaction/DragRotate', () => jest.fn().mockImplementation(opts => ({ type: 'DragRotate', ...opts })))

jest.mock('ol/events/condition', () => ({
  mouseActionButton: jest.fn(() => true),
}))

describe('ctrlOrCmdDragCondition', () => {
  const makeEvent = (overrides: Partial<MouseEvent> = {}) =>
    ({
      originalEvent: { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...overrides },
    }) as any

  it('returns true when ctrlKey is held and mouseActionButton true', () => {
    ;(mouseActionButton as jest.Mock).mockReturnValue(true)
    expect(ctrlOrCmdDragCondition(makeEvent({ ctrlKey: true }))).toBe(true)
  })

  it('returns true when metaKey is held and mouseActionButton true', () => {
    ;(mouseActionButton as jest.Mock).mockReturnValue(true)
    expect(ctrlOrCmdDragCondition(makeEvent({ metaKey: true }))).toBe(true)
  })

  it('returns false if altKey is held', () => {
    ;(mouseActionButton as jest.Mock).mockReturnValue(true)
    expect(ctrlOrCmdDragCondition(makeEvent({ ctrlKey: true, altKey: true }))).toBe(false)
  })

  it('returns false if shiftKey is held', () => {
    ;(mouseActionButton as jest.Mock).mockReturnValue(true)
    expect(ctrlOrCmdDragCondition(makeEvent({ ctrlKey: true, shiftKey: true }))).toBe(false)
  })

  it('returns false if no ctrl/meta modifier', () => {
    ;(mouseActionButton as jest.Mock).mockReturnValue(true)
    expect(ctrlOrCmdDragCondition(makeEvent())).toBe(false)
  })

  it('returns false if mouseActionButton is false', () => {
    ;(mouseActionButton as jest.Mock).mockReturnValue(false)
    expect(ctrlOrCmdDragCondition(makeEvent({ ctrlKey: true }))).toBe(false)
  })
})

describe('createCtrlDragRotateInteraction', () => {
  it('creates DragRotate with ctrlOrCmdDragCondition', () => {
    const interaction = createCtrlDragRotateInteraction()
    expect(DragRotate).toHaveBeenCalledWith(
      expect.objectContaining({
        condition: expect.any(Function),
      }),
    )

    const callArgs = (DragRotate as jest.Mock).mock.calls[0][0]
    expect(callArgs.condition).toBe(ctrlOrCmdDragCondition)
    expect(interaction).toEqual(expect.objectContaining({ type: 'DragRotate' }))
  })
})
