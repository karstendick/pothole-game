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

### Phase 1.5: Development Tools & Testing 🚧 IN PROGRESS
- [ ] Unit tests for game mechanics (swallowing, growth)
- [ ] Debug overlay with real-time game state
- [ ] Automated gameplay tests with Playwright
- [ ] Screenshot/state sharing for debugging

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

### Immediate: Better Development Feedback Loop
1. **Unit tests for game logic** - Test swallowing mechanics, growth calculations
2. **Debug overlay** - Show hole radius, object sizes, swallow ranges in real-time
3. **Automated gameplay tests** - Use Playwright to simulate user interactions

### Core Game Features
1. **Improve hole visualization** - Make it look like an actual hole in the ground
2. **Better swallow animation** - Objects fall into hole instead of shrinking
3. **Add physics to objects** - Use Havok or Cannon.js for rolling/falling
4. **SVG to 3D pipeline** - Create colorful, simple objects from SVG
5. **Better camera angle** - More like Donut County's view
6. **Sound effects** - Swallowing sounds, background music
7. **First level design** - Start with a simple playground level
