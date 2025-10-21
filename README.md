# Dicetrix

A revolutionary gravity-matching puzzle game that combines falling Tetromino pieces with advanced dice-based match detection and clearing mechanics. Built for Reddit using Phaser.js and the Devvit platform, creating an entirely new puzzle gaming experience.

## What is Dicetrix?

Dicetrix is a complete, fully playable puzzle game that creates an entirely new gaming experience by merging classic falling-block mechanics with innovative dice-matching gameplay. Players control Tetromino pieces (I, O, T, L, J, S, Z, and PLUS shapes) made of SimpleDie objects that fall into a 10x20 grid. When pieces lock into place, the game uses an advanced flood-fill algorithm to detect groups of 3+ adjacent dice with matching numbers and clears them, triggering gravity effects and potential cascade chains.

The game features a sophisticated finite state machine architecture with autonomous dice movement, intelligent responsive design that adapts to any screen size, and professional-grade visual and audio systems. Built specifically for Reddit's Devvit platform, it runs seamlessly within Reddit posts and provides an engaging puzzle experience for the Reddit community.

**Current Status**: Dicetrix is a complete, production-ready gravity-matching puzzle game featuring autonomous dice movement managed by a GameStateController finite state machine, real-time responsive design across all devices, advanced match detection with size-based effects, comprehensive input systems for desktop and mobile, and smooth animations with professional visual polish.

## What Makes Dicetrix Innovative?

### 🎯 Revolutionary Hybrid Gameplay System

Dicetrix creates an entirely new puzzle genre by seamlessly combining two beloved game mechanics into something completely unique:

**Tetromino Control + Dice Matching = New Gaming Experience**
- Control 8 different Tetromino shapes: I, O, T, L, J, S, Z, plus a custom PLUS shape
- Each piece is composed of SimpleDie objects showing random numbers (4-20 sides depending on difficulty)
- When pieces lock into place, an advanced flood-fill algorithm detects groups of 3+ adjacent dice with matching numbers
- Creates a strategic depth where players must consider both piece placement AND number matching

**Advanced Dice System with Strategic Depth**
- **Regular Dice**: Show numbers 1-20 based on game mode difficulty (Easy: 4-6 sides, Expert: 4-20 sides)
- **Wild Dice (*)**: Match with any number, created by clearing 5+ dice groups - the key to massive combos
- **Black Dice (X)**: Remove active color boosters when matched (Hard/Expert modes only) - adds risk/reward
- **Size-Based Effects**: Different match sizes trigger unique clearing effects:
  - **3 Dice**: Standard clear (removes matched dice only)
  - **4 Dice**: Line clear (removes entire row or column)
  - **5 Dice**: Wild spawn (creates a Wild die at match center)
  - **7 Dice**: Area clear (removes 7x7 area around match)
  - **9+ Dice**: Grid clear (removes all dice from playing field)
- **Ultimate Combo**: 3+ adjacent Wild dice upgrade all grid dice to maximum values with 5x score multiplier

### 🚀 Autonomous Dice Architecture Innovation

**Self-Managing Game Objects**
- **SimpleDie Architecture**: Each die is a self-contained Phaser.GameObjects.Container that manages its own rendering, movement, and lifecycle through proper object-oriented design
- **MovementManager**: Sophisticated tracking system with explicit registration/unregistration that emits events when all movement completes
- **Event-Driven Flow**: GameStateController uses Phaser's EventEmitter to coordinate piece locking, autonomous dice falling, match processing, and cascade chains
- **Natural Autonomy**: After piece locking, dice become autonomous and handle their own falling behavior through Phaser's built-in preUpdate() system - no complex coordination needed

### 🎮 Finite State Machine Game Architecture

**GameStateController - Professional Game Flow Management**
- Uses Phaser's EventEmitter system with finite state machine architecture to coordinate all game flow
- **Game Phases**: SPAWN → DROP_CONTROL → LOCK → MATCH → CLEAR_MATCH → CASCADE
- **Input State Management**: Automatically enables/disables input based on game phase to prevent conflicts
- **Event-Driven Coordination**: Coordinates piece locking, gravity application, match processing, and cascade chains through clean event communication
- **Autonomous Integration**: When pieces lock, dice become autonomous and manage their own falling behavior while the state machine coordinates the overall flow
- **Clean Architecture**: Eliminates complex state management by using event-driven communication between systems

