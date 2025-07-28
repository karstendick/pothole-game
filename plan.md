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

## Completed Features ✅

### Level System
- ✅ LevelConfig types with flexible victory conditions
- ✅ LevelManager with automatic progression
- ✅ Two playable levels (West Philly Sidewalk & Clark Park Playground)
- ✅ Game complete screen with restart button
- ✅ Progress saved to localStorage
- ✅ Victory condition checking (all objects vs specific objects)

### Core Gameplay
- ✅ Simplified swallowing mechanics (y-position based)
- ✅ Object disposal when deep enough
- ✅ Hole growth based on object size
- ✅ Debug overlay with object tracking

## Current Phase: Polish & Content 🚧

### Next Priority: Hole Visibility
The hole interior (two-tone earth layers) is not visible during gameplay. This is a critical visual feature that helps players understand they're controlling a hole.

### Object System (Future Enhancement)
For compound shapes built from primitives:

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
- **MVP Objects**:
  - 2 pebbles (tiny, starter objects)
  - 1 bottle cap (small)
  - 1 tennis ball (medium)
- **Victory**: Swallow all objects
- **Teaches**: Basic movement and size progression

#### Level 2: Clark Park Playground
- **MVP Objects**:
  - 2 marbles (small)
  - 1 playground ball (medium)
  - 1 sandbox (large, required for victory)
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

### Minimal Implementation Order
1. Create basic LevelConfig type
2. Build simple LevelManager that can load/transition
3. Create 4 objects for Level 1 (just primitives first)
4. Create 4 objects for Level 2 (including sandbox)
5. Test progression: Level 1 → Victory → Level 2 → Victory
6. Then expand with compound objects and more content

### Implementation Tasks

1. **Immediate Priorities**
   - [ ] Fix hole visibility (see interior layers)
   - [ ] Add victory celebration animation
   - [ ] Create Level 3: Alexander Penn School

2. **Object System (Future)**
   - [ ] ProceduralObjectBuilder class
   - [ ] Primitive shape generation
   - [ ] Compound object assembly
   - [ ] Material system
   - [ ] Physics body generation

3. **Polish & Effects**
   - [ ] Particle effects when objects fall
   - [ ] Rim lighting around hole edge
   - [ ] Smooth hole growth animation
   - [ ] Sound effects (silly sounds for kids)

## TODO List (Priority Order)

### High Priority
- [x] Fix hole visibility issues (can't see two-tone interior) ✅
- [x] Add more objects to flesh out levels (currently commented out) ✅

### Medium Priority  
- [ ] Add victory celebration animation
- [ ] Create compound object builder for primitives
- [ ] Create Level 3: Alexander Penn School

### Low Priority
- [ ] Add particle effects when objects fall
- [ ] Add rim lighting around hole edge

## Recent Accomplishments
- **Hole Visibility Fixed**: Implemented geometry-based calculation to ensure two-tone earth layers are always visible
- **Level System Complete**: Two playable levels with progression and restart functionality
- **Object Variety**: Added commented-out objects ready to be enabled when needed

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
- [ ] Level complete screen (basic version done)
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
