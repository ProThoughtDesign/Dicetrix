# Dicetrix

A revolutionary gravity-matching puzzle game that combines Tetris-style piece mechanics with dice-based number matching and groundbreaking individual die collision physics. Built for Reddit using Phaser.js and the Devvit platform.

## 🎮 What is Dicetrix?

Dicetrix is an innovative puzzle game that merges the spatial challenge of Tetris with dice-based number matching and revolutionary individual die physics. Players control falling multi-die pieces on an 8×16 grid, where **each die can collide and lock independently**, creating dynamic piece fragmentation that adds unprecedented strategic depth to puzzle gaming.

Unlike traditional Tetris where entire pieces lock as units, Dicetrix features groundbreaking individual die collision detection. When some dice in a piece hit obstacles and lock to the grid, the remaining dice continue falling as a smaller active piece, creating dynamic scenarios where pieces naturally fragment based on terrain.

The game features a complete Reddit integration system with difficulty-specific leaderboards, automated score submission with optional Reddit posting, periodic resets, user notifications, comprehensive community features, and advanced particle effects for match explosions, making it a fully-featured social gaming experience within the Reddit ecosystem.

**Current Game State**: Dicetrix is a fully functional puzzle game with complete scene progression (Boot → Preloader → SplashScreen → StartMenu → Settings → Game → GameOver → LeaderboardScene → HowToPlayScene), comprehensive Reddit integration, advanced particle systems with special dice effects, and sophisticated individual die physics. The game includes procedural piece generation, Black Die mechanics for advanced modes, booster effect systems, enhanced particle effects for special dice, and a complete audio system with mode-specific music.

## 🎯 Core Gameplay - How Dicetrix Works

**The Revolutionary Concept**: Dicetrix combines three gameplay mechanics that have never been unified before:

1. **Tetris-Style Falling Pieces**: Multi-die pieces fall from the top of an 8×16 grid
2. **Dice Number Matching**: Create connected groups of 3+ adjacent dice with the same number to clear them
3. **Individual Die Physics**: Each die in a piece can collide and lock independently, causing pieces to dynamically fragment

**The Game Loop**:
- Multi-die pieces (generated procedurally based on difficulty) fall down the grid
- Each die checks for collisions independently - when a die hits an obstacle, it locks immediately
- Remaining dice continue falling as a smaller piece until they also collide
- Players create matches by connecting 3+ adjacent dice with the same number (horizontal/vertical only)
- Matched dice disappear with spectacular particle effects, remaining dice fall to fill gaps
- Chain reactions create cascade bonuses with score multipliers
- Game ends when new pieces can't spawn due to grid collision at the top

## 🌟 What Makes Dicetrix Innovative and Unique?

### 1. Revolutionary Individual Die Physics - The Core Innovation
Dicetrix introduces the world's first **individual die collision system** in puzzle gaming. Unlike traditional Tetris where entire pieces lock as units, **each die in a multi-die piece can collide and lock independently**. This creates unprecedented gameplay scenarios:

- **Dynamic Piece Fragmentation**: A T-shaped piece might have its center die lock while the arms continue falling
- **Terrain-Based Strategy**: A 4-die line could have its bottom 2 dice lock while the top 2 continue as a smaller piece
- **Continuous Action**: An L-shape might fragment when only part of it encounters obstacles
- **Predictive Gameplay**: Players must anticipate how pieces will break apart based on existing grid layout

**Real-World Example**: Imagine a 4-die vertical line falling toward uneven terrain. The bottom die hits an existing piece and locks immediately. The remaining 3 dice continue falling as a smaller line until the next die hits something and locks, then the remaining 2 continue, and so on. This creates dynamic, unpredictable gameplay where no two games play the same way.

**Technical Implementation**: The game uses a sophisticated collision detection system where each die is processed individually every game tick using bottom-up collision detection. The `CoordinateConverter` manages the bottom-left coordinate system (Y=0 at bottom), while the `GameBoard` class handles individual die locking through `lockCell()` operations. The `ParticleSystemManager` provides spectacular visual feedback with particle explosions when matches are cleared, and special dice effects for enhanced dice including Black Dice auras and booster glows.

### 2. Complete Reddit Gaming Ecosystem  
Dicetrix is built from the ground up as a Reddit-native gaming experience with comprehensive social features:
- **Difficulty-Specific Leaderboards**: Separate rankings for Easy, Medium, Hard, Expert, and Zen modes managed by `LeaderboardManager`
- **Enhanced Score Submission**: Optional Reddit post creation with formatted game statistics via `RedditPostHandler`
- **Automated Reset Management**: Configurable daily/weekly/monthly leaderboard cycles with community announcements through `ResetController`
- **Real-Time Subreddit Widgets**: Live leaderboard displays that update when new scores are submitted
- **Achievement Notifications**: Automated alerts for top players and leaderboard winners
- **Advanced Particle Effects**: Color-coded match explosions with performance-optimized particle systems via `ParticleSystemManager`, including special dice auras for Black Dice and booster effects

### 3. Procedural Piece Generation System
The game features sophisticated piece generation through the `ProceduralPieceGenerator` class:
- **Constraint-Based Generation**: Pieces are generated within dimensional bounds (3×3×5 to 5×5×16 based on difficulty)
- **Connectivity Validation**: Uses `FloodFillValidator` to ensure all dice in a piece are connected
- **Black Die Integration**: Advanced modes include special Black Dice with wild matching and area conversion effects
- **Booster Effects**: Visual glow system managed by `BoosterEffectSystem` with difficulty-scaled percentages

### 4. Triple-Layer Strategic Challenge
Dicetrix challenges players to master three simultaneous gameplay dimensions that have never been combined before:
1. **Spatial Reasoning** - Traditional Tetris-style piece fitting and rotation with procedural constraints
2. **Number Matching** - Strategic dice placement for optimal matching opportunities using flood-fill detection
3. **Fragmentation Prediction** - Anticipating how pieces will break apart based on terrain and individual die physics

This creates unprecedented strategic depth where players must simultaneously consider piece placement, number positioning, and dynamic fragmentation patterns.

### 5. Advanced Difficulty Progression with Unique Mechanics
Each of the five difficulty modes introduces new mechanics and constraints:
- **Black Dice** (Hard/Expert): Wild cards that match any number AND trigger 3×3 area conversion effects
- **Uniform Dice Rule** (Zen): All dice in a piece have the same face count for pure matching focus
- **Procedural Constraints**: Piece complexity scales from 3×3×5 (Easy) to 5×5×16 (Expert)
- **Dynamic Scoring**: Difficulty multipliers reward players for tackling harder challenges

