import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Vector3 } from '@babylonjs/core'
import { Hole } from './Hole'
import { createMockScene, createMockMesh } from '../test/mocks/babylonMocks'

// Mock BabylonJS MeshBuilder
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core')

  // Helper to create a mock Vector3
  const createMockVector3 = (x: number, y: number, z: number) => ({
    x,
    y,
    z,
    clone: function () {
      return createMockVector3(this.x, this.y, this.z)
    },
    equals: function (other: any) {
      return this.x === other.x && this.y === other.y && this.z === other.z
    },
  })

  return {
    ...actual,
    MeshBuilder: {
      CreateDisc: vi.fn(() => ({
        rotation: { x: 0 },
        position: createMockVector3(0, 0, 0),
        material: null,
        dispose: vi.fn(),
      })),
    },
    StandardMaterial: vi.fn(() => ({
      diffuseColor: null,
      specularColor: null,
    })),
    Vector3: Object.assign(
      function (x: number, y: number, z: number) {
        return createMockVector3(x, y, z)
      },
      {
        Zero: () => createMockVector3(0, 0, 0),
        Distance: vi.fn((a: any, b: any) => {
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dz = a.z - b.z
          return Math.sqrt(dx * dx + dy * dy + dz * dz)
        }),
      },
    ),
  }
})