### 📱 Intelligent Cross-Platform Design

**Real-Time Responsive Adaptation**
- **Automatic Display Detection**: Classifies screen sizes into mobile (≤1080px), desktop (≤1600px), and fullscreen (>1600px) modes
- **Dynamic Cell Sizing**: 24px (mobile), 32px (desktop), up to 128px (fullscreen) with proportional scaling
- **Smart Positioning**: Mobile grid positioned 10px from left for thumb accessibility, desktop/fullscreen centered for optimal viewing
- **Real-Time Updates**: Handles window resize, fullscreen changes, and orientation changes instantly
- **Debug Testing**: M/D/F buttons for testing different display modes in real-time

### 🎨 Professional Visual & Audio Systems

**Advanced Visual Architecture**
- **SimpleDie Rendering**: Autonomous dice objects extending Phaser.GameObjects.Container with self-managed rendering and movement
- **Procedural Graphics**: Clean blue squares (0x4dabf7) with dynamic gold text (0xffd700) using Phaser's graphics API
- **Responsive Typography**: Dynamic font scaling (16px-48px) with black stroke (2-4px thickness) for optimal readability
- **Smooth Animations**: Professional piece movement, gravity effects, and satisfying match clearing effects
- **MovementManager Integration**: Sophisticated dice movement tracking with event-driven completion detection

**Comprehensive Audio System**
- **AudioManager**: Professional sound effect management with robust error handling
- **AudioEvents**: Complete sound library covering menu navigation, piece movement, match clearing, and special effects
- **Graceful Degradation**: Audio failures don't break gameplay - continues smoothly even if sound is unavailable

## Current Game Status

**✅ Complete Gravity-Matching Puzzle Game**

Dicetrix is a fully playable, professional-grade gravity-matching puzzle game with comprehensive features:

**🎮 Core Gameplay Systems**
- **Complete Scene Flow**: Boot → Preloader → StartMenu → Game with smooth transitions and asset management
- **Finite State Machine**: GameStateController with 6 distinct phases (SPAWN → DROP_CONTROL → LOCK → MATCH → CLEAR_MATCH → CASCADE)
- **Tetromino Piece Control**: 8 different shapes (I, O, T, L, J, S, Z, PLUS) with full rotation and collision detection
- **Advanced Match Detection**: Sophisticated flood-fill algorithm detects 3+ adjacent dice with matching numbers
- **Size-Based Effects**: 3-dice (standard), 4-dice (line clear), 5-dice (wild spawn), 7-dice (area clear), 9+ dice (grid clear)
- **Autonomous Dice System**: SimpleDie objects manage their own movement through Phaser's preUpdate() system
- **Special Dice Mechanics**: Wild dice (*), Black dice (X), and Ultimate Combo system with 5x multiplier

**🎯 Professional Input & Controls**
- **Desktop Controls**: Arrow keys for movement/rotation, space for hard drop, with intelligent auto-repeat (150ms delay, 50ms repeat)
- **Mobile Touch Controls**: Swipe gestures for movement (50px threshold), tap/double-tap for rotation/hard drop
- **Input State Management**: GameStateController automatically enables/disables input based on current game phase
- **Input Validation**: 50ms cooldown system prevents input spam, advanced gesture recognition for touch devices

**🖥️ Intelligent Responsive Design**
- **Real-time Display Detection**: Automatically classifies mobile (≤1080px), desktop (≤1600px), fullscreen (>1600px)
- **Dynamic Cell Sizing**: 24px (mobile), 32px (desktop), up to 128px (fullscreen) with proportional scaling
- **Optimal Positioning**: Mobile grid positioned 10px from left for thumb accessibility, desktop/fullscreen centered
- **Debug Testing**: M/D/F buttons for testing different display modes in real-time

