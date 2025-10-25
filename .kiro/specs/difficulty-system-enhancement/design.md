# Difficulty System Enhancement Design

## Overview

The Difficulty System Enhancement transforms Dicetrix from a hardcoded piece system to a flexible, constraint-based procedural generation system. This design introduces five distinct difficulty modes with progressive complexity scaling, Black Die mechanics for advanced gameplay, and a comprehensive booster system. The architecture maintains the existing individual die physics while adding sophisticated piece generation algorithms and visual effect systems.

## Architecture

### Core Components

```
DifficultySystemManager
├── DifficultyModeConfig (configuration per mode)
├── ProceduralPieceGenerator (constraint-based generation)
├── BlackDieManager (wild matching and area effects)
├── BoosterEffectSystem (visual glow and future mechanics)
└── FloodFillValidator (connectivity validation)
```

### Integration Points

- **GameMode.ts**: Enhanced with dimensional constraints and booster settings
- **Game.ts**: Modified piece generation to use procedural system
- **MatchDetector**: Extended to handle Black Die wild matching
- **DiceRenderer**: Enhanced with booster visual effects
- **ScoreCalculator**: Integrated with difficulty-based score multipliers

## Components and Interfaces

### DifficultyModeConfig Interface

```typescript
interface DifficultyModeConfig {
  id: GameMode;
  fallSpeed: number;
  scoreMultiplier: number;
  allowGravity: boolean;
  
  // Dimensional Constraints
  maxPieceWidth: number;
  maxPieceHeight: number;
  maxDicePerPiece: number;
  
  // Dice Configuration
  diceTypes: number[];
  allowBlackDice: boolean;
  uniformDiceRule: boolean; // Zen mode only
  
  // Booster System
  boosterChance: number; // 0.0 to 1.0
}
```

### ProceduralPieceGenerator Class

```typescript
class ProceduralPieceGenerator {
  generatePiece(config: DifficultyModeConfig): MultiDiePiece;
  private generateConnectedShape(maxWidth: number, maxHeight: number, maxDice: number): Position[];
  private assignDiceTypes(positions: Position[], config: DifficultyModeConfig): Die[];
  private applyBoosterEffects(dice: Die[], boosterChance: number): void;
  private validateConnectivity(positions: Position[]): boolean;
}
```

### BlackDieManager Class

```typescript
class BlackDieManager {
  isBlackDie(die: Die): boolean;
  canMatchWith(blackDie: Die, targetNumber: number): boolean;
  triggerAreaConversion(centerPos: Position, gameBoard: GameBoard): void;
  private convertToD20InArea(centerPos: Position, gameBoard: GameBoard): void;
  private rerollDiceInArea(positions: Position[], gameBoard: GameBoard): void;
}
```

### BoosterEffectSystem Class

```typescript
class BoosterEffectSystem {
  applyBoosterEffect(die: Die): void;
  renderBoosterGlow(die: Die, renderer: DiceRenderer): void;
  getBoosterType(die: Die): BoosterType | null;
  private determineBoosterType(): BoosterType;
}
```

### FloodFillValidator Class

```typescript
class FloodFillValidator {
  validateConnectivity(positions: Position[]): boolean;
  private floodFill(positions: Position[], visited: Set<string>, start: Position): number;
  private getAdjacent(pos: Position): Position[];
  private positionKey(pos: Position): string;
}
```

## Data Models

### Enhanced Die Interface

```typescript
interface Die {
  id: string;
  sides: number;
  number: number;
  color: string;
  relativePos: Position;
  
  // New properties
  isBlack?: boolean; // Black Die flag
  isWild?: boolean; // Wild matching capability
  boosterType?: BoosterType; // Visual effect type
  glowColor?: string; // Booster glow color
}
```

### BoosterType Enum

```typescript
enum BoosterType {
  NONE = 'none',
  RED_GLOW = 'red',
  BLUE_GLOW = 'blue',
  GREEN_GLOW = 'green',
  YELLOW_GLOW = 'yellow',
  PURPLE_GLOW = 'purple',
  ORANGE_GLOW = 'orange',
  TEAL_GLOW = 'teal',
  PINK_GLOW = 'pink',
  LIME_GLOW = 'lime'
}
```

