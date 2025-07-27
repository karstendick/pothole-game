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

### Phase 2: Physics & Swallowing 🚧 IN PROGRESS
- [x] Implement size-based swallow detection
- [x] Add hole growth mechanic when swallowing
- [x] ~~Create swallow animation (object shrinks into hole)~~
- [ ] **Better swallow animation** - Objects should fall into hole, not shrink
- [ ] Add object physics (rolling, tipping)
- [ ] Generate first SVG objects (varied sizes)
- [ ] Improve hole visualization (actual hole effect)

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
   - [ ] Add Havok Physics to project
   - [ ] Create basic cylinder hole mesh
   - [ ] Replace disc with cylinder in Hole class
   - [ ] Add physics impostors to objects
   - [ ] Implement fall detection logic
   - [ ] Add falling animation with physics
   - [ ] Create depth material/shader
   - [ ] Add particle effects
   - [ ] Performance optimization
   - [ ] Update tests for new physics

### Next Features After Physics
1. **Sound effects** - Swallowing sounds, background music
2. **Multiple levels** - Level progression system
3. **SVG to 3D pipeline** - Create colorful, simple objects from SVG
4. **Score/progress tracking** - Points, achievements, level completion
