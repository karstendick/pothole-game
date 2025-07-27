import { Scene, Vector3 } from '@babylonjs/core'
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui'
import { Hole } from './Hole'

export class DebugOverlay {
  private enabled: boolean = false
  private gui: AdvancedDynamicTexture
  private debugPanel: Rectangle
  private debugText: TextBlock
  private objectLabels: Map<string, Rectangle> = new Map()

  constructor(private scene: Scene) {
    // Create fullscreen UI
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('debugUI', true, this.scene)

    // Create debug panel in top-left corner
    this.debugPanel = new Rectangle('debugPanel')
    this.debugPanel.width = '300px'
    this.debugPanel.height = '150px'
    this.debugPanel.cornerRadius = 5
    this.debugPanel.color = 'white'
    this.debugPanel.thickness = 2
    this.debugPanel.background = 'rgba(0, 0, 0, 0.7)'
    this.debugPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    this.debugPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    this.debugPanel.left = 10
    this.debugPanel.top = 10
    this.debugPanel.isVisible = false
    this.gui.addControl(this.debugPanel)

    // Create text block for debug info
    this.debugText = new TextBlock('debugText')
    this.debugText.text = 'Debug Info'
    this.debugText.color = 'white'
    this.debugText.fontSize = 14
    this.debugText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    this.debugText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    this.debugText.left = 10
    this.debugText.top = 10
    this.debugPanel.addControl(this.debugText)

    // Listen for 'D' key to toggle debug mode
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.toggle()
      }
    })
  }

  toggle() {
    this.enabled = !this.enabled
    this.debugPanel.isVisible = this.enabled

    if (!this.enabled) {
      // Hide all object labels
      this.objectLabels.forEach((label) => {
        this.gui.removeControl(label)
      })
      this.objectLabels.clear()
    }

    console.log(`Debug mode: ${this.enabled ? 'ON' : 'OFF'}`)
  }

  update(hole: Hole) {
    if (!this.enabled) return

    // Update main debug text
    const holeRadius = hole.getRadius()
    const holePos = hole.getPosition()

    // Get swallowable objects from scene
    const meshes = this.scene.meshes.filter(
      (mesh) =>
        mesh.name !== 'hole' &&
        mesh.name !== 'ground' &&
        (mesh.name.startsWith('sphere') || mesh.name.startsWith('box')),
    )

    const debugInfo = [
      `Hole Radius: ${holeRadius.toFixed(3)}`,
      `Hole Position: (${holePos.x.toFixed(1)}, ${holePos.z.toFixed(1)})`,
      `Objects in scene: ${meshes.length}`,
      '',
      'Press D to toggle debug mode',
    ].join('\n')

    this.debugText.text = debugInfo

    // Update object labels
    meshes.forEach((mesh) => {
      const meshPosition = mesh.position

      // Project 3D position to 2D screen coordinates
      const engine = this.scene.getEngine()
      const camera = this.scene.activeCamera!

      // Get the mesh's world matrix
      const meshWorldMatrix = mesh.getWorldMatrix()

      // Project the mesh position to screen coordinates
      const coordinates = Vector3.Project(
        meshPosition,
        meshWorldMatrix,
        this.scene.getTransformMatrix(),
        camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
      )

      // Create or update label for this object
      let label = this.objectLabels.get(mesh.id)
      if (!label) {
        label = new Rectangle(`label_${mesh.id}`)
        label.width = '120px'
        label.height = '60px'
        label.cornerRadius = 3
        label.color = 'white'
        label.thickness = 1
        label.background = 'rgba(0, 0, 0, 0.7)'
        this.gui.addControl(label)
        this.objectLabels.set(mesh.id, label)

        const text = new TextBlock()
        text.color = 'white'
        text.fontSize = 12
        label.addControl(text)
      }

      // Convert from pixel coordinates to GUI coordinates
      // BabylonJS GUI uses a different coordinate system
      const guiSize = this.gui.getSize()
      const x = (coordinates.x / engine.getRenderWidth()) * guiSize.width - guiSize.width / 2
      const y = (coordinates.y / engine.getRenderHeight()) * guiSize.height - guiSize.height / 2

      // Position label above object
      label.left = x
      label.top = y - 40 // Offset above the object

      // Calculate mesh radius
      const boundingInfo = mesh.getBoundingInfo()
      const size = boundingInfo.maximum.subtract(boundingInfo.minimum)
      const meshRadius = Math.max(size.x, size.y, size.z) / 2

      // Update label text
      const textBlock = label.children[0] as TextBlock
      const distance = meshPosition.subtract(holePos).length()
      const canSwallow = hole.canSwallow(meshRadius, distance)

      textBlock.text = [
        `${mesh.name}`,
        `Size: ${meshRadius.toFixed(2)}`,
        `Can swallow: ${canSwallow ? 'YES' : 'NO'}`,
      ].join('\n')

      // Color based on swallowable state
      label.background = canSwallow ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'
    })

    // Remove labels for objects that no longer exist
    const currentMeshIds = new Set(meshes.map((mesh) => mesh.id))
    for (const [meshId, label] of this.objectLabels) {
      if (!currentMeshIds.has(meshId)) {
        this.gui.removeControl(label)
        this.objectLabels.delete(meshId)
      }
    }
  }

  dispose() {
    this.gui.dispose()
  }
}
