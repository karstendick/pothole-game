import { Game } from './game/Game'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
const game = new Game(canvas)

game.start()

// Expose game instance for testing
if (typeof window !== 'undefined') {
  ;(window as any).game = game
}
