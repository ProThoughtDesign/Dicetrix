# Dicetrix Cascade System Documentation

## Overview

The Cascade System is a core component of Dicetrix that handles gravity application and chain reactions after dice matches are cleared. It implements the requirements for task 8: "Implement gravity and cascade system".

## Architecture

The cascade system consists of several interconnected components:

### 1. CascadeManager (`CascadeManager.ts`)
The main orchestrator that manages the complete cascade sequence.

**Key Features:**
- Gravity application with smooth animations
- Cascade detection for newly formed matches
- Chain multiplier tracking (floor(log2(chain_index)))
- Cascade loop prevention (max 10 cascades)
- Visual effects for cascading matches

**Main Methods:**
- `processCascadeSequence()`: Main entry point for cascade processing
- `setMaxCascades(limit)`: Configure cascade limit (1-50)
- `setAnimationTiming(gravity, delay)`: Configure animation timing
- `getCascadeState()`: Get current cascade state
- `getCascadeStatistics()`: Get performance metrics

### 2. Grid (`Grid.ts`)
Handles the physical game grid and gravity mechanics.

**Cascade-Related Methods:**
- `applyGravity()`: Makes dice fall down after clearing
- `detectMatches()`: Finds new matches after gravity
- `clearCells(positions)`: Removes dice from specified positions

### 3. MatchProcessor (`MatchProcessor.ts`)
Processes matches and applies size effects.

**Integration Points:**
- Called by CascadeManager to process matches
- Handles Ultimate Combo detection and effects
- Applies size-based clearing effects

### 4. MatchEffects (`MatchEffects.ts`)
Provides visual feedback for cascade events.

**Cascade Effects:**
- `playCascadeEffect()`: Shows chain number and visual feedback
- Particle effects for different cascade sizes
- Screen shake for Ultimate Combos

## Cascade Flow

```
1. Initial Match Clearing
   ↓
2. Apply Gravity (with animation)
   ↓
3. Check for New Matches
   ↓
4. Process Matches (if found)
   ↓
5. Calculate Chain Multiplier
   ↓
6. Apply Visual Effects
   ↓
7. Repeat (2-6) until no matches or max cascades reached
```

## Chain Multiplier Formula

The chain multiplier follows the formula: `floor(log2(chain_index))`

Examples:
- Cascade 1: floor(log2(1)) = 0
- Cascade 2: floor(log2(2)) = 1  
- Cascade 3: floor(log2(3)) = 1
- Cascade 4: floor(log2(4)) = 2
- Cascade 8: floor(log2(8)) = 3

This provides exponential scaling that rewards longer chains without becoming overpowered.

## Cascade Loop Prevention

The system implements several safeguards against infinite loops:

1. **Maximum Cascade Limit**: Default 10, configurable 1-50
2. **Gravity Check**: Only continues if dice actually moved
3. **Match Validation**: Only continues if new matches are found
4. **Emergency Stop**: `forceStopCascade()` method for manual intervention

## Performance Considerations

### Animation Timing
- **Gravity Animation**: 300ms default (configurable)
- **Cascade Delay**: 200ms between cascades (configurable)
- **Immediate Mode**: Set delays to 0 for testing

### Memory Management
- Dice objects are properly destroyed after clearing
- Animation promises are cleaned up automatically
- Particle effects have limited lifespans

## Integration with Game Systems

### GameStateManager Integration
```typescript
const cascadeResult = await this.cascadeManager.processCascadeSequence();
const scoreBreakdown = this.calculateScoreBreakdown(matchResult, cascadeResult);
this.updateGameState(scoreBreakdown, cascadeResult);
```

### Booster System Integration
- Chain multipliers are modified by purple boosters
- Gravity delay affected by cyan boosters
- Score multipliers applied to cascade scores

### Visual Effects Integration
- Smooth falling animations for gravity
- Chain number indicators
- Particle effects for different cascade sizes
- Screen shake for Ultimate Combos

## Configuration Options

### Cascade Limits
```typescript
cascadeManager.setMaxCascades(5); // Set custom limit
```

### Animation Timing
```typescript
cascadeManager.setAnimationTiming(400, 150); // gravity: 400ms, delay: 150ms
```

### Performance Monitoring
```typescript
const stats = cascadeManager.getCascadeStatistics();
console.log(`Processed ${stats.totalCascadesProcessed} cascades`);
```

## Error Handling

### Concurrent Processing Prevention
```typescript
if (this.isProcessingCascade) {
  console.warn('Cascade already in progress, skipping');
  return this.createEmptyResult();
}
```

### Cascade Limit Enforcement
```typescript
if (this.currentCascadeCount >= this.maxCascades) {
  result.maxCascadesReached = true;
  console.warn(`Cascade limit of ${this.maxCascades} reached`);
}
```

### Resource Cleanup
```typescript
cascadeManager.destroy(); // Cleans up all resources
```

## Testing

The cascade system includes comprehensive tests:

### Unit Tests (`CascadeManager.test.ts`)
- Basic functionality and configuration
- State management and statistics
- Resource cleanup and error handling

### Integration Tests (`CascadeIntegration.test.ts`)
- Full system integration with GameStateManager
- Chain multiplier calculation validation
- Cascade sequence result structure validation

## Requirements Satisfaction

This implementation satisfies all requirements for task 8:

✅ **Create gravity application after dice clearing**
- Implemented in `applyGravityWithAnimation()`
- Smooth visual animations with configurable timing

✅ **Implement cascade detection for newly formed matches after gravity**
- Implemented in `executeCascadeLoop()`
- Automatic detection and processing of new matches

✅ **Add chain multiplier tracking for sequential cascades**
- Implemented with `floor(log2(chain_index))` formula
- Booster system integration for chain bonuses

✅ **Implement cascade loop prevention (max 10 cascades)**
- Configurable limit with default of 10
- Multiple safeguards against infinite loops

✅ **Create visual effects for cascading matches**
- Chain number indicators
- Particle effects and animations
- Screen shake for special effects

## Future Enhancements

Potential improvements for the cascade system:

1. **Adaptive Cascade Limits**: Adjust limits based on game mode
2. **Cascade Prediction**: Preview potential cascades
3. **Advanced Animations**: More sophisticated falling physics
4. **Performance Metrics**: Real-time cascade performance monitoring
5. **Cascade Replay**: Record and replay cascade sequences
