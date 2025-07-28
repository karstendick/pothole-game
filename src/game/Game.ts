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
import { DebugOverlay } from './DebugOverlay'
import { initializePhysics } from './physics'
import { LevelManager } from './LevelManager'
import { GameCompleteUI } from './GameCompleteUI'

export class Game {
  private engine: Engine
  public scene: Scene // Made public for testing
  public hole: Hole // Made public for testing
  private levelManager: LevelManager
  private debugOverlay: DebugOverlay
  private gameCompleteUI: GameCompleteUI
  private physicsInitialized: boolean = false

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true)
    this.scene = new Scene(this.engine)

    // Initialize game without physics first
    this.setupScene()

    // Create hole with default size (will be updated by level)
    this.hole = new Hole(this.scene, 0.8, Vector3.Zero(), this)

    // Create level manager
    this.levelManager = new LevelManager(
      this.scene,
      this.hole,
      () => this.onVictory(),
      () => this.onGameComplete(),
    )

    // Connect hole callback to level manager
    this.hole.setOnObjectSwallowed((mesh) => this.levelManager.onObjectSwallowed(mesh))

    // Create game complete UI
    this.gameCompleteUI = new GameCompleteUI(this.scene, () => this.onRestartGame())

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

      // Add physics to ground
      this.addPhysicsToGround()

      // Load the first level
      this.levelManager.loadCurrentLevel()
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

    // Create the ground (size will be updated by level)
    this.createGround(20) // Default size
  }

  private calculateOptimalTopLayerThickness(groundSize: number, cameraPos: Vector3): number {
    // Consider two critical cases:
    // 1. Hole at far edge (top of screen) - we look at the near edge of hole
    // 2. Hole at near edge (bottom of screen) - we look at the far edge of hole

    const typicalHoleRadius = 1.0 // A reasonable hole size to optimize for

    // Case 1: Hole far from camera (z = groundSize/2)
    // We're looking at the near edge of the hole
    const farHoleNearEdge = groundSize / 2 - typicalHoleRadius
    const farDist = Math.sqrt(Math.pow(cameraPos.x, 2) + Math.pow(farHoleNearEdge - cameraPos.z, 2))
    const farAngle = Math.atan(cameraPos.y / farDist)
    const farVisibleDepth = typicalHoleRadius * Math.tan(farAngle)

    // Case 2: Hole near camera (z = -groundSize/2)
    // We're looking at the far edge of the hole
    const nearHoleFarEdge = -groundSize / 2 + typicalHoleRadius
    const nearDist = Math.sqrt(
      Math.pow(cameraPos.x, 2) + Math.pow(nearHoleFarEdge - cameraPos.z, 2),
    )
    const nearAngle = Math.atan(cameraPos.y / nearDist)
    const nearVisibleDepth = typicalHoleRadius * Math.tan(nearAngle)

    // Use the minimum of the two cases to ensure visibility everywhere
    const minVisibleDepth = Math.min(farVisibleDepth, nearVisibleDepth)

    // Set thickness to 60% of minimum visible depth for good contrast
    const topThickness = minVisibleDepth * 0.6

    console.log(
      `Far hole visible depth: ${farVisibleDepth.toFixed(2)} units at ${((farAngle * 180) / Math.PI).toFixed(1)}°`,
    )
    console.log(
      `Near hole visible depth: ${nearVisibleDepth.toFixed(2)} units at ${((nearAngle * 180) / Math.PI).toFixed(1)}°`,
    )
    console.log(`Minimum visible depth: ${minVisibleDepth.toFixed(2)} units`)
    console.log(`Top layer thickness: ${topThickness.toFixed(2)} units`)

    return topThickness
  }

  private createGround(groundSize: number = 20) {
    // Camera is at (0, 15, -8) looking at origin
    // We want to ALWAYS see both layers when looking into a hole
    const cameraPos = new Vector3(0, 15, -8)

    // Calculate optimal thickness to ensure hole interior is always visible
    const topThickness = this.calculateOptimalTopLayerThickness(groundSize, cameraPos)
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

  private addPhysicsToGround() {
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

    const bottomAggregate = new PhysicsAggregate(
      this.groundBottom,
      PhysicsShapeType.BOX,
      { mass: 0 },
      this.scene,
    )
    this.groundBottom.metadata = { physicsAggregate: bottomAggregate }
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

  private onVictory() {
    console.log('Level complete!')
    // TODO: Add celebration animation
    // For now, just show a message
    const currentLevel = this.levelManager.getCurrentLevel()
    if (currentLevel) {
      console.log(`Completed: ${currentLevel.name}`)
    }
  }

  private onGameComplete() {
    console.log('All levels completed! Showing game complete screen.')
    this.gameCompleteUI.show()
  }

  private onRestartGame() {
    console.log('Restarting game...')
    this.levelManager.resetProgress()
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
