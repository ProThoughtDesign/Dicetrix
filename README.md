# Dicetrix

A revolutionary gravity-matching puzzle game that combines Tetris-style piece mechanics with dice-based matching and groundbreaking individual die collision physics. Built for Reddit using Phaser.js and the Devvit platform, featuring a comprehensive audio system with algorithmic musical compositions and professional sound effects management for immersive gameplay.

## 🎮 Game Overview

**Dicetrix** is a complete, fully-playable puzzle game that takes the familiar concept of falling pieces and revolutionizes it with individual die physics. Unlike traditional Tetris where entire pieces lock as units, each die in a multi-die piece can collide and lock independently, creating dynamic piece fragmentation that adds unprecedented strategic depth.

**Key Features:**
- 🧩 **8 Piece Types**: Single die, Line2-4, L3-4, Square, T-shape containing 1-4 dice each
- 🎲 **5 Difficulty Modes**: Easy (d4-d6) to Expert (d4-d20) with varying fall speeds and dice complexity
- ⚡ **Individual Die Physics**: Revolutionary collision system where pieces dynamically break apart
- 🎵 **Algorithmic Music**: Procedurally generated compositions for each game mode
- 📱 **Cross-Platform**: Responsive design supporting keyboard, touch, and on-screen controls
- 🔊 **Professional Audio**: Comprehensive sound effects with dice-matching specific audio feedback

## What is Dicetrix?

Dicetrix is a revolutionary gravity-matching puzzle game that combines Tetris-style piece mechanics with dice-based matching and groundbreaking individual die collision physics. Built for Reddit using Phaser.js and the Devvit platform, it features a comprehensive audio system with algorithmic musical compositions and professional sound effects management for immersive gameplay.

**The Core Innovation**: Dicetrix introduces a groundbreaking collision detection system where each die in multi-die pieces can collide and lock independently. This creates dynamic gameplay scenarios impossible in traditional puzzle games - pieces naturally break apart as individual dice encounter obstacles, creating terrain-based strategy where players must predict how pieces will fragment based on the existing grid layout.

### Core Innovation: Individual Die Physics System

The game's signature innovation is its **individual die collision detection system**. Unlike traditional Tetris where entire pieces lock as units, Dicetrix features groundbreaking physics where each die in a multi-piece can collide independently:

- **Dynamic Piece Fragmentation**: Multi-die pieces naturally break apart as individual dice encounter obstacles - a T-shaped piece might have its center die lock while the arms continue falling
- **Terrain-Based Strategy**: Players must predict how pieces will fragment based on the existing grid layout - uneven terrain causes pieces to break apart in unique ways  
- **Continuous Action**: Unlike Tetris where pieces lock as complete units, Dicetrix pieces can partially lock while remaining dice continue falling, maintaining constant gameplay flow
- **Strategic Depth**: Combines traditional spatial reasoning with fragmentation prediction and number matching - players must think in three dimensions simultaneously

**Technical Implementation**: Each game tick processes every die individually for collision detection. When a piece falls, each die checks for collisions against the bottom boundary, grid walls, and existing pieces. Only dice that would collide are immediately locked to the grid, while remaining dice continue falling as a smaller active piece.

### Three-Dimensional Puzzle Challenge

Dicetrix successfully merges three distinct gaming mechanics that have never been combined before:

1. **Tetris-Style Pieces**: 8 different multi-die shapes (single die, lines, L-shapes, squares, and T-shapes) fall down an 8x16 grid
2. **Dice Matching**: Create connected groups of 3+ adjacent dice with matching numbers to clear them and score points
3. **Individual Die Physics**: Revolutionary system where each die can collide and lock independently, creating dynamic piece fragmentation

**The Game Experience**: Players control falling multi-die pieces containing dice with numbered faces (d4, d6, d8, d10, d12, d20 depending on difficulty). The innovative twist is the **individual die collision system**: while multi-die pieces start as cohesive units, each die can hit obstacles independently. When some dice in a piece hit obstacles and lock to the grid, the remaining dice continue falling as a smaller active piece.

**Current Game State**: Dicetrix is a complete, fully-playable puzzle game with all core systems implemented. The game features a professional scene flow from animated splash screen through multiple difficulty modes, comprehensive audio system with algorithmic music generation, and sophisticated individual die physics that creates unique gameplay scenarios impossible in traditional puzzle games.

### Complete Game Experience

Dicetrix is a **fully-featured puzzle game** that takes players on a journey from an animated splash screen through multiple difficulty modes with sophisticated gameplay mechanics. The game features a complete scene progression: Boot → Preloader → SplashScreen → StartMenu → Settings → Game → GameOver, each with polished visuals and smooth transitions.

**Opening Experience**: Players are greeted with a captivating animated splash screen featuring falling dice with realistic physics, random color tints, and smooth animations. The interactive "Press any key to play Dicetrix" text pulses with professional typography, and the system supports keyboard, mouse, and touch input across all devices.

**Menu System**: The start menu features the stylized "DICETRIX" title with custom Nabla font, a color-coded difficulty selection dropdown with visual feedback, and professional UI elements. Players can access a dedicated Settings scene for comprehensive audio configuration with independent music and sound effect controls.

**Core Gameplay**: The main game presents an 8x16 grid where multi-die pieces (containing 1-4 dice each) fall from the top. The revolutionary innovation is the **individual die collision system** - while pieces start as cohesive units, each die can hit obstacles independently. When some dice in a piece collide and lock to the grid, the remaining dice continue falling as a smaller active piece.

**Audio System**: Features an algorithmic music system that creates musical compositions for each game mode using Strudel patterns. Each difficulty mode has its own unique musical identity with layered arrangements and dynamic effects processing - all generated procedurally. The system includes comprehensive sound effects for gameplay actions, UI interactions, and special events, with professional audio controls and settings persistence.

### Core Gameplay Loop

**Piece Movement & Control**: Multi-die pieces spawn at the top center of an 8x16 grid and fall automatically. Players control them using responsive on-screen buttons (3x2 grid), keyboard controls (WASD/arrows), or touch input. Each piece contains 1-4 dice with numbered faces based on the selected difficulty mode.

**Individual Die Physics**: As pieces fall, each die is checked for collisions independently. When some dice hit obstacles (bottom boundary, walls, or existing pieces), they lock to the grid immediately while remaining dice continue falling as a smaller active piece. This creates dynamic piece fragmentation based on terrain.

**Matching & Scoring**: Players create matches by connecting 3+ adjacent dice with the same number (horizontal/vertical only). Matched groups disappear immediately, and remaining dice fall to fill gaps, potentially creating cascade chain reactions for bonus scoring.