describe('Hole', () => {
  let mockScene: any
  let hole: Hole

  beforeEach(() => {
    mockScene = createMockScene()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default radius and position', () => {
      hole = new Hole(mockScene)

      expect(hole.getRadius()).toBe(0.8)
      const position = hole.getPosition()
      expect(position.x).toBe(0)
      expect(position.y).toBe(0)
      expect(position.z).toBe(0)
    })

    it('should initialize with custom radius and position', () => {
      const customRadius = 1.2
      const customPosition = new Vector3(5, 0, 5)

      hole = new Hole(mockScene, customRadius, customPosition)

      expect(hole.getRadius()).toBe(customRadius)
      const position = hole.getPosition()
      expect(position.x).toBe(5)
      expect(position.z).toBe(5)
    })
  })

  describe('position', () => {
    it('should update position when moveTo is called', () => {
      hole = new Hole(mockScene)
      const newX = 5
      const newZ = 10

      hole.moveTo(newX, newZ)

      const position = hole.getPosition()
      expect(position.x).toBe(newX)
      expect(position.z).toBe(newZ)
    })
  })

  describe('swallowing and growth', () => {
    it('should swallow objects and grow when update() is called', () => {
      hole = new Hole(mockScene, 0.8) // Starting radius

      // Create a small red sphere that can be swallowed
      const redSphere = createMockMesh('sphere1', { x: 0.2, y: 0, z: 0.2 })
      // Mock the bounding info to have radius 0.25
      redSphere.getBoundingInfo = vi.fn(() => ({
        maximum: {
          x: 0.25,
          y: 0.25,
          z: 0.25,
          subtract: vi.fn(() => ({ x: 0.5, y: 0.5, z: 0.5 })),
        },
        minimum: { x: -0.25, y: -0.25, z: -0.25 },
      }))

      mockScene.meshes = [redSphere]

      // Initial state
      expect(hole.getRadius()).toBe(0.8)

      // Call update - this should detect and swallow the red sphere
      hole.update()

      // Fast forward through the swallow animation (20 frames * 16ms each)
      vi.advanceTimersByTime(320)

      // The object should be disposed after animation
      expect(redSphere.dispose).toHaveBeenCalled()

      // The hole should have grown
      expect(hole.getRadius()).toBeCloseTo(0.875) // 0.8 + (0.25 * 0.3)
    })

    it('should not swallow objects that are too large', () => {
      hole = new Hole(mockScene, 0.8)

      // Create a large green sphere that cannot be swallowed
      const greenSphere = createMockMesh('sphere2', { x: 0.2, y: 0, z: 0.2 })
      // Mock the bounding info to have radius 1.0
      greenSphere.getBoundingInfo = vi.fn(() => ({
        maximum: {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          subtract: vi.fn(() => ({ x: 2.0, y: 2.0, z: 2.0 })),
        },
        minimum: { x: -1.0, y: -1.0, z: -1.0 },
      }))

      mockScene.meshes = [greenSphere]

      // Call update
      hole.update()

      // The object should NOT be disposed
      expect(greenSphere.dispose).not.toHaveBeenCalled()

      // The hole should not have grown
      expect(hole.getRadius()).toBe(0.8)
    })

    it('should simulate full game progression with actual Hole instance', () => {
      hole = new Hole(mockScene, 0.8)

      // Create all three objects at different locations
      const redSphere = createMockMesh('sphere1', { x: 0.2, y: 0, z: 0.2 })
      redSphere.getBoundingInfo = vi.fn(() => ({
        maximum: {
          x: 0.25,
          y: 0.25,
          z: 0.25,
          subtract: vi.fn(() => ({ x: 0.5, y: 0.5, z: 0.5 })),
        },
        minimum: { x: -0.25, y: -0.25, z: -0.25 },
      }))

      const blueBox = createMockMesh('box1', { x: 5, y: 0, z: 5 }) // Far away
      blueBox.getBoundingInfo = vi.fn(() => ({
        maximum: {
          x: 0.5,
          y: 0.5,
          z: 0.5,
          subtract: vi.fn(() => ({ x: 1.0, y: 1.0, z: 1.0 })),
        },
        minimum: { x: -0.5, y: -0.5, z: -0.5 },
      }))

      const greenSphere = createMockMesh('sphere2', { x: -3, y: 0, z: -3 }) // Different location
      greenSphere.getBoundingInfo = vi.fn(() => ({
        maximum: {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          subtract: vi.fn(() => ({ x: 2.0, y: 2.0, z: 2.0 })),
        },
        minimum: { x: -1.0, y: -1.0, z: -1.0 },
      }))

      mockScene.meshes = [redSphere, blueBox, greenSphere]

      // Initially can't swallow green sphere
      hole.update()
      expect(greenSphere.dispose).not.toHaveBeenCalled()
      expect(hole.getRadius()).toBe(0.8)

      // But red sphere should be swallowed - advance time first
      vi.advanceTimersByTime(320)
      expect(redSphere.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(0.875)

      // Move hole to blue box location
      hole.moveTo(5, 5)

      // Now update again - blue box should be swallowed
      hole.update()
      vi.advanceTimersByTime(320)
      expect(blueBox.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(1.025)

      // Move hole to green sphere location
      hole.moveTo(-3, -3)

      // Finally, green sphere should be swallowable
      hole.update()
      vi.advanceTimersByTime(320)
      expect(greenSphere.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(1.325) // 1.025 + (1.0 * 0.3)
    })

    it('should not swallow the same object twice', () => {
      hole = new Hole(mockScene, 1.0)

      const smallSphere = createMockMesh('sphere1', { x: 0.1, y: 0, z: 0.1 })
      smallSphere.getBoundingInfo = vi.fn(() => ({
        maximum: {
          x: 0.25,
          y: 0.25,
          z: 0.25,
          subtract: vi.fn(() => ({ x: 0.5, y: 0.5, z: 0.5 })),
        },
        minimum: { x: -0.25, y: -0.25, z: -0.25 },
      }))

      mockScene.meshes = [smallSphere]

      // First update - should swallow
      hole.update()

      // Advance only halfway through animation
      vi.advanceTimersByTime(160)

      // Second update before animation completes - should not swallow again
      hole.update()

      // Complete the animation
      vi.advanceTimersByTime(160)

      // Should only have been disposed once
      expect(smallSphere.dispose).toHaveBeenCalledTimes(1)
    })
  })
})