## 🎯 Core Gameplay Mechanics

### The Revolutionary Individual Die Physics System
The heart of Dicetrix is its groundbreaking collision detection system. Unlike traditional Tetris where entire pieces lock as units, **each die in a multi-die piece can collide and lock independently**:

- **Bottom-Up Processing**: Each die is checked for collisions individually every game tick
- **Selective Locking**: Only dice that hit obstacles (bottom boundary, walls, or existing pieces) lock to the grid immediately
- **Dynamic Fragmentation**: Remaining dice continue falling as a smaller active piece until they also collide
- **Terrain-Based Strategy**: Existing grid layout affects how new pieces will fragment

### Dice Matching & Cascade System
Players create matches by connecting 3+ adjacent dice with the same number (horizontal/vertical only):

- **Flood-Fill Detection**: The `MatchDetector.detectMatches()` function uses advanced algorithms to find connected groups
- **Spectacular Visual Effects**: Matched groups disappear with color-coded particle explosions from `MatchEffectManager`
- **Cascade Chain Reactions**: Remaining dice fall using `applyGravity()`, potentially creating new matches
- **Multiplier Bonuses**: Chain reactions increase score multipliers (2x, 3x, 4x+) for massive scoring opportunities

### Procedural Piece Generation System
The `ProceduralPieceGenerator` creates dynamic pieces based on difficulty constraints:

- **Dimensional Constraints**: Pieces range from 3×3×5 (Easy) to 5×5×16 (Expert) configurations
- **Connectivity Validation**: Uses `FloodFillValidator` to ensure all dice in a piece are connected
- **Black Die Integration**: Advanced modes include special Black Dice with wild matching and 3×3 area conversion effects
- **Booster Effects**: Visual glow system with difficulty-scaled percentages for strategic assistance

### Five Distinct Difficulty Modes
Each mode offers unique challenges and mechanics:

- **🟢 Easy Mode**: 3×3×5 pieces, d4/d6/d8 dice, 1000ms fall speed, 50% booster chance
- **🟡 Medium Mode**: 4×4×8 pieces, d6/d8/d10/d12 dice, 800ms fall speed, 35% booster chance
- **🔴 Hard Mode**: 5×5×10 pieces, d8/d10/d12/d20 + Black Dice, 600ms fall speed, 25% booster chance
- **🟠 Expert Mode**: 5×5×16 pieces, d10/d12/d20 + Black Dice, 400ms fall speed, 15% booster chance
- **🟣 Zen Mode**: 3×3×5 pieces, d4/d6/d8 dice (uniform rule), 1200ms fall speed, 50% booster chance

### Complete Reddit Gaming Ecosystem
Features comprehensive social integration through the Devvit platform:

- **Difficulty-Specific Leaderboards**: Separate rankings managed by `LeaderboardManager`
- **Enhanced Score Submission**: Optional Reddit post creation via `RedditPostHandler`
- **Automated Reset Management**: Configurable periodic cycles through `ResetController`
- **Real-Time Subreddit Widgets**: Live leaderboard displays that update with new scores
- **Achievement Notifications**: Automated alerts for top players and community engagement

## 🌟 Key Features

### Core Game Features
- 🧩 **Procedural Piece Generation**: Dynamic multi-die pieces with dimensional constraints (3×3×5 to 5×5×16 based on difficulty)
- ⚡ **Individual Die Physics**: Revolutionary collision system where pieces dynamically fragment based on terrain
- 🎲 **5 Difficulty Modes**: Easy, Medium, Hard, Expert, and Zen with unique constraints and mechanics
- 🔮 **Black Die System**: Special wild dice with 3×3 area conversion effects in advanced modes
- ✨ **Booster Effects**: Visual glow system with difficulty-scaled percentages for strategic assistance
- 💥 **Advanced Particle System**: Color-coded match explosions, special dice auras for Black Dice, booster glow effects, and enhanced dice particle effects with performance optimization

### Reddit Integration & Social Features
- 🏆 **Comprehensive Leaderboards**: Difficulty-specific rankings with automated periodic resets
- 📊 **Score Submission System**: Seamless integration with Reddit posts and community sharing
- 🔄 **Automated Reset Management**: Configurable daily/weekly/monthly leaderboard cycles
- 📢 **User Notifications**: Achievement alerts and leaderboard announcements
- 🎮 **Subreddit Widget**: Live leaderboard display for community engagement
- 👥 **How To Play Guide**: Multi-page interactive tutorial system

### Technical Excellence
- 📱 **Cross-Platform Controls**: Keyboard, touch, and responsive on-screen button support
- 🎵 **Professional Audio System**: Mode-specific music and specialized dice-match sound effects
- 🎨 **Enhanced Visuals**: Gold dice numbers, drop shadows, multi-layered glow effects, special dice particle auras, and advanced particle systems for enhanced dice
- 🌟 **Responsive Design**: Mobile-first UI with orientation change support and performance monitoring
- 🎯 **Complete Scene System**: Splash screen, main menu, settings, game, leaderboards, and tutorials
- ⚡ **Performance Optimization**: Object pooling, particle management, and frame rate monitoring

## 🎮 How to Play Dicetrix - Complete Step-by-Step Guide

### Phase 1: Getting Started

#### Step 1: Launch the Game
- Run `npm run dev` in your terminal
- Open the provided Reddit playtest URL in your browser
- The game loads through Boot → Preloader → SplashScreen sequence

#### Step 2: Experience the Captivating Splash Screen
- Watch the mesmerizing animated intro with falling dice using realistic physics
- Six different dice types (d4, d6, d8, d10, d12, d20) with random color tints
- Press any key, click anywhere, or tap the screen to continue to the main menu

#### Step 3: Navigate the Enhanced Main Menu
The main menu features a professional 2×2 button grid layout:
- **SETTINGS** (top-left): Configure audio with independent music and sound effect controls
- **HOW TO PLAY** (top-right): Access the comprehensive 4-page interactive tutorial system
- **LEADERBOARD** (bottom-left): View community rankings organized by difficulty with real-time data
- **Audio Button** (bottom-right): Click the responsive audio button (🔇/🔊) to enable global audio
- **Difficulty Dropdown**: Select from Easy, Medium, Hard, Expert, or Zen mode (color-coded)

