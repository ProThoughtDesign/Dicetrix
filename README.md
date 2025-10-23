# Dicetrix

A sophisticated multi-die Tetris-like puzzle game that combines falling Tetromino pieces made of dice with strategic number matching. Built for Reddit using Phaser.js and the Devvit platform, Dicetrix features multi-die pieces (like Tetris blocks) that spawn and fall down a 10x20 grid, where players can control piece movement, rotation, and placement before they lock into place and create matches when 3 or more adjacent dice show the same numbers.

## What is Dicetrix?

Dicetrix is an innovative puzzle game that merges Tetris-style piece mechanics with dice-based matching gameplay. Multi-die pieces (containing 1-4 dice in various Tetromino shapes like single, line, L-shape, square, and T-shape) spawn at the top center of a 10x20 grid. Players can move, rotate, and drop these pieces strategically before they lock into place. Each die shows a random number based on its type (4, 6, 8, 10, 12, or 20-sided dice depending on difficulty mode). When pieces lock, the game uses an advanced flood-fill algorithm to detect groups of 3 or more adjacent dice with matching numbers, automatically clearing them and causing remaining dice to fall due to gravity, creating satisfying cascade chain reactions.

The game features clean visual design with procedurally rendered dice, responsive layout that adapts to different screen sizes, and complete scene management. Built specifically for Reddit's Devvit platform, it runs seamlessly within Reddit posts and provides an engaging puzzle experience combining spatial reasoning (Tetris-like placement) with pattern matching (dice numbers).

**Current Status**: Dicetrix is a fully functional multi-die puzzle game with sophisticated Tetromino piece mechanics, real-time grid rendering, advanced match detection logic, and gravity-based cascade system. The game includes complete scene flow (Boot → Preloader → StartMenu → Game → GameOver) with working multi-die piece spawning, falling, player controls (move, rotate, drop), locking, match detection, clearing, and cascade mechanics. Players can control piece movement using on-screen controls with full rotation and placement strategy.

## Game Overview

Dicetrix is a multi-die Tetris-like puzzle game where Tetromino pieces made of dice drop from the top center of a 10x20 grid at configurable intervals (400-1200ms depending on difficulty mode). Each piece contains 1-4 dice arranged in classic Tetromino shapes (single, line, L-shape, square, T-shape, etc.). Each die shows a random number based on its type (4, 6, 8, 10, 12, or 20-sided dice depending on selected difficulty mode). Players can control the falling pieces using movement controls (left/right), rotation (clockwise/counter-clockwise), soft drop, and hard drop before they lock into the grid. When pieces lock into position, the game uses advanced flood-fill algorithms to detect groups of 3 or more adjacent dice with matching numbers and clears them instantly, causing remaining dice to fall due to gravity and potentially create satisfying cascade chain reactions.

The core gameplay focuses on **strategic piece placement and rotation** - players control falling multi-die pieces to create optimal matching opportunities and cascade setups. The game combines Tetris-style spatial reasoning with dice-based pattern matching. Different dice types create varying probability distributions for matches (d4 creates more frequent matches than d20). Combined with gravity effects that cause dice to fall after matches are cleared (except in Zen mode), Dicetrix offers a unique puzzle experience that emphasizes strategic placement, rotation planning, pattern recognition, and cascade chain setup.

## What Makes Dicetrix Innovative?

### 🎮 Revolutionary Fusion: Tetris Meets Dice Matching

Dicetrix creates an entirely new puzzle genre by combining two classic game mechanics:

**Tetris-Style Spatial Reasoning + Dice-Based Pattern Matching = Revolutionary Gameplay**
- Players must consider both **piece shape fitting** (like Tetris) AND **dice number positioning** for optimal strategy
- Multi-die pieces require rotation and placement planning while simultaneously considering dice number arrangements
- Creates dual-layer strategic depth: spatial puzzle solving combined with probability-based number matching
- No other game successfully merges these two distinct puzzle mechanics into cohesive gameplay

### 🎯 Advanced Multi-Die Tetromino System

**8 Unique Piece Shapes with Full Rotation**
- **Single**: 1 die for precise placement
- **Line Pieces**: 2-4 dice in straight lines for creating long matches
- **L-Shapes**: 3-4 dice in L formations for corner strategies
- **Square**: 4 dice in 2x2 formation for stable placement
- **T-Shape**: 4 dice in T formation for complex positioning

**Sophisticated Rotation Mechanics**
- Matrix-based rotation system with proper collision detection
- Clockwise and counter-clockwise rotation with wall-kick behavior
- Each piece maintains its dice arrangement through rotations
- Strategic rotation planning required for optimal number positioning

### 🎲 Intelligent Dice System with Strategic Depth

