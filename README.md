# Dicetrix

**A revolutionary dice-matching puzzle game that combines Tetris-style falling pieces with strategic number matching mechanics.** Built for Reddit using Phaser.js and the Devvit platform, Dicetrix offers a unique twist on classic puzzle gaming with procedurally generated multi-die pieces, cascade chain reactions, and special dice mechanics.

## 🎮 What is Dicetrix?

Dicetrix is an innovative gravity-based puzzle game where **procedurally generated multi-die pieces** fall down an 8×16 grid. Unlike traditional Tetris where you match shapes, Dicetrix challenges you to create matches by connecting **3 or more adjacent dice with the same number**. When matches are cleared, remaining dice fall to create **cascade chain reactions** that can lead to massive scoring combos.

### 🌟 What Makes Dicetrix Unique?

**🎲 Procedural Multi-Die Pieces**: Instead of fixed Tetris shapes, pieces are dynamically generated containing 1-16 dice with various face counts (d4, d6, d8, d10, d12, d20), creating endless variety and strategic depth.

**🔮 Special Dice Mechanics**: 
- **Black Dice** (Hard/Expert modes): Wild cards that match with any adjacent number and trigger area conversion effects
- **Booster Dice**: Glowing dice that provide visual assistance for strategic placement
- **Uniform Rule** (Zen mode): All dice in a piece share the same face count for simplified gameplay

**⚡ Advanced Cascade System**: Cleared dice cause remaining dice to fall and potentially form new matches automatically, creating satisfying chain reactions with increasing score multipliers.

**🎵 Dynamic Audio-Visual Experience**: Mode-specific music compositions, comprehensive sound effects, particle systems, and visual effects that respond to gameplay events.

**🏆 Five Distinct Difficulty Modes**: Each mode features unique constraints, dice types, fall speeds, and special mechanics, offering experiences from relaxed zen gameplay to lightning-fast expert challenges.

### 🎯 Core Gameplay

- **Multi-Die Pieces**: Procedurally generated pieces containing 1-16 dice fall down the grid
- **Number Matching**: Connect 3+ adjacent dice with the same number (horizontal/vertical only)
- **Cascade System**: Cleared dice cause remaining dice to fall, creating chain reactions
- **Scoring**: Points based on match size, dice values, and cascade multipliers
- **Five Difficulty Modes**: Each with unique constraints, dice types, and mechanics

### 🎮 Currently Implemented Features

- **Complete Scene System**: Splash screen, main menu, settings, game, game over, leaderboard, and how-to-play scenes
- **Five Difficulty Modes**: Easy, Medium, Hard, Expert, and Zen with distinct configurations
- **Advanced Audio System**: Mode-specific music, sound effects library, and comprehensive audio controls
- **Visual Effects**: Particle systems, dice glow effects, match explosions, and cascade animations
- **Settings Management**: Centralized settings with audio controls and persistent storage
- **Game Controls**: Keyboard (WASD/arrows), mobile touch controls, and pause functionality
- **Score Submission UI**: Interface for submitting scores with optional Reddit posting
- **Leaderboard System**: Difficulty-specific rankings with Redis storage and reset scheduling

## 🎯 How to Play

### Core Gameplay Loop

1. **🎲 Multi-Die Pieces Fall**: Procedurally generated pieces containing 1-16 dice fall down an 8×16 grid
2. **🎯 Create Matches**: Connect 3+ adjacent dice with the same number (horizontal/vertical only)
3. **💥 Trigger Cascades**: Cleared dice cause remaining dice to fall, potentially creating chain reactions
4. **🏆 Score Points**: Earn points based on match size, dice values, and cascade multipliers

### Game Mechanics

**Piece System**:
- Multi-die pieces with various shapes and sizes
- Pieces can be rotated and moved horizontally
- Pieces lock when they hit the bottom or other dice

**Matching System**:
- Connect 3+ adjacent dice with the same number
- Only horizontal and vertical connections count
- Matched dice disappear with visual effects

**Cascade System**:
- Remaining dice fall to fill gaps after matches
- New matches can form automatically during cascades
- Chain reactions increase score multipliers

## 🌟 Key Features

### 🎮 Five Difficulty Modes
Each mode offers distinct challenges and mechanics:

- **🟢 Easy**: 3×3×5 pieces, d4/d6/d8 dice, 1000ms fall speed, 50% booster glow
- **🟡 Medium**: 4×4×8 pieces, d6/d8/d10/d12 dice, 800ms fall speed, 35% booster glow
- **🔴 Hard**: 5×5×10 pieces, d8/d10/d12/d20 + **Black Dice**, 600ms fall speed, 25% booster glow
- **🟠 Expert**: 5×5×16 pieces, d10/d12/d20 + **Black Dice**, 400ms fall speed, 15% booster glow
- **🟣 Zen**: 3×3×5 pieces, d4/d6/d8 dice (uniform rule), 1200ms fall speed, **no cascades**

### 🔮 Special Dice Mechanics
- **Black Dice** (Hard & Expert): Wild cards that match with any adjacent number
- **Booster Effects**: Glowing dice provide visual assistance for strategic placement
- **Uniform Rule** (Zen): All dice in a piece have the same face count

### 🎵 Audio & Visual Systems
- **Dynamic Audio**: Mode-specific music and comprehensive sound effects library
- **Particle Effects**: Match explosions, cascade effects, and special dice auras
- **Visual Polish**: Enhanced dice rendering with glow effects and animations
- **Mobile-First Design**: Responsive UI with touch controls and performance optimization

### 🏆 Reddit Integration
- **Score Submission**: Interface for submitting scores with optional Reddit posting
- **Leaderboard System**: Difficulty-specific rankings stored in Redis
- **Community Features**: Post creation and subreddit integration through Devvit platform

## 🎮 How to Play Dicetrix

### 🚀 Getting Started

**Step 1: Launch the Game**
1. Run `npm run dev` in your terminal
2. Open the provided Reddit playtest URL in your browser  
3. Experience the animated splash screen with falling dice
4. Press any key or tap the screen to continue to the main menu

**Step 2: Navigate the Main Menu**
1. **Select Difficulty**: Use the dropdown to choose Easy, Medium, Hard, Expert, or Zen mode
2. **Enable Audio**: Click the 🔇/🔊 button to activate game audio (required for music and sound effects)
3. **Access Settings**: Click "SETTINGS" to configure music and sound effect volumes independently
4. **Learn the Game**: Click "HOW TO PLAY" for an interactive 4-page tutorial
5. **View Rankings**: Click "LEADERBOARD" to see community scores organized by difficulty

### 🎮 Master the Game Controls

**Desktop Controls:**
- **Movement**: Arrow keys or WASD to move pieces left/right/down
- **Rotation**: Up arrow or Q key to rotate pieces clockwise
- **Hard Drop**: Spacebar to instantly drop pieces to the bottom
- **Pause**: Escape key to access pause menu with settings and restart options

**Mobile Controls:**
- **On-Screen Buttons**: Responsive touch controls for movement and rotation
- **Touch Grid**: Tap any grid position to move the active piece horizontally to that column
- **Gesture Support**: Intuitive touch gestures for piece manipulation

### 🎯 Core Gameplay Mechanics

