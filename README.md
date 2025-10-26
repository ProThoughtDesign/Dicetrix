# Dicetrix

A revolutionary puzzle game that combines Tetris-style mechanics with dice-based number matching and groundbreaking **individual die physics**. Built for Reddit using Phaser.js and the Devvit platform.

## 🎮 What Makes Dicetrix Revolutionary?

Dicetrix introduces the world's first **individual die collision system** in puzzle gaming. Unlike traditional Tetris where entire pieces lock as units, **each die in a multi-die piece can collide and lock independently**, creating dynamic piece fragmentation that adds unprecedented strategic depth.

### 🔥 The Core Innovation: Individual Die Physics

When a multi-die piece falls and encounters obstacles:
- **Some dice hit obstacles** → They lock to the grid immediately
- **Remaining dice continue falling** → They form a smaller active piece
- **Pieces fragment dynamically** → Based on terrain and collision patterns

**Real Example**: A T-shaped piece hits uneven terrain → The center die locks when it hits an existing piece → The two arm dice continue falling separately until they encounter their own obstacles.

### 🏆 Complete Reddit Gaming Experience

- **5 Difficulty Modes**: Easy, Medium, Hard, Expert, and Zen with unique mechanics
- **Community Leaderboards**: Difficulty-specific rankings with automated resets
- **Score Submission**: Optional Reddit post creation with game statistics
- **Social Integration**: Real-time notifications and community engagement
- **Professional Polish**: Complete scene progression with advanced audio and visual systems

## 🎯 How to Play Dicetrix

### Core Gameplay Loop

1. **🎲 Multi-Die Pieces Fall**: Procedurally generated pieces containing 1-16 dice fall down an 8×16 grid
2. **⚡ Individual Die Physics**: Each die can collide and lock independently - pieces fragment dynamically!
3. **🎯 Create Matches**: Connect 3+ adjacent dice with the same number (horizontal/vertical only)
4. **💥 Trigger Cascades**: Cleared dice cause remaining dice to fall, potentially creating chain reactions
5. **🏆 Score Points**: Earn points based on match size, dice values, and cascade multipliers

### The Revolutionary Individual Die System

**How It Works**:
- Each die in a falling piece is checked for collisions independently
- When some dice hit obstacles, they lock immediately to the grid
- Remaining dice continue falling as a smaller active piece
- Pieces naturally fragment based on terrain and obstacles

**Strategic Impact**:
- **Terrain Matters**: Existing grid layout affects how pieces will break apart
- **Prediction Required**: Anticipate fragmentation patterns for optimal placement
- **Continuous Action**: No traditional "piece locking" - gameplay flows seamlessly
- **Triple Challenge**: Balance spatial reasoning + number matching + fragmentation prediction

## 🌟 What Makes Dicetrix Unique?

### 1. 🚀 World's First Individual Die Physics System
**The Innovation**: Each die in a multi-die piece can collide and lock independently, creating dynamic piece fragmentation that has never existed in puzzle games before.

**Real Examples**:
- **T-Piece**: Center die locks on impact → Arms continue falling separately
- **Line Piece**: Bottom 2 dice lock on terrain → Top 2 continue as smaller line
- **L-Shape**: Corner locks in gap → Rest fragments based on obstacles
- **Square**: Bottom row locks → Top row continues as horizontal line

### 2. 🎮 Five Unique Difficulty Modes
Each mode offers distinct challenges and mechanics:

- **🟢 Easy**: 3×3×5 pieces, d4/d6/d8 dice, 1000ms fall speed, 50% booster glow
- **🟡 Medium**: 4×4×8 pieces, d6/d8/d10/d12 dice, 800ms fall speed, 35% booster glow
- **🔴 Hard**: 5×5×10 pieces, d8/d10/d12/d20 + **Black Dice**, 600ms fall speed, 25% booster glow
- **🟠 Expert**: 5×5×16 pieces, d10/d12/d20 + **Black Dice**, 400ms fall speed, 15% booster glow
- **🟣 Zen**: 3×3×5 pieces, d4/d6/d8 dice (uniform rule), 1200ms fall speed, **no cascades**

### 3. 🔮 Advanced Black Die Mechanics (Hard & Expert)
- **Wild Matching**: Black Dice match with any adjacent number
- **Area Conversion**: When cleared, convert surrounding 3×3 area to d20 dice
- **Strategic Depth**: Position for maximum conversion impact and cascade setup

### 4. 🏆 Complete Reddit Integration
- **Community Leaderboards**: Difficulty-specific rankings with automated resets
- **Score Submission**: Optional Reddit post creation with game statistics
- **Social Features**: Real-time notifications and community engagement
- **Subreddit Widgets**: Live leaderboard displays for community competition