**🎨 Advanced Visual System**
- **SimpleDie Architecture**: Autonomous dice objects extending Phaser.GameObjects.Container with self-managed rendering
- **Procedural Rendering**: Clean blue squares (0x4dabf7) with dynamic gold text (0xffd700) using Phaser graphics commands
- **Responsive Typography**: Dynamic font scaling (16px-48px) with black stroke (2-4px thickness) for optimal readability
- **MovementManager Integration**: Smooth animations with autonomous movement tracking and completion detection

**⚙️ Game Architecture**
- **Event-Driven Flow**: GameStateController manages game flow using finite state machine with Phaser's EventEmitter
- **MovementManager**: Tracks autonomous dice movement with explicit registration/unregistration and completion events
- **Grid System**: 10x20 grid with sophisticated collision detection, match detection, and gravity application
- **MatchProcessor**: Advanced flood-fill algorithm with size-based effect triggering and match clearing coordination
- **Audio System**: Comprehensive sound effects with robust error handling and graceful degradation

**🎲 Game Mode System**
- **Easy Mode** (Current Default): 4-6 sided dice, simple pieces (I,O,L,J,T), 1000ms fall speed, 1.0x multiplier
- **Medium Mode**: 4-10 sided dice, includes S/Z pieces, 800ms fall speed, 1.2x multiplier  
- **Hard Mode**: 4-12 sided dice, PLUS piece, 1% black dice, 600ms fall speed, 1.5x multiplier
- **Expert Mode**: 4-20 sided dice, all pieces, 2% black dice, 400ms fall speed, 2.0x multiplier
- **Zen Mode**: No game over, 1200ms fall speed, enhanced wild dice (8% chance), 0.8x multiplier

**Current Gameplay Experience**: Players can immediately start playing a complete gravity-matching puzzle game. The GameStateController finite state machine manages all game flow through 6 distinct phases, coordinating piece spawning, player control, piece locking, match detection, match clearing, and cascade processing. SimpleDie objects extend Phaser.GameObjects.Container and autonomously handle their own movement and rendering through Phaser's built-in preUpdate() system, while the MovementManager tracks all movement with event-driven completion detection. The game automatically adapts to any screen size while maintaining optimal performance and visual quality.

#### 🎲 Actual Game Mechanics in Action

**Finite State Machine Flow**
- GameStateController manages 6 distinct phases: SPAWN → DROP_CONTROL → LOCK → MATCH → CLEAR_MATCH → CASCADE
- Each phase transition is event-driven with proper timeout handling (5 second safety timeout per phase)
- Input is automatically enabled only during DROP_CONTROL phase and disabled during all processing phases
- Phase transitions emit events for coordination between game systems

**Piece Movement & Control (DROP_CONTROL Phase)**
- Pieces spawn at the top center (gridX=4) of the 10x20 grid and fall automatically every 1000ms (Easy mode)
- Real-time collision detection prevents pieces from moving into occupied spaces or outside grid boundaries
- Rotation uses a matrix transformation system with wall kick attempts (-1, 1, -2, 2 grid positions) if rotation is blocked
- Hard drop instantly moves pieces to the lowest valid position and locks them immediately
- When piece can't move down, GameStateController.lockCurrentPiece() is called to transition to LOCK phase

**Autonomous Dice System (LOCK → CASCADE Phases)**
- During LOCK phase, each SimpleDie is placed in the grid and becomes autonomous
- Dice register with MovementManager and handle their own falling behavior through Phaser's preUpdate() system
- MovementManager tracks all moving dice with explicit registration/unregistration
- CASCADE phase waits for MovementManager to emit 'allMovementComplete' before proceeding

**Match Detection & Processing (MATCH → CLEAR_MATCH Phases)**
- MATCH phase: MatchProcessor uses flood-fill algorithm to detect connected groups of 3+ dice with matching numbers
- Wild dice (*) match with any number, making them valuable for completing difficult matches
- CLEAR_MATCH phase: Size-based effects trigger automatically based on match size
- Ultimate Combo activates when 3+ Wild dice are adjacent, upgrading all grid dice with 5x score multiplier

