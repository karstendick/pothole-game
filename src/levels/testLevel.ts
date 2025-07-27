import { Vector3, Color3 } from '@babylonjs/core'
import { Level } from '../game/types'

export const testLevel: Level = {
  name: 'Test Level',
  objects: [
    {
      name: 'sphere1',
      position: new Vector3(2, 0.25, 2),
      size: 0.5,
      color: new Color3(1, 0, 0),
      type: 'sphere',
    },
    {
      name: 'box1',
      position: new Vector3(-2, 0.5, 2),
      size: 1,
      color: new Color3(0, 0, 1),
      type: 'box',
    },
    {
      name: 'sphere2',
      position: new Vector3(0, 1, -3),
      size: 2,
      color: new Color3(0, 1, 0),
      type: 'sphere',
    },
  ],
  holeStartRadius: 0.8,
  holeStartPosition: Vector3.Zero(),
  groundSize: 20,
}