**Progressive Difficulty**: Five modes from Easy (d4-d6 dice) to Expert (d4-d20 dice) with varying fall speeds and score multipliers, plus a relaxed Zen mode without cascades.

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

**Bottom-Left Coordinate System**: Uses Y=0 at bottom, Y=15 at top with intuitive physics where pieces fall by decreasing Y coordinates (Y=16→15→14→...→0)

**Strategic Depth**: This system adds strategic complexity as players must consider:
- Traditional piece placement and spatial reasoning  
- How multi-die pieces will naturally fragment when hitting obstacles
- Optimal positioning for creating number matches with both locked and falling dice
- Managing the bottom-left coordinate system for precise placement

### Core Gameplay Mechanics

- **8 Piece Types**: Single die, Line2-4, L3-4, Square, T-shape containing 1-4 dice each
- **Dice Variety**: Each die shows a random number (1 to max sides) and is colored based on die type using a palette system
- **Bottom-Left Coordinate System**: Uses Y=0 at bottom, Y=15 at top for intuitive physics where pieces fall by decreasing Y
- **Intelligent Spawning**: Pieces spawn at Y=16 (above grid) so pieces enter the visible grid quickly
- **Multi-Input Controls**: Responsive on-screen 3x2 button grid, keyboard (WASD/arrows), and touch input
- **Advanced Match Detection**: Flood-fill algorithm finds connected groups of 3+ matching dice numbers
- **Cascade Chain Reactions**: After clearing matches, remaining dice fall creating potential chain combos
- **5 Difficulty Modes**: Progressive challenge with different dice types (d4-d20) and fall speeds (400-1200ms)
- **Algorithmic Music System**: Musical compositions for each game mode with Strudel patterns and procedural generation
- **Game Over Condition**: Occurs when new piece cannot spawn due to collision at spawn position

## What Makes Dicetrix Innovative?

### 🚀 Revolutionary Individual Die Physics System

**The Core Innovation**: Dicetrix introduces a groundbreaking collision detection system where each die in multi-die pieces can collide and lock independently. This creates dynamic gameplay scenarios impossible in traditional puzzle games:

- **Dynamic Piece Fragmentation**: Multi-die pieces naturally break apart as individual dice encounter obstacles - a T-shaped piece might have its center die lock while the arms continue falling
- **Terrain-Based Strategy**: Players must predict how pieces will fragment based on the existing grid layout - uneven terrain causes pieces to break apart in unique ways
- **Continuous Action**: Unlike Tetris where pieces lock as complete units, Dicetrix pieces can partially lock while remaining dice continue falling, maintaining constant gameplay flow
- **Strategic Depth**: Combines traditional spatial reasoning with fragmentation prediction and number matching - players must think in three dimensions simultaneously
- **Real-Time Physics**: Each game tick processes every die individually for collision detection and selective locking, creating fluid and responsive gameplay

**Technical Implementation**: The game processes each die in a multi-die piece independently during every game tick. When a piece falls, each die checks for collisions against the bottom boundary, grid walls, and existing pieces. Only dice that would collide are immediately locked to the grid, while remaining dice continue falling as a smaller active piece. This creates natural piece fragmentation based on the terrain each piece encounters.

### 🎯 Three-Dimensional Puzzle Challenge

Dicetrix successfully merges three distinct gaming mechanics that have never been combined before:

- **Tetris spatial reasoning** + **Dice probability matching** + **Individual die physics** = Revolutionary gameplay experience
- Players must master piece fitting, number positioning, AND dynamic piece fragmentation simultaneously - no other puzzle game requires this triple-layer strategy
- Creates unprecedented strategic depth through the interaction of three game systems working together in real-time
- **Unique Challenge**: Unlike traditional Tetris where pieces lock as complete units, Dicetrix pieces dynamically break apart based on terrain, requiring players to think about how a 4-piece line will fragment when it hits uneven ground, or how an L-shape will split when only part of it encounters obstacles

**Example Gameplay Scenarios**:
- A 4-die line piece encounters an obstacle with its bottom die → that die locks immediately at the collision point, while the remaining 3 dice continue falling as a smaller line piece
- An L-shaped piece hits uneven terrain → some dice lock in gaps while others continue falling until they encounter their own obstacles
- A T-piece approaches the bottom → the center die locks first when it hits Y=0, while the side dice continue falling until they also reach the bottom or hit existing pieces

### 🎮 Complete Game Experience

**Professional Scene Flow**: Dicetrix features a sophisticated progression through multiple polished scenes:
- **Animated Splash Screen**: Captivating introduction with falling dice physics, random color tints, and interactive "Press any key to play" prompt
- **Main Menu**: Stylized "DICETRIX" title with custom fonts, color-coded difficulty selection dropdown, and professional UI elements
- **Settings Scene**: Comprehensive audio configuration with independent music/sound effect controls, volume sliders, and test buttons
- **Game Scene**: Full gameplay experience with responsive controls, real-time scoring, and next piece preview
- **Game Over Scene**: End game results with options to restart or return to menu

**Advanced UI System**: The game includes a responsive GameUI with a 60/40 split layout (game board on left, controls on right), featuring:
- Real-time score display with gold text and black stroke for visibility
- Next piece preview in a 4x4 grid with green borders and grid-aligned positioning
- 3x2 interactive control button grid with clear symbols (↺ ⇊ ↻ / ← ⇓ →)
- Pause menu with compact audio controls for in-game adjustments
- Mobile-responsive design that adapts to different screen sizes

**Multi-Input Support**: Comprehensive input handling supporting keyboard (WASD/arrows), touch/drag with grid coordinate conversion, and on-screen button controls for optimal cross-platform gameplay.

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
- **Audio Integration**: Each locked die triggers piece placement sound effects for immediate feedback

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

**Audio-Enhanced Gameplay**:

- **Match-Size Audio Feedback**: Different sound effects for 3, 4, 5, 7, and 9+ dice matches provide immediate feedback
- **Combo Sound Effects**: Chain multipliers trigger escalating combo sounds (2x, 3x, 4x+)
- **Movement Audio**: Piece placement, rotation, and drop actions have distinct sound effects
- **State Audio**: Game events like level up, game over, pause/resume have appropriate audio cues

**Why This Approach is Innovative**:

- Combines traditional Tetris piece mechanics with dice-based matching and individual die physics
- Bottom-left coordinate system provides intuitive physics where "down" means decreasing Y values
- Multi-die pieces create dynamic spatial puzzles that change shape based on terrain interaction
- Seamless integration of piece movement, rotation, and individual die collision detection
- Production-ready implementation with comprehensive error handling and state validation
- Enhanced with specialized audio feedback system for dice-matching gameplay

### 🎯 Strategic Innovation Through Individual Die Mechanics

- **Dynamic Strategy Challenge**: Balance Tetris-style spatial fitting + dice number positioning + piece fragmentation prediction
- **Coordinate System Mastery**: Players must understand bottom-left coordinates for precise piece placement
- **Fragmentation Planning**: Anticipating how pieces will break apart when hitting obstacles adds new strategic depth
- **Pattern Recognition**: Creating connected groups of 3+ matching dice with both locked and falling dice
- **Cascade Planning**: Setting up chain reactions through strategic piece placement and match clearing
- **Progressive Difficulty**: Five modes with increasing dice complexity (d4 to d20) and faster fall speeds

### 🎵 Comprehensive Audio System

Dicetrix features a comprehensive audio system that combines algorithmic music generation with professional sound effects management:

**Algorithmic Music System**:
- **Mode-Specific Musical Compositions**: Each difficulty mode has its own unique musical identity:
  - **Menu Theme**: Welcoming ambient atmosphere for navigation
  - **Easy Mode**: Relaxed, encouraging gameplay music with gentle rhythms
  - **Medium Mode**: Moderately energetic music with balanced complexity
  - **Hard Mode**: Intense, driving music with complex patterns
  - **Expert Mode**: Maximum intensity with polyrhythmic elements
  - **Zen Mode**: Calm, meditative compositions for relaxed gameplay
- **Algorithmic Composition**: Uses procedural music generation with multi-layered musical arrangements
- **Music Transition System**: Smooth crossfading between different game states and modes
- **Procedural Generation**: All music generated algorithmically using code patterns

**Professional Audio Management**:
- **Cross-Browser Compatibility**: Automatic format detection and fallback support (MP3 primary format)
- **Development-Friendly Features**: Graceful handling of missing audio files with silent placeholders
- **Browser-Specific Optimization**: Format preferences optimized for universal compatibility
- **Memory Management**: Efficient audio loading and cleanup systems

**Advanced Audio Controls System**:
- **Interactive Audio Button**: One-click audio activation with visual state management (muted 🔇 / unmuted 🔊)
- **Real-Time Audio Feedback**: Immediate volume adjustment with visual feedback
- **Settings Persistence**: Automatic save/load of audio preferences to localStorage
- **Mobile-Responsive Design**: Adaptive layout optimized for all device types with proper touch target sizing
- **Browser Compatibility**: Handles autoplay policies and AudioContext initialization properly

**Comprehensive Sound Effects Library**:
- **Dice-Matching Sounds**: Specialized sound effects for different dice match sizes (3, 4, 5, 7, 9+ dice matches)
- **Gameplay Sounds**: Piece placement, rotation, drop, dice matches, level up, game over, pause/resume
- **UI Interaction Sounds**: Button clicks, menu navigation, settings changes, mode selection
- **Special Effect Sounds**: Combo effects (2x, 3x, 4x+), perfect clear, warning alerts
- **Advanced Audio Management**: 
  - Volume control and enable/disable for sound effects
  - Cooldown system prevents audio spam during rapid interactions
  - Graceful handling of missing audio files with automatic fallbacks
  - Real-time volume adjustment and persistent settings
- **Enhanced Pause Menu Audio**: Compact audio controls in pause menu for in-game adjustments
- **Settings Integration**: Dedicated Settings scene with independent music/sound effect controls

### 🎬 Immersive Splash Screen Experience

The game opens with a captivating animated splash screen that sets the tone for the entire experience:

- **Falling Dice Animation**: 1-3 dice spawn at random intervals (200-800ms) with realistic gravity physics
- **Visual Variety**: Six different dice types (d4, d6, d8, d10, d12, d20) with random color tints from a carefully curated palette
- **Interactive Design**: Pulsing "Press any key to play Dicetrix" text with smooth alpha transitions (0.6-1.0)
- **Multi-Platform Input**: Supports keyboard, mouse clicks, and touch input for seamless game entry
- **Audio Integration**: Automatically initializes the game's algorithmic audio system on first user interaction
- **Professional Polish**: Proper cleanup of animations and timers during scene transitions
- **Performance Optimized**: Object pooling system with 30 pooled dice sprites and mobile-specific optimizations
- **Error Handling**: Comprehensive error handling with graceful fallbacks and performance monitoring
- **Mobile Features**: Touch feedback system and battery-conscious animation timing for mobile devices

## 🎵 Enhanced Audio System

### Dice-Match Audio System

The game features a sophisticated audio system specifically designed for dice-matching gameplay:

- **Specialized Dice-Match Sounds**: Different sound effects for different match sizes:
  - 3 dice matches → `dice-match-3` sound effect
  - 4 dice matches → `dice-match-4` sound effect  
  - 5 dice matches → `dice-match-5` sound effect
  - 7 dice matches → `dice-match-7` sound effect
  - 9+ dice matches → `dice-match-9` sound effect
- **Smart Fallback System**: Unsupported match sizes automatically map to the closest appropriate sound
- **Combo Audio Integration**: Chain multipliers trigger special combo sound effects (2x, 3x, 4x+)
- **Enhanced SoundEffectLibrary**: New `playDiceMatch()` method with backward compatibility for development
- **Graceful Degradation**: Maintains functionality even when audio files are missing during development

### Interactive Audio Button

The start menu includes a responsive audio button with cross-platform support:

- **Visual State Management**: Muted (🔇) and unmuted (🔊) speaker icons with loading states
- **One-Click Audio Activation**: Enables audio context and starts menu music with a single click
- **Toggle Functionality**: Click again to stop music and return to muted state
- **Mobile-Responsive Design**: Proper touch target sizing and responsive behavior across devices
- **Error Handling**: Graceful degradation when audio systems fail, maintaining button functionality
- **Browser Compatibility**: Handles autoplay policies and AudioContext initialization properly

## How to Play Dicetrix

### 🚀 Getting Started

1. **Launch the Game**: Run `npm run dev` and open the provided Reddit playtest URL in your browser
2. **Experience the Splash Screen**: The game opens with a captivating animated introduction featuring:
   - Falling dice with random color tints and realistic physics simulation
   - Six different dice types (d4, d6, d8, d10, d12, d20) spawning at random intervals
   - Interactive "Press any key to play Dicetrix" text - press any key, click, or tap to continue
   - Automatic audio system initialization for the full musical experience
