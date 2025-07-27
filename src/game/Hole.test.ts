import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Scene, Engine, NullEngine, Vector3 } from '@babylonjs/core'
import { Hole } from './Hole'
import { createMockMesh } from '../test/mocks/babylonMocks'

// Mock window.requestAnimationFrame
// eslint-disable-next-line no-undef
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16)) as any

// Mock Mesh constants first
vi.mock('@babylonjs/core/Meshes/mesh', () => ({
  Mesh: {
    NO_CAP: 0,
  },
}))

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
        parent: null,
        isPickable: true,
      })),
      CreateCylinder: vi.fn(() => ({
        position: createMockVector3(0, 0, 0),
        material: null,
        dispose: vi.fn(),
        parent: null,
      })),
    },
    StandardMaterial: vi.fn(() => ({
      diffuseColor: null,
      specularColor: null,
      emissiveColor: null,
      diffuseTexture: null,
      backFaceCulling: true,
    })),
    DynamicTexture: vi.fn(() => ({
      getContext: vi.fn(() => ({
        fillStyle: '',
        fillRect: vi.fn(),
      })),
      update: vi.fn(),
    })),
    Mesh: vi.fn(function (name: string) {
      return {
        name,
        position: createMockVector3(0, 0, 0),
        rotation: { x: 0, y: 0, z: 0 },
        material: null,
        parent: null,
        isPickable: true,
        dispose: vi.fn(),
      }
    }),
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
  let scene: Scene
  let engine: Engine
  let hole: Hole

  beforeEach(() => {
    // Mock the engine
    engine = new NullEngine()

    // Create scene with engine
    scene = new Scene(engine)

    // Mock the scene's lights array to avoid the light disposal issue
    scene.lights = []

    vi.spyOn(scene, 'registerBeforeRender')
    vi.spyOn(scene, 'registerAfterRender')

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.useFakeTimers()
  })

  afterEach(() => {
    scene.dispose()
    engine.dispose()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default radius and position', () => {
      hole = new Hole(scene)

      expect(hole.getRadius()).toBe(0.8)
      const position = hole.getPosition()
      expect(position.x).toBe(0)
      expect(position.y).toBe(0)
      expect(position.z).toBe(0)
    })

    it('should initialize with custom radius and position', () => {
      const customRadius = 1.2
      const customPosition = new Vector3(5, 0, 5)

      hole = new Hole(scene, customRadius, customPosition)

      expect(hole.getRadius()).toBe(customRadius)
      const position = hole.getPosition()
      expect(position.x).toBe(5)
      expect(position.z).toBe(5)
    })
  })

  describe('position', () => {
    it('should update position when moveTo is called', () => {
      hole = new Hole(scene)
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
      hole = new Hole(scene, 0.8) // Starting radius

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

      scene.meshes.push(redSphere as any)

      // Initial state
      expect(hole.getRadius()).toBe(0.8)

      // Call update - this should detect and swallow the red sphere
      hole.update()

      // The object needs to be positioned over the hole and close to ground
      redSphere.position.y = 0.5

      // Fast forward to allow object to fall
      vi.advanceTimersByTime(100)
      hole.update()

      // Simulate the object falling below the disposal threshold
      redSphere.position.y = -6
      vi.advanceTimersByTime(100)

      // The object should be disposed after animation
      expect(redSphere.dispose).toHaveBeenCalled()

      // The hole should have grown
      expect(hole.getRadius()).toBeCloseTo(0.875) // 0.8 + (0.25 * 0.3)
    })

    it('should not swallow objects that are too large', () => {
      hole = new Hole(scene, 0.8)

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

      scene.meshes.push(greenSphere as any)

      // Call update
      hole.update()

      // The object should NOT be disposed
      expect(greenSphere.dispose).not.toHaveBeenCalled()

      // The hole should not have grown
      expect(hole.getRadius()).toBe(0.8)
    })

    it('should simulate full game progression with actual Hole instance', () => {
      hole = new Hole(scene, 0.8)

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

      scene.meshes.push(redSphere as any, blueBox as any, greenSphere as any)

      // Initially can't swallow green sphere
      hole.update()
      expect(greenSphere.dispose).not.toHaveBeenCalled()
      expect(hole.getRadius()).toBe(0.8)

      // Position red sphere to be swallowed
      redSphere.position.y = 0.5
      vi.advanceTimersByTime(100)
      hole.update()

      // Simulate falling
      redSphere.position.y = -6
      vi.advanceTimersByTime(100)
      expect(redSphere.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(0.875)

      // Move hole to blue box location
      hole.moveTo(5, 5)

      // Position blue box to be swallowed
      blueBox.position.y = 0.5
      hole.update()
      vi.advanceTimersByTime(100)
      hole.update()

      // Simulate falling
      blueBox.position.y = -6
      vi.advanceTimersByTime(100)
      expect(blueBox.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(1.025)

      // Move hole to green sphere location
      hole.moveTo(-3, -3)

      // Position green sphere to be swallowed
      greenSphere.position.y = 0.5
      hole.update()
      vi.advanceTimersByTime(100)
      hole.update()

      // Simulate falling
      greenSphere.position.y = -6
      vi.advanceTimersByTime(100)
      expect(greenSphere.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(1.325) // 1.025 + (1.0 * 0.3)
    })

    it('should not swallow the same object twice', () => {
      hole = new Hole(scene, 1.0)

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

      scene.meshes.push(smallSphere as any)

      // Position sphere to be swallowed
      smallSphere.position.y = 0.5

      // First update - should start swallowing
      hole.update()
      vi.advanceTimersByTime(50)

      // Second update before disposal - should not swallow again
      hole.update()
      vi.advanceTimersByTime(50)

      // Simulate falling below threshold
      smallSphere.position.y = -6
      vi.advanceTimersByTime(100)

      // Should only have been disposed once
      expect(smallSphere.dispose).toHaveBeenCalledTimes(1)
    })
  })
})
