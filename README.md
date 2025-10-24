# Dicetrix

A revolutionary puzzle game that combines Tetris-style piece mechanics with dice-based matching and groundbreaking individual die collision physics. Built for Reddit using Phaser.js and the Devvit platform.

## What is Dicetrix?

Dicetrix is an innovative puzzle game that merges three distinct gaming mechanics into one unique experience:

1. **Tetris-Style Pieces**: Multi-die pieces (8 different shapes) fall down an 8x16 grid
2. **Dice Matching**: Create groups of 3+ adjacent dice with matching numbers to clear them  
3. **Individual Die Collision Physics**: Revolutionary system where each die in a multi-piece can collide and lock independently

### The Game Experience

Dicetrix presents players with falling multi-die pieces (similar to Tetris blocks) that contain dice with numbered faces. The innovative twist is the **individual die collision system**: while multi-die pieces start as cohesive units, each die can hit obstacles independently. When some dice in a piece hit obstacles and lock to the grid, the remaining dice continue falling as a smaller active piece. This creates dynamic gameplay where pieces naturally break apart based on the terrain they encounter.

### Revolutionary Individual Die Collision Physics System

The game's signature innovation is its **individual die collision detection system**. Unlike traditional Tetris where entire pieces lock as units, Dicetrix features groundbreaking physics where each die in a multi-piece can collide independently:

**Individual Die Collision System**:
- Each game timer tick checks every die in the active piece for collision individually
- Dice that hit obstacles (bottom, boundaries, or existing pieces) lock to the grid immediately  
- Remaining dice continue falling as a smaller active piece until they also hit obstacles
- This creates natural piece fragmentation based on terrain and existing dice placement
- Players must consider how pieces will break apart when planning their moves

**Enhanced Safety & Validation**:
- Robust boundary validation with position clamping ensures dice never escape the grid
- Safe array management removes locked dice in reverse index order to maintain integrity
- Comprehensive error handling with graceful recovery from invalid states
- Extensive logging system for debugging collision detection and piece state changes

**Bottom-Left Coordinate System**: Uses Y=0 at bottom, Y=15 at top with intuitive physics where pieces fall by decreasing Y coordinates (Y=17→16→15→...→0)

**Strategic Depth**: This system adds strategic complexity as players must consider:
- Traditional piece placement and spatial reasoning  
- How multi-die pieces will naturally fragment when hitting obstacles
- Optimal positioning for creating number matches with both locked and falling dice
- Managing the bottom-left coordinate system for precise placement

### Core Gameplay Mechanics

- **8 Piece Types**: Single die, Line2-4, L3-4, Square, T-shape containing 1-4 dice each
- **Dice Variety**: Each die shows a random number (1 to max sides) and is colored based on die type using a palette system
- **Bottom-Left Coordinate System**: Uses Y=0 at bottom, Y=15 at top for intuitive physics where pieces fall by decreasing Y
- **Intelligent Spawning**: Pieces spawn at Y=17 (close to grid) so pieces enter the visible grid quickly
- **Multi-Input Controls**: Responsive on-screen 3x2 button grid, keyboard (WASD/arrows), and touch input
- **Advanced Match Detection**: Flood-fill algorithm finds connected groups of 3+ matching dice numbers
- **Cascade Chain Reactions**: After clearing matches, remaining dice fall creating potential chain combos
- **5 Difficulty Modes**: Progressive challenge with different dice types (d4-d20) and fall speeds (400-1200ms)
- **Game Over Condition**: Occurs when new piece cannot spawn due to collision at spawn position

## What Makes Dicetrix Innovative?

### 🚀 World-First Game Mechanics Fusion

Dicetrix successfully merges three distinct gaming mechanics that have never been combined before:

- **Tetris spatial reasoning** + **Dice probability matching** + **Individual die physics** = Revolutionary gameplay
- Players must master piece fitting, number positioning, AND dynamic piece fragmentation simultaneously  
- Creates unprecedented strategic depth through the interaction of three game systems

### 🔬 Revolutionary Individual Die Physics Technology

**Individual Die Collision System**:

The game implements a sophisticated collision detection algorithm that handles each die in multi-die pieces independently:

- **Bottom-Left Coordinate System**: Uses Y=0 at bottom, Y=15 at top with FALL_STEP (-1) for intuitive downward movement
- **Independent Die Movement**: Each die in a piece is checked for collision individually during each game tick
- **Selective Locking**: Only dice that hit obstacles lock to the grid, while others continue falling
- **Dynamic Piece Fragmentation**: Multi-die pieces naturally break apart as individual dice encounter obstacles
- **Comprehensive Collision Detection**: Checks bottom boundaries (Y<0), grid boundaries (X bounds), and existing piece collisions for each die
- **Safe Array Management**: Locked dice are removed from active pieces in reverse index order to maintain array integrity
- **Clean State Transitions**: Pieces transition from "multi-die active" to "partially locked" to "fully locked" dynamically

**Enhanced Safety & Validation Systems**:

- **Robust Error Handling**: Try-catch blocks around die locking operations with graceful failure recovery
- **Boundary Validation**: Multiple validation layers ensure dice never escape the 8x16 grid (columns 0-7, rows 0-15)
- **Position Clamping**: Out-of-bounds dice are automatically clamped to valid positions during locking using GridBoundaryValidator
- **Array Integrity Checks**: Validates dice indices before removal and handles duplicate/invalid indices
- **State Consistency Validation**: Comprehensive active piece state validation with automatic recovery
- **Extensive Logging**: Detailed logging system tracks collision events, dice removal, and state changes for debugging

**Advanced Boundary Detection**:

- **Per-Die Collision Analysis**: Each die's position is validated independently against grid boundaries
- **Individual Bottom Boundary Logic**: Each die attempting to move below Y=0 triggers individual locking at valid positions
- **Coordinate Conversion**: Sophisticated coordinate conversion between logical grid positions and screen rendering coordinates
- **Touch Input Integration**: Screen-to-grid coordinate conversion for precise touch-based piece placement

**Why This Approach is Innovative**:

- Combines traditional Tetris piece mechanics with dice-based matching and individual die physics
- Bottom-left coordinate system provides intuitive physics where "down" means decreasing Y values
- Multi-die pieces create dynamic spatial puzzles that change shape based on terrain interaction
- Seamless integration of piece movement, rotation, and individual die collision detection
- Production-ready implementation with comprehensive error handling and state validation

### 🎯 Strategic Innovation Through Individual Die Mechanics

- **Dynamic Strategy Challenge**: Balance Tetris-style spatial fitting + dice number positioning + piece fragmentation prediction
- **Coordinate System Mastery**: Players must understand bottom-left coordinates for precise piece placement
- **Fragmentation Planning**: Anticipating how pieces will break apart when hitting obstacles adds new strategic depth
- **Pattern Recognition**: Creating connected groups of 3+ matching dice with both locked and falling dice
- **Cascade Planning**: Setting up chain reactions through strategic piece placement and match clearing
- **Progressive Difficulty**: Five modes with increasing dice complexity (d4 to d20) and faster fall speeds

## How to Play

### 🚀 Getting Started

1. **Launch the Game**: Run `npm run dev` and open the provided Reddit playtest URL
2. **Navigate the Menu**: The game loads through Boot → Preloader → StartMenu scenes
3. **Select Difficulty**: Choose from 5 color-coded modes in the dropdown menu:
   - 🟢 **Easy** (d4-d6 dice, 1000ms fall speed, 1.0x score multiplier) - Perfect for learning
   - 🟡 **Medium** (d4-d10 dice, 800ms fall speed, 1.1x score multiplier) - Default balanced mode
   - 🔴 **Hard** (d4-d12 dice, 600ms fall speed, 1.25x score multiplier) - Challenging gameplay
   - 🟠 **Expert** (d4-d20 dice, 400ms fall speed, 1.5x score multiplier) - Ultimate challenge
   - 🟣 **Zen** (d4-d10 dice, 1200ms fall speed, 0.9x score multiplier, no gravity) - Relaxed mode
4. **Start Playing**: Click "START GAME" to begin your Dicetrix adventure

### 🎮 Game Flow & Scenes

The game follows a complete scene progression:

1. **Boot Scene**: Initializes Phaser and loads essential assets
2. **Preloader Scene**: Loads game assets and shows loading progress
3. **Start Menu Scene**: 
   - Features the stylized "DICETRIX" title using custom fonts
   - Difficulty selection dropdown with color-coded modes
   - Large "START GAME" button to begin playing
4. **Game Scene**: The main gameplay experience with individual die physics
5. **Game Over Scene**: End game results and restart options

### 🎮 Step-by-Step Gameplay Guide

#### Understanding the Game Interface

