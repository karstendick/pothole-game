import { AbstractMesh } from '@babylonjs/core'

/**
 * Gets all swallowable objects in the scene.
 * Excludes system meshes like the hole, ground layers, disposed objects, and non-level objects.
 */
export function getSwallowableObjects(meshes: AbstractMesh[]): AbstractMesh[] {
  return meshes.filter(
    (mesh) =>
      !mesh.isDisposed() &&
      mesh.name !== 'hole' &&
      !mesh.name.startsWith('ground') && // Excludes groundTop, groundBottom, etc.
      mesh.metadata?.levelObjectId !== undefined, // Has level object metadata
  )
}