### Phase 2: Understanding the Core Gameplay

#### Step 4: Master the Revolutionary Individual Die Physics
This is what makes Dicetrix unique - **each die in a piece can collide and lock independently**:
- Watch pieces dynamically fragment as individual dice hit obstacles
- A T-shaped piece might have its center die lock while the arms continue falling
- A 4-die line could have its bottom 2 dice lock while the top 2 continue as a smaller piece
- Learn to predict fragmentation patterns based on terrain for strategic advantage

#### Step 5: Learn the Controls
**Keyboard Controls**:
- **Movement**: ← → (left/right), ↓ (soft drop), Space (hard drop)
- **Rotation**: ↑ (clockwise), Q (counter-clockwise)
- **Game**: Esc (pause menu), WASD (alternative movement)

**Mobile/Touch Controls**:
- **Responsive On-Screen Buttons**: 3×2 grid layout optimized for mobile
  - Top Row: ↺ (rotate left) | ⇊ (soft drop) | ↻ (rotate right)
  - Bottom Row: ← (move left) | ⇓ (hard drop) | → (move right)
- **Direct Grid Tapping**: Tap any grid position to move pieces horizontally toward that column
- **Touch-Optimized**: Minimum 44px touch targets with proper spacing

#### Step 6: Create Strategic Matches
**Matching Rules**:
- Connect 3+ adjacent dice with the same number (horizontal/vertical only)
- Matches are detected using advanced flood-fill algorithms
- Matched dice disappear with spectacular color-coded particle explosions
- Different match sizes trigger different sound effects (3, 4, 5, 7, 9+ dice)

**Cascade Chain Reactions**:
- When matches clear, remaining dice fall to fill gaps
- Falling dice can form new matches automatically
- Each cascade level increases your score multiplier (1x → 2x → 3x → 4x+)
- Plan initial matches to create maximum chain reactions

### Phase 3: Mastering Advanced Mechanics

#### Step 7: Understand the Five Difficulty Modes
Each mode offers unique challenges and piece constraints:

- **🟢 Easy Mode**: 3×3×5 pieces, d4/d6/d8 dice, 1000ms fall speed, 50% glow assistance
- **🟡 Medium Mode**: 4×4×8 pieces, d6/d8/d10/d12 dice, 800ms fall speed, 35% glow assistance
- **🔴 Hard Mode**: 5×5×10 pieces, d8/d10/d12/d20 + Black Dice, 600ms fall speed, 25% glow assistance
- **🟠 Expert Mode**: 5×5×16 pieces, d10/d12/d20 + Black Dice, 400ms fall speed, 15% glow assistance
- **🟣 Zen Mode**: 3×3×5 pieces, d4/d6/d8 dice (uniform rule), 1200ms fall speed, no cascades

#### Step 8: Master Advanced Mechanics
**Black Dice** (Hard/Expert modes only):
- Act as wild cards that match any adjacent dice number
- When cleared, trigger 3×3 area conversion effects
- All dice in a 3×3 grid around each Black Die become d20 dice with new random numbers
- Creates opportunities for massive cascade chain reactions

**Booster Effects**:
- Random dice receive colorful glow auras based on difficulty percentages
- Nine different glow colors provide visual assistance for strategic placement
- Use glowing dice as guides for optimal positioning

#### Step 9: Develop Winning Strategies
**Triple-Layer Thinking** - Master all three simultaneously:
1. **Spatial Reasoning**: Traditional Tetris-style piece fitting and rotation
2. **Number Matching**: Strategic dice placement for optimal matching opportunities
3. **Fragmentation Prediction**: Anticipating how pieces will break apart based on terrain

**Pro Tips**:
- Create strategic gaps to control how pieces fragment
- Keep top rows clear to prevent game over
- Set up matches that will cause falling dice to form additional matches
- Listen to audio cues - different match sizes have different sound effects
- In Hard/Expert modes, position Black Dice for maximum area conversion impact

### Phase 4: Community Competition

#### Step 10: Score Submission & Reddit Integration
When your game ends (grid fills up preventing new pieces from spawning):
- Use the enhanced Score Submission UI with detailed breakdown display
- Choose to submit score only or create Reddit post with formatted game statistics
- View your leaderboard position and compete with the community
- Receive feedback on your rank and achievements

#### Step 11: Community Features
- **Leaderboard Scene**: View rankings across all difficulty modes with reset schedules
- **Reset Cycles**: Participate in automated daily/weekly/monthly competitions
- **Achievement Notifications**: Receive alerts for top player status
- **Subreddit Integration**: Contribute to live community widgets and discussions

### Victory Conditions & Objectives

**Primary Goal**: Achieve the highest score possible by creating matches and cascade chains before the grid fills up

**Scoring Formula**: Points = (match size × dice numbers + total faces) × cascade multiplier × difficulty multiplier

**Game Over**: Occurs when a new piece cannot spawn due to collision at the top of the grid

**Community Success**: Climb the difficulty-specific leaderboards and participate in the vibrant Reddit gaming community

This revolutionary puzzle game challenges you to master three simultaneous gameplay dimensions while competing in a comprehensive social gaming ecosystem!

### Game Controls

**Keyboard Controls** (handled in `Game` scene):
- **Movement**: ← → (left/right), ↓ (soft drop), Space (hard drop)
- **Rotation**: ↑ (clockwise), Q (counter-clockwise)  
- **Game**: Esc (pause menu via `PauseMenuUI` with audio controls), WASD (alternative movement)

**Responsive On-Screen Controls** (via `GameUI` class):
- **3×2 Button Grid**: Scaled for mobile accessibility with proper touch targets calculated by responsive layout system
- **Top Row**: ↺ (rotate left) | ⇊ (soft drop) | ↻ (rotate right)
- **Bottom Row**: ← (move left) | ⇓ (hard drop) | → (move right)
- **Mobile Optimized**: Buttons adapt to screen size with minimum 44px touch targets using responsive design calculations

**Touch & Interaction:**
- **Direct Grid Tapping**: Tap any grid position to move pieces horizontally toward that column using `CoordinateConverter` for position mapping
- **Pause Menu**: Access comprehensive `PauseMenuUI` with settings, restart, and main menu options
- **Cross-Platform**: Seamless experience across desktop, tablet, and mobile devices with responsive layout management

### The Revolutionary Individual Die Physics

