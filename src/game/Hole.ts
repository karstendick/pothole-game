import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  AbstractMesh,
  DynamicTexture,
} from '@babylonjs/core'
import { Mesh as MeshConstants } from '@babylonjs/core/Meshes/mesh'
import {
  canSwallow as canSwallowLogic,
  calculateGrowth as calculateGrowthLogic,
} from './swallowLogic'

export class Hole {
  private holeMesh: Mesh
  private radius: number
  private position: Vector3
  private growthRate: number = 0.3 // How much the radius grows per swallow
  private swallowingMeshes: Set<string> = new Set() // Track meshes being swallowed
  private game?: { cutHoleInGround: (position: Vector3, radius: number) => void } // Reference to Game instance for CSG operations

  constructor(
    private scene: Scene,
    initialRadius: number = 0.8,
    initialPosition: Vector3 = Vector3.Zero(),
    game?: { cutHoleInGround: (position: Vector3, radius: number) => void },
  ) {
    this.radius = initialRadius
    this.position = initialPosition.clone()
    this.game = game
    this.holeMesh = this.createHoleMesh()

    // Cut initial hole in ground if game reference provided
    if (this.game) {
      this.game.cutHoleInGround(this.position, this.radius)
    }
  }

  private createHoleMesh(): Mesh {
    // Create a parent mesh to group hole components
    const holeParent = new Mesh('holeParent', this.scene)

    // Create a cylinder that sits inside the hole to show depth
    // This is purely visual - the actual hole is cut from the ground
    const depth = 3.8 // Slightly less than hole depth to avoid z-fighting
    const cylinder = MeshBuilder.CreateCylinder(
      'holeCylinder',
      {
        diameter: this.radius * 2 - 0.05, // Slightly smaller than hole
        height: depth,
        tessellation: 32,
        cap: MeshConstants.NO_CAP, // No caps so we can see inside
      },
      this.scene,
    )

    // Position cylinder so top is just below ground level
    cylinder.position.y = -depth / 2 - 0.1

    // Create a red and white checkerboard texture for the inside
    const textureSize = 256
    const checkerTexture = new DynamicTexture('checkerTexture', textureSize, this.scene)
    const context = checkerTexture.getContext()

    // Draw red and white checkerboard pattern
    const squareSize = 32
    for (let i = 0; i < textureSize / squareSize; i++) {
      for (let j = 0; j < textureSize / squareSize; j++) {
        context.fillStyle = (i + j) % 2 === 0 ? '#FFFFFF' : '#FF0000'
        context.fillRect(i * squareSize, j * squareSize, squareSize, squareSize)
      }
    }
    checkerTexture.update()

    // Create material with the checkerboard texture
    const holeMat = new StandardMaterial('holeMat', this.scene)
    holeMat.diffuseTexture = checkerTexture
    holeMat.specularColor = new Color3(0, 0, 0)
    holeMat.emissiveColor = new Color3(0.1, 0.1, 0.1) // Slight glow
    holeMat.backFaceCulling = false // See inside of cylinder

    cylinder.material = holeMat
    cylinder.parent = holeParent

    // Make the hole not pickable so we can click through it
    holeParent.isPickable = false

    return holeParent
  }

  moveTo(x: number, z: number) {
    this.position.x = x
    this.position.z = z
    this.holeMesh.position.x = x
    this.holeMesh.position.z = z

    // Re-cut hole at new position if game reference provided
    // The cutHoleInGround method is debounced, so it won't cut every frame
    if (this.game) {
      this.game.cutHoleInGround(this.position, this.radius)
    }
  }

  getPosition(): Vector3 {
    return this.position.clone()
  }

  getRadius(): number {
    return this.radius
  }

  getHoleMesh(): Mesh {
    return this.holeMesh
  }

  canSwallow(objectRadius: number, distanceToObject: number): boolean {
    return canSwallowLogic(this.radius, objectRadius, distanceToObject)
  }

  calculateGrowth(objectRadius: number): number {
    return calculateGrowthLogic(objectRadius, this.growthRate)
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
      // Debug logging - only when close to being able to swallow
      if (mesh.name === 'sphere2' && this.radius > 0.9 && this.radius < 1.1) {
        console.log(
          `Green sphere: need hole radius > ${meshRadius.toFixed(2)}, current=${this.radius.toFixed(2)}`,
        )
      }

      // Check if object is over the hole and can be swallowed
      if (this.canSwallow(meshRadius, distance)) {
        // Additional check: is the object actually over the hole opening?
        const horizontalDistance = Math.sqrt(
          Math.pow(mesh.position.x - this.position.x, 2) +
            Math.pow(mesh.position.z - this.position.z, 2),
        )

        // Object must be within the hole radius and close to ground level
        if (horizontalDistance < this.radius && mesh.position.y < 1) {
          // Only swallow if not already being swallowed
          if (!this.swallowingMeshes.has(mesh.id)) {
            this.swallowingMeshes.add(mesh.id)
            this.swallowObject(mesh)
          }
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
    const growAmount = this.calculateGrowth(meshRadius)

    console.log(
      `Swallowing ${mesh.name}: radius=${meshRadius.toFixed(2)}, growth=${growAmount.toFixed(3)}`,
    )

    // Don't mess with physics - the hole in the ground will handle falling
    // Just monitor the object's fall and dispose when deep enough
    const checkFall = () => {
      if (mesh.position.y < -5) {
        // Fallen deep enough
        mesh.dispose()
        this.swallowingMeshes.delete(mesh.id)
        this.grow(growAmount)
      } else if (!mesh.isDisposed()) {
        setTimeout(checkFall, 100)
      }
    }

    checkFall()
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

    // Re-cut hole with new radius if game reference provided
    if (this.game) {
      this.game.cutHoleInGround(this.position, this.radius)
    }
  }
}