3. **Navigate the Menu**: Choose from 5 color-coded difficulty modes:
   - 🟢 **Easy** (d4-d6 dice, 1000ms fall speed) - Perfect for learning the mechanics
   - 🟡 **Medium** (d4-d10 dice, 800ms fall speed) - Recommended starting point
   - 🔴 **Hard** (d4-d12 dice, 600ms fall speed) - Challenging gameplay
   - 🟠 **Expert** (d4-d20 dice, 400ms fall speed) - Ultimate challenge with rare d20 matches
   - 🟣 **Zen** (d4-d10 dice, 1200ms fall speed, no gravity) - Focus on pure matching without time pressure
4. **Configure Audio**: Click the audio button (🔇/🔊) to enable/disable music and sound effects
5. **Access Settings**: Click "SETTINGS" for detailed audio configuration with independent music/sound effect controls
6. **Start Playing**: Click "START GAME" to begin your Dicetrix adventure

### 🎯 Basic Gameplay Rules

**Objective**: Create connected groups of 3+ adjacent dice with matching numbers to clear them and score points while managing falling multi-die pieces that can fragment dynamically.

**Game Over**: Occurs when a new piece cannot spawn due to collision at the spawn position (Y=16).

**Scoring**: Points are awarded based on match size, dice face values, and cascade multipliers. Larger matches and chain reactions yield higher scores.

### 🎮 Controls

**Keyboard Controls**:
- **WASD** or **Arrow Keys**: Move piece left/right/down, rotate
- **A/Left Arrow**: Move piece left
- **D/Right Arrow**: Move piece right  
- **S/Down Arrow**: Soft drop (move piece down faster)
- **W/Up Arrow**: Rotate piece clockwise
- **Q**: Rotate piece counter-clockwise
- **Space**: Hard drop (instantly drop piece to lowest valid position)

**On-Screen Controls** (3x2 button grid):
- **Top Row**: Rotate Counter-Clockwise (↺) | Hard Drop (⇊) | Rotate Clockwise (↻)
- **Bottom Row**: Move Left (←) | Soft Drop (⇓) | Move Right (→)

**Touch Controls**:
- **Tap buttons**: Use on-screen control buttons
- **Touch/Drag**: Direct piece manipulation (experimental)

### 🎲 Understanding Individual Die Physics

**The Revolutionary Innovation**: Unlike traditional Tetris where entire pieces lock as units, Dicetrix features individual die collision detection:

1. **Multi-Die Pieces**: Pieces contain 1-4 dice that start as cohesive units
2. **Independent Collision**: Each die is checked for collisions individually every game tick
3. **Selective Locking**: Only dice that hit obstacles lock to the grid immediately
4. **Dynamic Fragmentation**: Remaining dice continue falling as a smaller active piece
5. **Terrain-Based Breaking**: Pieces fragment differently based on existing grid layout

**Example Scenarios**:
- **T-Piece on Uneven Ground**: Center die hits obstacle and locks, while arm dice continue falling
- **Line Piece Partial Landing**: Bottom dice lock when hitting existing pieces, top dice keep falling
- **L-Piece Corner Collision**: Corner die locks in a gap, rest of piece continues as smaller unit

### 🎮 Game Flow & Scenes

The game follows a complete scene progression with professional architecture:

1. **Boot Scene**: Initializes Phaser and loads essential assets
2. **Preloader Scene**: 
   - Loads dice assets (d4, d6, d8, d10, d12, d20) from `/assets/dice/` directory
   - Features loading screen with high-contrast text (white with black stroke)
   - No audio files to load - all audio is generated algorithmically
   - Transitions to SplashScreen for audio system initialization
3. **Splash Screen Scene**: 
   - Animated introduction with falling dice featuring random color tints and physics
   - Object pooling system for optimal performance (30 pooled sprites, max 20 active)
   - Interactive text prompting "Press any key to play Dicetrix" with pulsing animation
   - Mobile detection and optimization with touch feedback system
   - Performance monitoring with FPS tracking and battery-conscious mode
   - Handles critical audio initialization on first user interaction
   - Comprehensive error handling with graceful fallbacks
4. **Start Menu Scene**: 
   - Features the stylized "DICETRIX" title using custom Nabla font with auto-scaling
   - Color-coded difficulty selection dropdown with visual feedback
   - Large "START GAME" button with image-based design and fallback text button
   - Settings access button for audio configuration
   - Font loading system with fallbacks for browser compatibility
5. **Settings Scene**: 
   - Complete audio configuration with independent music/sound effect toggles
   - Volume sliders and test buttons for immediate feedback
   - Settings persistence using the Settings service
   - Professional UI with 2x scaling factor for optimal visibility
6. **Game Scene**: 
   - Main gameplay experience with individual die physics system
   - Comprehensive UI with responsive controls and next piece preview
   - Real-time score tracking and cascade multiplier system
   - Multi-input support (keyboard, touch, on-screen buttons)
7. **Game Over Scene**: End game results and restart options

### 🎮 Step-by-Step Gameplay Guide

#### Understanding the Game Interface