**Event-Driven Cascade System (CASCADE Phase)**
- After matches clear, CASCADE phase applies gravity to all remaining dice
- Each die falls autonomously to its lowest valid position
- Chain multiplier increases using floor(log2(chain_index)) formula for each cascade level
- Cascades continue up to 10 levels maximum, cycling between CASCADE → MATCH phases
- Returns to SPAWN phase only when no more matches are found

## How to Play Dicetrix

### 🚀 Getting Started

1. **Launch the Development Server**
   ```bash
   npm run dev
   ```
   This starts the development server with live reloading and creates a Reddit playtest environment.

2. **Open the Game in Reddit**
   - Open the provided Reddit playtest URL (e.g., `https://www.reddit.com/r/dice_trix_dev?playtest=dice-trix`)
   - Click "Launch App" to open Dicetrix in fullscreen mode
   - The game automatically boots through: Boot → Preloader → StartMenu → Game

3. **Navigate the Interface**
   - **Boot Scene**: Quick initialization and asset loading with Dicetrix branding
   - **Preloader Scene**: Loading screen with progress indication and game assets
   - **StartMenu Scene**: Clean main menu with "DICETRIX" title (Nabla font) and "START GAME" button (Stalinist One font)
   - **Game Scene**: Full gameplay with intelligent responsive 10x20 grid and adaptive controls

### 🎮 Game Controls

**Desktop Controls:**
- **Left/Right Arrows**: Move piece horizontally
- **Down Arrow**: Soft drop (accelerate piece downward)
- **Up Arrow**: Rotate piece clockwise
- **Space Bar**: Hard drop (instantly drop to bottom and lock)

**Mobile Touch Controls:**
- **Swipe Left/Right**: Move piece horizontally
- **Swipe Down**: Soft drop piece
- **Tap or Swipe Up**: Rotate piece
- **Double Tap**: Hard drop piece

**Advanced Input Features**: 
- Auto-repeat for held keys (150ms delay, 50ms repeat rate)
- Advanced gesture recognition with 50px swipe threshold
- Input validation with 50ms cooldown to prevent spam
- Responsive touch controls that adapt to screen size

### 🎯 Step-by-Step Gameplay Guide

#### Phase 1: Piece Control (DROP_CONTROL)
- **Tetromino pieces** (I, O, T, L, J, S, Z, PLUS) spawn at the top center of the 10x20 grid
- Each piece contains **SimpleDie objects** showing random numbers (4-20 sides based on difficulty)
- Use controls to **position and rotate** pieces as they fall with gravity
- Pieces automatically fall at timed intervals (1000ms in Easy mode)
- **Real-time collision detection** prevents invalid movements
- **GameStateController** manages input enabling/disabling based on current phase

#### Phase 2: Piece Locking (LOCK)
- When a piece can't move down further, **GameStateController transitions to LOCK phase**
- Each die from the piece is placed in the grid using the dice matrix (properly rotated)
- Dice become **autonomous SimpleDie objects** that manage their own rendering and movement
- **Input is disabled** during the locking process
- GameStateController coordinates the transition through **finite state machine**

#### Phase 3: Match Detection (MATCH)
- **MatchProcessor** scans for groups of 3+ adjacent dice with matching numbers
- **Advanced flood-fill algorithm** detects connected groups in all directions
- **Wild dice (*)** match with any number for strategic combinations
- Match detection runs synchronously to avoid race conditions

#### Phase 4: Match Clearing (CLEAR_MATCH)
Different match sizes trigger unique clearing effects:
- **3 Dice**: Standard clear (removes matched dice only)
- **4 Dice**: Line clear (removes entire row or column)
- **5 Dice**: Wild spawn (creates a Wild die at match center)
- **7 Dice**: Area clear (removes 7x7 area around match)
- **9+ Dice**: Grid clear (removes all dice from playing field)

