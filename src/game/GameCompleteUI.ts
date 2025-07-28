import { Scene } from '@babylonjs/core'
import { AdvancedDynamicTexture, Rectangle, TextBlock, Button } from '@babylonjs/gui'

export class GameCompleteUI {
  private gui: AdvancedDynamicTexture
  private panel: Rectangle

  constructor(
    private scene: Scene,
    private onRestart: () => void,
  ) {
    // Create fullscreen UI
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('gameCompleteUI', true, this.scene)

    // Create panel
    this.panel = new Rectangle('gameCompletePanel')
    this.panel.width = '400px'
    this.panel.height = '300px'
    this.panel.cornerRadius = 20
    this.panel.color = 'white'
    this.panel.thickness = 3
    this.panel.background = 'rgba(0, 0, 0, 0.8)'
    this.panel.isVisible = false
    this.gui.addControl(this.panel)

    // Title text
    const titleText = new TextBlock('completeTitle')
    titleText.text = 'All Levels Complete!'
    titleText.color = 'white'
    titleText.fontSize = 36
    titleText.fontWeight = 'bold'
    titleText.top = -50
    this.panel.addControl(titleText)

    // Congratulations text
    const congratsText = new TextBlock('congratsText')
    congratsText.text = 'Congratulations!\nYou cleaned up all of Philadelphia!'
    congratsText.color = 'white'
    congratsText.fontSize = 20
    congratsText.top = 20
    congratsText.textWrapping = true
    congratsText.resizeToFit = true
    this.panel.addControl(congratsText)

    // Restart button
    const restartButton = Button.CreateSimpleButton('restartButton', 'Restart Game')
    restartButton.width = '200px'
    restartButton.height = '50px'
    restartButton.color = 'white'
    restartButton.background = '#4CAF50'
    restartButton.cornerRadius = 10
    restartButton.thickness = 0
    restartButton.top = 100
    restartButton.fontSize = 20
    restartButton.onPointerClickObservable.add(() => {
      this.hide()
      this.onRestart()
    })
    this.panel.addControl(restartButton)
  }

  show() {
    this.panel.isVisible = true
  }

  hide() {
    this.panel.isVisible = false
  }

  dispose() {
    this.gui.dispose()
  }
}
