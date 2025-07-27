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
    // Camera
    const camera = new UniversalCamera('camera', new Vector3(0, 10, -10), this.scene)
    camera.setTarget(Vector3.Zero())
    camera.attachControl(this.canvas, true)

    // Lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene)
    light.intensity = 0.7

    // Ground
    const ground = MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, this.scene)
    const groundMat = new StandardMaterial('groundMat', this.scene)
    groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3)
    ground.material = groundMat

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
    // Mouse/touch controls for hole movement
    let isPointerDown = false

    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case 1: // POINTERDOWN
          isPointerDown = true
          break
        case 2: // POINTERUP
          isPointerDown = false
          break
        case 4: // POINTERMOVE
          if (isPointerDown && pointerInfo.pickInfo?.pickedPoint) {
            this.hole.moveTo(pointerInfo.pickInfo.pickedPoint.x, pointerInfo.pickInfo.pickedPoint.z)
          }
          break
      }
    })
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
