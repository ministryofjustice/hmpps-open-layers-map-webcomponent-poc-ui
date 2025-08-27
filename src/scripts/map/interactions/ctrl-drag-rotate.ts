import DragRotate from 'ol/interaction/DragRotate'
import { MapBrowserEvent } from 'ol'
import { mouseActionButton, Condition } from 'ol/events/condition'

// Override default Rotate interaction to only activate on Ctrl or Cmd + mouse button like mapLibre
export const ctrlOrCmdDragCondition: Condition = (
  event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>,
): boolean => {
  const originalEvent = event.originalEvent as MouseEvent

  const isModifierHeld =
    (originalEvent.ctrlKey || originalEvent.metaKey) && !originalEvent.altKey && !originalEvent.shiftKey

  return isModifierHeld && mouseActionButton(event)
}

export default function createCtrlDragRotateInteraction(): DragRotate {
  return new DragRotate({
    condition: ctrlOrCmdDragCondition as Condition,
  })
}