**Step 1: Understanding Pieces**
- Multi-die pieces containing 1-16 dice fall from the top of the 8×16 grid
- Each die shows a number (1 to the die's face count: d4, d6, d8, d10, d12, or d20)
- Pieces can be moved horizontally and rotated while falling
- Pieces lock in place when they hit the bottom or collide with other dice

**Step 2: Creating Matches**
- Connect **3 or more adjacent dice** with the **same number** (horizontal/vertical connections only)
- Matched dice disappear with visual particle effects and sound feedback
- Larger matches (4+, 5+, 6+ dice) provide exponentially higher scores
- Different match sizes trigger distinct sound effects for audio feedback

**Step 3: Triggering Cascades**
- After matches are cleared, remaining dice **fall down to fill gaps**
- Falling dice can automatically form **new matches** without player input
- Each cascade level increases your **score multiplier** (2x, 3x, 4x, etc.)
- Chain reactions can continue indefinitely, creating massive scoring opportunities

**Step 4: Strategic Placement**
- Plan your initial matches to set up potential cascade chains
- Look for opportunities to create multiple matches simultaneously  
- Use the "next piece" preview to plan several moves ahead
- Position pieces to maximize cascade potential rather than just immediate matches

### 🎲 Difficulty Mode Selection Guide

**🟢 Easy Mode** (Perfect for Learning)
- **Piece Size**: 3×3×5 (width × height × max dice)
- **Dice Types**: d4, d6, d8 (simpler numbers)
- **Fall Speed**: 1000ms (slow, plenty of thinking time)
- **Booster Glow**: 50% (frequent visual assistance)
- **Best For**: New players learning the mechanics

**🟡 Medium Mode** (Balanced Experience)  
- **Piece Size**: 4×4×8 (moderate complexity)
- **Dice Types**: d6, d8, d10, d12 (varied numbers)
- **Fall Speed**: 800ms (moderate pace)
- **Booster Glow**: 35% (regular visual assistance)
- **Best For**: Players comfortable with basic mechanics

**🔴 Hard Mode** (Advanced Challenge)
- **Piece Size**: 5×5×10 (larger, more complex pieces)
- **Dice Types**: d8, d10, d12, d20 + **Black Dice** (wild cards)
- **Fall Speed**: 600ms (fast-paced)
- **Booster Glow**: 25% (limited assistance)
- **Special Feature**: Black dice match with any adjacent number
- **Best For**: Experienced players seeking challenge

**🟠 Expert Mode** (Maximum Difficulty)
- **Piece Size**: 5×5×16 (largest possible pieces)
- **Dice Types**: d10, d12, d20 + **Black Dice** (highest numbers + wilds)
- **Fall Speed**: 400ms (very fast)
- **Booster Glow**: 15% (minimal assistance)
- **Special Feature**: Black dice with area conversion effects
- **Best For**: Master players wanting ultimate challenge

**🟣 Zen Mode** (Relaxed Strategy)
- **Piece Size**: 3×3×5 (simple pieces)
- **Dice Types**: d4, d6, d8 with **Uniform Rule** (all dice in a piece have same face count)
- **Fall Speed**: 1200ms (very slow)
- **Special Feature**: **No cascades** (matches don't trigger chain reactions)
- **Best For**: Strategic planning without time pressure

### 🔮 Special Dice Mechanics

**Black Dice (Hard & Expert Modes)**
- **Wild Matching**: Black dice match with any adjacent number
- **Visual Identification**: Distinctive black color with special particle auras
- **Area Conversion**: When cleared, convert surrounding dice to d20 dice (Expert mode)
- **Strategic Value**: Use to complete difficult matches or bridge number gaps

**Booster Dice (All Modes)**
- **Visual Glow**: Dice with glowing particle effects around them
- **Strategic Assistance**: Help identify optimal placement positions
- **Frequency**: Varies by difficulty (50% Easy → 15% Expert)
- **Purpose**: Provide visual guidance for strategic piece placement

**Uniform Rule (Zen Mode Only)**
- **Consistent Pieces**: All dice in a single piece have the same face count
- **Simplified Strategy**: Easier to predict and plan matches
- **Reduced Complexity**: Focus on positioning rather than number variety

### 🏆 Scoring and Victory

**Scoring Formula:**
- **Base Points**: Match size × dice numbers × cascade multiplier × difficulty multiplier
- **Cascade Bonus**: Each cascade level increases multiplier (2x, 3x, 4x, etc.)
- **Size Bonus**: Larger matches provide exponential point increases
- **Difficulty Bonus**: Higher difficulties provide score multipliers

**Victory Conditions:**
- **Primary Goal**: Achieve the highest possible score before game over
- **Game Over**: Occurs when a new piece cannot spawn due to grid collision at the top
- **High Score**: Submit your score to compete on difficulty-specific leaderboards
- **Community Competition**: Compare your performance with other Reddit players

**Pro Tips for High Scores:**
1. **Plan Cascades**: Set up initial matches that will trigger chain reactions
2. **Larger Matches**: Prioritize 4+ dice matches over multiple 3-dice matches  
3. **Combo Chains**: Maintain cascade multipliers as long as possible
4. **Grid Management**: Keep the top of the grid clear to avoid early game over
5. **Special Dice**: Use Black dice strategically to complete difficult matches

## 🌟 Technical Features

### 🎮 Game Architecture
- **Complete Scene System**: Boot, Preloader, Splash, StartMenu, Settings, Game, GameOver, Leaderboard, HowToPlay
- **Phaser.js Integration**: 2D graphics with WebGL rendering and responsive scaling
- **State Management**: Centralized settings management with persistent storage
- **Performance Optimization**: Object pooling, particle systems, and mobile-first design

### 🎵 Audio System
- **Dynamic Music**: Mode-specific background music with seamless transitions
- **Sound Effects Library**: Comprehensive audio feedback for all game actions
- **Audio Controls**: Independent music and sound effect volume controls
- **Browser Compatibility**: Proper audio context handling for autoplay policies

### 🎨 Visual Effects
- **Particle Systems**: Match explosions, cascade effects, and special dice auras
- **Dice Rendering**: Enhanced dice with glow effects, shadows, and animations
- **UI Polish**: Responsive layouts, visual feedback, and smooth transitions
- **Mobile Support**: Touch controls and responsive design for all screen sizes

### 🏆 Reddit Integration
- **Devvit Platform**: Built on Reddit's developer platform for seamless integration
- **Score Submission**: Interface for submitting scores with optional Reddit posting
- **Leaderboard System**: Redis-based storage with difficulty-specific rankings
- **Post Creation**: Automated post creation for app installation and score sharing

## 🚀 Quick Start Guide

### 1. Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open the provided Reddit playtest URL → Experience the splash screen → Press any key to continue

### 2. Main Menu Navigation
- **Difficulty Dropdown**: Choose Easy, Medium, Hard, Expert, or Zen mode
- **SETTINGS**: Configure audio (music + sound effects)
- **HOW TO PLAY**: Interactive tutorial system
- **LEADERBOARD**: Community rankings by difficulty
- **Audio Button**: Click 🔇/🔊 to enable game audio

### 3. Game Controls
- **Keyboard**: WASD/Arrow keys (move), Space (hard drop), ↑/Q (rotate), Esc (pause)
- **Mobile**: Responsive on-screen buttons
- **Touch**: Tap grid positions to move pieces horizontally

### 4. Core Mechanics
1. **Multi-Die Pieces**: Procedurally generated pieces fall down the grid
2. **Create Matches**: Connect 3+ adjacent dice with same numbers
3. **Trigger Cascades**: Cleared dice cause chain reactions with multipliers
4. **Strategic Placement**: Plan matches for maximum cascade potential

### 5. Victory Conditions
- **Goal**: Maximize score through matches and cascade chains
- **Game Over**: When pieces can't spawn (grid collision at top)
- **Community**: Submit scores and compete on difficulty-specific leaderboards

## 🎯 Technical Implementation

### Game Architecture
- **Phaser.js Framework**: 2D game engine with WebGL rendering and responsive scaling
- **Scene Management**: Complete scene system with proper state transitions
- **Coordinate System**: Grid-to-screen coordinate conversion for precise positioning
- **Performance Optimization**: Object pooling, particle management, and mobile optimization

### Scoring System
- **Base Formula**: Points based on match size, dice values, cascade multipliers, and difficulty multipliers
- **Cascade Chains**: Automatic chain reactions with increasing multipliers
- **Special Dice**: Black dice with wild matching capabilities (Hard/Expert modes)
- **Booster Effects**: Visual glow assistance with difficulty-scaled frequencies

### Data Management
- **Settings System**: Centralized settings management with persistent storage
- **Leaderboard Storage**: Redis-based storage with difficulty-specific rankings
- **Score Tracking**: Comprehensive score breakdown and submission system

## 🏆 Development & Deployment

### Development Setup
```bash
# Install dependencies
npm install

# Start development server with live reloading
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy
```

### Testing
- **Devvit Playtest**: Automatic test subreddit creation for Reddit integration testing
- **Cross-Platform**: Test on desktop, tablet, and mobile devices
- **Audio System**: Verify music and sound effects across different browsers
- **Performance**: Monitor particle effects and frame rate on various devices

## 🛠️ Roadmap

The following features are planned for future development:

### Gameplay Enhancements
- **Individual Die Physics**: Advanced collision system where dice can fragment independently from pieces
- **Area Conversion Effects**: Black dice converting surrounding areas to d20 dice when cleared
- **Enhanced Cascade System**: More complex chain reaction mechanics

### Reddit Integration Expansion
- **Live Leaderboard Widgets**: Real-time subreddit widgets displaying current rankings
- **Automated Reset Notifications**: Community posts announcing leaderboard resets
- **Achievement System**: Reddit notifications for reaching milestones
- **Community Tournaments**: Scheduled competitive events with special rewards

### Advanced Features
- **Real-time Multiplayer**: Head-to-head competitive gameplay
- **Custom Game Modes**: User-created difficulty configurations
- **Replay System**: Record and share gameplay sessions
- **Statistics Dashboard**: Detailed player analytics and progress tracking

---

## 🎊 Experience Dicetrix Today!

Dicetrix combines classic puzzle mechanics with modern web technology to create an engaging social gaming experience on Reddit. With five difficulty modes, comprehensive audio-visual systems, and community leaderboards, it offers hours of strategic puzzle gameplay.

**Ready to play?** Run `npm run dev` and start your puzzle gaming journey!

