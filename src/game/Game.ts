import {
  Engine,
  Scene,
  HemisphericLight,
  Vector3,
  UniversalCamera,
  Color3,
  MeshBuilder,
  StandardMaterial,
} from '@babylonjs/core'
import { Hole } from './Hole'
import { Level } from './types'
import { testLevel } from '../levels/testLevel'
import { DebugOverlay } from './DebugOverlay'

export class Game {
  private engine: Engine
  public scene: Scene // Made public for testing
  public hole: Hole // Made public for testing
  private currentLevel: Level
  private debugOverlay: DebugOverlay

  constructor(
    private canvas: HTMLCanvasElement,
    level: Level = testLevel,
  ) {
    this.engine = new Engine(canvas, true)
    this.scene = new Scene(this.engine)
    this.currentLevel = level
    this.hole = new Hole(this.scene, level.holeStartRadius, level.holeStartPosition)

    this.setupScene()
    this.setupControls()

    // Create debug overlay
    this.debugOverlay = new DebugOverlay(this.scene)
  }

  private setupScene() {
    // Camera - Fixed position, no user control (more angled like Donut County)
    const camera = new UniversalCamera('camera', new Vector3(0, 15, -8), this.scene)
    camera.setTarget(Vector3.Zero())
    // Don't attach controls - camera should be fixed

    // Lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene)
    light.intensity = 0.7

    // Ground
    const groundSize = this.currentLevel.groundSize
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: groundSize, height: groundSize },
      this.scene,
    )
    const groundMat = new StandardMaterial('groundMat', this.scene)
    groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3)
    ground.material = groundMat
    ground.isPickable = true // Ensure ground can be picked for hole movement

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
    })
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
