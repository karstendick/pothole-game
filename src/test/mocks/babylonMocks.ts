import { vi } from 'vitest'

export const createMockScene = () => ({
  meshes: [],
  registerBeforeRender: vi.fn(),
  registerAfterRender: vi.fn(),
  unregisterBeforeRender: vi.fn(),
  unregisterAfterRender: vi.fn(),
  getUniqueId: vi.fn(() => Math.random()),
  _blockEntityCollection: false,
  defaultMaterial: {
    wireframe: false,
  },
  addMesh: vi.fn(),
})

export const createMockMesh = (name: string, position = { x: 0, y: 0, z: 0 }) => {
  let disposed = false
  const mesh = {
    id: name,
    name,
    position: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
    scaling: { x: 1, y: 1, z: 1 },
    metadata: {
      levelObjectId: name, // Add levelObjectId metadata so the mesh is recognized as swallowable
    },
    dispose: vi.fn(() => {
      disposed = true
    }),
    isDisposed: vi.fn(() => disposed),
    getBoundingInfo: vi.fn(() => ({
      maximum: {
        x: position.x + 1,
        y: position.y + 1,
        z: position.z + 1,
        subtract: vi.fn(() => ({
          x: 2,
          y: 2,
          z: 2,
        })),
      },
      minimum: { x: position.x - 1, y: position.y - 1, z: position.z - 1 },
    })),
  }
  return mesh
}