**Left Side (Main Game Area - 60% of screen)**:
- **Score Display**: Current score shown at the top in gold text with black stroke for visibility
- **Main Grid**: 8x16 playing field with green grid lines and dark blue background (#071021)
- **Bottom-Left Coordinates**: Y=0 is at the bottom, Y=15 is at the top of the visible grid (intuitive physics)
- **Visual Feedback**: Dice are rendered with colors based on type (d4=red, d6=blue, d8=green, etc.) and clearly show their face numbers
- **Active Pieces**: Multi-die pieces fall and can be controlled until individual dice lock to the grid
- **Match Footer**: Dynamic text showing match results and cascade information

**Right Side (Controls & Info - 40% of screen)**:
- **Next Piece Preview**: 4x4 grid showing your upcoming piece with green border and grid-aligned positioning
- **Control Panel**: 3x2 grid of interactive control buttons with clear symbols (↺ ⇊ ↻ / ← ⇓ →)
- **Booster Slots**: 3x3 grid for future power-ups (currently placeholder with green borders)
- **Leaderboard**: Hidden on mobile devices for optimal space utilization

#### Core Gameplay Mechanics

**1. Piece Movement & Control**
- **Multi-Die Pieces**: 8 different piece types spawn at the top center (X=3, Y=16) containing 1-4 dice each
- **Control Options**: Use keyboard (WASD/arrows), on-screen buttons, or touch/drag input
- **Individual Die Physics**: Each die in a piece can collide and lock independently - this is the game's revolutionary innovation
- **Bottom-Left Coordinate System**: Y=0 at bottom, Y=15 at top - pieces fall by decreasing Y coordinates

**2. Individual Die Collision System**
- **Dynamic Fragmentation**: When a multi-die piece falls, each die is checked for collisions individually
- **Selective Locking**: Only dice that hit obstacles (bottom, walls, or existing pieces) lock to the grid immediately
- **Continued Falling**: Remaining dice continue falling as a smaller active piece until they also hit obstacles
- **Terrain-Based Breaking**: Pieces naturally fragment based on the existing grid layout and obstacles

**3. Dice Matching & Scoring**
- **Match Creation**: Connect 3+ adjacent dice with the same number (horizontal/vertical only)
- **Cascade Chains**: Matched groups disappear, remaining dice fall, potentially creating chain reactions
- **Scoring System**: Points based on match size, dice numbers, and cascade multipliers
- **Match Sizes**: Different sound effects play for 3, 4, 5, 7, and 9+ dice matches

**4. Difficulty Progression**
- **Easy Mode**: d4-d6 dice, 1000ms fall speed - perfect for learning the mechanics
- **Medium Mode**: d4-d10 dice, 800ms fall speed - recommended starting point
- **Hard Mode**: d4-d12 dice, 600ms fall speed - challenging gameplay
- **Expert Mode**: d4-d20 dice, 400ms fall speed - ultimate challenge with rare d20 matches
- **Zen Mode**: d4-d10 dice, 1200ms fall speed, no gravity - focus on pure matching

#### Strategic Gameplay Tips

**1. Master Individual Die Physics**
- **Fragmentation Prediction**: Anticipate how pieces will break apart when hitting uneven terrain
- **Terrain Management**: Create strategic gaps and platforms to control how pieces fragment
- **Partial Locking**: Use the fact that some dice lock while others continue falling to your advantage

**2. Coordinate System Mastery**
- **Bottom-Left Understanding**: Remember Y=0 is at the bottom - pieces fall by decreasing Y values
- **Precise Placement**: Use the coordinate system for exact piece positioning and collision prediction
- **Spawn Awareness**: Pieces spawn at Y=16 (above visible grid) and enter at Y=15

**3. Advanced Matching Strategy**
- **Chain Setup**: Position dice to create cascade reactions when matches are cleared
- **Number Management**: Balance different dice types to create matching opportunities
- **Combo Building**: Set up multiple matches to trigger combo multipliers (2x, 3x, 4x+)

**4. Multi-Layer Strategy**
- **Spatial Reasoning**: Traditional Tetris-style piece fitting
- **Number Positioning**: Strategic placement for dice matching
- **Fragmentation Planning**: Predicting and controlling how pieces will break apart buttons with clear symbols (↺ ⇊ ↻ / ← ⇓ →)
- **Pause Menu**: Access audio controls and game options during gameplay

#### How to Play: Complete Step-by-Step Guide

**Step 1: Launch & Navigate**
- Run `npm run dev` and open the provided Reddit playtest URL
- Experience the animated splash screen with falling dice physics (d4, d6, d8, d10, d12, d20 with random color tints)
- Press any key, click, or tap to continue to the main menu
- Select your difficulty mode from the color-coded dropdown:
  - 🟢 **Easy**: d4-d6 dice, slower pace (1000ms), perfect for learning the mechanics
  - 🟡 **Medium**: d4-d10 dice, balanced gameplay (800ms) - recommended starting point
  - 🔴 **Hard**: d4-d12 dice, challenging gameplay (600ms) with rarer high-number matches
  - 🟠 **Expert**: d4-d20 dice, ultimate challenge (400ms) with very rare d20 matches
  - 🟣 **Zen**: d4-d10 dice, relaxed pace (1200ms) with no cascade gravity for pure matching focus
- Click the audio button (🔇/🔊) to enable music and sound effects
- Click the large "START GAME" button to begin your Dicetrix adventure

**Step 2: Master Piece Control**
- **8 Piece Types**: Single die, Line2-4, L3-4, Square, T-shape (containing 1-4 dice each)
- **Movement**: Use ← → to move horizontally, ⇊ for soft drop, ⇓ for hard drop
- **Rotation**: Use ↺ ↻ to rotate pieces (matrix-based rotation with intelligent wall kicks)
- **Alternative Controls**: Keyboard (WASD/arrows), touch input, or on-screen buttons

**Step 3: Master Individual Die Physics (The Key Innovation)**
- **Revolutionary System**: Each die in multi-die pieces can collide independently during each game tick
- **How It Works**: As pieces fall, each die checks for collisions separately against bottom boundary, grid boundaries, and existing pieces
- **Selective Locking**: Only dice hitting obstacles lock immediately to the grid, while remaining dice continue falling as a smaller active piece
- **Dynamic Fragmentation**: Multi-die pieces naturally break apart based on the terrain they encounter

**Step 4: Create Dice Matches**
- **Matching Rule**: Connect 3+ adjacent dice with the same number (horizontal/vertical only)
- **Cascade System**: When matches are cleared, remaining dice fall to fill gaps, potentially creating chain reactions
- **Scoring**: Earn points based on match size, dice complexity, and cascade multipliers
- **Special Matches**: Larger matches (5, 7, 9+ dice) trigger special sound effects and higher scores

**Step 5: Strategic Mastery**
- **Triple-Layer Strategy**: Balance Tetris-style spatial fitting + dice number positioning + piece fragmentation prediction
- **Fragmentation Planning**: Anticipate how pieces will break apart when hitting obstacles
- **Pattern Recognition**: Set up chain reactions through strategic piece placement
- **Progressive Challenge**: Each difficulty mode introduces new dice types and faster gameplay() method
- **Dynamic Fragmentation**: Remaining dice continue falling as smaller active pieces until they also hit obstacles
- **Strategic Impact**: Pieces naturally break apart based on terrain they encounter, creating unique strategic scenarios

**Step 5: Create Matches & Score Points**
- **Objective**: Connect 3+ adjacent dice showing the same number (horizontal/vertical adjacency only)
- **Match Detection**: Uses flood-fill algorithm to find connected groups of matching dice numbers
- **Clearing**: Matched groups disappear with animated visual feedback and specialized dice-match sound effects
- **Dice-Match Audio**: Different sound effects play based on match size (3, 4, 5, 7, or 9+ dice matches)
- **Scoring Formula**: Points = (match size × number value + total die faces) × cascade multiplier
- **Example**: A 4-die match of 6s = (4 × 6 + total sides) × multiplier

**Step 6: Trigger Cascade Chain Reactions** (Disabled in Zen Mode)
- **Gravity Effect**: After clearing matches, remaining dice fall using column-based gravity to fill gaps
- **Chain Combos**: New matches can form automatically from falling dice, creating cascade chains
- **Combo Audio**: Special combo sound effects (2x, 3x, 4x+) play for chain multipliers
- **Multiplier Bonus**: Each cascade level increases your score multiplier (starts at 1, increases per cascade)
- **Strategic Setup**: Plan initial matches to create maximum chain reactions for exponential scoring

**Step 7: Avoid Game Over & Advanced Strategy**
- **End Condition**: Game ends when new pieces cannot spawn due to collision at spawn position (Y=17)
- **Prevention**: Keep top rows (Y=14-15) clear to provide spawning space for new pieces
- **Advanced Tactics**: 
  - Predict how pieces will fragment when individual dice hit terrain and existing pieces
  - Use fragmentation strategically to position dice in optimal locations for matches
  - Balance three simultaneous challenges: spatial piece fitting + number matching + fragmentation prediction
  - Set up cascade chains by creating matches that will cause falling dice to form additional matches
  - Manage the bottom-left coordinate system for precise piece placement and collision prediction

#### Pro Tips for Mastering Dicetrix

- **🎯 Master Individual Die Physics**: Learn to predict how pieces will fragment as individual dice hit obstacles - this is the key to advanced play
- **👀 Use Next Piece Preview**: Always plan your next move using the 4x4 preview grid in the right panel
- **🧠 Triple Strategy Balance**: Simultaneously consider spatial piece fitting + number matching + fragmentation prediction
- **🔊 Audio Feedback**: Listen to the specialized dice-match sound effects to understand match sizes without looking
- **⚡ Cascade Setup**: Create matches that will cause falling dice to form additional matches for combo multipliers
- **🎮 Control Mastery**: Use keyboard (WASD/arrows), touch input, or on-screen buttons - find what works best for you
- **📱 Mobile Optimization**: The game is fully responsive with touch-friendly controls and proper mobile scaling
- **⏸️ Pause Menu Audio**: Use the in-game pause menu to adjust audio settings without leaving the game
- **🎵 Mode-Specific Music**: Each difficulty mode has unique algorithmic music - let it guide your gameplay rhythm
- **🔄 Rotation Strategy**: Use wall kicks when rotation is blocked - the game will try multiple positions automaticallyeously consider spatial piece fitting + number positioning + fragmentation prediction
- **📏 Height Management**: Keep the top rows (Y=14-15) clear to prevent spawn collision game over
- **💥 Fragmentation Planning**: Anticipate how pieces will break apart when hitting terrain and existing dice
- **⛓️ Cascade Setup**: Position pieces strategically to create chain reactions and bonus scoring (except in Zen mode)
- **🔄 Rotation Mastery**: Use matrix-based rotation with intelligent wall kicks for complex maneuvers in tight spaces
- **⏱️ Timing Control**: Master soft drop and hard drop to control piece positioning precisely before fragmentation occurs
- **🎵 Audio Experience**: Immerse yourself in mode-specific musical compositions that adapt to your gameplay intensity and provide audio feedback for moves and matches
- **🎮 Control Efficiency**: Learn keyboard shortcuts for faster piece manipulation, especially in higher difficulty modes

### 🎮 Game Controls

**On-Screen Control Grid (3x2 layout)**:
- **Top Row**: ↺ (rotate left) | ⇊ (soft drop) | ↻ (rotate right)  
- **Bottom Row**: ← (move left) | ⇓ (hard drop) | → (move right)

**Keyboard Controls**:
- **Arrow Keys**: ← → (move), ↓ (soft drop), ↑ (rotate clockwise)
- **WASD**: A/D (move), S (soft drop), W (rotate clockwise)  
- **Rotation**: Q (counter-clockwise), E (clockwise)
- **Special**: Space (hard drop), Esc (pause/menu)

**Touch/Mobile Controls**:
- **Tap Controls**: Use the on-screen button grid for all actions
- **Board Touch**: Tap grid positions for direct piece interaction
- **Responsive Design**: Controls automatically scale for optimal mobile experience

### 🎲 Difficulty Modes

**🟢 Easy Mode**: d4 & d6 dice, 1000ms fall speed, 1.0x score multiplier
- Perfect for learning the mechanics with frequent matches (numbers 1-6)
- Slower pace allows time to understand individual die physics and piece fragmentation
- Dice colors: d4=red, d6=blue for easy visual identification

**🟡 Medium Mode**: d4-d10 dice, 800ms fall speed, 1.1x score multiplier  
- Balanced gameplay with moderate challenge (default recommended mode, numbers 1-10)
- Good mix of common and rare numbers for strategic depth
- Additional dice types: d8=green, d10=yellow

**🔴 Hard Mode**: d4-d12 dice, 600ms fall speed, 1.25x score multiplier
- Challenging gameplay with rarer high-number matches (numbers 1-12)
- Faster pace requires quick decision-making and fragmentation prediction
- Includes d12=purple dice for even more matching complexity

**🟠 Expert Mode**: d4-d20 dice, 400ms fall speed, 1.5x score multiplier
- Ultimate challenge with d20 dice creating very rare high-number matches (numbers 1-20)
- Extremely fast pace with maximum strategic complexity
- Full dice spectrum including d20=orange for the ultimate matching challenge

**🟣 Zen Mode**: d4-d10 dice, 1200ms fall speed, 0.9x score multiplier, no cascade gravity
- Relaxed gameplay without cascade chain reactions (gravity disabled)
- Focus purely on piece placement and matching without time pressure or chain complexity
- Perfect for learning individual die physics without the added complexity of cascading matches

### 🎯 The Revolutionary Individual Die Physics System

**What Makes This System Unique**:

Dicetrix introduces a groundbreaking collision detection system that processes each die individually during every game tick. This creates unprecedented gameplay scenarios where multi-die pieces can partially lock while remaining dice continue falling.

**Technical Implementation**:
- **Bottom-Up Processing**: Dice are processed in Y-ascending order (bottom first) so that newly locked dice become obstacles for dice above them
- **Per-Die Collision Detection**: Each die checks independently against bottom boundary (Y<0), grid boundaries, and existing pieces
- **Selective Locking**: Only dice that would collide are locked immediately using `gameBoard.lockCell()` method
- **Dynamic Piece Updates**: Successfully locked dice are removed from the active piece using safe array management
- **Coordinate System**: Uses bottom-left coordinates (Y=0 at bottom) with FALL_STEP (-1) for intuitive downward movement
- **Comprehensive Error Handling**: Try-catch blocks, boundary validation, and position clamping ensure robust collision handling

**Gameplay Impact**:
- **Natural Piece Breaking**: Multi-die pieces fragment based on terrain they encounter, not predetermined patterns
- **Strategic Depth**: Players must predict how pieces will break apart when planning moves and rotations
- **Continuous Action**: Unlike traditional Tetris, pieces don't lock as complete units - gameplay flows continuously
- **Terrain-Based Strategy**: Existing grid layout directly affects how new pieces will fragment and where dice will land

**Example Scenarios**:
- A 4-die line piece hits an obstacle with its bottom die → that die locks immediately, remaining 3 dice continue falling as a smaller line
- An L-shaped piece encounters uneven terrain → some dice lock in gaps while others continue falling until they hit obstacles
- A T-piece hits the bottom → center die locks first at Y=0, side dice continue falling until they also hit the bottom or existing pieces

This system transforms traditional Tetris spatial reasoning into a multi-dimensional puzzle requiring players to think about piece placement, number matching, AND dynamic fragmentation simultaneously.ection system that processes each die in multi-die pieces independently. This creates dynamic gameplay scenarios impossible in traditional puzzle games:

**Technical Implementation**:
- **Timer-Based Processing**: Every game tick (400-1200ms based on difficulty) checks each die individually
- **Independent Collision Detection**: Each die is tested against bottom boundary, grid boundaries, and existing pieces
- **Selective Locking**: Only dice that would collide lock to the grid immediately
- **Dynamic Fragmentation**: Remaining dice continue falling as a smaller active piece
- **Bottom-Left Coordinate System**: Uses Y=0 at bottom, pieces fall by decreasing Y coordinates (Y=16→15→14→...→0)

**Gameplay Impact**:
- **Natural Piece Breaking**: Multi-die pieces fragment based on terrain they encounter
- **Strategic Depth**: Players must predict how pieces will break apart when planning moves
- **Continuous Action**: Unlike traditional Tetris, pieces don't lock as complete units
- **Terrain-Based Strategy**: Existing grid layout directly affects how new pieces will fragment

**Example Scenarios**:
- A 4-die line piece hits an obstacle with its bottom die → that die locks, remaining 3 dice continue falling
- An L-shaped piece encounters uneven terrain → some dice lock while others fall into gaps
- A T-piece hits the bottom → center die locks first, side dice continue until they hit obstacles

This system transforms traditional Tetris spatial reasoning into a multi-dimensional puzzle requiring players to think about piece placement, number matching, AND dynamic fragmentation simultaneously.

## Technical Features

### 🎮 Game Architecture

- **Phaser.js**: Modern 2D game engine with WebGL rendering and responsive scaling (1080x1920 portrait design)
- **Complete Scene Flow**: Boot → Preloader → SplashScreen → StartMenu → Settings → Game → GameOver with proper asset loading
- **Professional Architecture**: Modular TypeScript codebase with strict compilation and comprehensive error handling
- **Reddit Integration**: Built for Devvit platform with webview integration and Reddit API access
- **Asset Management**: Efficient loading system for dice textures and audio assets with graceful fallbacks
- **Performance Optimization**: Object pooling, mobile detection, battery-conscious animations, and FPS monitoring

### 🎲 Advanced Game Systems

- **8 Piece Shapes**: Single, Line2-4, L3-4, Square, T-shape with procedural generation
- **Individual Die Collision Physics**: Revolutionary collision detection where each die can lock independently
- **Bottom-Left Coordinate System**: Y=0 at bottom, Y=15 at top with CoordinateConverter for screen mapping
- **Flood-Fill Match Detection**: Advanced algorithm finds connected groups with wild dice support (isWild property)
- **Cascade System**: Column-based gravity with chain reaction detection (disabled in Zen mode)
- **5 Difficulty Modes**: Progressive dice types (d4-d20), fall speeds (400-1200ms), score multipliers (0.9x-1.5x)
- **Revolutionary Comprehensive Audio System**: Complete professional audio experience featuring algorithmic music compositions with advanced Strudel patterns, comprehensive SoundEffectLibrary with 19 categorized sound effects, professional AudioControlsUI with responsive volume sliders and toggle switches, cross-browser compatibility, memory-efficient streaming, settings persistence, and zero file overhead
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
✅ **Cascade Chain Reactions** - Column-based gravity system with chain reaction detection and animated effects  
✅ **5 Difficulty Modes** - Progressive difficulty with dice types d4-d20, fall speeds (400-1200ms), score multipliers  
✅ **Responsive UI System** - GameUI class with adaptive layout and 3x2 control grid  
✅ **Multi-Input Support** - Keyboard, touch/drag with grid coordinate conversion, gamepad detection  
✅ **Full Scene Management** - Complete flow: Boot → Preloader → SplashScreen → StartMenu → Settings → Game → GameOver  
✅ **Professional Architecture** - TypeScript, modular design, asset management, performance optimization  
✅ **Reddit Integration** - Built for Devvit platform with webview integration and Reddit API compatibility  
✅ **Comprehensive Audio System** - Algorithmic music compositions and sound effects library with Strudel patterns, professional AudioAssetManager, AudioControlsUI with responsive controls, enhanced pause menu integration, and cross-browser compatibility  
✅ **Interactive Splash Screen** - Professional animated introduction with object pooling, mobile optimization, and comprehensive error handling

### Recent Updates

- **Complete Individual Die Physics System**: Revolutionary collision detection where each die in multi-die pieces can collide and lock independently:
  - **Bottom-Up Processing**: Dice processed in Y-ascending order so newly locked dice become obstacles for dice above
  - **Per-Die Collision Detection**: Each die checks independently against boundaries and existing pieces during every game tick
  - **Selective Locking**: Only colliding dice lock immediately using `gameBoard.lockCell()` while others continue falling
  - **Dynamic Piece Fragmentation**: Multi-die pieces naturally break apart based on terrain they encounter
  - **Safe Array Management**: Locked dice removed from active pieces using reverse-index removal to maintain array integrity
  - **Comprehensive Error Handling**: Try-catch blocks, boundary validation, and position clamping for production stability
  - **Bottom-Left Coordinate System**: Y=0 at bottom with FALL_STEP (-1) for intuitive downward physics movement
- **Complete Comprehensive Music System Implementation**: Professional audio experience with algorithmic music and sound effects:
  - **Advanced AudioControlsUI Component**: Professional audio controls interface with responsive volume sliders, toggle switches, and settings persistence
  - **Real-Time Audio Feedback**: Immediate volume adjustment with visual feedback and smooth slider animations
  - **Master Mute Override**: Comprehensive mute system that overrides all other audio settings with visual dimming feedback
  - **Settings Persistence**: Automatic save/load of audio preferences to localStorage with validation and error handling
  - **Reset Functionality**: Confirmation dialog for resetting audio settings to defaults with proper cleanup
  - **Mobile-Responsive Design**: Adaptive layout with scaling factors and touch-optimized controls for all device types
  - **Professional Visual Design**: Custom color schemes, smooth animations, and interactive feedback for all audio controls
  - **Enhanced Pause Menu Integration**: Compact audio controls in pause menu for in-game adjustments without requiring scene restart
- **Audio Asset Management System**: Professional audio infrastructure with comprehensive file management:
  - **AudioAssetManager Class**: Comprehensive audio asset management with preloading and validation capabilities
  - **Cross-Browser Compatibility**: Automatic format detection and fallback support (MP3 primary format)
  - **Memory Management**: Efficient audio loading and cleanup systems
  - **Development-Friendly Fallbacks**: Graceful handling of missing audio files with silent placeholders
  - **Comprehensive Validation Tools**: Asset validation, file naming checks, and detailed reporting
  - **Browser-Specific Optimization**: Format preferences optimized for universal compatibility
- **Algorithmic Music System**: Complete audio experience with both music and sound effects:
  - **Musical Compositions**: Algorithmic pieces for each game mode with layered arrangements using Strudel patterns
  - **Mode-Specific Musical Identity**: Each difficulty has unique musical themes (Menu, Easy, Medium, Hard, Expert, Zen) with distinct sonic characteristics
  - **Advanced Strudel Integration**: Multi-layered arrangements with melody, harmony, bass, percussion, and dynamic variations
  - **Dynamic Music Adaptation**: Real-time adaptation based on game state (intensity, speed, tension) with crossfading transitions
  - **Enhanced Hard Mode Music**: Aggressive patterns with heavy distortion, complex percussion, and intense build-ups
  - **Expert Mode Complexity**: Polyrhythmic melodies, chromatic harmonies, and controlled chaos elements
  - **Zen Mode Ambience**: Calm, meditative compositions with ambient textures and natural breathing rhythms
  - **Music Transition System**: Smooth crossfading between different game states and musical themes
  - **Variation Engine**: Subtle, moderate, and dramatic variation levels for dynamic musical experiences
  - **Procedural Generation**: All music generated algorithmically using code patterns
- **Comprehensive Sound Effects Library**: Professional audio feedback system with complete game interaction coverage:
  - **Categorized Sound Effects**: Complete game audio feedback covering gameplay, UI interactions, and special effects
  - **Advanced Audio Management**: Volume control, enable/disable options, cooldown system, and graceful error handling
  - **Intelligent Cooldown System**: Prevents audio spam during rapid interactions with per-sound timing
  - **Dynamic Volume Adjustment**: Context-aware volume scaling based on game state
  - **Settings Integration**: Independent music and sound effect controls with real-time adjustment and persistence
- **Enhanced Splash Screen Implementation**: Professional animated introduction scene with advanced features:
  - Object pooling system with 30 pooled dice sprites for optimal performance
  - Random dice spawning (1-3 dice per interval) with 200-800ms timing and maximum 20 concurrent dice
  - Six different dice types (d4, d6, d8, d10, d12, d20) with random color tints from predefined palette
  - Realistic gravity physics simulation with automatic cleanup of off-screen dice
  - Interactive text prompting "Press any key to play Dicetrix" with smooth pulsing animation (alpha 0.6-1.0)
  - Multi-platform input support (keyboard, mouse, touch) with mobile-specific touch feedback
  - Performance monitoring with FPS tracking and battery-conscious mode for mobile devices
  - Comprehensive error handling with graceful fallbacks and detailed logging
  - Mobile device detection and optimization with responsive animation timing
  - Audio initialization on first user interaction for proper sound functionality
  - Proper scene transition with cleanup of all animations and timers
- **Enhanced Scene Flow**: Integrated SplashScreen between Preloader and StartMenu with proper audio initialization on user interaction
- **Complete Audio System**: Implemented AudioHandler service with singleton pattern, sound effect control, Settings scene integration, and persistent preferences
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
- **Animated Cascade Effects**: Added smooth animations for match clearing and gravity movements with visual feedback
- **Audio Error Resolution**: Fixed "Unable to decode audio data" errors by removing placeholder MP3 files and implementing graceful audio degradation

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
   - Navigate through: Boot → Preloader → SplashScreen → StartMenu → Game
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

---

## Summary

**Dicetrix** is a complete, production-ready puzzle game that revolutionizes the genre by combining Tetris-style piece mechanics with dice-based matching and groundbreaking individual die collision physics. 

**Key Features**:
- 🎮 **Complete Game Experience**: Professional scene flow from animated splash screen to game over
- 🚀 **Revolutionary Physics**: Individual die collision system where pieces dynamically fragment
- 🎲 **Strategic Depth**: Balance spatial reasoning, number matching, and fragmentation prediction
- 🎵 **Comprehensive Audio System**: Complete algorithmic music compositions, professional AudioControlsUI, enhanced pause menu integration, and 19 categorized sound effects with advanced audio management
- 📱 **Multi-Platform**: Responsive design with keyboard, touch, and on-screen controls
- 🎯 **5 Difficulty Modes**: Progressive challenge from Easy (d4-d6) to Expert (d4-d20)
- ⛓️ **Cascade System**: Chain reactions and gravity physics (disabled in Zen mode)
- 🏗️ **Professional Architecture**: TypeScript, Phaser.js, comprehensive error handling

**What Makes It Special**: Unlike traditional Tetris where pieces lock as complete units, Dicetrix features innovative individual die collision physics where each die can hit obstacles independently. This creates unique strategic depth where players must simultaneously consider piece placement, number matching, and dynamic piece fragmentation based on terrain.

**Core Innovation**: The individual die physics system processes each die separately during every game tick, allowing multi-die pieces to partially lock while remaining dice continue falling. This transforms traditional spatial reasoning into a multi-dimensional puzzle requiring players to predict how pieces will fragment when encountering obstacles.

Built for Reddit using the Devvit platform, Dicetrix represents an evolution in puzzle gaming that challenges players to think in multiple dimensions simultaneously while managing an 8x16 grid with bottom-left coordinate physics.

## License

This project is licensed under the MIT License.
