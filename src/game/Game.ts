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

export class Game {
  private engine: Engine
  private scene: Scene
  private hole: Hole

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true)
    this.scene = new Scene(this.engine)
    this.hole = new Hole(this.scene)

    this.setupScene()
    this.setupControls()
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
    const ground = MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, this.scene)
    const groundMat = new StandardMaterial('groundMat', this.scene)
    groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3)
    ground.material = groundMat
    ground.isPickable = true // Ensure ground can be picked for hole movement

    // Test objects of different sizes
    this.createTestObjects()
  }

  private createTestObjects() {
    // Small sphere
    const sphere1 = MeshBuilder.CreateSphere('sphere1', { diameter: 0.5 }, this.scene)
    sphere1.position = new Vector3(2, 0.25, 2)
    const mat1 = new StandardMaterial('mat1', this.scene)
    mat1.diffuseColor = new Color3(1, 0, 0)
    sphere1.material = mat1

    // Medium box
    const box1 = MeshBuilder.CreateBox('box1', { size: 1 }, this.scene)
    box1.position = new Vector3(-2, 0.5, 2)
    const mat2 = new StandardMaterial('mat2', this.scene)
    mat2.diffuseColor = new Color3(0, 0, 1)
    box1.material = mat2

    // Large sphere
    const sphere2 = MeshBuilder.CreateSphere('sphere2', { diameter: 2 }, this.scene)
    sphere2.position = new Vector3(0, 1, -3)
    const mat3 = new StandardMaterial('mat3', this.scene)
    mat3.diffuseColor = new Color3(0, 1, 0)
    sphere2.material = mat3
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
    })

    window.addEventListener('resize', () => {
      this.engine.resize()
    })
  }
}
