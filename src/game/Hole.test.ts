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
  let mockGame: { cutHoleInGround: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    // Mock the engine
    engine = new NullEngine()

    // Create scene with engine
    scene = new Scene(engine)

    // Mock the scene's lights array to avoid the light disposal issue
    scene.lights = []

    // Mock activeCamera for visibility checks
    scene.activeCamera = {
      isInFrustum: vi.fn(() => true),
    } as any

    vi.spyOn(scene, 'registerBeforeRender')
    vi.spyOn(scene, 'registerAfterRender')

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.useFakeTimers()

    // Create mock game object
    mockGame = {
      cutHoleInGround: vi.fn(),
    }
  })

  afterEach(() => {
    try {
      scene?.dispose()
      engine?.dispose()
    } catch {
      // Ignore disposal errors in tests
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default radius and position', () => {
      hole = new Hole(scene, 0.8, Vector3.Zero(), mockGame)

      expect(hole.getRadius()).toBe(0.8)
      const position = hole.getPosition()
      expect(position.x).toBe(0)
      expect(position.y).toBe(0)
      expect(position.z).toBe(0)
      expect(mockGame.cutHoleInGround).toHaveBeenCalledWith(expect.anything(), 0.8)
    })

    it('should initialize with custom radius and position', () => {
      const customRadius = 1.2
      const customPosition = new Vector3(5, 0, 5)

      hole = new Hole(scene, customRadius, customPosition, mockGame)

      expect(hole.getRadius()).toBe(customRadius)
      const position = hole.getPosition()
      expect(position.x).toBe(5)
      expect(position.z).toBe(5)
      expect(mockGame.cutHoleInGround).toHaveBeenCalledWith(expect.anything(), 1.2)
    })

    it('should throw error if game reference is not provided', () => {
      expect(() => new Hole(scene, 0.8, Vector3.Zero(), null as any)).toThrow(
        'Game reference is required for Hole to function',
      )
    })
  })

  describe('position', () => {
    it('should update position when moveTo is called', () => {
      hole = new Hole(scene, 0.8, Vector3.Zero(), mockGame)
      const newX = 5
      const newZ = 10

      hole.moveTo(newX, newZ)

      const position = hole.getPosition()
      expect(position.x).toBe(newX)
      expect(position.z).toBe(newZ)
      // Should call cutHoleInGround when position changes
      expect(mockGame.cutHoleInGround).toHaveBeenCalledTimes(2) // Once on init, once on move
    })
  })

  describe('swallowing and growth', () => {
    it('should swallow objects and grow when update() is called', () => {
      hole = new Hole(scene, 0.8, Vector3.Zero(), mockGame) // Starting radius

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

      // Position object below ground to trigger swallowing
      redSphere.position.y = -0.6

      // Call update - this should detect and swallow the red sphere
      hole.update()

      // Simulate the object falling deeper
      redSphere.position.y = -11 // Below -10 threshold
      vi.advanceTimersByTime(100)

      // The object should be disposed after falling deep enough
      expect(redSphere.dispose).toHaveBeenCalled()

      // The hole should have grown
      expect(hole.getRadius()).toBeCloseTo(0.875) // 0.8 + (0.25 * 0.3)

      // Should have called cutHoleInGround when hole grew
      expect(mockGame.cutHoleInGround).toHaveBeenCalledWith(expect.anything(), 0.875)
    })

    it('should not swallow objects that are too large', () => {
      hole = new Hole(scene, 0.8, Vector3.Zero(), mockGame)

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
      hole = new Hole(scene, 0.8, Vector3.Zero(), mockGame)

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

      // Position red sphere below ground to be swallowed
      redSphere.position.y = -0.6
      hole.update()

      // Simulate falling deep enough
      redSphere.position.y = -11
      vi.advanceTimersByTime(100)
      expect(redSphere.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(0.875, 2)

      // Move hole to blue box location
      hole.moveTo(5, 5)

      // Position blue box below ground to be swallowed
      blueBox.position.y = -0.6
      hole.update()

      // Simulate falling deep enough
      blueBox.position.y = -11
      vi.advanceTimersByTime(100)
      expect(blueBox.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(1.025, 2)

      // Move hole to green sphere location
      hole.moveTo(-3, -3)

      // Position green sphere to be swallowed
      greenSphere.position.y = -0.6
      hole.update()

      // Simulate falling deep enough
      greenSphere.position.y = -11
      vi.advanceTimersByTime(100)
      expect(greenSphere.dispose).toHaveBeenCalled()
      expect(hole.getRadius()).toBeCloseTo(1.325, 2) // 1.025 + (1.0 * 0.3)
    })

    it('should not swallow the same object twice', () => {
      hole = new Hole(scene, 1.0, Vector3.Zero(), mockGame)

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

      // Position sphere below ground to be swallowed
      smallSphere.position.y = -0.6

      // First update - should start swallowing
      hole.update()

      // Second update before disposal - should not swallow again
      hole.update()

      // Simulate falling deep enough
      smallSphere.position.y = -11
      vi.advanceTimersByTime(100)

      // Should only have been disposed once
      expect(smallSphere.dispose).toHaveBeenCalledTimes(1)
    })
  })
})
