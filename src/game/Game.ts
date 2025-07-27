import {
  Engine,
  Scene,
  HemisphericLight,
  Vector3,
  UniversalCamera,
  Color3,
  MeshBuilder,
  StandardMaterial,
  PhysicsAggregate,
  PhysicsShapeType,
  Mesh,
} from '@babylonjs/core'
import { CSG } from '@babylonjs/core/Meshes/csg'
import { Hole } from './Hole'
import { Level } from './types'
import { testLevel } from '../levels/testLevel'
import { DebugOverlay } from './DebugOverlay'
import { initializePhysics } from './physics'

export class Game {
  private engine: Engine
  public scene: Scene // Made public for testing
  public hole: Hole // Made public for testing
  private currentLevel: Level
  private debugOverlay: DebugOverlay
  private physicsInitialized: boolean = false
  private physicsAggregates: Map<string, PhysicsAggregate> = new Map()

  constructor(
    private canvas: HTMLCanvasElement,
    level: Level = testLevel,
  ) {
    this.engine = new Engine(canvas, true)
    this.scene = new Scene(this.engine)
    this.currentLevel = level

    // Initialize game without physics first
    this.setupScene()
    this.hole = new Hole(this.scene, level.holeStartRadius, level.holeStartPosition, this)
    this.setupControls()
    this.debugOverlay = new DebugOverlay(this.scene)

    // Initialize physics asynchronously after scene is ready
    this.scene.executeWhenReady(() => {
      this.initPhysics()
    })
  }