### 5. 💥 Advanced Visual & Audio Systems
- **Particle Effects**: Color-coded match explosions and special dice auras
- **Enhanced Audio**: Mode-specific music and specialized dice-match sound effects
- **Visual Polish**: Gold dice numbers, drop shadows, multi-layered glow effects
- **Performance Optimized**: Object pooling and mobile-first responsive design

## 🎮 Step-by-Step How to Play

### Getting Started

1. **🚀 Launch the Game**
   - Run `npm run dev` in your terminal
   - Open the provided Reddit playtest URL in your browser
   - Experience the captivating splash screen with falling dice animation

2. **🎯 Navigate the Main Menu**
   - **Difficulty Dropdown**: Select from Easy, Medium, Hard, Expert, or Zen mode
   - **SETTINGS**: Configure audio with independent music and sound effect controls
   - **HOW TO PLAY**: Access the comprehensive interactive tutorial system
   - **LEADERBOARD**: View community rankings organized by difficulty
   - **Audio Button**: Click 🔇/🔊 to enable global audio

### Core Gameplay

3. **🎮 Master the Controls**
   - **Keyboard**: Arrow keys or WASD for movement, Space for hard drop, ↑/Q for rotation
   - **Mobile**: Use responsive on-screen buttons (3×2 grid layout)
   - **Touch**: Tap any grid position to move pieces horizontally toward that column
   - **Pause**: Press Esc to access pause menu with settings and restart options

4. **⚡ Understand Individual Die Physics** (The Key Innovation)
   - Each die in a piece can collide and lock independently
   - When some dice hit obstacles, they lock immediately to the grid
   - Remaining dice continue falling as a smaller active piece
   - Pieces dynamically fragment based on terrain and obstacles

5. **🎯 Create Dice Matches**
   - Connect 3+ adjacent dice with the same number (horizontal/vertical only)
   - Matched dice disappear with color-coded particle explosions
   - Different match sizes trigger different sound effects
   - Remaining dice fall to fill gaps, potentially creating new matches

6. **💥 Trigger Cascade Chain Reactions**
   - Falling dice can form new matches automatically
   - Each cascade level increases score multiplier (1x → 2x → 3x → 4x+)
   - Plan initial matches to create maximum chain reactions
   - Listen for combo sound effects indicating successful chains

### Advanced Features

7. **🎲 Choose Your Challenge Level**
   - **🟢 Easy**: 3×3×5 pieces, d4/d6/d8 dice, slow fall speed, 50% glow assistance
   - **🟡 Medium**: 4×4×8 pieces, d6/d8/d10/d12 dice, moderate speed, 35% glow
   - **🔴 Hard**: 5×5×10 pieces, d8/d10/d12/d20 + Black Dice, fast speed, 25% glow
   - **🟠 Expert**: 5×5×16 pieces, d10/d12/d20 + Black Dice, very fast, 15% glow
   - **🟣 Zen**: 3×3×5 pieces, d4/d6/d8 uniform dice, slow speed, no cascades

8. **🔮 Master Advanced Mechanics**
   - **Black Dice** (Hard/Expert): Wild cards that match any number + trigger 3×3 area conversion
   - **Booster Effects**: Glowing dice provide visual assistance for strategic placement
   - **Area Conversion**: Black Dice convert surrounding 3×3 areas to d20 dice when cleared
   - **Uniform Rule** (Zen): All dice in a piece have the same face count

### Winning Strategies

9. **🧠 Develop Triple-Layer Thinking**
   - **Spatial Reasoning**: Traditional Tetris-style piece fitting and rotation
   - **Number Matching**: Strategic dice placement for optimal matching opportunities
   - **Fragmentation Prediction**: Anticipating how pieces will break apart based on terrain

10. **🏆 Pro Tips for Success**
    - Create strategic gaps to control piece fragmentation
    - Keep top rows (Y=14-15) clear to prevent game over
    - Set up matches that cause falling dice to form additional matches
    - Use audio cues to understand match sizes without looking
    - Position Black Dice for maximum area conversion impact
    - Plan cascade chains for massive scoring opportunities

### Community Competition

11. **📊 Score Submission & Reddit Integration**
    - Game ends when pieces can't spawn due to grid collision
    - Use enhanced Score Submission UI with detailed breakdown
    - Choose to submit score only or create Reddit post with statistics
    - View leaderboard position and compete with the community
    - Participate in automated daily/weekly/monthly competitions

### Victory Conditions

**🎯 Primary Goal**: Achieve the highest score by creating matches and cascade chains before the grid fills up

