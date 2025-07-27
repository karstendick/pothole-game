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
  private radius: number = 0.8
  private initialRadius: number = 0.8
  private position: Vector3 = Vector3.Zero()
  private growthRate: number = 0.02 // How much the radius grows per swallow

  constructor(private scene: Scene) {
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

  update() {
    // Check for objects that should be swallowed
    const meshes = this.scene.meshes.filter(
      (mesh) =>
        (mesh.name !== 'hole' && mesh.name !== 'ground' && mesh.name.startsWith('sphere')) ||
        mesh.name.startsWith('box'),
    )

    meshes.forEach((mesh) => {
      const distance = Vector3.Distance(mesh.position, this.position)
      const meshRadius = this.getMeshRadius(mesh)

      // If object is close enough and small enough, swallow it
      if (distance < this.radius && meshRadius < this.radius * 0.8) {
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
    // Simple swallow animation - shrink and disappear
    const animationFrames = 20
    let frame = 0

    const shrinkAnimation = () => {
      frame++
      const scale = 1 - frame / animationFrames
      mesh.scaling = new Vector3(scale, scale, scale)

      if (frame >= animationFrames) {
        mesh.dispose()
        // Grow the hole based on the size of the object swallowed
        const meshRadius = this.getMeshRadius(mesh)
        const growAmount = meshRadius * this.growthRate
        this.grow(growAmount)
      } else {
        setTimeout(shrinkAnimation, 16)
      }
    }

    shrinkAnimation()
  }

  private grow(amount: number) {
    this.radius += amount
    // Update disc to new size - recreate it to ensure it stays circular
    this.holeMesh.dispose()
    this.holeMesh = this.createHoleMesh()
  }
}
