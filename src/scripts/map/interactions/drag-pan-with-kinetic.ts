import { DragPan } from 'ol/interaction'
import Kinetic from 'ol/Kinetic'

/**
 * Set OpenLayer's DragPan animation to feel less "sticky" and closer to MapLibre’s.
 */
export default function createDragPanWithKinetic() {
  const kinetic = new Kinetic(-0.004, 0.01, 50)

  return new DragPan({ kinetic })
}