**Multi-Sided Dice with Probability Strategy**
- **5 Dice Types**: d4, d6, d8, d10, d12, d20 with appropriate number ranges
- **Color-Coded System**: Each die type has distinct colors (red, blue, green, yellow, purple, orange, teal, gray)
- **Probability Awareness**: Lower-sided dice (d4) create frequent matches, higher-sided dice (d20) create rare but valuable matches
- **Visual Excellence**: High-contrast numbers with stroke outlines ensure perfect readability on all dice
- **Procedural Rendering**: Dice are rendered with preloaded images and intelligent fallback graphics

**Strategic Multi-Die Piece Control**
- Multi-die Tetromino pieces spawn and fall from the top center of a 10x20 grid every 400-1200ms depending on difficulty mode
- Each piece contains 1-4 dice arranged in classic Tetromino shapes
- Players can control falling pieces using movement (left/right), rotation (clockwise/counter-clockwise), soft drop, and hard drop before they lock into place
- Next piece preview shows the upcoming multi-die piece in a dedicated 4x4 grid side panel for strategic planning
- Creates engaging strategic gameplay combining Tetris-style spatial reasoning with dice pattern matching

### 🔍 Advanced Automatic Match Detection System

**Sophisticated Real-Time Pattern Recognition**
- **Flood-Fill Algorithm**: Efficiently detects connected groups of dice with matching numbers using recursive neighbor checking in real-time
- **Adjacency Matching**: Dice must be horizontally or vertically adjacent (not diagonal) to form matches
- **Minimum Match Size**: Groups of 3 or more dice are automatically detected and cleared instantly
- **Wild Dice Support**: Special wild dice can match with any number, creating strategic cascade opportunities
- **Automatic Cascade System**: When matches clear, remaining dice automatically fall due to gravity, potentially creating satisfying multi-level chain reactions
- **Real-Time Processing**: Match detection and clearing happens instantly as dice lock into the grid

### 🎮 Complete Interactive Control System

**Intuitive Touch and Mouse Controls**
- **3x2 Control Grid**: Large 112px buttons optimized for both desktop and mobile interaction
- **Movement Controls**: Move pieces left/right with precise positioning
- **Rotation System**: Clockwise and counter-clockwise rotation with collision detection
- **Drop Mechanics**: Soft drop (accelerate by one row) and hard drop (instant placement)
- **Visual Feedback**: Button hover effects and responsive design for all screen sizes
- **Keyboard Support**: ESC key for menu navigation and seamless scene transitions

### 🎮 Professional Game Architecture

**Phaser.js Integration**
- **Complete Scene Management**: Full game flow with Boot → Preloader → StartMenu → Game → GameOver transitions and proper state management
- **Responsive Design**: Game automatically adapts to different screen sizes and orientations with dynamic scaling (1024x768 base with RESIZE mode)
- **Real-Time Grid Rendering**: Clean visual representation of the 10x20 playing field with bright green cell outlines (rgb(23, 246, 75)), proper positioning, and smooth updates
- **Advanced Dice Visualization**: Procedurally rendered dice with preloaded images (d4, d6, d8, d10, d12, d20) and intelligent fallback graphics
- **Asset Management**: Complete asset preloading system with progress display and fallback rendering for missing textures
- **Interactive Controls**: On-screen control buttons for movement, rotation, and dropping with touch-friendly design and responsive layout

### 📱 Cross-Platform Compatibility

**Responsive Layout System**
- **Automatic Scaling**: Game adapts to mobile, desktop, and fullscreen viewing
- **Touch-Friendly**: Interface designed to work well on both desktop and mobile devices
- **Reddit Integration**: Built specifically for the Devvit platform to run within Reddit posts
- **Performance Optimized**: Efficient rendering system maintains smooth gameplay across devices

## Current Game Status

**🎮 Fully Functional Multi-Die Puzzle Game**

Dicetrix is a complete, playable multi-die puzzle game with all core mechanics implemented and working:

**✅ Complete Core Systems**
- **Scene Management System**: Full scene flow with Boot → Preloader → StartMenu → Game → GameOver transitions and proper state management
- **Game Board Logic**: Fully functional 10x20 grid with collision detection, multi-die piece placement, and authoritative state management
- **Multi-Die Tetromino System**: 8 different piece shapes containing 1-4 dice spawn at the top center with random numbers based on dice type
- **Advanced Rotation & Movement**: Full 4-way rotation with matrix-based rotation system, collision detection, and precise movement controls
- **Automatic Fall Mechanics**: Multi-die pieces fall automatically at configurable speeds (400ms Expert to 1200ms Zen)
- **Sophisticated Match Detection**: Advanced flood-fill algorithm detects groups of 3+ adjacent dice with matching numbers in real-time
- **Gravity & Cascade System**: After matches clear, remaining dice fall due to gravity and can create satisfying chain reactions
- **Professional Grid Rendering**: Real-time visual representation with bright green cell outlines, multi-die piece positioning, and smooth updates
- **Complete Game Mode System**: Five fully configured difficulty modes with unique dice types, speeds, and multipliers