### PieceGenerationConstraints Interface

```typescript
interface PieceGenerationConstraints {
  maxWidth: number;
  maxHeight: number;
  maxDiceCount: number;
  allowedDiceTypes: number[];
  allowBlackDice: boolean;
  uniformDiceRule: boolean;
  boosterChance: number;
}
```

## Error Handling

### Piece Generation Validation

- **Connectivity Validation**: FloodFillValidator ensures all generated pieces form connected shapes
- **Dimensional Bounds Checking**: Strict validation against maxWidth × maxHeight constraints
- **Dice Count Limits**: Enforcement of maxDicePerPiece constraints
- **Regeneration Logic**: Automatic retry mechanism for failed piece generation attempts
- **Fallback Mechanisms**: Single die fallback when procedural generation fails repeatedly

### Black Die Area Conversion Safety

- **Boundary Validation**: 3×3 area conversion respects grid boundaries
- **State Consistency**: Atomic operations for area conversion to prevent partial updates
- **Collision Detection**: Validation that converted dice don't conflict with active pieces
- **Error Recovery**: Graceful handling of conversion failures with logging

### Booster Effect Rendering

- **Performance Optimization**: Efficient glow rendering with sprite pooling
- **Visual Clarity**: Booster effects don't obscure dice numbers or colors
- **Memory Management**: Proper cleanup of booster effect resources
- **Fallback Rendering**: Graceful degradation when visual effects fail

## Testing Strategy

### Unit Testing Focus Areas

1. **ProceduralPieceGenerator**
   - Dimensional constraint validation
   - Connectivity algorithm correctness
   - Dice type assignment logic
   - Booster chance probability distribution

2. **BlackDieManager**
   - Wild matching logic validation
   - Area conversion boundary handling
   - D20 conversion and reroll mechanics
   - Edge case handling (grid boundaries, overlapping effects)

3. **FloodFillValidator**
   - Connectivity detection accuracy
   - Performance with large piece configurations
   - Edge case handling (single die, maximum complexity pieces)

4. **BoosterEffectSystem**
   - Probability distribution validation
   - Visual effect application consistency
   - Performance impact measurement

### Integration Testing Scenarios

1. **Cross-Difficulty Mode Validation**
   - Piece generation within constraints for each mode
   - Proper dice type distribution per difficulty
   - Booster chance scaling verification

2. **Black Die Interaction Testing**
   - Wild matching with various dice configurations
   - Area conversion effects with overlapping regions
   - Performance impact of multiple Black Die matches

3. **Visual System Integration**
   - Booster glow rendering with various dice types
   - Performance with maximum booster dice on screen
   - Visual clarity maintenance across all configurations

### Performance Testing Requirements

- **Piece Generation Speed**: Sub-10ms generation time for maximum complexity pieces
- **Flood Fill Performance**: Linear time complexity validation for connectivity checking
- **Booster Rendering Impact**: <5% frame rate impact with maximum booster dice
- **Memory Usage**: Efficient resource management for procedural generation

## Implementation Phases

### Phase 1: Core Infrastructure
- DifficultyModeConfig implementation
- ProceduralPieceGenerator basic structure
- FloodFillValidator connectivity algorithm
- Enhanced GameMode configuration system

### Phase 2: Black Die System
- BlackDieManager implementation
- Wild matching logic integration
- Area conversion effect mechanics
- Match detection system enhancement

### Phase 3: Booster Effect System
- BoosterEffectSystem implementation
- Visual glow rendering integration
- Performance optimization for multiple effects
- Booster type determination algorithms

### Phase 4: Integration and Polish
- Complete difficulty mode configuration
- Cross-system integration testing
- Performance optimization and profiling
- Visual polish and effect refinement

This design provides a comprehensive foundation for implementing the enhanced difficulty system while maintaining the core gameplay mechanics that make Dicetrix unique.
