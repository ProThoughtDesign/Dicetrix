# Visual Effects System

This directory contains the complete visual effects system for Dicetrix, providing neon-themed graphics, animations, and particle effects.

## Components

### DiceRenderer
- Generates procedural dice textures for all die types (4, 6, 8, 10, 12, 20 sides)
- Creates color variations for each die color (red, blue, green, yellow, purple, orange, cyan)
- Handles Wild and Black dice with special visual indicators
- Applies neon-themed styling with glows and gradients

### ParticleEffects
- Creates match clearing effects with color-coded particles
- Handles cascade chain reactions with increasing intensity
- Provides Ultimate Combo spectacular effects
- Manages size-based effects (line clear, area clear, grid clear, wild spawn)

### AnimationManager
- Smooth piece movement animations (fall, move, rotate, lock)
- Dice clearing animations with staggered timing
- Gravity application with bouncing effects
- UI transitions and screen effects
- Score popups and level up celebrations

### VisualEffectsManager
- Coordinates all visual systems
- Provides unified interface for game integration
- Manages neon theme and environmental effects
- Handles screen effects (shake, flash, pulse)

### VisualIntegration
- Simplified interface for game logic integration
- Helper methods for common visual feedback scenarios
- Handles complex multi-system effects

## Usage

### Basic Setup
```typescript
import { createVisualIntegration } from './visual/index.js';

// In your game scene
const visualIntegration = createVisualIntegration(this);
```

### Match Clearing
```typescript
// When a match is detected and cleared
await visualIntegration.handleMatchClearing({
  dice: matchedDice,
  size: matchSize,
  effectType: 'standard', // or 'line_clear', 'area_clear', etc.
  score: calculatedScore
});
```

### Piece Movement
```typescript
// Animate piece falling
await visualIntegration.handlePieceMovement(piece, {
  type: 'fall',
  params: { fromY: startY, toY: endY, duration: 300 }
});

// Animate piece rotation
await visualIntegration.handlePieceMovement(piece, {
  type: 'rotate',
  params: { angle: Math.PI / 2, duration: 200 }
});
```

### Cascade Effects
```typescript
// When cascades occur
visualIntegration.handleCascade({
  x: centerX,
  y: centerY,
  chainLevel: currentChain,
  score: cascadeScore,
  multiplier: chainMultiplier
});
```

### Ultimate Combo
```typescript
// When Ultimate Combo is triggered
visualIntegration.handleUltimateCombo(centerX, centerY, totalScore);
```

### Booster Activation
```typescript
// When color boosters activate
visualIntegration.handleBoosterActivation('score_multiplier', 'red', x, y);
```

## Configuration

All visual parameters are centralized in `VisualConfig.ts`:

- Animation durations and easing functions
- Color palettes and neon theme settings
- Particle effect parameters
- Screen effect intensities
- Performance limits

## Features

### Neon Theme
- Dark background with neon grid overlay
- Ambient glow zones with subtle pulsing
- Color-coded visual feedback
- Glowing borders and effects

### Procedural Generation
- All dice textures generated at runtime
- No external image assets required
- Consistent styling across all elements
- Scalable for different screen sizes

### Performance Optimized
- Particle cleanup and limits
- Tween management and pooling
- Efficient texture generation
- Configurable quality settings

### Mobile Friendly
- Touch-optimized visual feedback
- Responsive scaling
- Performance considerations for mobile devices

## Integration with Existing Systems

The visual system integrates with:
- **Die.ts**: Enhanced rendering with neon effects
- **Preloader.ts**: Procedural texture generation
- **Game scenes**: Visual feedback for all game events
- **UI components**: Neon-themed styling and animations

## Customization

To customize visual effects:

1. Modify `VisualConfig.ts` for parameters
2. Extend particle effects in `ParticleEffects.ts`
3. Add new animations in `AnimationManager.ts`
4. Create custom integrations in `VisualIntegration.ts`

The system is designed to be modular and extensible while maintaining consistent neon aesthetics throughout the game.
