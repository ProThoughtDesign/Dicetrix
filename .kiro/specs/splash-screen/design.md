# Splash Screen Design Document

## Overview

The Splash Screen is a new Phaser.js scene that serves as an animated introduction to Dicetrix, positioned between the Preloader and StartMenu scenes. It features falling dice animations with random color tints and interactive text that prompts users to begin playing. The scene also handles critical audio initialization on first user interaction, ensuring proper audio functionality throughout the game.

## Architecture

### Scene Integration

The Splash Screen integrates into the existing Phaser.js scene flow:

```
Boot → Preloader → SplashScreen → StartMenu → Game
```

The scene follows the established architectural patterns:
- Extends Phaser.Scene base class
- Uses the same background color scheme (#1a1a2e)
- Implements standard preload/create lifecycle methods
- Integrates with existing audio and settings services

### Class Structure

```typescript
export class SplashScreen extends Scene {
  private fallingDice: Phaser.GameObjects.Image[] = [];
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private flashText: Phaser.GameObjects.Text | null = null;
  private flashTween: Phaser.Tweens.Tween | null = null;
  private transitionInProgress: boolean = false;
}
```

## Components and Interfaces

### Falling Dice System

**Dice Spawning**
- Uses Phaser.Time.TimerEvent for controlled spawning intervals
- Spawns 1-3 dice per interval with random timing (200-800ms)
- Random horizontal positioning across screen width
- Utilizes existing dice assets (d4, d6, d8, d10, d12, d20)

**Physics and Animation**
- Applies Phaser physics for gravity simulation
- Steady downward velocity (approximately 200-300 pixels/second)
- Optional rotation animation for visual appeal
- Automatic cleanup when dice exit screen bounds

**Color Tinting**
- Random color selection from predefined palette
- Uses Phaser's built-in tint property
- Colors aligned with game's existing color scheme:
  - Green: 0x00ff88
  - Yellow: 0xffff33
  - Red: 0xff3366
  - Orange: 0xff9933
  - Purple: 0xcc33ff
  - Blue: 0x3366ff

### Interactive Text Component

**Text Properties**
- Font: Asimovian (matching game's typography)
- Color: White (#ffffff) with black stroke for contrast
- Content: "Press any key to play Dicetrix"
- Positioning: Centered horizontally and vertically
- Sizing: 80% of screen width with proportional height

**Animation System**
- Slow pulsing effect using Phaser.Tweens
- Alpha oscillation between 0.6 and 1.0
- Duration: 1.5 seconds per cycle
- Infinite loop with yoyo effect

### Input Handling

**Multi-Platform Support**
- Keyboard input: Any key press
- Mouse input: Click anywhere on screen
- Touch input: Tap anywhere on screen
- Prevents multiple rapid transitions

**Transition Logic**
- Single-use flag to prevent duplicate transitions
- Immediate cleanup of animations and timers
- Audio initialization before scene change
- Graceful error handling for audio failures

## Data Models

### Dice Object Model

```typescript
interface FallingDie {
  sprite: Phaser.GameObjects.Image;
  velocity: number;
  rotationSpeed?: number;
  tint: number;
}
```

### Scene State Model

```typescript
interface SplashScreenState {
  isActive: boolean;
  diceCount: number;
  lastSpawnTime: number;
  audioInitialized: boolean;
  transitionReady: boolean;
}
```

## Error Handling

### Audio Initialization Failures
- Graceful degradation if audio services fail
- Continue with scene transition regardless of audio status
- Comprehensive logging for debugging
- Fallback to silent operation

### Asset Loading Issues
- Fallback to basic geometric shapes if dice textures fail
- Error logging without blocking scene functionality
- Graceful handling of missing font resources

### Performance Safeguards
- Maximum dice limit (20 concurrent objects)
- Automatic cleanup of off-screen objects
- Memory management for tween animations
- Frame rate monitoring and adjustment

## Testing Strategy

### Unit Testing Focus
- Dice spawning logic and timing
- Color tint randomization
- Input event handling
- Scene transition logic
- Audio initialization flow

### Integration Testing
- Scene flow from Preloader to StartMenu
- Audio service integration
- Settings service compatibility
- Cross-platform input handling

### Performance Testing
- Frame rate stability with multiple falling dice
- Memory usage during extended display
- Mobile device compatibility
- Touch responsiveness

### Visual Testing
- Text scaling across different screen sizes
- Dice animation smoothness
- Color tint variety and distribution
- Transition timing and effects

## Implementation Notes

### Asset Dependencies
- Existing dice textures: d4.png, d6.png, d8.png, d10.png, d12.png, d20.png
- Asimovian font (already loaded in game)
- No additional asset loading required

### Performance Considerations
- Object pooling for dice sprites to minimize garbage collection
- Efficient cleanup of completed animations
- Optimized tween management
- Minimal DOM manipulation

### Accessibility
- High contrast text with stroke outline
- Clear, readable instructions
- Multiple input methods supported
- No time pressure for user interaction

### Mobile Optimization
- Touch-friendly interaction area (full screen)
- Appropriate text sizing for mobile screens
- Smooth animations at 60fps target
- Battery-conscious animation timing