**What Makes Dicetrix Unique:**
Unlike traditional Tetris where entire pieces lock as units, **each die in a multi-die piece can collide and lock independently**. The `Game` scene processes each die individually using bottom-up collision detection with the `CoordinateConverter` managing the Y=0-at-bottom coordinate system. This creates dynamic scenarios where:

- A T-shaped piece might have its center die lock via `GameBoard.lockCell()` while the arms continue falling
- A 4-die line could have its bottom 2 dice lock while the top 2 continue as a smaller active piece
- An L-shape might fragment when only part of it encounters obstacles, with remaining dice continuing to fall

**Technical Implementation:**
- **Individual Collision Detection**: Each die is checked for collisions independently every game tick
- **Bottom-Up Processing**: Dice are processed from lowest Y to highest Y coordinates
- **Dynamic Piece Fragmentation**: `activePiece` automatically updates to contain only unlocked dice
- **Grid Integration**: Locked dice immediately become part of the `GameBoard` state for future collision detection

**Strategic Impact:**
- **Terrain-Based Strategy**: Existing grid layout affects how new pieces will fragment based on collision detection
- **Fragmentation Prediction**: Players must anticipate how pieces will break apart using the coordinate system
- **Continuous Action**: Gameplay flows continuously without traditional piece-locking pauses
- **Triple Challenge**: Balance spatial fitting + number matching + fragmentation prediction with individual die physics

### Enhanced Difficulty System

The game features five distinct difficulty modes managed by `DifficultyModeConfig` and implemented through `ProceduralPieceGenerator`:

- **🟢 Easy Mode** (3×3×5 pieces, d4/d6/d8 dice, 1000ms fall speed)
  - Perfect for learning individual die physics and basic matching
  - 50% booster glow chance via `BoosterEffectSystem` for maximum visual assistance
  - 1.0x score multiplier baseline managed by `ScoreMultiplierManager`

- **🟡 Medium Mode** (4×4×8 pieces, d6/d8/d10/d12 dice, 800ms fall speed)  
  - Recommended starting point with balanced challenge
  - 35% booster glow chance for moderate assistance
  - 1.1x score multiplier bonus

- **🔴 Hard Mode** (5×5×10 pieces, d8/d10/d12/d20 + Black Dice, 600ms fall speed)
  - Introduces `BlackDieManager` mechanics with 3×3 area conversion effects
  - 25% booster glow chance for strategic assistance
  - 1.25x score multiplier bonus

- **🟠 Expert Mode** (5×5×16 pieces, d10/d12/d20 + Black Dice, 400ms fall speed)
  - Ultimate challenge with maximum piece complexity from `ProceduralPieceGenerator`
  - 15% booster glow chance for minimal assistance  
  - 1.5x score multiplier bonus

- **🟣 Zen Mode** (3×3×5 pieces, d4/d6/d8 dice uniform rule, 1200ms fall speed)
  - Relaxed gameplay with no cascade chains, focus on pure matching
  - 50% booster glow chance for visual enjoyment
  - 0.9x score multiplier (peaceful mode)

### Advanced Scoring & Reddit Integration

**Enhanced Scoring System**:
- **Base Formula**: Points = (match size × dice number + total die faces) × cascade multiplier × difficulty multiplier
- **Cascade Chains**: Automatic chain reactions with increasing multipliers (2x, 3x, 4x+)
- **Score Breakdown Tracking**: Detailed breakdown of base score, chain multipliers, combo bonuses, and booster modifiers

**Reddit Integration Features**:
- **Score Submission Interface**: Enhanced UI with optional Reddit post creation
- **Leaderboard System**: Difficulty-specific rankings with automated periodic resets
- **Achievement Notifications**: Top player alerts and leaderboard announcements
- **Community Sharing**: Direct integration with Reddit posts and subreddit widgets

**Special Mechanics**:
- **Black Dice** (Hard/Expert): Wild matching + 3×3 area conversion to d20 dice
- **Booster Effects**: Visual glow assistance with difficulty-scaled frequencies
- **Audio Feedback**: Specialized sound effects for different match sizes (3, 4, 5, 7, 9+ dice)

## 🚀 Complete Step-by-Step Playing Guide

### Phase 1: Getting Started

1. **Launch the Game**
   - Run `npm run dev` in your terminal
   - Open the provided Reddit playtest URL in your browser
   - The game loads through Boot → Preloader → SplashScreen sequence

2. **Interactive Splash Screen Experience**
   - Watch the mesmerizing falling dice animation with realistic physics
   - Six different dice types (d4, d6, d8, d10, d12, d20) spawn with random colors
   - Press any key, click anywhere, or tap the screen to continue

3. **Main Menu Navigation**
   - **Difficulty Dropdown**: Select from Easy, Medium, Hard, Expert, or Zen mode
   - **LEADERBOARD**: View community rankings organized by difficulty
   - **HOW TO PLAY**: Access 4-page interactive tutorial with navigation controls
   - **SETTINGS**: Configure audio with independent music/sound controls
   - **Audio Button**: Enable global audio (🔇/🔊) for music and sound effects

### Phase 2: Understanding the Revolutionary Gameplay

4. **Master the Individual Die Physics System**
   - Unlike Tetris, each die in a piece can collide and lock independently
   - Watch pieces dynamically fragment when some dice hit obstacles
   - Remaining dice continue falling as smaller active pieces
   - Learn to predict fragmentation patterns based on terrain

5. **Control Your Pieces**
   - **Keyboard**: WASD or Arrow keys for movement, Space for hard drop
   - **Rotation**: Up arrow (clockwise) or Q (counter-clockwise)
   - **Mobile**: Use responsive on-screen buttons (3×2 grid layout)
   - **Touch**: Tap any grid position to move pieces horizontally toward that column

6. **Create Strategic Matches**
   - Connect 3+ adjacent dice with the same number (horizontal/vertical only)
   - Watch spectacular color-coded particle explosions when matches clear
   - Trigger cascade chain reactions as remaining dice fall and form new matches
   - Earn multiplier bonuses (2x, 3x, 4x+) for chain reactions

### Phase 3: Advanced Strategy & Mastery

7. **Understand Difficulty Progression**
   - **Easy**: 3×3×5 pieces, d4/d6/d8 dice, slow fall speed, 50% glow assistance
   - **Medium**: 4×4×8 pieces, d6/d8/d10/d12 dice, moderate speed, 35% glow
   - **Hard**: 5×5×10 pieces, d8/d10/d12/d20 + Black Dice, fast speed, 25% glow
   - **Expert**: 5×5×16 pieces, d10/d12/d20 + Black Dice, very fast, 15% glow
   - **Zen**: 3×3×5 pieces, d4/d6/d8 uniform dice, slow speed, no cascades

