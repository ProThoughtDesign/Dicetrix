# Dicetrix

A revolutionary puzzle game that combines Tetris-style piece mechanics with dice-based matching and groundbreaking individual die physics. Built for Reddit using Phaser.js and the Devvit platform.

## What is Dicetrix?

Dicetrix merges three game mechanics into one unique experience:

1. **Tetris-Style Pieces**: Multi-die Tetromino pieces (8 different shapes) fall down a 10x20 grid
2. **Dice Matching**: Create groups of 3+ adjacent dice with matching numbers to clear them
3. **Individual Die Physics**: Revolutionary system where each die has independent collision detection

### Revolutionary Individual Die Physics

The game's signature innovation is its **individual die collision detection system**. Each die within a multi-die piece has independent collision detection through an advanced timer-based algorithm:

- Each game timer tick performs collision checks in bottom-to-top, left-to-right order
- Individual dice that hit obstacles lock immediately to the grid and are removed from the active piece
- Remaining dice continue falling independently in subsequent timer cycles
- Pieces naturally break apart as they encounter terrain, creating realistic physics simulation
- Up to 50 collision cycles per timer tick ensure smooth physics processing

This adds strategic depth as players must consider not just piece placement, but how pieces will dynamically separate and where individual dice will land.

### Core Gameplay

- **Multi-die Tetromino pieces** (1-4 dice each) spawn at the top center and fall automatically
- **Player controls**: Move (← →), rotate (↺ ↻), soft drop (⇊), and hard drop (⇓) using responsive on-screen buttons
- **Match detection**: Advanced flood-fill algorithm detects groups of 3+ adjacent dice with matching numbers
- **Cascade system**: After matches clear, remaining dice fall due to gravity, creating chain reactions (disabled in Zen mode)
- **5 difficulty modes**: Easy through Expert (plus Zen mode) with different dice types (d4-d20) and fall speeds
- **Game Over**: Occurs when a new piece cannot spawn due to collision at the top center spawn position

## What Makes Dicetrix Innovative?

### 🚀 World-First Game Mechanics Fusion

Dicetrix successfully merges three distinct gaming mechanics that have never been combined before:

- **Tetris spatial reasoning** + **Dice probability matching** + **Individual die physics** = Revolutionary gameplay
- Players must master piece fitting, number positioning, AND physics anticipation simultaneously
- Creates unprecedented strategic depth through the interaction of three game systems

### 🔬 Breakthrough Individual Die Physics Technology

**Advanced Timer-Based Collision System**:
- Each die within a multi-die piece has independent collision detection with bottom-to-top, left-to-right priority
- Sophisticated algorithm processes up to 50 collision cycles per timer tick to ensure smooth physics
- When dice hit obstacles, they lock immediately to the grid while others continue falling independently
- Pieces transition seamlessly from "controllable unit" to "individual falling dice" mode
- Creates realistic physics where pieces break apart organically based on terrain and obstacles

**Technical Innovation Details**:
- **Collision Priority System**: Dice are evaluated in bottom-left to top-right order to ensure proper physics simulation
- **Multi-Cycle Processing**: Up to 50 collision cycles per timer tick prevent physics bottlenecks
- **State Management**: Active pieces dynamically lose dice as they lock, with remaining dice continuing to fall
- **Sprite Management**: Visual sprites are automatically reparented from active piece container to locked grid container

**Why This Has Never Been Done Before**:
- Most puzzle games use "all-or-nothing" piece locking where entire pieces must land together
- Traditional Tetris doesn't allow piece separation during gameplay
- The technical complexity of individual die state management while maintaining smooth 60fps gameplay has been prohibitive
- Requires sophisticated collision detection algorithms that can handle partial piece locking scenarios

### 🎯 Strategic Innovation

- **Dual Strategy Challenge**: Balance Tetris-style spatial fitting with dice number positioning for matches
- **Physics Anticipation**: Predict how pieces will separate when encountering obstacles and terrain  
- **Dynamic Control System**: Controls work on remaining unlocked dice after partial piece locking
- **Emergent Complexity**: Simple rules create complex strategic scenarios through physics interactions

## How to Play

### 🚀 Getting Started

1. **Launch the Game**: Run `npm run dev` and open the provided Reddit playtest URL
2. **Navigate the Menu**: The game loads through Boot → Preloader → StartMenu scenes
3. **Select Difficulty**: Choose from 5 color-coded modes in the dropdown menu:
   - 🟢 Easy (d4-d6, 1000ms fall speed, slower pace)
   - 🟡 Medium (d4-d10, 800ms fall speed, balanced)
   - 🔴 Hard (d4-d12, 600ms fall speed, faster)
   - 🟠 Expert (d4-d20, 400ms fall speed, fastest)
   - 🟣 Zen (d4-d10, 1200ms fall speed, no gravity)
4. **Start Playing**: Click "START GAME" to begin

### 📋 Step-by-Step Gameplay Instructions