**🎮 Current Playable Experience**
- **Complete Gameplay Loop**: Multi-die pieces spawn → fall → player controls (move/rotate) → lock → match detection → clearing → gravity → cascades
- **Professional Visual Design**: Real-time grid rendering with procedurally generated dice graphics, high-contrast numbers, and smooth animations
- **Next Piece Preview**: Shows the upcoming multi-die piece in a dedicated 4x4 grid side panel for strategic planning
- **Full Interactive Control**: 3x2 grid of control buttons for movement, rotation (clockwise/counter-clockwise), soft drop, and hard drop
- **Real-Time Score Tracking**: Functional scoring system with live updates, cascade multipliers, and mode-specific bonuses
- **Interactive Mode Selection**: Color-coded dropdown menu to select from 5 difficulty modes with hover effects
- **Responsive Cross-Platform Design**: Game automatically adapts to different screen sizes with proper scaling and touch optimization
- **Professional UI Polish**: Clean interface with proper contrast, stroke outlines, hover effects, and visual feedback

**🎯 Fully Implemented Features**
- **Match Processing**: Groups of 3+ adjacent dice with same numbers are automatically detected and cleared
- **Cascade Reactions**: Gravity causes dice to fall after matches, potentially creating chain reactions
- **Dice Variety**: Different dice types (d4, d6, d8, d10, d12, d20) with appropriate number ranges
- **Visual Polish**: High-contrast text, stroke outlines, color coding, and smooth animations
- **Game State Management**: Proper handling of active pieces, locked pieces, and grid state transitions
- **Asset System**: Preloaded dice images with intelligent fallback to procedural graphics

**Current Experience**: Players can launch Dicetrix and experience a complete multi-die puzzle game. Multi-die Tetromino pieces spawn and fall automatically, players can control their movement and rotation, pieces lock into the grid, form matches when 3+ adjacent dice have the same number, clear automatically, and cause remaining dice to fall in cascade reactions. The game provides engaging spatial reasoning and pattern recognition gameplay with multiple difficulty modes.

#### 🎲 Current Game Mechanics

**Multi-Die Piece Spawning and Control**
- Multi-die Tetromino pieces spawn at the top center of the 10x20 grid at configurable intervals based on difficulty mode
- Players can control falling pieces using on-screen buttons or keyboard controls:
  - **Move Left/Right**: Position pieces horizontally before they lock
  - **Soft Drop**: Accelerate piece falling by one row
  - **Hard Drop**: Instantly drop piece to the lowest valid position
  - **Rotate Left/Right**: Rotate pieces clockwise and counter-clockwise with full collision detection
- Real-time collision detection prevents pieces from moving into occupied spaces or outside grid boundaries
- Pieces automatically lock when they hit the bottom or land on other pieces

**Match Detection System**
- Advanced flood-fill algorithm automatically detects groups of 3+ adjacent dice with matching numbers
- Adjacent means horizontally or vertically connected (not diagonal) for match formation
- Wild dice support: Special wild dice can match with any number for strategic gameplay
- Matches are automatically cleared from the grid with immediate visual feedback

**Gravity and Cascade System**
- After matches are cleared, remaining dice automatically fall due to gravity (except in Zen mode)
- Falling dice can create new matches, leading to cascade chain reactions
- Multiple cascade levels can occur from a single initial match
- Score increases with each cascade level using mode-specific multipliers

**Visual and Audio Feedback**
- Clean procedural dice rendering with high-contrast numbers and color coding
- Bright green grid lines (rgb(23, 246, 75)) at 50% opacity for clear visual boundaries
- Next piece preview in dedicated 4x4 grid side panel showing upcoming multi-die pieces
- Real-time score tracking with automatic updates for matches and cascades
- Smooth piece rotation animations and movement feedback

## How to Play Dicetrix

Dicetrix is a strategic multi-die puzzle game that combines Tetris-style piece mechanics with dice-based matching. You control falling multi-die Tetromino pieces to create matches and cascade reactions. Here's everything you need to know:

### 🎯 Basic Gameplay

**Objective**: Control falling multi-die Tetromino pieces to create groups of 3 or more adjacent dice with matching numbers. Clear matches to score points and prevent the grid from filling up.

**Game Flow**:
1. Multi-die pieces (containing 1-4 dice in Tetromino shapes) spawn at the top center of the 10x20 grid
2. Use controls to move, rotate, and drop pieces strategically before they lock
3. When 3+ adjacent dice show the same number, they automatically clear
4. Remaining dice fall due to gravity, potentially creating cascade chains
5. Continue until the grid fills to the top

