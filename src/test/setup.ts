import { vi } from 'vitest'

// Setup file for tests
// Mock BabylonJS elements that require WebGL
globalThis.WebGLRenderingContext = vi.fn() as any
globalThis.WebGL2RenderingContext = vi.fn() as any

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  canvas: {},
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
})) as any
