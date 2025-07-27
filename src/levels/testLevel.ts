import { Vector3, Color3 } from '@babylonjs/core'
import { Level } from '../game/types'

export const testLevel: Level = {
  name: 'Test Level',
  objects: [
    // Original objects
    {
      name: 'sphere1',
      position: new Vector3(2, 1, 2), // Raised for physics drop
      size: 0.5,
      color: new Color3(1, 0, 0),
      type: 'sphere',
    },
    {
      name: 'box1',
      position: new Vector3(-2, 1.5, 2), // Raised for physics drop
      size: 1,
      color: new Color3(0, 0, 1),
      type: 'box',
    },
    {
      name: 'sphere2',
      position: new Vector3(0, 2, -3), // Raised for physics drop
      size: 2,
      color: new Color3(0, 1, 0),
      type: 'sphere',
    },

    // New varied boxes
    {
      name: 'box2_tall',
      position: new Vector3(4, 2, 0), // Tall skinny box
      size: 0.5, // For physics calculation
      dimensions: new Vector3(0.5, 3, 0.5), // width, height, depth
      color: new Color3(1, 1, 0), // Yellow
      type: 'box',
    },
    {
      name: 'box3_flat',
      position: new Vector3(-4, 0.5, -2), // Flat wide box
      size: 1.5,
      dimensions: new Vector3(3, 0.3, 2), // Like a book
      color: new Color3(1, 0, 1), // Magenta
      type: 'box',
    },
    {
      name: 'box4_plank',
      position: new Vector3(0, 1, 4), // Long plank
      size: 1,
      dimensions: new Vector3(4, 0.4, 0.4), // Like a wooden plank
      color: new Color3(0, 1, 1), // Cyan
      type: 'box',
    },
    {
      name: 'box5_thin',
      position: new Vector3(-3, 1.5, -4), // Thin sheet
      size: 1,
      dimensions: new Vector3(2, 2, 0.1), // Like a sheet of plywood
      color: new Color3(0.5, 0.5, 0.5), // Gray
      type: 'box',
    },
  ],
  holeStartRadius: 0.8,
  holeStartPosition: new Vector3(0, 0.01, 0), // Slightly above ground
  groundSize: 20,
}
