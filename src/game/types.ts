import { Vector3, Color3 } from '@babylonjs/core'

export interface GameObject {
  name: string
  position: Vector3
  size: number // diameter for spheres, edge length for boxes
  dimensions?: Vector3 // optional: for non-cubic boxes (width, height, depth)
  color: Color3
  type: 'sphere' | 'box'
}

export interface Level {
  name: string
  objects: GameObject[]
  holeStartRadius: number
  holeStartPosition: Vector3
  groundSize: number
}