**Piece Types**: 8 different Tetromino shapes containing dice:
- **Single**: 1 die for precise placement
- **Line2**: 2 dice in a straight line
- **Line3**: 3 dice in a straight line  
- **Line4**: 4 dice in a straight line
- **L3**: 3 dice in L formation (corner piece)
- **L4**: 4 dice in larger L formation
- **Square**: 4 dice in 2x2 formation (most stable)
- **T-Shape**: 4 dice in T formation (versatile placement)

### 🎮 Controls

**On-Screen Controls** (Touch & Mouse):
- **← →**: Move multi-die piece left/right across the grid
- **↺ ↻**: Rotate piece counter-clockwise/clockwise (90° increments with collision detection)
- **⇊**: Soft drop (accelerate falling by one row for faster placement)
- **⇓**: Hard drop (instantly drop to lowest valid position and lock immediately)

**Keyboard Controls**:
- **ESC**: Return to main menu anytime during gameplay

**Control Layout**: The game features a 3x2 grid of large control buttons (112px each) positioned in the right panel for easy access on both desktop and mobile devices. All buttons include hover effects and are optimized for touch interaction.

### 🎲 Game Mechanics

**Multi-Die Pieces**: Tetromino-style pieces containing multiple dice:
- **8 Piece Shapes**: Single, line2, line3, line4, L3, L4, square, T-shape
- **Advanced Rotation System**: Full 4-way rotation with sophisticated collision detection and matrix-based rotation logic
- **Dice Types**: Different difficulty modes feature different dice types within pieces:
  - **Easy**: d4 (1-4) and d6 (1-6) dice - frequent matches, 1000ms fall speed
  - **Medium**: d4, d6, d8 (1-8), d10 (1-10) dice - balanced gameplay, 800ms fall speed
  - **Hard**: d4 through d12 (1-12) dice - challenging matches, 600ms fall speed
  - **Expert**: d4 through d20 (1-20) dice - rare matches, 400ms fall speed
  - **Zen**: d4 through d10 dice with no gravity - relaxed mode, 1200ms fall speed

**Matching Rules**:
- Groups of 3+ adjacent dice with the same number automatically clear using flood-fill detection
- Adjacent means horizontally or vertically connected (not diagonal)
- Wild dice can match with any number for strategic opportunities
- Matches are detected and cleared instantly when pieces lock into the grid

**Cascade System**:
- After matches clear, remaining dice automatically fall due to gravity (except Zen mode)
- Falling dice can create new matches for satisfying chain reactions
- Multiple cascade levels multiply your score with mode-specific multipliers
- Gravity system uses column-by-column compaction for realistic physics

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

3. **Navigate the Complete Game Interface**
   - **Boot Scene**: Quick initialization with dark blue background
   - **Preloader Scene**: Loads dice images (d4, d6, d8, d10, d12, d20) with "Loading..." progress display
   - **StartMenu Scene**: Professional main menu with bright green "DICETRIX" title, interactive "START GAME" button, and color-coded mode selection dropdown
   - **Game Scene**: Full gameplay with falling multi-die pieces, 10x20 grid with bright green cell outlines, player controls, real-time match detection, and cascade effects
   - **GameOver Scene**: End screen with red "GAME OVER" message and "RETURN TO MENU" option

4. **Experience Multi-Die Tetromino Gameplay**
   - Watch multi-die pieces spawn at the top center of the grid and fall automatically
   - Use the 3x2 control button grid to move, rotate, and drop pieces strategically
   - See pieces lock into place when they hit the bottom or other pieces
   - Watch automatic flood-fill match detection clear groups of 3+ adjacent dice with same numbers
   - Experience gravity effects as remaining dice fall and create satisfying cascade chains

### 🎮 Step-by-Step Gameplay Instructions