**Left Side (Main Game Area)**:
- **Score Display**: Current score shown at the top in gold text with black stroke for visibility
- **Main Grid**: 8x16 playing field with green grid lines and dark blue background (#071021)
- **Bottom-Left Coordinates**: Y=0 is at the bottom, Y=15 is at the top of the visible grid
- **Visual Feedback**: Dice are rendered with colors based on type and show their face numbers clearly

**Right Side (Controls & Info)**:
- **Next Piece Preview**: 4x4 grid showing your upcoming piece with green border and grid-aligned positioning
- **Control Panel**: 3x2 grid of interactive control buttons with symbols (↺ ⇊ ↻ / ← ⇓ →)
- **Booster Slots**: 3x3 grid for future power-ups (currently placeholder with green borders)
- **Leaderboard**: Hidden on mobile for space optimization

#### Basic Gameplay Steps

1. **Piece Spawning**: 
   - Multi-die pieces automatically appear at the top center (X=4, Y=17)
   - 8 different shapes: Single die, Line2-4, L3-4, Square, T-shape
   - Each piece contains 1-4 dice with random numbers based on difficulty
   - Dice colors are determined by a palette system for visual variety

2. **Controlling Pieces**:
   - Use responsive on-screen buttons, keyboard (WASD/arrows), or touch input
   - Move left/right with ← → buttons or A/D keys
   - Rotate with ↺ ↻ buttons or Q/R keys (matrix-based rotation with wall kicks)
   - Soft drop with ⇊ button or S key (moves down one step)
   - Hard drop with ⇓ button or Space key (drops to lowest position)
   - Touch the board directly for precise grid coordinate interaction

3. **Individual Die Physics** (The Innovation):
   - Pieces fall automatically based on difficulty timing (400-1200ms)
   - All dice in a piece start moving together as one unit
   - **Each timer tick checks every die individually for collision**
   - **Only dice that hit obstacles lock to the grid immediately**
   - **Remaining dice continue falling as a smaller active piece**
   - Pieces fall by decreasing Y coordinates (Y=17→16→15→...→0)
   - Safe array management removes locked dice in reverse index order

4. **Creating Matches**:
   - Match 3+ adjacent dice showing the same number using flood-fill detection
   - Only horizontal and vertical connections count (no diagonals)
   - Wild dice system architecture ready for future special pieces
   - Matched groups disappear immediately with visual feedback and score calculation

5. **Cascade System** (except Zen mode):
   - After clearing matches, remaining dice fall to fill gaps using gravity system
   - New matches can form from falling dice, creating chain reactions
   - Chain reactions provide bonus scoring opportunities with score multipliers

6. **Game Over**:
   - Occurs when a new piece cannot spawn due to collision at spawn position
   - Keep the top rows clear to avoid game over

#### Pro Tips for Success

- **Master Individual Die Physics**: Understand how pieces fragment as individual dice hit obstacles
- **Use Next Piece Preview**: Plan positioning using the 4x4 preview grid in the right panel
- **Triple Strategy Balance**: Consider spatial piece fitting + number positioning + fragmentation prediction
- **Height Management**: Keep top rows clear to prevent spawn collision game over at Y=17
- **Fragmentation Planning**: Anticipate how pieces will break apart when hitting terrain
- **Cascade Setup**: Position pieces to create chain reactions (except in Zen mode)
- **Rotation Mastery**: Use matrix-based rotation with wall kicks for complex maneuvers
- **Timing Control**: Strategic use of soft drop and hard drop to control piece positioning before fragmentation

### 🎮 Controls

**Responsive On-Screen Control Grid (3x2 layout)**:

- **Top Row**: ↺ (rotate clockwise) | ⇊ (soft drop) | ↻ (rotate counter-clockwise)  
- **Bottom Row**: ← (move left) | ⇓ (hard drop) | → (move right)
- **Visual Feedback**: Green borders brighten on hover, buttons scale based on screen size
- **Mobile Optimized**: Control size adapts automatically for optimal touch experience

**Comprehensive Keyboard Support**:

- **Arrow Keys**: ← → (move), ↓ (soft drop), ↑ (rotate clockwise)
- **WASD Alternative**: A/D (move), S (soft drop), W (rotate clockwise)  
- **Rotation Keys**: Q (counter-clockwise), R (clockwise), ↑/W (clockwise)
- **Special Actions**: Space (hard drop), Esc (pause/return to menu)
- **Bottom-Left Movement**: Down movement decreases Y coordinates (pieces fall toward Y=0)

**Advanced Touch/Mobile Controls**:

- **Board Touch Detection**: Tap grid positions with automatic screen-to-grid coordinate conversion
- **Drag vs Tap Recognition**: System distinguishes between taps and drags for precise input
- **Touch Callbacks**: Comprehensive touch event system with drag start/move/end detection
- **Responsive Design**: Touch targets automatically scale for optimal mobile experience

**Critical Control Behavior**: 
- Controls affect all remaining dice in the active piece as one unit
- Individual dice lock to the grid when they hit obstacles, while others continue falling
- Pieces respond to all movement and rotation commands until all dice are eventually locked
- Hard drop finds lowest valid Y position for remaining dice by decreasing Y coordinates
- Soft drop moves pieces down by FALL_STEP (-1) in the bottom-left coordinate system

### 🎯 Core Gameplay Loop

1. **Piece Generation & Spawn**: Multi-die pieces spawn at top center and fall automatically

   - 8 different piece shapes: Single, Line2-4, L3-4, Square, T-shape
   - Each piece contains 1-4 dice with random numbers based on difficulty mode
   - Dice colors determined by palette mapping system for visual variety
   - Pieces spawn at Y=17 with lowest die positioned to enter the visible grid quickly
   - Game Over occurs if spawn position is blocked by existing dice

2. **Active Control Phase**: While the piece remains active and controllable

   - Responsive UI with 3x2 control grid and multi-input support (keyboard, touch)
   - Matrix-based rotation with wall kicks and boundary validation
   - All dice in the piece move together as a coordinated unit
   - Touch input with grid coordinate conversion for board interaction

3. **Individual Die Physics**: Revolutionary collision detection system

   - **Timer-Based Falling**: Automatic dropping with intervals based on difficulty (400-1200ms)
   - **Individual Die Movement**: Each tick checks every die in the active piece for collision independently
   - **Selective Collision**: Only dice that would collide lock to the grid, others continue falling
   - **Bottom-Left Coordinate System**: Pieces fall by decreasing Y (Y=17→16→15→...→0), with Y=0 as ground
   - **Comprehensive Per-Die Collision Detection**: Each die checked against bottom boundary, grid boundaries, and existing pieces
   - **Position Clamping**: Out-of-bounds dice are clamped to valid positions during individual locking
   - **Dynamic State Transitions**: Pieces transition from "multi-die active" to "partially locked" to "fully locked"
   - **Safe Array Management**: Locked dice removed from active pieces in reverse index order to maintain integrity

4. **Match Detection & Clearing**: Advanced pattern recognition system

   - Flood-fill algorithm detects connected groups of 3+ matching dice numbers
   - Horizontal and vertical adjacency only (no diagonal matching)
   - Wild dice system architecture ready for future special pieces (isWild property)
   - Immediate clearing with visual feedback and score calculation

5. **Cascade & Gravity System**: Post-clearing physics simulation
   - Column-based gravity compaction fills gaps after clearing matches
   - Chain reaction detection for multi-level cascades and bonus scoring
   - Score multipliers for longer cascade chains based on difficulty mode
   - Completely disabled in Zen mode (allowGravity: false) for relaxed gameplay experience

### 🎲 Game Modes & Strategy

**🟢 Easy Mode**: d4 & d6 dice, 1000ms fall speed, 1.0x score multiplier - Learn basics with frequent matches (numbers 1-6)  
**🟡 Medium Mode**: d4-d10 dice, 800ms fall speed, 1.1x score multiplier - Balanced gameplay (default, numbers 1-10)  
**🔴 Hard Mode**: d4-d12 dice, 600ms fall speed, 1.25x score multiplier - Challenging with rarer matches (numbers 1-12)  
**🟠 Expert Mode**: d4-d20 dice, 400ms fall speed, 1.5x score multiplier - Ultimate challenge with d20 dice (numbers 1-20)  
**🟣 Zen Mode**: d4-d10 dice, 1200ms fall speed, 0.9x score multiplier, no gravity - Relaxed gameplay without cascades

**Advanced Strategies**:

- **Master Individual Die Physics**: Understand how pieces fragment as individual dice hit obstacles
- **Utilize Next Piece Preview**: Plan positioning using the 4x4 preview grid in the right panel
- **Triple Strategy Balance**: Consider spatial piece fitting + number positioning + fragmentation prediction
- **Height Management**: Keep top rows clear to prevent spawn collision game over at Y=17
- **Fragmentation Planning**: Anticipate how pieces will break apart when hitting terrain
- **Cascade Setup**: Position pieces to create chain reactions (except in Zen mode)
- **Rotation Mastery**: Use matrix-based rotation with wall kicks for complex maneuvers
- **Timing Control**: Strategic use of soft drop and hard drop to control piece positioning before fragmentation

## Technical Features

### 🎮 Game Architecture

- **Phaser.js**: Modern 2D game engine with WebGL rendering and responsive scaling
- **Complete Scene Flow**: Boot → Preloader → StartMenu → Game → GameOver with proper asset loading
- **Responsive UI System**: BaseUI class with mobile/desktop layout adaptation (70/30 vs 60/40 splits)
- **Reddit Integration**: Built for Devvit platform with webview integration and Reddit API access
- **TypeScript**: Full type safety with modular architecture and strict compilation

### 🎲 Advanced Game Systems

- **8 Piece Shapes**: Single, Line2-4, L3-4, Square, T-shape with procedural generation
- **Individual Die Collision Physics**: Revolutionary collision detection where each die can lock independently
- **Bottom-Left Coordinate System**: Y=0 at bottom, Y=15 at top with CoordinateConverter for screen mapping
- **Flood-Fill Match Detection**: Advanced algorithm finds connected groups with wild dice support (isWild property)
- **Cascade System**: Column-based gravity with chain reaction detection (disabled in Zen mode)
- **5 Difficulty Modes**: Progressive dice types (d4-d20), fall speeds (400-1200ms), score multipliers (0.9x-1.5x)
- **Multi-Input Support**: Keyboard, gamepad detection, touch/drag with grid coordinate conversion

### 🎯 Professional Implementation

- **Authoritative GameBoard**: Grid-based state management with comprehensive collision detection
- **Matrix-Based Rotation**: Sophisticated piece rotation with wall kicks and boundary validation
- **Procedural Dice Rendering**: Dynamic dice generation using Phaser graphics with color-coded die types
- **Performance Optimized**: Container-based sprite management with efficient rendering pipeline
- **Input Abstraction**: InputHandler class with callback system and cross-platform compatibility
- **Coordinate Conversion**: CoordinateConverter class handles bottom-left to screen coordinate mapping

## Current Status

Dicetrix is a **complete, production-ready puzzle game** with all core systems implemented and working:

✅ **Individual Die Physics** - Revolutionary collision detection with selective die locking and dynamic piece fragmentation  
✅ **Complete Piece System** - 8 piece shapes with matrix-based rotation and boundary validation  
✅ **Advanced Match Detection** - Flood-fill algorithm finds groups of 3+ matching dice with wild dice support  
✅ **Cascade Chain Reactions** - Column-based gravity system with chain reaction detection  
✅ **5 Difficulty Modes** - Progressive difficulty with dice types d4-d20, fall speeds (400-1200ms), score multipliers  
✅ **Responsive UI System** - GameUI class with adaptive layout and 3x2 control grid  
✅ **Multi-Input Support** - Keyboard, touch/drag with grid coordinate conversion, gamepad detection  
✅ **Full Scene Management** - Complete flow: Boot → Preloader → StartMenu → Game → GameOver  
✅ **Professional Architecture** - TypeScript, modular design, asset management, performance optimization  
✅ **Reddit Integration** - Built for Devvit platform with webview integration and Reddit API compatibility

### Recent Updates

- **First Piece Visual Fix Implementation**: Added comprehensive diagnostic timing metrics and validation systems to resolve first piece rendering issues
- **Enhanced Individual Die Collision System**: Implemented robust per-die collision detection with comprehensive error handling and detailed logging
- **Advanced Safety Mechanisms**: Added try-catch blocks, boundary validation, and position clamping using GridBoundaryValidator for production stability
- **Improved Array Management**: Enhanced safe dice removal with duplicate detection and index validation in reverse order
- **State Consistency Validation**: Comprehensive active piece state validation with automatic error recovery mechanisms
- **Extensive Logging System**: Detailed collision event tracking and state change logging for debugging collision scenarios
- **Bottom-Left Coordinate System**: Proper Y=0 at bottom coordinate system with FALL_STEP (-1) for intuitive downward movement
- **Enhanced Rendering System**: CoordinateConverter handles accurate grid-to-screen coordinate mapping for precise dice positioning
- **Responsive UI System**: Adaptive layout with 60/40 split for game board and controls, mobile-optimized touch interface
- **Next Piece Rendering**: Re-enabled next piece preview with grid-aligned positioning in 4x4 display area
- **Comprehensive Test Suite**: Added extensive test coverage for coordinate conversion, spawning, rotation, and collision systems
- **Mixed Collision Handling**: Implemented sophisticated logic to handle scenarios where some dice lock while others continue falling

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
