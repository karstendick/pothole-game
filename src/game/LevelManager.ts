import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Mesh,
  AbstractMesh,
  PhysicsAggregate,
  PhysicsShapeType,
} from '@babylonjs/core'
import { LevelConfig, LevelObject } from './levels/types'
import { levels } from './levels'
import { Hole } from './Hole'

export class LevelManager {
  private currentLevelIndex: number = 0
  private currentLevel: LevelConfig | null = null
  private remainingObjects: Set<string> = new Set()
  private requiredObjects: Set<string> = new Set()
  private levelObjects: Map<string, Mesh> = new Map()

  constructor(
    private scene: Scene,
    private hole: Hole,
    private onVictory: () => void,
    private onGameComplete: () => void,
  ) {
    // Load saved progress
    const savedLevel = window.localStorage.getItem('currentLevel')
    if (savedLevel !== null) {
      this.currentLevelIndex = parseInt(savedLevel, 10)
    }
  }

  getCurrentLevel(): LevelConfig | null {
    return this.currentLevel
  }

  loadCurrentLevel() {
    if (this.currentLevelIndex >= levels.length) {
      console.log('All levels completed!')
      this.onGameComplete()
      return
    }

    this.loadLevel(levels[this.currentLevelIndex])
  }

  loadLevel(levelConfig: LevelConfig) {
    // Clear existing level
    this.clearLevel()

    this.currentLevel = levelConfig
    console.log(`Loading level: ${levelConfig.name}`)

    // Reset hole
    this.hole.setRadius(levelConfig.hole.startRadius)
    this.hole.moveTo(levelConfig.hole.startPosition.x, levelConfig.hole.startPosition.z)

    // Set environment
    if (levelConfig.environment.backgroundColor) {
      this.scene.clearColor = levelConfig.environment.backgroundColor.toColor4()
    }

    // Create objects
    levelConfig.objects.forEach((objConfig) => {
      const mesh = this.createObject(objConfig)
      this.levelObjects.set(objConfig.id, mesh)
      this.remainingObjects.add(objConfig.id)

      if (objConfig.isRequired) {
        this.requiredObjects.add(objConfig.id)
      }
    })

    console.log(`Level loaded with ${this.remainingObjects.size} objects`)
  }

  private createObject(config: LevelObject): Mesh {
    let mesh: Mesh

    // Create mesh based on type
    switch (config.type) {
      case 'sphere':
        mesh = MeshBuilder.CreateSphere(
          config.id,
          {
            diameter: (config.radius || config.size || 1) * 2,
          },
          this.scene,
        )
        break

      case 'box':
        if (config.dimensions) {
          mesh = MeshBuilder.CreateBox(
            config.id,
            {
              width: config.dimensions.x,
              height: config.dimensions.y,
              depth: config.dimensions.z,
            },
            this.scene,
          )
        } else {
          mesh = MeshBuilder.CreateBox(
            config.id,
            {
              size: config.size || 1,
            },
            this.scene,
          )
        }
        break

      case 'cylinder':
        mesh = MeshBuilder.CreateCylinder(
          config.id,
          {
            diameter: (config.radius || 0.5) * 2,
            height: config.height || 1,
          },
          this.scene,
        )
        break

      default:
        // Fallback to box
        mesh = MeshBuilder.CreateBox(config.id, { size: 1 }, this.scene)
    }

    // Set position
    mesh.position = config.position.clone()

    // Create material
    const material = new StandardMaterial(`${config.id}_mat`, this.scene)
    material.diffuseColor = config.color
    mesh.material = material

    // Add physics
    const shapeType = config.type === 'sphere' ? PhysicsShapeType.SPHERE : PhysicsShapeType.BOX
    const aggregate = new PhysicsAggregate(
      mesh,
      shapeType,
      {
        mass: config.physics.mass,
        friction: config.physics.friction,
        restitution: config.physics.restitution,
      },
      this.scene,
    )

    // Store metadata
    mesh.metadata = {
      ...mesh.metadata,
      levelObjectId: config.id,
      swallowRadius: config.swallowRadius,
      isRequired: config.isRequired,
      physicsAggregate: aggregate,
    }

    return mesh
  }

  onObjectSwallowed(mesh: AbstractMesh) {
    const objectId = mesh.metadata?.levelObjectId
    if (!objectId || !this.remainingObjects.has(objectId)) {
      return
    }

    console.log(`Object swallowed: ${objectId}`)
    this.remainingObjects.delete(objectId)
    this.levelObjects.delete(objectId)

    // Check victory condition
    this.checkVictoryCondition()
  }

  private checkVictoryCondition() {
    if (!this.currentLevel) return

    const victory = this.currentLevel.victory
    let isVictory = false

    switch (victory.type) {
      case 'all_objects':
        isVictory = this.remainingObjects.size === 0
        break

      case 'target_size':
        isVictory = this.hole.getRadius() >= (victory.targetSize || 999)
        break

      case 'specific_objects':
        // Check if all required objects are gone
        isVictory = victory.requiredObjects?.every((id) => !this.remainingObjects.has(id)) || false
        break
    }

    if (isVictory) {
      this.triggerVictory()
    }
  }

  private triggerVictory() {
    console.log('Victory!')
    // Save progress
    this.currentLevelIndex++
    window.localStorage.setItem('currentLevel', this.currentLevelIndex.toString())

    // Call victory callback
    this.onVictory()

    // Load next level after a delay
    setTimeout(() => {
      if (this.currentLevelIndex < levels.length) {
        this.loadCurrentLevel()
      } else {
        console.log('Game complete! All levels finished!')
        this.onGameComplete()
      }
    }, 2000)
  }

  private clearLevel() {
    // Dispose all level objects
    this.levelObjects.forEach((mesh) => {
      mesh.metadata?.physicsAggregate?.dispose()
      mesh.dispose()
    })

    this.levelObjects.clear()
    this.remainingObjects.clear()
    this.requiredObjects.clear()
  }

  resetProgress() {
    this.currentLevelIndex = 0
    window.localStorage.removeItem('currentLevel')
    this.loadCurrentLevel()
  }

  dispose() {
    this.clearLevel()
  }
}