#### Phase 5: Cascade System (CASCADE)
- After matches clear, remaining dice **fall autonomously** under gravity
- **MovementManager** tracks all moving dice with explicit registration/unregistration
- Each die handles its own movement through Phaser's **preUpdate()** system
- New matches may form from falling dice, creating **chain reactions**
- Each cascade level increases the **chain multiplier** using floor(log2(chain_index))
- Process continues until no more matches are found (up to 10 cascade levels max)

#### Phase 6: Return to Spawn (SPAWN)
- After all cascades complete, **GameStateController** returns to SPAWN phase
- **Input is re-enabled** and next piece is requested
- Cycle repeats with new piece spawning at top center

#### Special Mechanics
- **Wild Dice (*)**: Match with any number, created by 5-dice matches
- **Black Dice (X)**: Remove active boosters (Hard/Expert modes only, 1-2% chance)
- **Ultimate Combo**: 3+ adjacent Wild dice upgrade all grid dice with 5x score multiplier

### 🏆 Game Modes & Difficulty Levels

**🟢 Easy Mode** (Current Default)
- **Dice Types**: 4-6 sided dice only
- **Pieces**: I, O, L, J, T (simple shapes)
- **Fall Speed**: 1000ms | **Score Multiplier**: 1.0x
- **Wild Dice**: 5% chance | **Black Dice**: None
- Perfect for learning the core mechanics

**🟡 Medium Mode**
- **Dice Types**: 4-10 sided dice
- **Pieces**: All basic shapes including S and Z
- **Fall Speed**: 800ms | **Score Multiplier**: 1.2x
- **Wild Dice**: 4% chance | **Black Dice**: None

**🟠 Hard Mode**
- **Dice Types**: 4-12 sided dice
- **Pieces**: All shapes including PLUS piece
- **Fall Speed**: 600ms | **Score Multiplier**: 1.5x
- **Wild Dice**: 3% chance | **Black Dice**: 1%

**🔴 Expert Mode**
- **Dice Types**: 4-20 sided dice (maximum complexity)
- **Pieces**: All 8 piece types including PLUS
- **Fall Speed**: 400ms | **Score Multiplier**: 2.0x
- **Wild Dice**: 2% chance | **Black Dice**: 2%

**🟣 Zen Mode**
- **Dice Types**: 4-10 sided dice
- **Pieces**: All basic shapes | **No Game Over**
- **Fall Speed**: 1200ms | **Score Multiplier**: 0.8x
- **Wild Dice**: 8% chance (enhanced) | **Black Dice**: None

### 📊 Scoring & Strategy

**Score Calculation**
- **Base Points**: sum of die sides × match size × matched number
- **Chain Multiplier**: floor(log2(chain_index)) for each cascade level
- **Ultimate Combo**: 5x multiplier applied to all subsequent cascades
- **Mode Multipliers**: Easy (1.0x), Medium (1.2x), Hard (1.5x), Expert (2.0x), Zen (0.8x)

**Strategic Tips**
- **Create large matches** (4+ dice) for powerful size-based clearing effects
- **Plan cascade setups** by creating unstable formations that will fall and create new matches
- **Use Wild dice strategically** to complete difficult matches and trigger Ultimate Combos
- **Aim for long cascade chains** (up to 10) to maximize exponential score multipliers
- **Higher difficulty modes** provide greater score multipliers but increased challenge

### 📱 Cross-Platform Responsive Design

The game automatically adapts to your screen size:

**📱 Mobile (≤1080px)**
- **Cell Size**: 24x24px optimized for touch
- **Positioning**: Grid positioned 10px from left for thumb accessibility
- **Typography**: 16px minimum with dynamic scaling
- **Controls**: Touch gestures with swipe detection

**💻 Desktop (≤1600px)**
- **Cell Size**: 32x32px for comfortable viewing
- **Positioning**: Grid centered both horizontally and vertically
- **Typography**: 20px minimum with scaling up to 40px
- **Controls**: Keyboard with auto-repeat functionality

