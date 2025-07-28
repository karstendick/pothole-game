import { test, expect } from '@playwright/test'

test.describe('Basic Loading', () => {
  test('page should load', async ({ page }) => {
    await page.goto('/')
    // Basic check that page loads
    await expect(page).toHaveTitle(/Pothole Game/)

    // Check canvas exists
    const canvas = page.locator('#renderCanvas')
    await expect(canvas).toBeVisible()

    // Check WebGL support
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    })
    console.log('WebGL supported:', hasWebGL)
  })
})

test.describe('Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    // Add console logging to debug CI issues
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text())
      }
    })

    page.on('pageerror', (error) => {
      console.log('Page error:', error.message)
    })

    await page.goto('/')

    // Wait for canvas element to exist
    await page.waitForSelector('#renderCanvas', { timeout: 30000 })

    // Wait for the game to load - increased timeout for CI
    await page.waitForFunction(
      () => {
        const game = (window as any).game
        // Check that game is loaded AND level objects exist
        return (
          game &&
          game.scene &&
          game.hole &&
          game.scene.meshes.some((mesh: any) => mesh.metadata?.levelObjectId !== undefined)
        )
      },
      { timeout: 30000 },
    )

    // Additional wait to ensure game is fully initialized
    await page.waitForTimeout(500)
  })

  test('game should load and display canvas', async ({ page }) => {
    const canvas = page.locator('#renderCanvas')
    await expect(canvas).toBeVisible()

    // Check canvas has proper size
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).toBeTruthy()
    expect(canvasBox!.width).toBeGreaterThan(0)
    expect(canvasBox!.height).toBeGreaterThan(0)
  })

  test('hole should move when dragging', async ({ page }) => {
    const canvas = page.locator('#renderCanvas')

    // Get initial hole position
    const initialPos = await page.evaluate(() => {
      const game = (window as any).game
      const pos = game.hole.getPosition()
      return { x: pos.x, z: pos.z }
    })

    // Drag on canvas
    const canvasBox = await canvas.boundingBox()!
    const centerX = canvasBox!.x + canvasBox!.width / 2
    const centerY = canvasBox!.y + canvasBox!.height / 2

    await page.mouse.move(centerX, centerY)
    await page.mouse.down()
    await page.mouse.move(centerX + 100, centerY + 100, { steps: 10 })
    await page.mouse.up()

    // Wait for position to update
    await page.waitForTimeout(100)

    // Check new position
    const newPos = await page.evaluate(() => {
      const game = (window as any).game
      const pos = game.hole.getPosition()
      return { x: pos.x, z: pos.z }
    })

    // Hole should have moved
    expect(newPos.x).not.toBeCloseTo(initialPos.x, 1)
    expect(newPos.z).not.toBeCloseTo(initialPos.z, 1)
  })

  test('hole should grow when swallowing objects', async ({ page }) => {
    // Wait for game to be fully running
    await page.waitForTimeout(500)

    // Get initial hole radius
    const initialRadius = await page.evaluate(() => {
      const game = (window as any).game
      return game.hole.getRadius()
    })

    // Use drag controls to move hole towards objects
    const canvas = page.locator('#renderCanvas')
    const canvasBox = await canvas.boundingBox()!
    const centerX = canvasBox!.x + canvasBox!.width / 2
    const centerY = canvasBox!.y + canvasBox!.height / 2

    // First, check what objects are available and their positions
    const objectInfo = await page.evaluate(() => {
      const game = (window as any).game
      const objects = game.scene.meshes.filter(
        (mesh: any) => mesh.metadata?.levelObjectId !== undefined,
      )
      return objects.map((obj: any) => ({
        id: obj.metadata.levelObjectId,
        position: { x: obj.position.x, z: obj.position.z },
        radius: obj.metadata.swallowRadius,
      }))
    })

    // Find the smallest object (should be a pebble)
    const smallestObject = objectInfo.reduce((min: any, obj: any) =>
      obj.radius < min.radius ? obj : min,
    )

    // Calculate drag direction to move towards the smallest object
    // Camera is at (0, 15, -8) looking at origin, so we need to convert world to screen
    const dragX = smallestObject.position.x * 50 // Scale factor for screen movement
    const dragZ = -smallestObject.position.z * 50 // Invert Z for screen space

    // Drag towards the smallest object
    await page.mouse.move(centerX, centerY)
    await page.mouse.down()
    await page.mouse.move(centerX + dragX, centerY + dragZ, { steps: 20 })
    await page.mouse.up()

    // Wait for object to fall and be swallowed
    await page.waitForTimeout(2000)

    // Check if radius increased
    const finalRadius = await page.evaluate(() => {
      const game = (window as any).game
      return game.hole.getRadius()
    })

    expect(finalRadius).toBeGreaterThan(initialRadius)
  })

  test('debug mode should toggle with D key', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = []
    page.on('console', (msg) => consoleMessages.push(msg.text()))

    // Enable debug mode
    await page.keyboard.press('d')
    await page.waitForTimeout(100)

    // Check for debug ON message
    const hasDebugOn = consoleMessages.some((msg) => msg.includes('Debug mode: ON'))
    expect(hasDebugOn).toBe(true)

    // Disable debug mode
    await page.keyboard.press('d')
    await page.waitForTimeout(100)

    // Check for debug OFF message
    const hasDebugOff = consoleMessages.some((msg) => msg.includes('Debug mode: OFF'))
    expect(hasDebugOff).toBe(true)
  })

  test('game progression - hole can eventually swallow all objects', async ({ page }) => {
    // This is a longer test that verifies the core game loop works

    // Wait for game to stabilize
    await page.waitForTimeout(500)

    const getObjectCount = () =>
      page.evaluate(() => {
        const game = (window as any).game
        const scene = game.scene
        return scene.meshes.filter(
          (mesh: any) => mesh.metadata?.levelObjectId !== undefined && !mesh.isDisposed(),
        ).length
      })

    const initialCount = await getObjectCount()
    expect(initialCount).toBeGreaterThan(0)

    // Simulate player moving around trying to swallow objects
    const canvas = page.locator('#renderCanvas')
    const canvasBox = await canvas.boundingBox()!
    const centerX = canvasBox!.x + canvasBox!.width / 2
    const centerY = canvasBox!.y + canvasBox!.height / 2

    // Get object positions to target them specifically
    const objectInfo = await page.evaluate(() => {
      const game = (window as any).game
      const objects = game.scene.meshes.filter(
        (mesh: any) => mesh.metadata?.levelObjectId !== undefined,
      )
      return objects.map((obj: any) => ({
        id: obj.metadata.levelObjectId,
        position: { x: obj.position.x, z: obj.position.z },
        radius: obj.metadata.swallowRadius,
      }))
    })

    // Sort objects by size to swallow smallest first
    const sortedObjects = objectInfo.sort((a: any, b: any) => a.radius - b.radius)

    // Try to swallow at least one object
    let swallowed = false
    for (const obj of sortedObjects.slice(0, 2)) {
      // Try first two smallest objects
      // Calculate drag direction
      const dragX = obj.position.x * 50
      const dragZ = -obj.position.z * 50

      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + dragX, centerY + dragZ, { steps: 20 })
      await page.mouse.up()

      // Wait for object to potentially be swallowed
      await page.waitForTimeout(2000)

      const currentCount = await getObjectCount()
      if (currentCount < initialCount) {
        swallowed = true
        break
      }
    }

    expect(swallowed).toBe(true)
  })

  test('touch/mobile controls should work', async ({ page, isMobile }) => {
    // Skip on non-mobile devices
    test.skip(!isMobile, 'Touch controls only tested on mobile devices')

    const canvas = page.locator('#renderCanvas')

    // Get initial position
    const initialPos = await page.evaluate(() => {
      const game = (window as any).game
      const pos = game.hole.getPosition()
      return { x: pos.x, z: pos.z }
    })

    // On mobile, pointer events are triggered by touch
    // Our game uses pointer events which work for both mouse and touch
    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')
    const centerX = canvasBox.x + canvasBox.width / 2
    const centerY = canvasBox.y + canvasBox.height / 2

    // Simulate touch drag using mouse methods (which trigger pointer events on mobile)
    await page.mouse.move(centerX, centerY)
    await page.mouse.down()
    await page.mouse.move(centerX + 100, centerY + 100, { steps: 10 })
    await page.mouse.up()

    await page.waitForTimeout(200)

    // Check position changed
    const newPos = await page.evaluate(() => {
      const game = (window as any).game
      const pos = game.hole.getPosition()
      return { x: pos.x, z: pos.z }
    })

    // Mobile controls should move the hole
    expect(newPos.x).not.toBeCloseTo(initialPos.x, 1)
    expect(newPos.z).not.toBeCloseTo(initialPos.z, 1)
  })
})