#### Step 1: **Launch and Navigate the Professional Menu System**
- Launch the game to see the **Boot Scene** with quick initialization and dark blue background (#0a0a1a)
- **Preloader Scene** loads all dice assets (d4, d6, d8, d10, d12, d20) with "Loading..." progress display and stroke text for contrast
- **StartMenu Scene** features the stylized "DICETRIX" title in bright green (#00ff88) with professional typography
- Use the interactive color-coded mode selection dropdown to choose your preferred difficulty (each mode has a unique color and hover effects)
- Click the "START GAME" button with hover effects to begin the gameplay experience

#### Step 2: **Master the Interactive Multi-Die Puzzle Gameplay**
- Enter the complete **Game Scene** with a functional 10x20 grid, controllable falling multi-die piece mechanics, and responsive layout
- Control multi-die Tetromino pieces that spawn at the top center using the 3x2 grid of control buttons:
  - **← →**: Move pieces left/right across the grid
  - **↺ ↻**: Rotate pieces clockwise/counter-clockwise with collision detection
  - **⇊**: Soft drop to accelerate piece falling by one row
  - **⇓**: Hard drop to instantly place piece at lowest valid position
- Use strategic piece placement and rotation to create groups of 3+ adjacent dice with matching numbers
- Experience cascade chain reactions as gravity causes remaining dice to fall after matches clear (except in Zen mode)
- Watch your score increase in real-time with updates for each match and cascade using mode-specific multipliers

#### Step 3: **Utilize Advanced Game Features**
- **Next Piece Preview**: Plan ahead using the upcoming multi-die piece displayed in the dedicated 4x4 grid side panel
- **Visual Feedback**: See high-contrast dice rendering with clear numbers, bright green grid lines (rgb(23, 246, 75)), and procedural graphics
- **Rotation Mechanics**: Master sophisticated piece rotation with matrix-based rotation system and collision detection
- **Strategic Gameplay**: Balance Tetris-style piece fitting with dice number positioning to create optimal matching opportunities
- **Score Tracking**: Monitor real-time score updates with mode-specific multipliers and cascade bonuses displayed at the top

#### Step 4: **Complete the Full Game Experience**
- **Game Over Detection**: Game automatically ends when the grid fills up to the top, triggering scene transition
- **GameOver Scene**: View your final score with red "GAME OVER" text and interactive "RETURN TO MENU" button
- **Seamless Flow**: Experience the complete cycle from menu → gameplay → game over → menu with proper state management
- **Mode Persistence**: Your selected difficulty mode is remembered between games using the Settings service

### 🎯 Complete Automatic Gameplay Experience

#### 1. **Select Your Difficulty Mode**
- Choose from 5 difficulty modes using the interactive color-coded dropdown in the main menu:
  - **Easy**: d4 and d6 dice (numbers 1-4, 1-6), 1000ms fall speed, 1.0x score multiplier, green color
  - **Medium**: d4, d6, d8, d10 dice, 800ms fall speed, 1.1x score multiplier, yellow color
  - **Hard**: d4-d12 dice, 600ms fall speed, 1.25x score multiplier, red color
  - **Expert**: d4-d20 dice, 400ms fall speed, 1.5x score multiplier, orange color
  - **Zen**: d4-d10 dice, 1200ms fall speed, gravity disabled, 0.9x score multiplier, purple color

#### 2. **Control Falling Dice Strategically**
- Individual dice spawn at the top center (x=5) of the 10x20 grid at mode-specific intervals
- Each die shows a random number based on its type (d4 shows 1-4, d6 shows 1-6, d8 shows 1-8, etc.)
- Use on-screen controls to move dice left/right, rotate them, or drop them faster before they lock
- Next piece preview shows the upcoming die in the dedicated 4x4 grid side panel

#### 3. **Create Strategic Matches**
- Position dice to form groups of 3 or more adjacent dice with the same number
- Advanced flood-fill algorithm automatically detects connected groups when dice lock into the grid
- Adjacent means horizontally or vertically connected (not diagonal) for match formation
- Matched groups are automatically cleared from the grid with immediate visual feedback and score updates

#### 4. **Master Cascade Chain Reactions**
- After matches clear, remaining dice automatically fall due to gravity (except in Zen mode where gravity is disabled)
- Strategically place dice to set up cascade chains where falling dice create new matches
- Multiple cascade levels can occur from well-planned initial placements
- Score increases with each cascade level and match size using mode-specific multipliers

#### 5. **Develop Advanced Strategies**
- Learn probability patterns: d4 dice create matches more frequently than d20 dice due to smaller number ranges
- Plan ahead using the next piece preview to set up optimal matching opportunities
- Master the balance between quick placement and strategic positioning
- Understand how different difficulty modes affect dice distributions and fall speeds
- Experience the difference between gravity-enabled modes and Zen mode's gravity-disabled gameplay



### 🎯 Step-by-Step Gameplay Instructions

#### Step 1: **Launch and Navigate the Professional Menu System**
- Launch the game to see the **Boot Scene** with quick initialization and dark blue background
- **Preloader Scene** loads all dice assets (d4, d6, d8, d10, d12, d20) with "Loading..." progress display and stroke text for contrast
- **StartMenu Scene** features the stylized "DICETRIX" title in bright green (#00ff88) with professional typography
- Use the interactive color-coded mode selection dropdown to choose your preferred difficulty (each mode has a unique color and hover effects)
- Click the "START GAME" button with hover effects to begin the automatic gameplay experience

#### Step 2: **Experience Interactive Multi-Die Puzzle Gameplay**
- Enter the complete **Game Scene** with a functional 10x20 grid, controllable falling multi-die piece mechanics, and responsive layout
- Control multi-die Tetromino pieces that spawn at the top center using on-screen buttons for movement, rotation, and dropping
- Use strategic piece placement and rotation to create groups of 3+ adjacent dice with matching numbers detected by flood-fill algorithms
- Experience cascade chain reactions as gravity causes remaining dice to fall after matches clear (except in Zen mode)
- Watch your score increase in real-time with updates for each match and cascade using mode-specific multipliers
- Use the next piece preview in the 4x4 grid side panel to plan your strategy ahead of time

#### Step 3: **Master Advanced Game Features**
- **Next Piece Preview**: Plan ahead using the upcoming multi-die piece displayed in the dedicated 4x4 grid side panel
- **Interactive Controls**: Use the 3x2 grid of control buttons (move left/right, rotate clockwise/counter-clockwise, soft/hard drop) for precise piece placement
- **Rotation Mechanics**: Master piece rotation with proper collision detection and wall-kick behavior for optimal positioning
- **Visual Polish**: See high-contrast dice rendering with clear numbers, bright green grid lines, and procedural graphics with image fallbacks
- **Strategic Gameplay**: Balance Tetris-style piece fitting with dice number positioning to create optimal matching opportunities
- **Score Tracking**: Monitor real-time score updates with mode-specific multipliers (1.0x-1.5x) and cascade bonuses displayed at the top

#### Step 4: **Complete the Full Game Loop**
- **Game Over Detection**: Game automatically ends when the grid fills up to the top, triggering automatic scene transition
- **GameOver Scene**: View your final score with red "GAME OVER" text and interactive "RETURN TO MENU" button with hover effects
- **Seamless Flow**: Experience the complete cycle from menu → automatic gameplay → game over → menu with proper state management
- **Mode Persistence**: Your selected difficulty mode is remembered between games using the Settings service for convenience

### 🏆 Game Modes & Difficulty Levels

**🟢 Easy Mode** (Green)
- **Dice Types**: d4 and d6 (numbers 1-4 and 1-6)
- **Fall Speed**: 1000ms (1 second per drop)
- **Score Multiplier**: 1.0x
- **Gravity**: Enabled
- Perfect for learning the core mechanics and understanding dice matching patterns with frequent matches

**🟡 Medium Mode** (Yellow - Default)
- **Dice Types**: d4, d6, d8, d10 (numbers 1-4, 1-6, 1-8, 1-10)
- **Fall Speed**: 800ms (moderate pace)
- **Score Multiplier**: 1.1x
- **Gravity**: Enabled
- Balanced gameplay with increased complexity and varied dice types

**🔴 Hard Mode** (Red)
- **Dice Types**: d4, d6, d8, d10, d12 (up to 1-12 numbers)
- **Fall Speed**: 600ms (challenging pace)
- **Score Multiplier**: 1.25x
- **Gravity**: Enabled
- Higher numbers make matches less frequent but more valuable with strategic depth

**🟠 Expert Mode** (Orange)
- **Dice Types**: d4, d6, d8, d10, d12, d20 (maximum complexity with 1-20 numbers)
- **Fall Speed**: 400ms (very fast)
- **Score Multiplier**: 1.5x
- **Gravity**: Enabled
- Ultimate challenge with the widest range of possible numbers and fastest pace

**🟣 Zen Mode** (Purple)
- **Dice Types**: d4, d6, d8, d10 (moderate complexity)
- **Fall Speed**: 1200ms (relaxed pace)
- **Score Multiplier**: 0.9x
- **Gravity**: Disabled (dice don't fall after matches)
- Relaxed gameplay focused on pattern recognition without cascade pressure

### 📊 Scoring & Strategy

**Current Scoring System**
- **Basic Scoring**: Points awarded for each die in a cleared match
- **Match Size Bonus**: Larger matches (4+, 5+, etc.) provide bonus points
- **Cascade Multipliers**: Chain reactions from gravity create score multipliers
- **Mode Multipliers**: Easy (1.0x), Medium (1.1x), Hard (1.25x), Expert (1.5x), Zen (0.9x)

**Strategic Tips for Dicetrix**
- **Dual Strategy**: Balance Tetris-style piece fitting with dice number positioning for optimal play
- **Rotation Mastery**: Learn to rotate pieces efficiently using the matrix-based rotation system to fit tight spaces while positioning dice numbers strategically
- **Pattern Recognition**: Identify potential matches and plan multi-die piece placement accordingly
- **Probability Awareness**: Lower-sided dice (d4, d6) create matches more frequently than higher-sided dice (d12, d20)
- **Cascade Planning**: Set up situations where clearing one match causes dice to fall and form new matches
- **Grid Management**: Keep the grid from filling to the top by creating matches in the upper rows while maintaining good piece placement
- **Number Distribution**: In Easy mode, focus on common numbers (1-4 from d4, 1-6 from d6) for reliable matches
- **Next Piece Planning**: Use the 4x4 preview grid to plan optimal placement and rotation for the upcoming multi-die piece
- **Control Mastery**: Practice using the 3x2 control button layout efficiently to place pieces precisely where needed
- **Shape Strategy**: Learn how each of the 8 piece shapes (single, line2-4, L3-4, square, T) can be used for different strategic situations

### 📱 Cross-Platform Responsive Design

Dicetrix automatically adapts to different screen sizes with responsive design:

**📱 Mobile Devices**
- **Optimized Layout**: Game grid and UI elements scale appropriately for smaller screens
- **Touch-Friendly**: All interactive elements are sized for easy touch interaction
- **Readable Text**: Font sizes automatically adjust to maintain readability
- **Efficient Use of Space**: Layout maximizes the available screen real estate

**💻 Desktop Browsers**
- **Comfortable Viewing**: Larger grid cells and UI elements for desktop interaction
- **Keyboard Support**: ESC key for menu navigation and other keyboard shortcuts
- **Mouse Interaction**: Precise clicking for menu buttons and UI elements
- **Optimal Sizing**: Game scales to make good use of desktop screen space

**🖥️ Large Displays**
- **Scalable Interface**: Game elements scale up appropriately for large monitors
- **Maintained Proportions**: Grid and dice maintain proper aspect ratios at any size
- **Clear Visuals**: Text and graphics remain crisp at higher resolutions
- **Fullscreen Support**: Game works well in fullscreen mode within Reddit

**Responsive Features**: 
- **Automatic Scaling**: Game detects screen size and adjusts layout accordingly
- **Orientation Support**: Handles both portrait and landscape orientations
- **Real-time Updates**: Layout adjusts smoothly when window size changes
- **Cross-Platform Compatibility**: Works consistently across different devices and browsers

## What You Can Experience Right Now

**🎮 Complete Interactive Dice Puzzle Game**
- **Full Interactive Gameplay Experience**: Dice spawn at top center, players control their movement and placement, and matches form when 3+ adjacent dice have the same number
- **Advanced Match Detection System**: Sophisticated flood-fill algorithm automatically detects and clears matching groups in real-time as dice lock into the grid
- **Strategic Cascade Chain Reactions**: Gravity causes dice to fall after matches clear, allowing players to plan satisfying multi-level chain reactions (disabled in Zen mode)
- **5 Complete Difficulty Modes**: Choose from Easy, Medium, Hard, Expert, or Zen modes with different dice types (d4-d20) and fall speeds (400-1200ms)
- **Professional Interactive UI**: Color-coded mode selection dropdown, next piece preview in dedicated 4x4 grid panel, on-screen control buttons, real-time score tracking, and fully responsive layout
- **Visual Polish**: Procedurally rendered dice with preloaded images (d4-d20), high-contrast numbers, bright green grid lines, color coding, and smooth animations

**🏗️ Professional Implementation**
- **Phaser.js Game Engine**: Modern 2D game framework with WebGL rendering, AUTO scaling, and 1024x768 base resolution with RESIZE mode
- **Complete Scene Management**: Full flow from Boot → Preloader → StartMenu → Game → GameOver with proper state transitions and registry management
- **Advanced Game Logic**: Sophisticated 10x20 grid system, collision detection, flood-fill match processing, gravity simulation, and cascade chain handling
- **Asset Management**: Complete preloading system for dice images (d4, d6, d8, d10, d12, d20) with intelligent fallback to procedural graphics rendering
- **Responsive Design**: Game automatically adapts to different screen sizes and orientations with dynamic layout updates and proper scaling
- **Reddit Integration**: Built specifically for Devvit platform to run seamlessly within Reddit posts with proper webview integration

## Complete Game Experience

### 🎮 What You'll Experience

When you launch Dicetrix, you'll experience a complete, polished automatic dice puzzle game with the following flow:

1. **Boot Scene**: Quick initialization and asset preparation with dark blue background
2. **Preloader Scene**: Loads dice images (d4, d6, d8, d10, d12, d20) with "Loading..." text and progress display
3. **Start Menu**: Professional interface with bright green "DICETRIX" title, colorful mode selection dropdown, and "START GAME" button
4. **Game Scene**: Full gameplay with falling multi-die pieces, 10x20 grid, player controls, real-time match detection, and cascade effects
5. **Interactive Multi-Die Gameplay**: Multi-die Tetromino pieces spawn at top center, players control their movement, rotation, and placement before they lock into the grid
6. **Automatic Match Processing**: Advanced flood-fill algorithm automatically detects groups of 3+ adjacent dice with matching numbers and clears them
7. **Strategic Cascade Chain Reactions**: Gravity causes remaining dice to fall, allowing players to plan multiple cascade levels through strategic placement
8. **Real-Time Score System**: Score tracking with mode-specific multipliers and cascade bonuses displayed in real-time
9. **Game Over**: When the grid fills to the top, automatic transition to game over screen with red "GAME OVER" text and final score
10. **Complete Loop**: Return to menu and experience different automatic gameplay with different difficulty modes

### 🎯 Fully Implemented Features

**Complete Core Systems:**
- ✅ **Individual dice spawning and falling mechanics** with configurable speeds per mode
- ✅ **10x20 grid system** with collision detection, dice placement, and state management
- ✅ **Advanced flood-fill match detection** algorithm for groups of 3+ adjacent dice
- ✅ **Sophisticated gravity system** that makes dice fall after matches are cleared
- ✅ **Complete scoring system** with match size bonuses, cascade multipliers, and mode bonuses
- ✅ **Next piece preview** showing the upcoming die in dedicated side panel
- ✅ **Professional grid rendering** with bright green cell outlines, dice positioning, and visual polish
- ✅ **Full game mode system** with 5 difficulty modes (Easy, Medium, Hard, Expert, Zen)
- ✅ **Responsive layout system** that adapts to different screen sizes and orientations
- ✅ **Complete scene management** with proper transitions and state handling

**Current Interactive Gameplay Status:**
- ✅ **Interactive Mode Selection UI**: Colorful dropdown menu to choose from 5 difficulty modes with unique colors
- ✅ **Player-Controlled Multi-Die Gameplay**: Multi-die pieces spawn and fall, players control movement, rotation, and dropping before pieces lock
- ✅ **Real-time Match Detection**: Groups of matching numbers are automatically detected and cleared instantly using flood-fill algorithms
- ✅ **Strategic Cascade Chain Effects**: Players can plan cascade reactions through strategic multi-die piece placement
- ✅ **Professional Visual Polish**: High-contrast dice rendering, bright green grid lines, color coding, and smooth animations
- ✅ **Complete Interactive Game Loop**: Full cycle from menu selection to strategic Tetromino-style gameplay to game over
- ✅ **Advanced Rotation System**: Full 4-way piece rotation with matrix-based collision detection and wall kicks

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

3. **Experience the Multi-Die Puzzle Game**
   - Navigate through: Boot → Preloader → StartMenu → Game
   - Watch multi-die Tetromino pieces automatically spawn at the top center of the 10x20 grid
   - Control pieces falling every 400-1200ms (depending on difficulty mode) using on-screen buttons or keyboard
   - Move, rotate, and position pieces strategically before they lock into place when they hit the bottom or land on other pieces
   - Watch the advanced flood-fill algorithm automatically detect groups of 3+ adjacent dice with matching numbers
   - Experience gravity effects as remaining dice fall after matches are cleared, allowing for cascade planning
   - Create cascade chain reactions by strategically placing multi-die pieces to form new matches when others fall
   - Use the next piece preview showing the upcoming multi-die piece in the dedicated side panel (4x4 grid area) for planning
   - Watch the score increase as matches are detected and cleared based on your strategic piece placements
   - Use ESC key to return to the main menu at any time

## Key Features

**🎯 Core Gameplay**
- Multi-die Tetromino piece falling and locking mechanics
- Grid-based puzzle gameplay with 10x20 playing field
- Advanced match detection using flood-fill algorithms
- Gravity system creating cascade chain reactions
- Multiple dice types (4, 6, 8, 10, 12, 20-sided) based on difficulty
- 8 different piece shapes with full rotation capabilities

**🎮 Technical Excellence**
- Phaser.js game engine with WebGL rendering
- Real-time responsive design across all devices
- Professional scene management and state transitions
- Efficient grid system with collision detection
- Clean visual rendering with procedural dice graphics

**🎨 Polish & Experience**
- 5 difficulty modes (Easy, Medium, Hard, Expert, Zen) with different dice types and speeds
- Responsive layout adapting to mobile, desktop, and fullscreen
- Smooth animations and visual feedback
- Cross-platform compatibility within Reddit's Devvit platform
- Complete game loop from menu to gameplay to game over

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
- **Dice Class**: Self-managed rendering, movement, and lifecycle
- **Autonomous Movement**: Dice handle their own falling through Phaser's systems with configurable speed
- **MovementManager**: Tracks dice movement with explicit registration/unregistration and completion events
- **Procedural Rendering**: Clean blue squares (0x4dabf7) with dynamic gold text (0xffd700) using Phaser's graphics APIa font
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
- ✅ Complete multi-die piece falling and locking mechanics
- ✅ Full rotation system with 4-way rotation and collision detection
- ✅ Functional 10x20 grid system with multi-die piece collision detection
- ✅ Advanced flood-fill match detection for groups of 3+ adjacent dice
- ✅ Gravity system with cascade chain reaction potential
- ✅ Player input controls for piece movement, rotation, and dropping
- ✅ Real-time responsive design across all screen sizes
- ✅ Game mode configuration system with 5 difficulty levels
- ✅ Score tracking with real-time updates and next piece preview
- ✅ Complete scene management from menu to gameplay
- ✅ Interactive game mode selection UI with color-coded dropdown