8. **Master Advanced Mechanics**
   - **Black Dice** (Hard/Expert): Wild cards that match any number + 3×3 area conversion
   - **Booster Effects**: Glowing dice provide visual assistance for strategic placement
   - **Terrain Management**: Create strategic gaps to control piece fragmentation
   - **Height Control**: Keep top rows clear to prevent game over

9. **Develop Winning Strategies**
   - **Triple-Layer Thinking**: Balance spatial reasoning + number matching + fragmentation prediction
   - **Cascade Setup**: Plan initial matches to trigger maximum chain reactions
   - **Pattern Recognition**: Look for opportunities to create large matches (5, 7, 9+ dice)
   - **Audio Cues**: Listen to specialized sound effects for different match sizes

### Phase 4: Community Competition

10. **Score Submission & Reddit Integration**
    - Game ends when pieces can't spawn due to grid collision
    - Use the enhanced Score Submission UI with detailed breakdown display
    - Choose to submit score only or create Reddit post with game statistics
    - View your leaderboard position and compete with the community

11. **Community Features**
    - **Leaderboard Scene**: View rankings across all difficulty modes
    - **Reset Cycles**: Participate in automated daily/weekly/monthly competitions
    - **Achievement Notifications**: Receive alerts for top player status
    - **Subreddit Integration**: Contribute to live community widgets and discussions

### Victory Conditions & Objectives

**Primary Goal**: Achieve the highest score possible by creating matches and cascade chains before the grid fills up

**Scoring Formula**: Points = (match size × dice numbers + total faces) × cascade multiplier × difficulty multiplier

**Game Over**: Occurs when a new piece cannot spawn due to collision at the top of the grid

**Community Success**: Climb the difficulty-specific leaderboards and participate in the vibrant Reddit gaming community

This revolutionary puzzle game challenges you to master three simultaneous gameplay dimensions while competing in a comprehensive social gaming ecosystem!

## 🚀 Technical Innovation Behind Dicetrix

### Complete Reddit Gaming Ecosystem

**Comprehensive Social Integration**: Dicetrix is built from the ground up as a Reddit-native gaming experience with full community features:

- **Automated Leaderboard Management**: Configurable reset intervals (daily/weekly/monthly) with automatic archival and announcement posting
- **Enhanced Score Submission**: Players can submit scores with optional Reddit post creation, complete with formatted game stats and community hashtags  
- **Real-Time Subreddit Widgets**: Live leaderboard displays that update automatically when new scores are submitted
- **User Achievement System**: Automated notifications for top players with personalized achievement messages
- **Community Engagement**: Direct integration with Reddit's social features for sharing, commenting, and community building

**Technical Reddit Integration**:
- **Devvit Platform**: Built using Reddit's official developer platform for seamless integration
- **Redis-Powered Backend**: Scalable data persistence with difficulty-specific leaderboard storage
- **Express API Layer**: RESTful endpoints for game state management and Reddit integration
- **Automated Task Scheduling**: Background processes for leaderboard resets and community notifications

### Revolutionary Individual Die Physics System

**The Core Innovation**: Dicetrix introduces a groundbreaking collision detection system where each die in multi-die pieces can collide and lock independently. This creates dynamic gameplay scenarios impossible in traditional puzzle games:

- **Dynamic Piece Fragmentation**: Multi-die pieces naturally break apart as individual dice encounter obstacles
- **Terrain-Based Strategy**: Players must predict how pieces will fragment based on the existing grid layout
- **Continuous Action**: Unlike Tetris where pieces lock as complete units, Dicetrix pieces can partially lock while remaining dice continue falling
- **Strategic Depth**: Combines traditional spatial reasoning with fragmentation prediction and number matching
- **Bottom-Left Coordinate System**: Uses intuitive Y=0 at bottom physics where pieces fall by decreasing Y coordinates

**Real Examples**:
- A T-shaped piece might have its center die lock while the arms continue falling
- A 4-die line could have its bottom 2 dice lock while the top 2 continue as a smaller piece  
- An L-shape might fragment when only part of it encounters obstacles
- A square piece could split with bottom dice locking while top dice continue falling

**Technical Implementation**: Each game tick processes every die individually for collision detection using a bottom-up approach. Only dice that would collide are immediately locked to the grid, while remaining dice continue falling as a smaller active piece.

### Enhanced Difficulty System with Procedural Generation

**Procedural Piece Generation**: The enhanced difficulty system uses the ProceduralPieceGenerator to create pieces within dimensional constraints based on the selected mode:

- **Easy Mode**: 3×3×5 constraints (max 3 width, 3 height, 5 dice per piece) with d4, d6, d8 dice and 50% booster chance
- **Medium Mode**: 4×4×8 constraints with d6, d8, d10, d12 dice and 35% booster chance  
- **Hard Mode**: 5×5×10 constraints with d8, d10, d12, d20 dice, Black Dice enabled, and 25% booster chance
- **Expert Mode**: 5×5×16 constraints with d10, d12, d20 dice, Black Dice enabled, and 15% booster chance
- **Zen Mode**: 3×3×5 constraints with d4, d6, d8 dice, uniform dice rule (all dice in a piece have same face count), and 50% booster chance

**Black Die Mechanics**: Advanced modes (Hard/Expert) feature special Black Dice managed by the BlackDieManager that act as wild cards for matching and trigger powerful area conversion effects. When Black Dice are cleared in matches, they transform surrounding dice in a 3×3 grid to d20 dice with rerolled numbers, creating opportunities for massive cascade chain reactions.

**Booster Effect System**: The BoosterEffectSystem applies visual glow effects to dice based on difficulty-specific percentages. Nine different glow colors (red, blue, green, yellow, purple, orange, teal, magenta, cyan) create vibrant visual variety with multi-layered concentric circle rendering for stunning effects.

### Three-Dimensional Puzzle Challenge

Dicetrix successfully merges three distinct gaming mechanics that have never been combined before:

1. **Tetris-Style Pieces**: Procedurally generated multi-die shapes fall down an 8×16 grid
2. **Dice Matching**: Create connected groups of 3+ adjacent dice with matching numbers to clear them and score points
3. **Individual Die Physics**: Revolutionary system where each die can collide and lock independently, creating dynamic piece fragmentation

