# Pothole Game Development Plan

## Technology Stack
- **BabylonJS**: 3D engine with built-in physics
- **TypeScript**: Type-safe development
- **Vite**: Fast dev server, HMR, optimized builds
- **GitHub Pages**: Free hosting with custom domain support
- **GitHub Actions**: Automated CI/CD

Yes, Vite is perfect for this! Fast builds, great TS support, and handles assets well.

## Project Structure
```
pothole-game/
├── src/
│   ├── main.ts          # Entry point
│   ├── game/
│   │   ├── Game.ts      # Main game class
│   │   ├── Hole.ts      # Hole mechanics
│   │   ├── Level.ts     # Level management
│   │   └── Objects.ts   # Swallowable objects
│   ├── utils/
│   │   ├── SvgTo3D.ts   # SVG to mesh conversion
│   │   └── Touch.ts     # Mobile controls
│   └── assets/
│       └── svgs/        # Generated SVG files
├── public/              # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Development Phases

### Phase 1: Setup & Basic Hole ✅ COMPLETED
- [x] Initialize Vite + TypeScript + BabylonJS
- [x] Create basic scene with ground plane
- [x] Implement moveable hole (simple disc for now)
- [x] Add mobile touch controls
- [x] Setup GitHub Actions deployment
- [x] Add ESLint + Prettier with pre-commit hooks

### Phase 1.5: Development Tools & Testing ✅ COMPLETED
- [x] Unit tests for game mechanics (swallowing, growth)
- [x] Debug overlay with real-time game state
- [x] Automated gameplay tests with Playwright
- [x] CI/CD optimizations with caching

### Phase 2: Physics & Swallowing ✅ COMPLETED
- [x] Implement size-based swallow detection
- [x] Add hole growth mechanic when swallowing
- [x] ~~Create swallow animation (object shrinks into hole)~~
- [x] **Better swallow animation** - Objects now fall into hole with physics
- [x] Add Havok Physics engine integration
- [x] Create actual 3D hole using CSG (cuts through ground)
- [x] Two-layer ground for visual depth (green grass + dark earth)
- [x] Objects fall naturally with physics when over hole

### Phase 3: Level Design
- [ ] Create level loading system
- [ ] Design 5-6 simple levels
- [ ] Add progression (hole size limits)
- [ ] Generate themed SVG objects per level
- [ ] Add sound effects

### Phase 4: Polish
- [ ] Add particle effects
- [ ] Create simple UI/menus
- [ ] Add level select screen
- [ ] Optimize mobile performance
- [ ] Playtesting with kids

## Key Features for Kids
- **Simple controls**: Just drag to move hole
- **Size-based swallowing**: Hole must be bigger than object
- **No fail state**: Can't lose, just explore
- **Bright colors**: High contrast SVG designs
- **Size progression**: Eat small things to grow and eat bigger things

## Mobile Considerations
- Touch-first controls
- Responsive canvas sizing
- 60 FPS target on modern phones
- Progressive loading for assets
- Offline support via service worker

## Deployment Strategy
1. Every push to `main` triggers GitHub Action
2. Vite builds optimized bundle
3. Deploy directly from workflow (no gh-pages branch needed)
4. Available at: https://karstendick.github.io/pothole-game

## Completed So Far
- ✅ Project setup with Vite, TypeScript, BabylonJS
- ✅ Basic game scene with camera, lighting, ground
- ✅ Moveable hole with mouse/touch controls
- ✅ Size-based swallowing mechanics
- ✅ Hole growth on swallowing
- ✅ Simple shrink animation
- ✅ GitHub Actions for deployment and linting
- ✅ ESLint + Prettier configuration

## Next Steps (Priority Order)

### Current Focus: Physics-Based Hole with Realistic Swallowing

#### Implementation Plan

1. **Add Physics Engine**
   - Install and configure Havok Physics (BabylonJS's recommended engine)
   - Enable physics on the scene with appropriate gravity
   - Add physics impostors to all game objects

2. **Create 3D Cylindrical Hole**
   - Replace flat disc with cylindrical mesh extending below ground
   - Use CSG (Constructive Solid Geometry) to cut hole in ground mesh
   - Create depth effect with:
     - Dark gradient material (lighter at top, black at bottom)
     - Transparent/semi-transparent walls for visibility
     - Fog effect for illusion of infinite depth

3. **Physics-Based Falling**
   - When object overlaps hole sufficiently:
     - Disable ground collision for that object
     - Let physics engine handle natural falling
     - Add slight inward force toward hole center
     - Apply angular velocity for tumbling effect
   - Objects disappear after falling below certain depth

4. **Visual Enhancements**
   - Rim lighting/shadow around hole edge
   - Particle effects as objects fall (dust, debris)
   - Subtle camera shake for large objects
   - Improved hole material with depth parallax

5. **Technical Considerations**
   - Performance: Limit simultaneous physics objects
   - Mobile optimization: Reduce physics iterations on low-end devices
   - Hole growth: Dynamically update cylinder mesh and physics impostor
   - Save physics state for debug/testing

6. **Implementation Steps**
   - [x] Add Havok Physics to project
   - [x] Create basic cylinder hole mesh
   - [x] Replace disc with cylinder in Hole class
   - [x] Add physics impostors to objects
   - [x] Cut actual hole in ground using CSG
   - [x] Implement fall detection logic
   - [x] Add falling animation with physics
   - [x] Create two-layer ground for depth effect
   - [x] Performance optimization with debouncing
   - [x] Update tests for new physics
   - [x] Add axis indicators to debug overlay

## What to Work on Next

### Option 1: Visual Polish & Effects (Recommended)
Since the core physics mechanics are working, adding visual polish would make the biggest impact:
- **Particle effects** when objects fall into hole (dust clouds, debris)
- **Rim lighting** around hole edge for better visibility
- **Smooth hole growth animation** instead of instant resize

### Option 2: Sound Design
Add audio feedback to make the game more engaging:
- **Swallow sounds** that vary by object size
- **Ambient background music**
- **Victory sound** when level is complete
- **Physics sounds** (objects hitting each other)

### Option 3: Level System
Start building the progression system:
- **Level loading** from JSON/TypeScript configs
- **Victory condition** (all objects swallowed)
- **Level select screen**
- **Save progress** to localStorage
- **Different themed levels** (park, city, beach, etc.)

### Option 4: SVG Object Pipeline
Create more interesting objects:
- **SVG to 3D conversion** utility
- **Procedural object generation**
- **Themed object sets** per level
- **Different materials** (wood, metal, plastic)

### Option 5: UI/UX Improvements
Better user interface:
- **Start menu**
- **Pause functionality**
- **Level complete screen**
- **Tutorial/instructions**
- **Mobile-optimized UI**

### Recommendation: Start with Visual Polish
The particle effects and visual improvements would:
1. Make the game feel more polished immediately
2. Enhance the physics you just implemented
3. Be relatively quick to implement
4. Make testing more enjoyable

After visual polish, move to sound design, then level system.
