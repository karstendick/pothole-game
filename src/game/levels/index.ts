import { westPhillySidewalk } from './westPhillySidewalk'
import { clarkParkPlayground } from './clarkParkPlayground'
import { LevelConfig } from './types'

// All levels in order
export const levels: LevelConfig[] = [
  westPhillySidewalk,
  clarkParkPlayground,
  // Future levels will be added here
]

// Export individual levels for testing
export { westPhillySidewalk, clarkParkPlayground }
export * from './types'