#### Phase 1: Understanding the Interface
1. **Game Grid**: The main 10x20 playing field where dice land and accumulate
2. **Next Piece Preview**: 4x4 grid on the right showing your upcoming piece
3. **Control Panel**: 3x2 grid of control buttons below the next piece preview
4. **Score Display**: Shows your current score at the top of the game grid

#### Phase 2: Controlling Pieces
1. **Piece Spawning**: New pieces automatically appear at the top center (column 4-5)
2. **Movement Controls**:
   - **← →**: Move the active piece left or right
   - **↺ ↻**: Rotate the piece counter-clockwise or clockwise
   - **⇊**: Soft drop (move piece down one row immediately)
   - **⇓**: Hard drop (instantly drop piece to lowest possible position)
3. **Control Limitations**: Once individual dice lock to the grid, they can no longer be controlled

#### Phase 3: Individual Die Physics (The Innovation)
1. **Automatic Falling**: Every 800ms (default), pieces automatically drop one row
2. **Collision Detection**: Each die checks if it can move down independently
3. **Individual Locking**: Dice that hit obstacles or reach the bottom lock immediately
4. **Partial Control**: Remaining unlocked dice can still be controlled as a group
5. **Complete Locking**: When all dice in a piece are locked, a new piece spawns

#### Phase 4: Creating Matches
1. **Match Requirements**: Connect 3+ dice with the same number horizontally or vertically
2. **Match Detection**: The game automatically detects and highlights matches
3. **Clearing**: Matched dice disappear from the grid immediately
4. **Wild Dice**: Special dice that match any number (if present in your mode)

#### Phase 5: Cascade System (Except Zen Mode)
1. **Gravity Application**: After matches clear, remaining dice fall down to fill gaps
2. **Chain Reactions**: Falling dice can form new matches automatically
3. **Multiple Cascades**: Chain reactions can trigger additional cascades
4. **Scoring Bonus**: Longer cascade chains provide score multipliers

#### Phase 6: Game Over Conditions
1. **Spawn Blocking**: Game ends when a new piece cannot spawn due to blocked spawn position
2. **Critical Height**: Keep the top rows clear to prevent early game over
3. **Strategic Planning**: Balance clearing matches with maintaining playable space

### 🎮 Basic Controls

**On-Screen Control Grid (3x2 layout)**:
- **← →**: Move pieces left/right across the grid (only affects remaining unlocked dice)
- **↺ ↻**: Rotate pieces counter-clockwise/clockwise using matrix rotation (only affects remaining unlocked dice)
- **⇊**: Soft drop (accelerate falling by one row)
- **⇓**: Hard drop (instantly drop to lowest valid position, then trigger collision detection)
- **ESC**: Return to main menu

**Important**: Controls only work on dice that haven't been locked yet. Once individual dice lock to the grid, they can no longer be controlled.

### 🎯 Core Gameplay Loop

1. **Piece Spawn**: Multi-die Tetromino pieces spawn at top center (x=4, y=0) and fall automatically
   - 8 different piece shapes: Single, Line2-4, L3-4, Square, T-shape
   - Each piece contains 1-4 dice with random numbers based on difficulty mode
   - Game Over occurs if spawn position is blocked

2. **Controllable Phase**: While dice remain unlocked in the active piece
   - Use controls to move, rotate, and position pieces strategically
   - All unlocked dice in the piece move together as a unit
   - Controls become ineffective as individual dice lock to the grid

3. **Individual Die Physics Phase**: Advanced collision detection system
   - Each timer tick (800ms default) processes up to 50 collision cycles
   - Collision checks in bottom-to-top, left-to-right priority order
   - Individual dice that cannot move down lock immediately to the grid
   - Locked dice are removed from the active piece and become permanent grid cells
   - Remaining dice continue falling independently in subsequent timer cycles
   - Process continues until all dice are locked or can move freely

4. **Match Detection**: When 3+ adjacent dice show the same number
   - Advanced flood-fill algorithm automatically detects connected groups
   - Matches must be horizontally or vertically adjacent (not diagonal)
   - Wild dice match any number for flexible combinations
   - Matched dice are immediately cleared from the grid

5. **Cascade System**: After matches clear (except in Zen mode)
   - Remaining dice fall due to gravity using column compaction
   - Falling dice can create new matches for satisfying chain reactions
   - Multiple cascade levels create scoring opportunities

### 🎲 Game Modes & Strategy

**🟢 Easy Mode**: d4 & d6 dice, 1000ms fall speed, 1.0x score multiplier - Learn the basics with frequent matches
**🟡 Medium Mode**: d4-d10 dice, 800ms fall speed, 1.1x score multiplier - Balanced gameplay (default)  
**🔴 Hard Mode**: d4-d12 dice, 600ms fall speed, 1.25x score multiplier - Challenging with rare matches
**🟠 Expert Mode**: d4-d20 dice, 400ms fall speed, 1.5x score multiplier - Ultimate challenge
**🟣 Zen Mode**: d4-d10 dice, 1200ms fall speed, 0.9x score multiplier, no gravity - Relaxed gameplay