**🖥️ Fullscreen (>1600px)**
- **Cell Size**: Dynamic calculation up to 128px maximum
- **Positioning**: Centered with optimal screen utilization
- **Typography**: 24px minimum scaling up to 48px
- **Enhanced UI**: Expanded game area with additional features

**Real-time Adaptation**: 
- Monitors screen changes with debouncing
- Recalculates all measurements automatically
- Debug buttons (M/D/F) for testing different display modes
- Handles resize, fullscreen, and orientation changes seamlessly

## What You Can Play Right Now

**🎮 Complete Gravity-Matching Puzzle Game**
- **Full Tetromino Control**: 8 different shapes (I, O, T, L, J, S, Z, PLUS) with rotation and collision detection
- **Finite State Machine**: GameStateController with 6 phases (SPAWN → DROP_CONTROL → LOCK → MATCH → CLEAR_MATCH → CASCADE)
- **Advanced Match Detection**: Flood-fill algorithm detects 3+ adjacent dice with matching numbers
- **Size-Based Effects**: 5 different clearing effects (standard, line clear, wild spawn, area clear, grid clear)
- **Autonomous Dice System**: SimpleDie objects extend Phaser.GameObjects.Container and manage their own movement through preUpdate() system
- **Special Dice Mechanics**: Wild dice (*), Black dice (X), and Ultimate Combo system with 5x multiplier
- **Cross-Platform Design**: Real-time adaptation to mobile (≤1080px), desktop (≤1600px), and fullscreen (>1600px) displays
- **Professional Visual System**: Clean procedural rendering with responsive scaling and dynamic typography
- **Comprehensive Input**: Keyboard controls with auto-repeat, touch gesture recognition, phase-based input control
- **Next Piece Preview**: Visual preview system showing upcoming Tetromino shapes with proper matrix rendering

**🏗️ Professional Game Architecture**
- **Complete Scene Flow**: Boot → Preloader → StartMenu → Game with proper transitions
- **Responsive Design**: Real-time adaptation across all screen sizes and orientations with debug testing (M/D/F buttons)
- **Event-Driven Architecture**: GameStateController coordinates all game flow through finite state machine
- **Advanced Input Handling**: InputManager with gesture recognition and phase-based enabling/disabling
- **Sophisticated Game Logic**: Grid collision detection, match processing, and cascade chain reactions
- **MovementManager**: Tracks autonomous dice movement with explicit registration/unregistration and completion events

## Current Game Experience

### 🎮 What You'll Play

When you launch Dicetrix, you'll experience a complete, polished puzzle game with the following gameplay flow:

1. **Boot Scene**: Quick initialization with Dicetrix branding and asset preloading
2. **Start Menu**: Clean interface with "DICETRIX" title (Nabla font) and "START GAME" button (Stalinist One font)
3. **Game Scene**: Immediately playable 10x20 grid with falling Tetromino pieces and responsive design
4. **Finite State Machine**: GameStateController manages 6 distinct phases with automatic input enabling/disabling
5. **Piece Control**: Use arrow keys (desktop) or swipe gestures (mobile) to control falling pieces during DROP_CONTROL phase
6. **Autonomous Locking**: Pieces lock automatically using dice matrix positioning when they can't fall further
7. **Match Detection**: Advanced flood-fill algorithm detects 3+ adjacent dice with matching numbers in MATCH phase
8. **Size Effects**: Experience different clearing effects based on match size (3-9+ dice) in CLEAR_MATCH phase
9. **Cascade System**: Watch dice fall autonomously through preUpdate() system and create chain reactions in CASCADE phase
10. **Responsive Design**: Game automatically adapts to your screen size with debug testing buttons (M/D/F)

### 🎯 Current Game Features

