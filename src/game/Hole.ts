import { Scene, Vector3, Mesh, AbstractMesh } from '@babylonjs/core'
import { getSwallowableObjects } from './utils/meshUtils'

export class Hole {
  private holeMesh: Mesh
  private radius: number
  private position: Vector3
  private growthRate: number = 0.3 // How much the radius grows per swallow
  private swallowingMeshes: Set<string> = new Set() // Track meshes being swallowed
  private game: { cutHoleInGround: (position: Vector3, radius: number) => void } // Reference to Game instance for CSG operations
  private onObjectSwallowed?: (mesh: AbstractMesh) => void // Callback for when object is swallowed

  constructor(
    private scene: Scene,
    initialRadius: number = 0.8,
    initialPosition: Vector3 = Vector3.Zero(),
    game: { cutHoleInGround: (position: Vector3, radius: number) => void },
  ) {
    if (!game) {
      throw new Error('Game reference is required for Hole to function')
    }

    this.radius = initialRadius
    this.position = initialPosition.clone()
    this.game = game
    this.holeMesh = this.createHoleMesh()

    // Cut initial hole in ground
    this.game.cutHoleInGround(this.position, this.radius)
  }

  private createHoleMesh(): Mesh {
    // Create a parent mesh to serve as a position marker
    const holeParent = new Mesh('holeParent', this.scene)

    // Make the hole not pickable so we can click through it
    holeParent.isPickable = false

    return holeParent
  }

  moveTo(x: number, z: number) {
    this.position.x = x
    this.position.z = z
    this.holeMesh.position.x = x
    this.holeMesh.position.z = z

    // Re-cut hole at new position
    // The cutHoleInGround method is debounced, so it won't cut every frame
    this.game.cutHoleInGround(this.position, this.radius)
  }

  getPosition(): Vector3 {
    return this.position.clone()
  }

  getRadius(): number {
    return this.radius
  }

  setRadius(radius: number) {
    this.radius = radius
    // Re-cut hole with new radius
    this.game.cutHoleInGround(this.position, this.radius)
  }

  getHoleMesh(): Mesh {
    return this.holeMesh
  }

  setOnObjectSwallowed(callback: (mesh: AbstractMesh) => void) {
    this.onObjectSwallowed = callback
  }

  calculateGrowth(objectRadius: number): number {
    return objectRadius * this.growthRate
  }

  update() {
    // Check for objects that should be swallowed
    const meshes = getSwallowableObjects(this.scene.meshes)

    meshes.forEach((mesh) => {
      // Simple check: is the object below ground level?
      if (mesh.position.y < -0.5 && !this.swallowingMeshes.has(mesh.id)) {
        this.swallowingMeshes.add(mesh.id)
        this.swallowObject(mesh)
      }
    })
  }

  private getMeshRadius(mesh: AbstractMesh): number {
    const boundingInfo = mesh.getBoundingInfo()
    const size = boundingInfo.maximum.subtract(boundingInfo.minimum)
    return Math.max(size.x, size.y, size.z) / 2
  }

  private swallowObject(mesh: AbstractMesh) {
    // Calculate growth amount based on object size
    const meshRadius = this.getMeshRadius(mesh)
    const growAmount = this.calculateGrowth(meshRadius)

    console.log(
      `Swallowing ${mesh.name}: radius=${meshRadius.toFixed(2)}, growth=${growAmount.toFixed(3)}`,
    )

    // Check periodically if object is out of camera view
    const checkVisibility = () => {
      // Check if already disposed or removed from swallowing set
      if (!mesh.isDisposed() && this.swallowingMeshes.has(mesh.id)) {
        console.log(`Checking ${mesh.name} at y=${mesh.position.y.toFixed(2)}`)

        // Dispose if deep enough (ignore camera frustum check)
        if (mesh.position.y < -5) {
          console.log(`Disposing ${mesh.name} at depth ${mesh.position.y}`)

          // Notify callback BEFORE disposing (so metadata is still available)
          this.onObjectSwallowed?.(mesh)

          mesh.dispose()
          this.swallowingMeshes.delete(mesh.id)
          this.grow(growAmount)
        } else {
          // Still falling, check again later
          setTimeout(checkVisibility, 100)
        }
      }
    }

    checkVisibility()
  }

  grow(amount: number) {
    const oldRadius = this.radius
    this.radius += amount
    console.log(
      `Hole growing: ${oldRadius.toFixed(2)} -> ${this.radius.toFixed(2)} (grew by ${amount.toFixed(3)})`,
    )

    // Update cylinder to new size - recreate it
    const currentX = this.position.x
    const currentZ = this.position.z
    this.holeMesh.dispose()
    this.holeMesh = this.createHoleMesh()
    // Restore the position after recreating
    this.holeMesh.position.x = currentX
    this.holeMesh.position.z = currentZ

    // Re-cut hole with new radius
    this.game.cutHoleInGround(this.position, this.radius)
  }
}
