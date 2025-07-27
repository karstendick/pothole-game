# Philadelphia Pothole Game - Development Plan

## Game Concept
A kid-friendly game where you play as a heroic pothole in Philadelphia, growing by swallowing objects around the city. Simple touch/mouse controls, no fail states, just fun exploration and growth.

## Design Principles
- **Kid-Friendly**: Ages 4-6 primary audience
- **Simple Controls**: Just drag to move
- **No Failure**: Can't lose, only progress
- **Clear Feedback**: Visual and audio rewards
- **Mobile-First**: Touch controls, 60 FPS target

## Technology Stack
- **BabylonJS**: 3D engine with Havok physics
- **TypeScript**: Type-safe development
- **Vite**: Fast builds and dev server
- **GitHub Pages**: Free hosting
- **GitHub Actions**: CI/CD pipeline

## Deployment
- Push to `main` → GitHub Action → Build → Deploy
- Available at: https://karstendick.github.io/pothole-game
- Saves progress locally (localStorage)

## Current Phase: Object System & Level Design 🚧

### Object System (Procedural Approach)
Using compound shapes built from primitives:

```typescript
{
  type: 'compound',
  name: 'bucket',
  parts: [
    { shape: 'cylinder', height: 0.5, radius: 0.3, position: [0, 0, 0] },
    { shape: 'torus', majorRadius: 0.2, minorRadius: 0.02, position: [0, 0.3, 0] }
  ]
}
```

### Level Progression
Linear progression through West Philadelphia locations:

#### Level 1: West Philly Sidewalk (Tutorial)
- **Objects**: Pebbles, bottle caps, pennies, toys, chalk
- **Victory**: Swallow all objects
- **Teaches**: Basic movement and size progression

#### Level 2: Clark Park Playground
- **Objects**: Marbles, balls, buckets, tricycles, sandbox
- **Victory**: Swallow the sandbox
- **Teaches**: Some objects are required for victory

#### Level 3: Alexander Penn School
- **Objects**: Pencils, backpacks, lunch boxes, desks, school bus
- **Victory**: Swallow the school bus
- **Teaches**: Large object progression

#### Level 4: Children's Hospital of Philadelphia (CHOP)
- **Objects**: Toy cars, stuffed animals, wheelchairs, gurneys, ambulance
- **Victory**: Swallow the ambulance
- **Teaches**: Moving objects and timing

#### Level 5: SEPTA Subway Station
- **Objects**: Tokens, trash cans, benches, turnstiles, subway car
- **Victory**: Swallow the subway car
- **Teaches**: Underground environment

#### Level 6: Italian Market
- **Objects**: Produce, crates, shopping carts, awnings, burning barrels!
- **Victory**: Swallow all the burning barrels
- **Teaches**: Environmental hazards and special objects

### Implementation Tasks
1. **Object System**
   - [ ] ProceduralObjectBuilder class
   - [ ] Primitive shape generation
   - [ ] Compound object assembly
   - [ ] Material system
   - [ ] Physics body generation

2. **Level System**
   - [ ] LevelConfig types
   - [ ] LevelManager class
   - [ ] Victory condition checking
   - [ ] Simple level transitions
   - [ ] Save progress to localStorage

3. **Level Content**
   - [ ] Design Level 1 objects
   - [ ] Design Level 2 objects
   - [ ] Balance progression
   - [ ] Test victory conditions

## Future Phases

### Phase 4: Polish & Effects
- [ ] Particle effects when swallowing
- [ ] Rim lighting around hole
- [ ] Smooth hole growth animation
- [ ] Victory celebrations
- [ ] Sound effects (silly sounds for kids)
- [ ] Performance optimization

### Phase 5: UI & User Experience
- [ ] Simple start screen
- [ ] Pause functionality
- [ ] Level complete screen
- [ ] Visual tutorials
- [ ] Current level indicator

## Technical Architecture

### Level Configuration
```typescript
interface LevelConfig {
  id: string
  name: string
  victory: {
    type: 'all_objects' | 'target_size' | 'specific_objects'
    targetSize?: number
    requiredObjects?: string[]
  }
  objects: LevelObject[]
}
```

### Object Definition
```typescript
interface LevelObject {
  id: string
  name: string
  type: 'primitive' | 'compound'
  position: Vector3
  definition: ObjectDefinition
  physics: PhysicsProperties
  swallowRadius: number
}
```
