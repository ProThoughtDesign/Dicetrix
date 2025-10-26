# Dicetrix

A puzzle game that combines Tetris-style mechanics with dice-based number matching. Built for Reddit using Phaser.js and the Devvit platform.

## 🎮 Game Overview

Dicetrix is a gravity-based puzzle game where multi-die pieces fall down an 8×16 grid. Players create matches by connecting 3+ adjacent dice with the same number, triggering cascades and chain reactions for higher scores.

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

## 🎮 How to Play

### Getting Started

1. **🚀 Launch the Game**
   - Run `npm run dev` in your terminal
   - Open the provided Reddit playtest URL in your browser
   - Experience the splash screen with falling dice animation

2. **🎯 Navigate the Main Menu**
   - **Difficulty Dropdown**: Select from Easy, Medium, Hard, Expert, or Zen mode
   - **SETTINGS**: Configure audio with independent music and sound effect controls
   - **HOW TO PLAY**: Access the interactive tutorial system
   - **LEADERBOARD**: View community rankings organized by difficulty
   - **Audio Button**: Click 🔇/🔊 to enable global audio

### Core Gameplay

3. **🎮 Master the Controls**
   - **Keyboard**: Arrow keys or WASD for movement, Space for hard drop, ↑/Q for rotation
   - **Mobile**: Use responsive on-screen buttons
   - **Touch**: Tap grid positions to move pieces horizontally
   - **Pause**: Press Esc to access pause menu with settings and restart options

4. **🎯 Create Dice Matches**
   - Connect 3+ adjacent dice with the same number (horizontal/vertical only)
   - Matched dice disappear with particle effects
   - Different match sizes trigger different sound effects
   - Remaining dice fall to fill gaps, potentially creating new matches

5. **💥 Trigger Cascade Chain Reactions**
   - Falling dice can form new matches automatically
   - Each cascade level increases score multiplier
   - Plan initial matches to create maximum chain reactions
   - Listen for combo sound effects indicating successful chains

### Advanced Features

6. **🎲 Choose Your Challenge Level**
   - **🟢 Easy**: 3×3×5 pieces, d4/d6/d8 dice, slow fall speed, 50% glow assistance
   - **🟡 Medium**: 4×4×8 pieces, d6/d8/d10/d12 dice, moderate speed, 35% glow
   - **🔴 Hard**: 5×5×10 pieces, d8/d10/d12/d20 + Black Dice, fast speed, 25% glow
   - **🟠 Expert**: 5×5×16 pieces, d10/d12/d20 + Black Dice, very fast, 15% glow
   - **🟣 Zen**: 3×3×5 pieces, d4/d6/d8 uniform dice, slow speed, no cascades

7. **🔮 Master Special Mechanics**
   - **Black Dice** (Hard/Expert): Wild cards that match any number
   - **Booster Effects**: Glowing dice provide visual assistance for strategic placement
   - **Uniform Rule** (Zen): All dice in a piece have the same face count

### Victory Conditions

**🎯 Primary Goal**: Achieve the highest score by creating matches and cascade chains before the grid fills up

**📈 Scoring**: Points based on match size, dice values, cascade multipliers, and difficulty multipliers

**💀 Game Over**: When a new piece cannot spawn due to collision at the top of the grid

**🏆 Community Competition**: Submit scores and compete on difficulty-specific leaderboards

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