**Winning Strategies**:
- **Master Individual Die Physics**: Learn to predict how pieces will separate when encountering obstacles
- **Plan Ahead**: Use the next piece preview (4x4 grid in right panel) to prepare positioning
- **Balance Dual Strategy**: Consider both Tetris-style piece fitting AND dice number positioning
- **Manage Grid Height**: Keep upper rows clear to prevent game over when spawning new pieces at (4,0)
- **Set Up Cascades**: Position pieces to create chain reactions after matches clear (except in Zen mode)
- **Use Rotation Wisely**: Matrix-based rotation with boundary checking allows complex piece manipulation
- **Control Timing**: Use soft drop and hard drop strategically to control when collision detection occurs

## Technical Features

### 🎮 Game Architecture
- **Phaser.js 3.x**: Modern 2D game engine with WebGL rendering and responsive scaling
- **Complete Scene Flow**: Boot → Preloader → StartMenu → Game → GameOver
- **Responsive Design**: Dynamic layout system adapts to mobile, desktop, and fullscreen viewing
- **Reddit Integration**: Built for Devvit platform to run within Reddit posts

### 🎲 Advanced Game Systems
- **8 Tetromino Shapes**: Single, Line2-4, L3-4, Square, T-shape pieces with multi-die composition
- **Revolutionary Individual Die Physics**: Bottom-to-top collision detection with up to 50 cycles per timer tick
- **Flood-Fill Match Detection**: Automatically finds groups of 3+ adjacent matching dice with same numbers
- **Cascade System**: Column-based gravity creates chain reactions (disabled in Zen mode)
- **5 Difficulty Modes**: Progressive dice types (d4-d20), fall speeds (400-1200ms), and score multipliers (0.9x-1.5x)
- **Timer-Based Gameplay**: Automatic piece dropping with configurable intervals based on difficulty

### 🎯 Professional Implementation
- **TypeScript**: Full type safety with strict compilation and modular architecture
- **Authoritative GameBoard**: 10x20 grid with comprehensive collision detection and state management
- **Matrix-Based Rotation**: Sophisticated piece rotation with normalization and boundary checking
- **Asset Management**: Preloaded dice images (d4, d6, d8, d10, d12, d20) with procedural fallbacks
- **Performance Optimized**: Efficient rendering with container-based sprite management for smooth 60fps gameplay
- **Collision Safety**: Boundary clamping prevents dice from locking outside valid grid positions

## Current Status

Dicetrix is a **complete, production-ready puzzle game** with all core systems implemented and working:

✅ **Revolutionary Individual Die Physics** - Bottom-to-top collision detection with multi-cycle processing  
✅ **Complete Tetromino System** - 8 piece shapes with matrix-based rotation and boundary checking  
✅ **Advanced Match Detection** - Flood-fill algorithm with Wild dice support finds groups of 3+ matching dice  
✅ **Cascade Chain Reactions** - Column-based gravity system creates satisfying chain reactions  
✅ **5 Difficulty Modes** - Progressive difficulty with dice types d4-d20, fall speeds, and score multipliers  
✅ **Professional UI** - Responsive 3x2 control grid with dynamic layout system  
✅ **Full Scene Management** - Complete game flow: Boot → Preloader → StartMenu → Game → GameOver  
✅ **Reddit Integration** - Built for Devvit platform with seamless webview integration and asset loading

## Development

### Quick Start

```bash
npm install
npm run dev      # Start development server with Devvit playtest
npm run build    # Build for production
npm run deploy   # Deploy to Reddit
npm run launch   # Publish for review
```

### Testing the Game

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Playtest URL**
   - Open the provided playtest URL (e.g., `https://www.reddit.com/r/dicetrix_dev?playtest=dicetrix`)
   - Click "Launch App" to open the game in fullscreen mode

3. **Experience the Complete Game**
   - Navigate through: Boot → Preloader → StartMenu → Game
   - Control multi-die Tetromino pieces using on-screen buttons
   - Watch pieces naturally break apart with individual die physics
   - Create matches of 3+ adjacent same-number dice to clear them
   - Experience cascade chain reactions as dice fall after clearing
   - Try different difficulty modes for varied gameplay experiences

### Project Structure

```
src/
├── client/           # Frontend Phaser.js game
│   ├── game/        # Core game logic
│   │   ├── scenes/  # Game scenes (Boot, StartMenu, Game, GameOver)
│   │   ├── logic/   # Game systems (GameBoard, Grid, MatchDetector)
│   │   ├── config/  # Game mode configurations
│   │   └── visuals/ # Rendering (DiceRenderer, visual effects)
├── server/          # Backend API for Reddit integration
└── shared/          # Shared types and configurations
```

## License

This project is licensed under the MIT License.
