import { Scene, Vector3, Color3, MeshBuilder, StandardMaterial } from '@babylonjs/core'
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui'
import { Hole } from './Hole'

export class DebugOverlay {
  private enabled: boolean = false
  private gui: AdvancedDynamicTexture
  private debugPanel: Rectangle
  private debugText: TextBlock
  private objectLabels: Map<string, Rectangle> = new Map()
  private axisLines: any[] = []

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

    // Create axis indicators
    this.createAxisIndicators()
  }

  private createAxisIndicators() {
    const axisLength = 2
    const origin = Vector3.Zero()

    // X axis - Red
    const xAxis = MeshBuilder.CreateLines(
      'xAxis',
      {
        points: [origin, new Vector3(axisLength, 0, 0)],
      },
      this.scene,
    )
    xAxis.color = new Color3(1, 0, 0) // Red
    xAxis.isPickable = false
    xAxis.isVisible = false
    this.axisLines.push(xAxis)

    // Y axis - Green
    const yAxis = MeshBuilder.CreateLines(
      'yAxis',
      {
        points: [origin, new Vector3(0, axisLength, 0)],
      },
      this.scene,
    )
    yAxis.color = new Color3(0, 1, 0) // Green
    yAxis.isPickable = false
    yAxis.isVisible = false
    this.axisLines.push(yAxis)

    // Z axis - Blue
    const zAxis = MeshBuilder.CreateLines(
      'zAxis',
      {
        points: [origin, new Vector3(0, 0, axisLength)],
      },
      this.scene,
    )
    zAxis.color = new Color3(0, 0, 1) // Blue
    zAxis.isPickable = false
    zAxis.isVisible = false
    this.axisLines.push(zAxis)

    // Create arrow heads for each axis
    const arrowSize = 0.1

    // X arrow (cone pointing right)
    const xArrow = MeshBuilder.CreateCylinder(
      'xArrow',
      {
        diameterTop: 0,
        diameterBottom: arrowSize,
        height: arrowSize * 2,
        tessellation: 6,
      },
      this.scene,
    )
    xArrow.position = new Vector3(axisLength, 0, 0)
    xArrow.rotation.z = -Math.PI / 2
    const xMat = new StandardMaterial('xMat', this.scene)
    xMat.emissiveColor = new Color3(1, 0, 0)
    xArrow.material = xMat
    xArrow.isPickable = false
    xArrow.isVisible = false
    this.axisLines.push(xArrow)

    // Y arrow (cone pointing up)
    const yArrow = MeshBuilder.CreateCylinder(
      'yArrow',
      {
        diameterTop: 0,
        diameterBottom: arrowSize,
        height: arrowSize * 2,
        tessellation: 6,
      },
      this.scene,
    )
    yArrow.position = new Vector3(0, axisLength, 0)
    const yMat = new StandardMaterial('yMat', this.scene)
    yMat.emissiveColor = new Color3(0, 1, 0)
    yArrow.material = yMat
    yArrow.isPickable = false
    yArrow.isVisible = false
    this.axisLines.push(yArrow)

    // Z arrow (cone pointing forward)
    const zArrow = MeshBuilder.CreateCylinder(
      'zArrow',
      {
        diameterTop: 0,
        diameterBottom: arrowSize,
        height: arrowSize * 2,
        tessellation: 6,
      },
      this.scene,
    )
    zArrow.position = new Vector3(0, 0, axisLength)
    zArrow.rotation.x = Math.PI / 2
    const zMat = new StandardMaterial('zMat', this.scene)
    zMat.emissiveColor = new Color3(0, 0, 1)
    zArrow.material = zMat
    zArrow.isPickable = false
    zArrow.isVisible = false
    this.axisLines.push(zArrow)
  }

  toggle() {
    this.enabled = !this.enabled
    this.debugPanel.isVisible = this.enabled

    // Toggle axis visibility
    this.axisLines.forEach((line) => {
      line.isVisible = this.enabled
    })

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
      'Axes: X=Red, Y=Green, Z=Blue',
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

    // Dispose axis indicators
    this.axisLines.forEach((line) => {
      line.dispose()
    })
  }
}
