import { Game } from './game/Game'

// Extend window interface for debugging
declare global {
  interface Window {
    game?: Game
  }
}

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
const game = new Game(canvas)

game.start()

// Expose game instance for testing
if (typeof window !== 'undefined') {
  window.game = game
}
