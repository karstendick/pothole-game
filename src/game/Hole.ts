import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  AbstractMesh,
} from '@babylonjs/core'

export class Hole {
  private holeMesh: Mesh
  private radius: number
  private position: Vector3
  private growthRate: number = 0.3 // How much the radius grows per swallow
  private swallowingMeshes: Set<string> = new Set() // Track meshes being swallowed

  constructor(
    private scene: Scene,
    initialRadius: number = 0.8,
    initialPosition: Vector3 = Vector3.Zero(),
  ) {
    this.radius = initialRadius
    this.position = initialPosition.clone()
    this.holeMesh = this.createHoleMesh()
  }

  private createHoleMesh(): Mesh {
    // For now, create a simple dark disc to represent the hole
    const hole = MeshBuilder.CreateDisc('hole', { radius: this.radius }, this.scene)
    hole.rotation.x = Math.PI / 2
    hole.position.y = 0.01 // Slightly above ground to avoid z-fighting

    const holeMat = new StandardMaterial('holeMat', this.scene)
    holeMat.diffuseColor = new Color3(0.1, 0.1, 0.1)
    holeMat.specularColor = new Color3(0, 0, 0)
    hole.material = holeMat

    return hole
  }

  moveTo(x: number, z: number) {
    this.position.x = x
    this.position.z = z
    this.holeMesh.position.x = x
    this.holeMesh.position.z = z
  }

  getPosition(): Vector3 {
    return this.position.clone()
  }

  getRadius(): number {
    return this.radius
  }

  update() {
    // Check for objects that should be swallowed
    const meshes = this.scene.meshes.filter(
      (mesh) =>
        mesh.name !== 'hole' &&
        mesh.name !== 'ground' &&
        (mesh.name.startsWith('sphere') || mesh.name.startsWith('box')),
    )

    meshes.forEach((mesh) => {
      const distance = Vector3.Distance(mesh.position, this.position)
      const meshRadius = this.getMeshRadius(mesh)

      // If object is close enough and small enough, swallow it
      // Check both center distance and edge distance for better mobile experience
      const edgeDistance = distance - meshRadius

      // Debug logging - only when close to being able to swallow
      if (mesh.name === 'sphere2' && this.radius > 0.9 && this.radius < 1.1) {
        console.log(
          `Green sphere: need hole radius > ${meshRadius.toFixed(2)}, current=${this.radius.toFixed(2)}`,
        )
      }

      if (edgeDistance < this.radius * 0.9 && meshRadius < this.radius) {
        // Only swallow if not already being swallowed
        if (!this.swallowingMeshes.has(mesh.id)) {
          this.swallowingMeshes.add(mesh.id)
          this.swallowObject(mesh)
        }
      }
    })
  }

  private getMeshRadius(mesh: AbstractMesh): number {
    const boundingInfo = mesh.getBoundingInfo()
    const size = boundingInfo.maximum.subtract(boundingInfo.minimum)
    return Math.max(size.x, size.y, size.z) / 2
  }

  private swallowObject(mesh: AbstractMesh) {
    // Calculate growth amount before starting animation
    const meshRadius = this.getMeshRadius(mesh)
    const growAmount = meshRadius * this.growthRate

    console.log(
      `Swallowing ${mesh.name}: radius=${meshRadius.toFixed(2)}, growth=${growAmount.toFixed(3)}`,
    )

    // Simple swallow animation - shrink and disappear
    const animationFrames = 20
    let frame = 0

    const shrinkAnimation = () => {
      frame++
      const scale = 1 - frame / animationFrames
      mesh.scaling = new Vector3(scale, scale, scale)

      if (frame >= animationFrames) {
        mesh.dispose()
        // Remove from tracking set
        this.swallowingMeshes.delete(mesh.id)
        // Grow the hole
        this.grow(growAmount)
      } else {
        setTimeout(shrinkAnimation, 16)
      }
    }

    shrinkAnimation()
  }

  private grow(amount: number) {
    const oldRadius = this.radius
    this.radius += amount
    console.log(
      `Hole growing: ${oldRadius.toFixed(2)} -> ${this.radius.toFixed(2)} (grew by ${amount.toFixed(3)})`,
    )

    // Update disc to new size - recreate it to ensure it stays circular
    const currentX = this.position.x
    const currentZ = this.position.z
    this.holeMesh.dispose()
    this.holeMesh = this.createHoleMesh()
    // Restore the position after recreating
    this.moveTo(currentX, currentZ)
  }
}