  private async initPhysics() {
    try {
      console.log('Initializing physics...')
      const havokPlugin = await initializePhysics()
      this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin)
      this.physicsInitialized = true
      console.log('Physics initialized successfully')

      // Add physics to existing objects
      this.addPhysicsToScene()
    } catch (error) {
      console.error('Failed to initialize physics:', error)
    }
  }

  private setupScene() {
    // Camera - Fixed position, no user control (more angled like Donut County)
    const camera = new UniversalCamera('camera', new Vector3(0, 15, -8), this.scene)
    camera.setTarget(Vector3.Zero())
    // Don't attach controls - camera should be fixed

    // Lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene)
    light.intensity = 0.7

    // Ground - Create as a box with thickness for CSG operations
    const groundSize = this.currentLevel.groundSize
    const groundThickness = 2 // Give ground some depth
    const ground = MeshBuilder.CreateBox(
      'ground',
      { width: groundSize, height: groundThickness, depth: groundSize },
      this.scene,
    )
    // Position ground so top surface is at y=0
    ground.position.y = -groundThickness / 2

    const groundMat = new StandardMaterial('groundMat', this.scene)
    groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3)
    ground.material = groundMat
    ground.isPickable = true

    // Create level objects
    this.createLevelObjects()
  }

  private createLevelObjects() {
    const objects = this.currentLevel.objects

    objects.forEach((obj, index) => {
      let mesh

      if (obj.type === 'sphere') {
        mesh = MeshBuilder.CreateSphere(obj.name, { diameter: obj.size }, this.scene)
      } else {
        mesh = MeshBuilder.CreateBox(obj.name, { size: obj.size }, this.scene)
      }

      mesh.position = obj.position.clone()

      const mat = new StandardMaterial(`mat${index}`, this.scene)
      mat.diffuseColor = obj.color
      mesh.material = mat

      // Store object type for physics setup
      mesh.metadata = { type: obj.type, size: obj.size }
    })
  }

  private addPhysicsToScene() {
    console.log('Adding physics to scene objects...')

    // Add physics to ground
    const ground = this.scene.getMeshByName('ground')
    if (ground) {
      const groundAggregate = new PhysicsAggregate(
        ground,
        PhysicsShapeType.BOX,
        { mass: 0 },
        this.scene,
      )
      ground.metadata = { physicsAggregate: groundAggregate }
      console.log('Physics added to ground')
    }

    // Add physics to all game objects
    let objectCount = 0
    this.scene.meshes.forEach((mesh) => {
      if (mesh.name.startsWith('sphere') || mesh.name.startsWith('box')) {
        const shapeType =
          mesh.metadata?.type === 'sphere' ? PhysicsShapeType.SPHERE : PhysicsShapeType.BOX

        // Add physics with mass based on size
        const mass = mesh.metadata?.size || 1
        const aggregate = new PhysicsAggregate(
          mesh,
          shapeType,
          {
            mass: mass,
            friction: 0.5,
            restitution: 0.3,
          },
          this.scene,
        )

        // Store the aggregate on the mesh for easy access
        mesh.metadata = { ...mesh.metadata, physicsAggregate: aggregate }

        objectCount++
        console.log(`Physics added to ${mesh.name} (mass: ${mass})`)
      }
    })
    console.log(`Physics added to ${objectCount} objects`)
  }

  private setupControls() {
    // Mouse/touch controls for hole movement - drag anywhere to move
    let isPointerDown = false
    let lastPointerX = 0
    let lastPointerY = 0

    this.canvas.addEventListener('pointerdown', (evt) => {
      isPointerDown = true
      lastPointerX = evt.clientX
      lastPointerY = evt.clientY
      evt.preventDefault()
    })

    this.canvas.addEventListener('pointerup', () => {
      isPointerDown = false
    })

    this.canvas.addEventListener('pointermove', (evt) => {
      if (isPointerDown) {
        // Calculate drag delta
        const deltaX = evt.clientX - lastPointerX
        const deltaY = evt.clientY - lastPointerY

        // Convert screen space movement to world space
        // Adjust these multipliers to control sensitivity
        const worldDeltaX = deltaX * 0.02
        const worldDeltaZ = -deltaY * 0.02 // Invert Y for proper up/down movement

        // Move hole relative to its current position
        const currentPos = this.hole.getPosition()
        this.hole.moveTo(currentPos.x + worldDeltaX, currentPos.z + worldDeltaZ)

        lastPointerX = evt.clientX
        lastPointerY = evt.clientY
      }
    })

    // Prevent touch scrolling on mobile
    this.canvas.addEventListener(
      'touchmove',
      (evt) => {
        evt.preventDefault()
      },
      { passive: false },
    )
  }

  getPhysicsAggregate(meshName: string): PhysicsAggregate | undefined {
    return this.physicsAggregates.get(meshName)
  }

  private originalGround: Mesh | null = null

  private lastHolePosition: Vector3 | null = null
  private lastHoleRadius: number = 0
  private isUpdatingHole: boolean = false

  cutHoleInGround(position: Vector3, radius: number) {
    // Skip if already updating
    if (this.isUpdatingHole) return

    // Only update if position changed significantly or radius changed
    const minDistance = 0.1 // Minimum distance to trigger update
    const needsUpdate =
      !this.lastHolePosition ||
      Vector3.Distance(position, this.lastHolePosition) > minDistance ||
      Math.abs(radius - this.lastHoleRadius) > 0.01

    if (needsUpdate) {
      this.isUpdatingHole = true
      this.lastHolePosition = position.clone()
      this.lastHoleRadius = radius

      // Use requestAnimationFrame for smooth updates
      window.requestAnimationFrame(() => {
        this._cutHoleInGroundImmediate(position, radius)
        this.isUpdatingHole = false
      })
    }
  }

  private _cutHoleInGroundImmediate(position: Vector3, radius: number) {
    // Keep original ground mesh for resetting
    if (!this.originalGround) {
      const ground = this.scene.getMeshByName('ground') as Mesh
      if (!ground) return
      this.originalGround = ground.clone('originalGround')
      this.originalGround.setEnabled(false)
    }

    const ground = this.scene.getMeshByName('ground') as Mesh
    if (!ground) return

    // Store and dispose old physics aggregate
    const oldPhysics = ground.metadata?.physicsAggregate as PhysicsAggregate
    if (oldPhysics) {
      oldPhysics.dispose()
    }

    // Create a fresh ground from the original
    const freshGround = this.originalGround.clone('tempGround')
    freshGround.setEnabled(true)

    // Create cylinder to subtract
    const holeDepth = 4
    const holeCylinder = MeshBuilder.CreateCylinder(
      'holeCutter',
      {
        diameter: radius * 2,
        height: holeDepth,
        tessellation: 32,
      },
      this.scene,
    )

    // Position cylinder to cut through ground
    holeCylinder.position.x = position.x
    holeCylinder.position.z = position.z
    holeCylinder.position.y = -holeDepth / 2 + 0.01 // Slightly above ground top

    // Convert meshes to CSG
    const groundCSG = CSG.FromMesh(freshGround)
    const holeCSG = CSG.FromMesh(holeCylinder)

    // Subtract hole from ground
    const newGroundCSG = groundCSG.subtract(holeCSG)

    // Create new ground mesh
    const newGround = newGroundCSG.toMesh('ground', ground.material, this.scene)
    newGround.position = ground.position.clone()

    // Dispose old meshes
    ground.dispose()
    freshGround.dispose()
    holeCylinder.dispose()

    // Reapply physics if needed
    if (this.physicsInitialized) {
      // Use MESH type to properly handle the hole geometry
      const newGroundAggregate = new PhysicsAggregate(
        newGround,
        PhysicsShapeType.MESH,
        { mass: 0 },
        this.scene,
      )
      newGround.metadata = { physicsAggregate: newGroundAggregate }
    }
  }

  start() {
    this.engine.runRenderLoop(() => {
      this.scene.render()
      this.hole.update()
      this.debugOverlay.update(this.hole)
    })

    window.addEventListener('resize', () => {
      this.engine.resize()
    })
  }
}
