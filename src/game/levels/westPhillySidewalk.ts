import { Vector3, Color3 } from '@babylonjs/core'
import { LevelConfig } from './types'

export const westPhillySidewalk: LevelConfig = {
  id: 'west-philly-sidewalk',
  name: 'West Philly Sidewalk',
  description: 'Your journey begins on a cracked sidewalk in West Philadelphia!',

  victory: {
    type: 'all_objects', // Swallow everything to complete
  },

  hole: {
    startRadius: 0.3, // Tiny start - can only eat pebbles
    startPosition: new Vector3(0, 0.01, 0),
  },

  environment: {
    groundSize: 15,
    backgroundColor: new Color3(0.7, 0.8, 0.9), // Daylight blue
  },

  objects: [
    // Pebble 1 - immediate swallow
    {
      id: 'pebble1',
      name: 'Small Pebble',
      type: 'sphere',
      position: new Vector3(1, 0.05, 1),
      radius: 0.05,
      color: new Color3(0.5, 0.5, 0.5), // Gray
      physics: {
        mass: 0.1,
        restitution: 0.3,
        friction: 0.8,
      },
      swallowRadius: 0.05,
    },

    // Pebble 2 - immediate swallow
    {
      id: 'pebble2',
      name: 'Small Pebble',
      type: 'sphere',
      position: new Vector3(-1.5, 0.05, 0.5),
      radius: 0.05,
      color: new Color3(0.6, 0.5, 0.4), // Brownish
      physics: {
        mass: 0.1,
        restitution: 0.3,
        friction: 0.8,
      },
      swallowRadius: 0.05,
    },

    // Bottle cap - need to eat pebbles first
    {
      id: 'bottlecap',
      name: 'Bottle Cap',
      type: 'cylinder',
      position: new Vector3(2, 0.1, -2),
      radius: 0.15,
      height: 0.05,
      color: new Color3(0.9, 0.1, 0.1), // Red (Coke cap)
      physics: {
        mass: 0.2,
        restitution: 0.4,
        friction: 0.6,
      },
      swallowRadius: 0.15,
    },

    // Tennis ball - final object
    {
      id: 'tennisball',
      name: 'Tennis Ball',
      type: 'sphere',
      position: new Vector3(-3, 0.3, -3),
      radius: 0.3,
      color: new Color3(0.8, 0.9, 0.1), // Tennis ball yellow-green
      physics: {
        mass: 0.5,
        restitution: 0.8,
        friction: 0.5,
      },
      swallowRadius: 0.3,
    },

    // // Penny - small coin
    // {
    //   id: 'penny',
    //   name: 'Penny',
    //   type: 'cylinder',
    //   position: new Vector3(0.5, 0.02, -1),
    //   radius: 0.08,
    //   height: 0.02,
    //   color: new Color3(0.7, 0.4, 0.2), // Copper color
    //   physics: {
    //     mass: 0.05,
    //     restitution: 0.2,
    //     friction: 0.7
    //   },
    //   swallowRadius: 0.08
    // },

    // // Cigarette butt
    // {
    //   id: 'cigarette',
    //   name: 'Cigarette Butt',
    //   type: 'cylinder',
    //   position: new Vector3(-2, 0.04, 1.5),
    //   radius: 0.04,
    //   height: 0.15,
    //   color: new Vector3(0.9, 0.8, 0.6), // Off-white/tan
    //   physics: {
    //     mass: 0.02,
    //     restitution: 0.1,
    //     friction: 0.9
    //   },
    //   swallowRadius: 0.075
    // },

    // // Gum wad
    // {
    //   id: 'gum',
    //   name: 'Chewed Gum',
    //   type: 'sphere',
    //   position: new Vector3(1.5, 0.04, -0.5),
    //   radius: 0.06,
    //   color: new Color3(0.9, 0.4, 0.6), // Pink
    //   physics: {
    //     mass: 0.03,
    //     restitution: 0.05, // Very low bounce - it's sticky!
    //     friction: 0.95
    //   },
    //   swallowRadius: 0.06
    // },

    // // Small stick
    // {
    //   id: 'stick',
    //   name: 'Twig',
    //   type: 'box',
    //   position: new Vector3(-0.8, 0.05, 2),
    //   dimensions: new Vector3(0.3, 0.03, 0.03),
    //   color: new Color3(0.4, 0.3, 0.2), // Brown
    //   physics: {
    //     mass: 0.05,
    //     restitution: 0.3,
    //     friction: 0.7
    //   },
    //   swallowRadius: 0.15
    // },

    // // Acorn
    // {
    //   id: 'acorn',
    //   name: 'Acorn',
    //   type: 'sphere',
    //   position: new Vector3(3, 0.08, 0),
    //   radius: 0.08,
    //   color: new Color3(0.5, 0.3, 0.1), // Dark brown
    //   physics: {
    //     mass: 0.1,
    //     restitution: 0.4,
    //     friction: 0.6
    //   },
    //   swallowRadius: 0.08
    // }
  ],
}
