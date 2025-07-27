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

    // Create the ground
    this.createGround()

    // Create level objects
    this.createLevelObjects()
  }

  private createGround() {
    const groundSize = this.currentLevel.groundSize

    // Top layer - thin green grass layer
    const topThickness = 1.5
    this.groundTop = MeshBuilder.CreateBox(
      'groundTop',
      { width: groundSize, height: topThickness, depth: groundSize },
      this.scene,
    )
    this.groundTop.position.y = -topThickness / 2

    const topMat = new StandardMaterial('topMat', this.scene)
    topMat.diffuseColor = new Color3(0.4, 0.6, 0.3) // Green grass
    this.groundTop.material = topMat
    this.groundTop.isPickable = true

    // Bottom layer - thick dark earth layer
    const bottomThickness = 23.5
    this.groundBottom = MeshBuilder.CreateBox(
      'groundBottom',
      { width: groundSize, height: bottomThickness, depth: groundSize },
      this.scene,
    )
    this.groundBottom.position.y = -topThickness - bottomThickness / 2

    const bottomMat = new StandardMaterial('bottomMat', this.scene)
    bottomMat.diffuseColor = new Color3(0.05, 0.04, 0.03) // Very dark earth
    bottomMat.specularColor = new Color3(0, 0, 0)
    this.groundBottom.material = bottomMat
    this.groundBottom.isPickable = true
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

    // Add physics to both ground layers
    if (!this.groundTop || !this.groundBottom) {
      throw new Error('Ground layers not initialized')
    }

    const topAggregate = new PhysicsAggregate(
      this.groundTop,
      PhysicsShapeType.BOX,
      { mass: 0 },
      this.scene,
    )
    this.groundTop.metadata = { physicsAggregate: topAggregate }
    console.log('Physics added to ground top layer')

    const bottomAggregate = new PhysicsAggregate(
      this.groundBottom,
      PhysicsShapeType.BOX,
      { mass: 0 },
      this.scene,
    )
    this.groundBottom.metadata = { physicsAggregate: bottomAggregate }
    console.log('Physics added to ground bottom layer')

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

  private groundTop: Mesh | null = null
  private groundBottom: Mesh | null = null
  private originalGroundTop: Mesh | null = null
  private originalGroundBottom: Mesh | null = null

  private lastHolePosition: Vector3 | null = null
  private lastHoleRadius: number = 0
  private isUpdatingHole: boolean = false

  cutHoleInGround(position: Vector3, radius: number) {
    // Skip if already updating
    if (this.isUpdatingHole) return

    // Only update if position changed significantly or radius changed
    const minDistance = 0.3 // Increased minimum distance to reduce updates
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
    if (!this.groundTop || !this.groundBottom) {
      throw new Error('Ground layers not initialized - cannot cut hole')
    }

    // Store originals on first cut
    if (!this.originalGroundTop) {
      this.originalGroundTop = this.groundTop.clone('originalGroundTop')
      this.originalGroundTop.setEnabled(false)
    }
    if (!this.originalGroundBottom) {
      this.originalGroundBottom = this.groundBottom.clone('originalGroundBottom')
      this.originalGroundBottom.setEnabled(false)
    }

    // Create cylinder to subtract - make it very deep
    const holeDepth = 20 // Much deeper so bottom is never visible
    const holeCylinder = MeshBuilder.CreateCylinder(
      'holeCutter',
      {
        diameter: radius * 2,
        height: holeDepth,
        tessellation: 32,
      },
      this.scene,
    )

    // Position cylinder to cut through both layers
    holeCylinder.position.x = position.x
    holeCylinder.position.z = position.z
    holeCylinder.position.y = -holeDepth / 2 + 0.01 // Slightly above ground top

    // Store materials and physics
    const topMaterial = this.groundTop.material
    const bottomMaterial = this.groundBottom.material
    const oldTopPhysics = this.groundTop.metadata?.physicsAggregate as PhysicsAggregate
    const oldBottomPhysics = this.groundBottom.metadata?.physicsAggregate as PhysicsAggregate

    // Dispose old physics
    if (oldTopPhysics) oldTopPhysics.dispose()
    if (oldBottomPhysics) oldBottomPhysics.dispose()

    // Create fresh copies from originals
    const freshTop = this.originalGroundTop.clone('tempTop')
    freshTop.setEnabled(true)
    freshTop.material = topMaterial

    const freshBottom = this.originalGroundBottom.clone('tempBottom')
    freshBottom.setEnabled(true)
    freshBottom.material = bottomMaterial

    // Cut hole in both layers
    const holeCSG = CSG.FromMesh(holeCylinder)

    // Top layer
    const topCSG = CSG.FromMesh(freshTop)
    const newTopCSG = topCSG.subtract(holeCSG)
    const newTop = newTopCSG.toMesh('groundTop', topMaterial, this.scene)
    newTop.position = this.groundTop.position.clone()

    // Bottom layer
    const bottomCSG = CSG.FromMesh(freshBottom)
    const newBottomCSG = bottomCSG.subtract(holeCSG)
    const newBottom = newBottomCSG.toMesh('groundBottom', bottomMaterial, this.scene)
    newBottom.position = this.groundBottom.position.clone()

    // Dispose old meshes
    this.groundTop.dispose()
    this.groundBottom.dispose()
    freshTop.dispose()
    freshBottom.dispose()
    holeCylinder.dispose()

    // Update references
    this.groundTop = newTop
    this.groundBottom = newBottom

    // Reapply physics if needed
    if (this.physicsInitialized) {
      // Top layer physics
      const newTopAggregate = new PhysicsAggregate(
        this.groundTop,
        PhysicsShapeType.MESH,
        { mass: 0 },
        this.scene,
      )
      this.groundTop.metadata = { physicsAggregate: newTopAggregate }

      // Bottom layer physics
      const newBottomAggregate = new PhysicsAggregate(
        this.groundBottom,
        PhysicsShapeType.MESH,
        { mass: 0 },
        this.scene,
      )
      this.groundBottom.metadata = { physicsAggregate: newBottomAggregate }
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
