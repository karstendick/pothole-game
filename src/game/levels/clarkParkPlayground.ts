import { Vector3, Color3 } from '@babylonjs/core'
import { LevelConfig } from './types'

export const clarkParkPlayground: LevelConfig = {
  id: 'clark-park-playground',
  name: 'Clark Park Playground',
  description: 'Clean up the playground at Clark Park!',

  victory: {
    type: 'specific_objects',
    requiredObjects: ['sandbox'], // Must eat the sandbox to win
  },

  hole: {
    startRadius: 0.8, // Start bigger than level 1 ended
    startPosition: new Vector3(0, 0.01, 0),
  },

  environment: {
    groundSize: 20,
    backgroundColor: new Color3(0.5, 0.7, 0.9), // Bright daylight
  },

  objects: [
    // Marble 1
    {
      id: 'marble1',
      name: 'Blue Marble',
      type: 'sphere',
      position: new Vector3(2, 0.1, 1),
      radius: 0.1,
      color: new Color3(0.2, 0.4, 0.9), // Blue
      physics: {
        mass: 0.2,
        restitution: 0.8, // Marbles bounce!
        friction: 0.3,
      },
      swallowRadius: 0.1,
    },

    // Marble 2
    {
      id: 'marble2',
      name: 'Red Marble',
      type: 'sphere',
      position: new Vector3(-1, 0.1, 2),
      radius: 0.1,
      color: new Color3(0.9, 0.2, 0.2), // Red
      physics: {
        mass: 0.2,
        restitution: 0.8,
        friction: 0.3,
      },
      swallowRadius: 0.1,
    },

    // Playground ball
    {
      id: 'playground_ball',
      name: 'Playground Ball',
      type: 'sphere',
      position: new Vector3(-3, 0.5, -2),
      radius: 0.4,
      color: new Color3(0.9, 0.1, 0.9), // Bright pink
      physics: {
        mass: 0.4,
        restitution: 0.9, // Very bouncy!
        friction: 0.5,
      },
      swallowRadius: 0.4,
    },

    // Sandbox - victory object
    {
      id: 'sandbox',
      name: 'Sandbox',
      type: 'box',
      position: new Vector3(4, 0.5, 3),
      dimensions: new Vector3(1.5, 0.3, 1.5), // 1.5x1.5 meter sandbox
      color: new Color3(0.9, 0.8, 0.6), // Sandy color
      physics: {
        mass: 10, // Heavy!
        restitution: 0.1,
        friction: 0.9,
      },
      swallowRadius: 0.75, // Half of largest dimension (1.5)
      isRequired: true,
    },

    // // Chalk piece
    // {
    //   id: 'chalk',
    //   name: 'Sidewalk Chalk',
    //   type: 'cylinder',
    //   position: new Vector3(-2, 0.05, -1),
    //   radius: 0.05,
    //   height: 0.15,
    //   color: new Color3(0.5, 0.8, 1), // Light blue chalk
    //   physics: {
    //     mass: 0.1,
    //     restitution: 0.2,
    //     friction: 0.8
    //   },
    //   swallowRadius: 0.075
    // },

    // // Jump rope handle
    // {
    //   id: 'jumprope',
    //   name: 'Jump Rope Handle',
    //   type: 'cylinder',
    //   position: new Vector3(1, 0.1, -3),
    //   radius: 0.06,
    //   height: 0.2,
    //   color: new Color3(0.9, 0.6, 0.1), // Orange plastic
    //   physics: {
    //     mass: 0.15,
    //     restitution: 0.5,
    //     friction: 0.6
    //   },
    //   swallowRadius: 0.1
    // },

    // // Small toy car
    // {
    //   id: 'toycar',
    //   name: 'Toy Car',
    //   type: 'box',
    //   position: new Vector3(-1, 0.1, -2),
    //   dimensions: new Vector3(0.2, 0.1, 0.15),
    //   color: new Color3(0.1, 0.7, 0.1), // Green
    //   physics: {
    //     mass: 0.3,
    //     restitution: 0.4,
    //     friction: 0.5
    //   },
    //   swallowRadius: 0.15
    // },

    // // Popsicle stick
    // {
    //   id: 'popsicle',
    //   name: 'Popsicle Stick',
    //   type: 'box',
    //   position: new Vector3(2.5, 0.02, 2),
    //   dimensions: new Vector3(0.15, 0.01, 0.02),
    //   color: new Color3(0.8, 0.7, 0.5), // Wood color
    //   physics: {
    //     mass: 0.02,
    //     restitution: 0.3,
    //     friction: 0.7
    //   },
    //   swallowRadius: 0.075
    // },

    // // Bottle cap (different from level 1)
    // {
    //   id: 'watercap',
    //   name: 'Water Bottle Cap',
    //   type: 'cylinder',
    //   position: new Vector3(0, 0.1, 1.5),
    //   radius: 0.12,
    //   height: 0.04,
    //   color: new Color3(0.2, 0.4, 0.9), // Blue plastic
    //   physics: {
    //     mass: 0.15,
    //     restitution: 0.4,
    //     friction: 0.6
    //   },
    //   swallowRadius: 0.12
    // },

    // // Small shovel (sandbox toy)
    // {
    //   id: 'shovel',
    //   name: 'Toy Shovel',
    //   type: 'box',
    //   position: new Vector3(3.5, 0.15, 2.5),
    //   dimensions: new Vector3(0.1, 0.3, 0.05),
    //   color: new Color3(0.9, 0.1, 0.1), // Red plastic
    //   physics: {
    //     mass: 0.25,
    //     restitution: 0.3,
    //     friction: 0.6
    //   },
    //   swallowRadius: 0.2
    // }
  ],
}
