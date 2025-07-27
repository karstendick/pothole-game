import { describe, it, expect } from 'vitest'
import { canSwallow, calculateGrowth } from './swallowLogic'

describe('Swallow Logic', () => {
  describe('canSwallow', () => {
    it('should allow swallowing when object is smaller and close enough', () => {
      const holeRadius = 1.0
      const objectRadius = 0.8
      const distance = 0.5 // Close to hole

      expect(canSwallow(holeRadius, objectRadius, distance)).toBe(true)
    })

    it('should prevent swallowing when object is too large', () => {
      const holeRadius = 1.0
      const objectRadius = 1.1 // Larger than hole
      const distance = 0.5

      expect(canSwallow(holeRadius, objectRadius, distance)).toBe(false)
    })

    it('should prevent swallowing when object equals hole size', () => {
      const holeRadius = 1.0
      const objectRadius = 1.0 // Same size as hole
      const distance = 0.5

      expect(canSwallow(holeRadius, objectRadius, distance)).toBe(false)
    })

    it('should prevent swallowing when object is too far away', () => {
      const holeRadius = 1.0
      const objectRadius = 0.5
      const distance = 10 // Far from hole

      expect(canSwallow(holeRadius, objectRadius, distance)).toBe(false)
    })
  })

  describe('calculateGrowth', () => {
    it('should calculate growth proportional to object size', () => {
      const growthRate = 0.3

      const testCases = [
        { objectRadius: 0.25, expectedGrowth: 0.075 }, // Small sphere
        { objectRadius: 0.5, expectedGrowth: 0.15 }, // Medium box
        { objectRadius: 1.0, expectedGrowth: 0.3 }, // Large sphere
      ]

      testCases.forEach(({ objectRadius, expectedGrowth }) => {
        const growth = calculateGrowth(objectRadius, growthRate)
        expect(growth).toBeCloseTo(expectedGrowth)
      })
    })
  })
})