**Example Scenarios**:
- A 4-die line piece encounters an obstacle with its bottom die → that die locks immediately at the collision point, while the remaining 3 dice continue falling as a smaller line piece
- An L-shaped piece hits uneven terrain → some dice lock in gaps while others continue falling until they encounter their own obstacles
- A T-piece approaches the bottom → the center die locks first when it hits Y=0, while the side dice continue falling until they also reach the bottom or hit existing pieces

**Strategic Complexity**: This creates unprecedented strategic depth where players must simultaneously consider:
- Traditional Tetris spatial reasoning and piece rotation
- Dice number positioning for optimal matching opportunities
- Predicting how pieces will dynamically fragment based on terrain
- Setting up cascade chain reactions for bonus scoring
- Managing dimensional constraints and Black Die mechanics in advanced modes

### Complete Game Experience

Dicetrix is a **fully-featured puzzle game** with a complete scene progression: Boot → Preloader → SplashScreen → StartMenu → Settings → Game → GameOver, each with polished visuals and smooth transitions.

**Opening Experience**: Players are greeted with a captivating animated splash screen featuring falling dice with realistic physics, random color tints, and smooth animations. The interactive "Press any key to play Dicetrix" text pulses with professional typography using custom Asimovian fonts with comprehensive fallback chains.

**Menu System**: The start menu features the stylized "DICETRIX" title with custom Nabla fonts, a color-coded difficulty selection dropdown with responsive design, and a professional 2×2 button grid layout. The grid includes Settings (top-left), How To Play (top-right), Leaderboard (bottom-left), and Audio controls (bottom-right) for intuitive navigation. Players can access dedicated scenes for comprehensive audio configuration, interactive tutorials, and community leaderboards.

**Game Interface**: The main game features a sophisticated responsive layout:
- **Centered Game Board**: 8×16 game grid positioned centrally with prominent score display above (42px font size)
- **Next Piece Preview**: 4×4 grid positioned beside the board with "Next Piece" label and visual border
- **Control Buttons**: 3×2 scaled control button layout (128×128 pixels) with clear symbols (↺ ⇊ ↻ / ← ⇓ →)
- **Pause Menu Integration**: Comprehensive pause menu with 2×2 button layout for settings, restart, and navigation
- **Visual Grouping**: Next Piece section has visual border for clear organization

**Audio System**: Features a hybrid audio system combining algorithmic music generation with Phaser.js sound effects. Each difficulty mode has its own unique musical identity. The system includes comprehensive sound effects for gameplay actions, UI interactions, and special events including dice-match specific audio feedback with different sounds for 3, 4, 5, 7, and 9+ dice matches.

### Core Gameplay Loop

**Piece Movement & Control**: Multi-die pieces spawn at Y=16 (above the visible 8×16 grid) and fall automatically with configurable speeds. Players control them using responsive on-screen buttons (3×2 grid of 128×128 pixel buttons), keyboard controls (WASD/arrows), or touch input. Each piece contains 1-16 dice with numbered faces based on the selected difficulty mode.

**Individual Die Physics**: As pieces fall, each die is checked for collisions independently using bottom-up processing. When some dice hit obstacles (Y<0 boundary, walls, or existing pieces), they lock to the grid immediately using `lockCell()` while remaining dice continue falling as a smaller active piece. This creates dynamic piece fragmentation based on terrain.

**Matching & Scoring**: Players create matches by connecting 3+ adjacent dice with the same number (horizontal/vertical only) using flood-fill detection. Matched groups disappear with spectacular color-coded particle explosions, and remaining dice fall to fill gaps using gravity application, potentially creating cascade chain reactions for bonus scoring with multipliers.

**Progressive Difficulty**: Five modes with enhanced dimensional constraints:
- **Easy**: 3×3×5 pieces, d4/d6/d8 dice, 1000ms fall speed, 1.0x multiplier
- **Medium**: 4×4×8 pieces, d6/d8/d10/d12 dice, 800ms fall speed, 1.1x multiplier  
- **Hard**: 5×5×10 pieces, d8/d10/d12/d20 + Black Dice, 600ms fall speed, 1.25x multiplier
- **Expert**: 5×5×16 pieces, d10/d12/d20 + Black Dice, 400ms fall speed, 1.5x multiplier
- **Zen**: 3×3×5 pieces, d4/d6/d8 dice (uniform rule), 1200ms fall speed, 0.9x multiplier

## 🎨 Enhanced Visual System

The game features significantly improved visual clarity and appeal:

- **Bold Gold Numbers**: All dice display their numbers in bright gold (#FFD700) using Arial Black font for maximum readability
- **Drop Shadow Effects**: Each number has a subtle black drop shadow positioned slightly offset for depth and contrast
- **Thick Black Strokes**: Numbers feature thick black outlines that scale proportionally with font size for crisp visibility
- **50% Larger Text**: Dice numbers are rendered 50% larger than the base size for better readability across all screen sizes
- **Multi-Layered Glow System**: Random dice receive colorful glow auras with concentric circles (9 different colors)
- **Difficulty-Scaled Booster Effects**: Glow frequency varies by mode (Easy: 50%, Medium: 35%, Hard: 25%, Expert: 15%, Zen: 50%)
- **Black Die Special Display**: Black dice show infinity symbol (∞) instead of numbers for wild matching
- **Consistent Visual Hierarchy**: All text elements use the same enhanced styling for a cohesive visual experience
- **Advanced Particle Effects**: Color-coded match explosions with performance-optimized particle systems and object pooling
- **Match Effect Manager**: Sophisticated particle management with configurable effects based on match size and colors

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
- **Graceful Degradation**: Maintains functionality even when audio files are missing

### Enhanced Audio System with Global State Management

The start menu includes a responsive audio button with comprehensive audio management:

- **Global Audio State**: Audio preferences are enabled globally across all game scenes when activated
- **Visual State Management**: Muted (🔇) and unmuted (🔊) speaker icons with clear visual feedback
- **One-Click Audio Activation**: Enables both music and sound effects globally with a single interaction
- **Persistent Settings**: Audio state is maintained throughout the entire game session
- **Cross-Platform Support**: Proper touch target sizing and responsive behavior across devices
- **Browser Compatibility**: Handles autoplay policies and AudioContext initialization seamlessly
- **Error Handling**: Graceful degradation when audio systems fail, maintaining button functionality

## 🔮 Black Die Mechanics (Hard & Expert Modes)

**Wild Matching**: Black Dice act as universal wild cards that can match with any adjacent dice number, providing powerful strategic options for creating large match groups.

**Area Conversion Effects**: When Black Dice are cleared in matches, they trigger a devastating 3×3 area conversion effect:
- All dice within a 3×3 grid centered on each Black Die position are converted to d20 dice
- Converted dice are rerolled to new random numbers between 1-20
- Multiple Black Dice can create overlapping conversion zones for massive board transformations
- Creates opportunities for setting up huge cascade chain reactions

**Strategic Depth**: Black Dice add a risk-reward element where players must decide whether to use them for immediate matches or position them strategically for maximum area conversion impact.

## 🌟 Enhanced Booster System

**Visual Glow Effects**: Dice randomly receive colorful glow auras based on difficulty-specific percentages:
- **Easy & Zen**: 50% chance for maximum visual assistance
- **Medium**: 35% chance for balanced gameplay  
- **Hard**: 25% chance for moderate assistance
- **Expert**: 15% chance for minimal assistance

**Booster Types**: Nine different glow colors (red, blue, green, yellow, purple, orange, teal, magenta, cyan) create vibrant visual variety with multi-layered concentric circle rendering for stunning effects.

## 💥 Advanced Particle Effects System with Special Dice Enhancements

**Advanced Particle System Manager**: Dicetrix features a sophisticated particle system that creates spectacular visual feedback for dice matches and special dice effects:

- **Color-Coded Match Explosions**: Each match triggers particle effects that match the primary color of the cleared dice
- **Special Dice Auras**: Black Dice display mystical auras, booster dice show colorful glows, and enhanced dice have unique particle effects
- **Real-Time Special Effects**: Automatically detects and creates particle auras for Black Dice, booster dice, and glowing dice as they spawn
- **Dynamic Aura Positioning**: Special dice particle effects update positions in real-time as pieces move during gameplay
- **Size-Scaled Effects**: Larger matches (5, 7, 9+ dice) create more impressive particle explosions
- **Performance Optimization**: Advanced object pooling and performance monitoring ensure smooth gameplay
- **Simultaneous Match Handling**: Multiple matches trigger with slight delays for visual clarity
- **Grid-Aligned Positioning**: Particle effects are precisely positioned using board metrics for accurate visual feedback
- **Enhanced Visual Hierarchy**: Special dice effects are layered behind gameplay elements to maintain visibility while adding visual flair

**Technical Features**:
- **Particle Pool Management**: Efficient object pooling prevents memory leaks and maintains performance
- **Performance Monitor**: Real-time monitoring ensures particle effects don't impact gameplay framerate  
- **Emitter Manager**: Centralized particle emitter management with automatic cleanup
- **Special Dice Effects**: Dedicated particle systems for Black Dice auras, booster glows, and enhanced dice effects
- **Automatic Effect Creation**: Seamlessly integrates with the game's rendering system to create special effects during piece spawning
- **Configurable Effects**: Adjustable particle counts, colors, and explosion radius for different devices
- **Mobile Optimization**: Reduced particle counts and optimized rendering for mobile devices
- **Dynamic Aura Positioning**: Real-time particle position updates as special dice move during gameplay
- **Visibility Compliance**: Ensures particles enhance rather than interfere with gameplay visibility

## 🎬 Immersive Splash Screen Experience

The game opens with a captivating animated splash screen that sets the tone for the entire experience:

- **Falling Dice Animation**: 1-3 dice spawn at random intervals (200-800ms) with realistic gravity physics using object pooling
- **Visual Variety**: Six different dice types (d4, d6, d8, d10, d12, d20) with random color tints from a carefully curated palette
- **Interactive Design**: Pulsing "Press any key to play Dicetrix" text with smooth alpha transitions (0.6-1.0) using Asimovian fonts
- **Multi-Platform Input**: Supports keyboard, mouse clicks, and touch input for seamless game entry
- **Font Loading Integration**: Uses FontLoader utility for consistent Asimovian and Nabla font loading with fallback chains
- **Professional Polish**: Proper cleanup of animations and timers during scene transitions
- **Performance Optimized**: Object pooling system with 30 pooled dice sprites and mobile-specific optimizations
- **Error Handling**: Comprehensive error handling with graceful fallbacks and performance monitoring
- **Mobile Features**: Touch feedback system, battery-conscious animation timing, and responsive design for mobile devices
- **Memory Management**: Efficient sprite pooling and cleanup to prevent memory leaks

## 🎯 Complete Step-by-Step Guide

### Getting Started

1. **Launch the Game**: Run `npm run dev` and open the provided Reddit playtest URL in your browser

2. **Interactive Splash Screen**: Experience the captivating animated introduction:
   - Falling dice with realistic physics and random color tints
   - Six different dice types (d4, d6, d8, d10, d12, d20) with object pooling optimization
   - Press any key, click, or tap the pulsing "Press any key to play Dicetrix" text to continue

3. **Enhanced Main Menu Navigation**:
   - **Difficulty Selection**: Choose from the color-coded dropdown with 5 enhanced modes
   - **2×2 Button Grid Layout**: Professional grid organization for intuitive navigation
     - **SETTINGS** (top-left): Configure audio with independent music and sound effect controls
     - **HOW TO PLAY** (top-right): Access the comprehensive 4-page interactive tutorial system
     - **LEADERBOARD** (bottom-left): View community rankings organized by difficulty with reset schedules
     - **Audio Button** (bottom-right): Click the responsive audio button (🔇/🔊) to enable game music and sound effects

4. **Master the Revolutionary Controls**: Use keyboard (WASD/arrows), touch, or responsive on-screen buttons
5. **Experience Individual Die Physics**: Watch pieces dynamically fragment as dice hit obstacles independently
6. **Create Strategic Matches**: Connect 3+ adjacent dice with the same number to clear them and trigger cascades
7. **Explore Community Features**:
   - Check current leaderboard standings and your personal rank across all difficulty modes
   - Review upcoming reset schedules and competition periods
   - Learn about enhanced score submission with optional Reddit posting

### Game Objectives & Reddit Integration

**Primary Goal**: Create connected groups of 3+ adjacent dice with matching numbers to clear them and score points while managing falling multi-die pieces that can fragment dynamically.

**Community Competition**: Compete on difficulty-specific leaderboards with automated periodic resets and community announcements.

**Score Submission**: When games end, use the enhanced score submission interface to:
- Submit scores to the appropriate difficulty leaderboard
- Optionally create Reddit posts with formatted game statistics
- Receive leaderboard position feedback and achievement notifications
- Contribute to community engagement through the subreddit widget system

**Victory Condition**: Achieve the highest score possible and climb the community leaderboards before the grid fills up.

**Game Over**: The game ends when a new piece cannot spawn due to collision, triggering the score submission interface with Reddit integration options.

### Understanding the Enhanced Game Interface

**Main Game Area (Responsive Layout)**:
- **Score Display**: Real-time score tracking with enhanced typography and stroke effects
- **8×16 Game Grid**: Professional grid with intuitive bottom-left coordinate system (Y=0 at bottom)
- **Visual Excellence**: Gold dice numbers with drop shadows, multi-layered glow effects, and color-coded dice types
- **Individual Die Physics**: Watch pieces dynamically fragment as individual dice hit obstacles and lock independently

**Control & Information Panel**:
- **Next Piece Preview**: 4×4 grid showing upcoming pieces with grid-aligned positioning
- **Responsive Control Buttons**: 3×2 grid optimized for both desktop and mobile with proper touch targets
- **Pause Menu Integration**: Access comprehensive pause menu with settings, restart, and main menu options
- **Audio Controls**: Integrated audio management with visual feedback

**Enhanced UI Features**:
- **Mobile-First Design**: Responsive layout that adapts to screen size and orientation changes
- **Cross-Platform Input**: Seamless keyboard, mouse, and touch input support
- **Professional Typography**: Custom font loading with fallback chains for consistent appearance
- **Accessibility**: Proper contrast ratios, touch target sizes, and visual feedback systems

### Mastering Individual Die Physics (The Key Innovation)

**How It Works**:
1. **Independent Collision**: Each die in a multi-die piece is checked for collisions individually every game tick
2. **Selective Locking**: Only dice that hit obstacles (bottom boundary, walls, or existing pieces) lock to the grid immediately
3. **Dynamic Fragmentation**: Remaining dice continue falling as a smaller active piece until they also collide
4. **Bottom-Up Processing**: Dice are processed from lowest Y to highest Y so newly locked dice become obstacles for dice above them

**Real Examples**:
- **T-Piece Fragmentation**: Center die hits an obstacle and locks, while the two arm dice continue falling separately
- **Line Piece Partial Landing**: Bottom 2 dice of a 4-dice line lock when hitting existing pieces, top 2 continue as a smaller line
- **L-Piece Terrain Interaction**: Corner die locks in a gap, while the rest continues falling and may fragment further
- **Square Split**: Bottom row locks on uneven terrain, top row continues falling as a horizontal line

### Creating Dice Matches

**Matching Rules**:
- **Objective**: Connect 3+ adjacent dice showing the same number
- **Adjacency**: Only horizontal and vertical connections count (no diagonal)
- **Detection**: Advanced flood-fill algorithm finds all connected groups automatically
- **Clearing**: Matched groups disappear with spectacular color-coded particle explosions and specialized sound effects
- **Visual Effects**: Each match triggers performance-optimized particle effects with colors matching the dice

**Dice Types by Difficulty**:
- **Easy Mode**: d4 (numbers 1-4), d6 (numbers 1-6), d8 (numbers 1-8)
- **Medium Mode**: d6 (numbers 1-6), d8 (numbers 1-8), d10 (numbers 1-10), d12 (numbers 1-12)
- **Hard Mode**: d8 (numbers 1-8), d10 (numbers 1-10), d12 (numbers 1-12), d20 (numbers 1-20) + Black Dice
- **Expert Mode**: d10 (numbers 1-10), d12 (numbers 1-12), d20 (numbers 1-20) + Black Dice
- **Zen Mode**: d4 (numbers 1-4), d6 (numbers 1-6), d8 (numbers 1-8) with uniform dice rule

### Triggering Cascade Chain Reactions

**Cascade System** (Disabled in Zen Mode):
1. **Match Clearing**: When matches are cleared, remaining dice fall using column-based gravity
2. **Chain Formation**: Falling dice can form new matches automatically, creating cascade chains
3. **Multiplier Bonus**: Each cascade level increases your score multiplier (1x → 2x → 3x → 4x+)
4. **Audio Feedback**: Special combo sound effects play for chain multipliers
5. **Strategic Setup**: Plan initial matches to create maximum chain reactions

**Scoring Formula**: Points = (match size × dice number + total die faces) × cascade multiplier

### Advanced Strategy Tips

**Triple-Layer Strategy** (The Core Challenge):
1. **Spatial Reasoning**: Traditional Tetris-style piece fitting and rotation planning
2. **Number Positioning**: Strategic placement for optimal dice matching opportunities
3. **Fragmentation Prediction**: Anticipating how pieces will break apart when hitting terrain

**Pro Tips**:
- **Terrain Management**: Create strategic gaps and platforms to control piece fragmentation
- **Height Control**: Keep top rows (Y=14-15) clear to prevent spawn collision game over
- **Cascade Planning**: Set up matches that will cause falling dice to form additional matches
- **Pattern Recognition**: Look for opportunities to create large matches (5, 7, 9+ dice) for bonus scoring
- **Audio Cues**: Listen to specialized dice-match sound effects to understand match sizes without looking
- **Black Die Strategy**: In Hard/Expert modes, position Black Dice for maximum area conversion impact
- **Booster Awareness**: Use glowing dice as visual guides for strategic placement opportunities

## 🎊 Complete Gaming Experience

Dicetrix delivers a revolutionary puzzle gaming experience that successfully merges innovative individual die physics with comprehensive Reddit community integration. Players enjoy:

**Technical Excellence**: Professional-grade implementation with responsive design, cross-platform compatibility, enhanced audio systems, advanced particle effects, performance monitoring, and mobile-first optimization.

**Community Integration**: Full Reddit ecosystem with automated leaderboards, score submission, community notifications, and social sharing features.

**Innovative Gameplay**: The world's first puzzle game to combine Tetris-style mechanics, dice-based matching, individual die collision physics, and advanced particle effects in a single cohesive experience.

**Accessibility & Polish**: Complete scene progression, interactive tutorials, comprehensive settings, pause menu integration, professional visual/audio design, and performance-optimized particle systems.

This groundbreaking puzzle game challenges players to master three simultaneous gameplay dimensions while participating in a vibrant Reddit community, creating an unprecedented social puzzle gaming experience.
