import { describe, it, expect, vi } from 'vitest'
import { Scene, Vector3 } from '@babylonjs/core'
import { Hole } from './Hole'

// Mock BabylonJS
vi.mock('@babylonjs/core', () => ({
  Scene: vi.fn(),
  Vector3: {
    Zero: () => ({ x: 0, y: 0, z: 0, clone: vi.fn() }),
  },
  Mesh: vi.fn(),
}))

describe('Hole Growth Logic', () => {
  describe('calculateGrowth', () => {
    it('should calculate growth proportional to object size', () => {
      const mockScene = {} as Scene
      const mockGame = { cutHoleInGround: vi.fn() }
      const hole = new Hole(mockScene, 0.8, Vector3.Zero(), mockGame)

      const testCases = [
        { objectRadius: 0.25, expectedGrowth: 0.075 }, // Small sphere
        { objectRadius: 0.5, expectedGrowth: 0.15 }, // Medium box
        { objectRadius: 1.0, expectedGrowth: 0.3 }, // Large sphere
      ]

      testCases.forEach(({ objectRadius, expectedGrowth }) => {
        const growth = hole.calculateGrowth(objectRadius)
        expect(growth).toBeCloseTo(expectedGrowth)
      })
    })
  })
})
