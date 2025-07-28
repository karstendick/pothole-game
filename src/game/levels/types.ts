import { Vector3, Color3 } from '@babylonjs/core'

export type VictoryConditionType = 'all_objects' | 'target_size' | 'specific_objects'

export interface VictoryCondition {
  type: VictoryConditionType
  targetSize?: number // For size-based victory
  requiredObjects?: string[] // For specific object collection
}

export interface LevelObject {
  id: string
  name: string
  type: 'sphere' | 'box' | 'cylinder' | 'compound'
  position: Vector3

  // For primitives
  size?: number // General size for simple shapes
  radius?: number // For spheres/cylinders
  height?: number // For cylinders/boxes
  dimensions?: Vector3 // For boxes (width, height, depth)

  // Visual
  color: Color3

  // Physics
  physics: {
    mass: number
    restitution: number
    friction: number
  }

  // Gameplay
  swallowRadius: number // Effective radius for swallowing calculations
  isRequired?: boolean // For specific victory conditions
}

export interface LevelConfig {
  id: string
  name: string
  description: string

  // Victory conditions
  victory: VictoryCondition

  // Hole configuration
  hole: {
    startRadius: number
    startPosition: Vector3
    maxRadius?: number // Optional size limit
  }

  // Environment settings
  environment: {
    groundSize: number
    backgroundColor?: Color3
  }

  // Objects in the level
  objects: LevelObject[]
}