**Fully Implemented Systems:**
- ✅ Complete Tetromino piece control (8 shapes: I, O, T, L, J, S, Z, PLUS) with matrix-based positioning
- ✅ Finite State Machine with 6 phases (SPAWN → DROP_CONTROL → LOCK → MATCH → CLEAR_MATCH → CASCADE)
- ✅ Advanced match detection using flood-fill algorithm
- ✅ Autonomous dice movement through SimpleDie objects extending Phaser.GameObjects.Container with preUpdate() system
- ✅ MovementManager with explicit registration/unregistration and completion events
- ✅ Size-based clearing effects (3, 4, 5, 7, 9+ dice matches) with proper effect triggering
- ✅ Cascade chain reactions with score multipliers using floor(log2(chain_index))
- ✅ Real-time responsive design with mobile (≤1080px), desktop (≤1600px), fullscreen (>1600px) detection
- ✅ Professional input system with phase-based enabling/disabling and gesture recognition
- ✅ Next piece preview system with proper shape matrix rendering and centering
- ✅ Score tracking and display with real-time updates using Stalinist One font
- ✅ Debug buttons for testing display modes (M/D/F) with forced mode switching

**Game Mode Status:**
- ✅ Easy Mode: Fully playable (4-6 sided dice, simple pieces, 1000ms fall speed)
- 🔧 Other Modes: Configured but not yet selectable in UI (Medium, Hard, Expert, Zen)

## Development

### Quick Start

```bash
npm install
npm run dev      # Start development server with Devvit playtest
npm run build    # Build for production (client + server)
npm run deploy   # Deploy to Reddit
npm run launch   # Publish for review
npm run check    # Run code quality checks
```

### Testing the Game

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Playtest URL**
   - Open the provided playtest URL (e.g., `https://www.reddit.com/r/dice-trix_dev?playtest=dice-trix`)
   - Click "Launch App" to open the game in fullscreen mode

3. **Experience the Complete Game**
   - Navigate through: Boot → Preloader → StartMenu → Game
   - Control falling Tetromino pieces with keyboard (arrow keys, space) or touch (swipe gestures, tap to rotate)
   - Create matches of 3+ adjacent dice with the same number using the flood-fill detection system
   - Watch autonomous dice fall and cascade chains trigger with smooth bounce animations
   - Experience size-based effects (standard clear, line clears, wild spawning, area clearing, grid clearing)
   - Test responsive design with M/D/F debug buttons to see real-time layout adaptation
   - Observe the autonomous dice system where individual dice manage their own falling behavior
   - Try different input methods and see auto-repeat functionality for held keys

## Key Features

**🎯 Core Gameplay**
- Revolutionary hybrid mechanics combining Tetromino control with dice matching
- Autonomous dice architecture with self-managing game objects
- Advanced match detection using flood-fill algorithms
- Size-based effects system (3-dice to 9+ dice clearing effects)
- Event-driven cascade chain reactions with score multipliers

**🎮 Technical Excellence**
- Finite state machine architecture with GameStateController
- Real-time responsive design across all devices
- Professional input system with keyboard and touch support
- Comprehensive visual system with procedural rendering
- MovementManager for autonomous dice movement tracking

**🎨 Polish & Experience**
- 5 difficulty modes (Easy, Medium, Hard, Expert, Zen)
- Complete audio system with sound effects
- Smooth animations and visual feedback
- Cross-platform compatibility (mobile, desktop, fullscreen)
- Professional scene management and transitions

## Project Structure

```
src/
├── client/           # Frontend Phaser.js game
│   ├── game/        # Core game logic
│   │   ├── audio/   # Audio management (AudioManager, AudioEvents)
│   │   ├── input/   # Input handling (InputManager, TouchControls)
│   │   ├── models/  # Game entities (Die, Piece, Grid, GameStateManager)
│   │   ├── scenes/  # Phaser scenes (StartMenu, Game, GameOver, etc.)
│   │   ├── systems/ # Game systems (ProgressionSystem, PerformanceMonitor)
│   │   ├── ui/      # Responsive UI system (ResponsiveUISystem, DisplayModeDetector)
│   │   └── visual/  # Visual effects and rendering (DiceRenderer, ParticleEffects)
├── server/          # Backend API for Reddit integration
└── shared/          # Shared types and configurations
    ├── types/       # TypeScript type definitions
    └── config/      # Game mode configurations
```

## Technical Implementation

### Current Architecture