**📈 Scoring**: Points = (match size × dice numbers + total faces) × cascade multiplier × difficulty multiplier

**💀 Game Over**: When a new piece cannot spawn due to collision at the top of the grid

**🏆 Community Success**: Climb difficulty-specific leaderboards and engage with the Reddit gaming community

## 🌟 Key Features

### 🎮 Revolutionary Gameplay
- ⚡ **Individual Die Physics**: World's first collision system where pieces fragment dynamically
- 🎲 **5 Difficulty Modes**: Easy to Expert with unique mechanics + relaxing Zen mode
- 🔮 **Black Die System**: Wild matching + 3×3 area conversion effects (Hard/Expert)
- 🧩 **Procedural Generation**: Dynamic pieces with dimensional constraints (3×3×5 to 5×5×16)
- 💥 **Cascade Chain Reactions**: Automatic chain multipliers for massive scoring

### 🏆 Reddit Community Integration
- 📊 **Difficulty-Specific Leaderboards**: Separate rankings with automated resets
- 🎯 **Enhanced Score Submission**: Optional Reddit post creation with game stats
- 📢 **Community Features**: Real-time notifications and achievement alerts
- 🎮 **Subreddit Widgets**: Live leaderboard displays for community competition
- 👥 **Interactive Tutorials**: Comprehensive how-to-play guide system

### 🎨 Professional Polish
- 📱 **Cross-Platform**: Keyboard, touch, and responsive mobile controls
- 🎵 **Dynamic Audio**: Mode-specific music + specialized dice-match sound effects
- ✨ **Advanced Visuals**: Particle effects, glow systems, and enhanced dice rendering
- 🌟 **Mobile-First Design**: Responsive UI with performance optimization
- 🎯 **Complete Experience**: Full scene progression from splash to leaderboards

## 🚀 Quick Start Guide

### 1. Launch & Setup
```bash
npm run dev
```
Open the provided Reddit playtest URL → Experience the animated splash screen → Press any key to continue

### 2. Main Menu Navigation
- **Difficulty Dropdown**: Choose Easy, Medium, Hard, Expert, or Zen mode
- **SETTINGS**: Configure audio (music + sound effects)
- **HOW TO PLAY**: Interactive tutorial system
- **LEADERBOARD**: Community rankings by difficulty
- **Audio Button**: Click 🔇/🔊 to enable game audio

### 3. Game Controls
- **Keyboard**: WASD/Arrow keys (move), Space (hard drop), ↑/Q (rotate), Esc (pause)
- **Mobile**: Responsive on-screen buttons (3×2 grid)
- **Touch**: Tap grid positions to move pieces horizontally

### 4. Master the Core Mechanics
1. **Individual Die Physics**: Pieces fragment when some dice hit obstacles
2. **Create Matches**: Connect 3+ adjacent dice with same numbers
3. **Trigger Cascades**: Cleared dice cause chain reactions with multipliers
4. **Strategic Placement**: Use terrain to control fragmentation patterns

### 5. Victory Conditions
- **Goal**: Maximize score through matches and cascade chains
- **Game Over**: When pieces can't spawn (grid collision at top)
- **Community**: Compete on difficulty-specific leaderboards with Reddit integration

## 🎯 Technical Innovation

### Revolutionary Individual Die Physics
Unlike traditional Tetris where entire pieces lock as units, **each die in a multi-die piece can collide and lock independently**:

- **Bottom-Up Processing**: Each die checked for collisions individually every game tick
- **Selective Locking**: Only dice hitting obstacles lock immediately to grid
- **Dynamic Fragmentation**: Remaining dice continue falling as smaller active piece
- **Terrain-Based Strategy**: Existing grid layout affects how pieces fragment

### Advanced Scoring System
- **Base Formula**: Points = (match size × dice numbers + total faces) × cascade multiplier × difficulty multiplier
- **Cascade Chains**: Automatic chain reactions with increasing multipliers (2x, 3x, 4x+)
- **Black Die Mechanics**: Wild matching + 3×3 area conversion effects (Hard/Expert modes)
- **Booster Effects**: Visual glow assistance with difficulty-scaled frequencies

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

---

## 🎊 Experience Dicetrix Today!

Dicetrix represents a revolutionary leap in puzzle gaming, introducing the world's first **individual die physics system** that creates dynamic piece fragmentation never seen before. Combined with comprehensive Reddit integration, advanced visual effects, and five unique difficulty modes, it offers an unprecedented social puzzle gaming experience.

**Ready to play?** Run `npm run dev` and discover why Dicetrix is redefining what's possible in puzzle games!

 remaining dice continue falling