**Phaser.js Game Engine**
- **Phaser.js 3.88.2**: Modern 2D game engine with WebGL rendering and AUTO scaling
- **TypeScript**: Full type safety with strict compilation and project references
- **Scene Management**: Boot → Preloader → StartMenu → ModeSelection → AudioSettings → Game → GameOver
- **Game Configuration**: 1024x768 base resolution with RESIZE scaling mode and responsive adaptation

**Finite State Machine Game Controller**
- **GameStateController**: Manages game flow through 6 distinct phases with event-driven transitions
- **Phase Flow**: SPAWN → DROP_CONTROL → LOCK → MATCH → CLEAR_MATCH → CASCADE (with CASCADE → MATCH loops)
- **Input State Management**: Automatically enables input only during DROP_CONTROL phase
- **Safety Systems**: 5-second timeout per phase with emergency recovery mechanisms
- **Event Coordination**: Uses Phaser's EventEmitter for clean communication between systems

**Autonomous Dice System**
- **SimpleDie Class**: Extends Phaser.GameObjects.Container with self-managed rendering, movement, and lifecycle
- **Autonomous Movement**: Dice handle their own falling through Phaser's preUpdate() system with configurable speed
- **MovementManager**: Tracks dice movement with explicit registration/unregistration and completion events
- **Procedural Rendering**: Clean blue squares (0x4dabf7) with dynamic gold text (0xffd700) using Anta font
- **Responsive Scaling**: Dynamic font sizing and stroke thickness based on cell size with proper centering

**Responsive Design System**
- **Display Mode Detection**: Automatically classifies mobile (≤1080px), desktop (≤1600px), fullscreen (>1600px)
- **Dynamic Cell Sizing**: 24px (mobile), 32px (desktop), up to 128px (fullscreen) with proportional scaling
- **Adaptive Positioning**: Mobile grid positioned 10px from left for thumb accessibility, desktop/fullscreen centered
- **Debug Testing**: M/D/F buttons for real-time display mode testing with forced mode switching
- **Layout Updates**: Handles window resize, fullscreen changes, and orientation automatically with debouncing

**Game Logic Systems**
- **Grid System**: 10x20 playing field with sophisticated collision detection and dice placement using matrix positioning
- **Piece System**: Tetromino shapes with fixed-size square matrices for proper rotation and collision handling
- **Match Processing**: Advanced flood-fill algorithm with size-based effects and Ultimate Combo detection
- **Score System**: Base score calculation with chain multipliers and mode-specific bonuses
- **Audio System**: Comprehensive sound effects with AudioManager and AudioEvents integration*: 10x20 playing field with sophisticated collision detection and dice placement
- **Piece System**: 8 Tetromino shapes (I, O, T, L, J, S, Z, PLUS) with matrix-based rotation and wall kicks
- **Match Detection**: Advanced flood-fill algorithm detects 3+ adjacent dice with matching numbers
- **Size Effects**: Different match sizes trigger unique clearing effects (3, 4, 5, 7, 9+ dice)
- **Cascade Processing**: Chain reactions with exponential score multipliers using floor(log2(chain_index))

**Input System**
- **InputManager**: Handles both keyboard and touch input with gesture recognition
- **Phase-Based Control**: Input automatically enabled/disabled based on GameStateController phase
- **Auto-repeat**: Held keys repeat with 150ms delay and 50ms repeat rate
- **Touch Gestures**: Swipe detection with 50px threshold and double-tap recognition
- **Input Validation**: 50ms cooldown prevents input spam

**Current Implementation Status**
- ✅ Complete finite state machine with 6 phases managing all game flow
- ✅ Autonomous dice movement through SimpleDie objects with MovementManager tracking
- ✅ Event-driven cascade system with proper phase transitions and input control
- ✅ Real-time responsive design across all screen sizes with debug testing
- ✅ Professional input handling with phase-based enabling/disabling
- ✅ Score tracking with real-time updates and next piece preview
- 🔧 Game modes configured but UI selection not yet implemented
- 🔧 Audio system implemented but may need additional sound assets
