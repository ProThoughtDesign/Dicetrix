# Particle System Design Document

## Overview

This design implements a high-performance particle system for the Dicetrix game using Phaser.js particle emitters and custom particle management. The system focuses on core gameplay feedback effects: match explosions, cascade trails, combo celebrations, piece placement impacts, and special dice auras. The design prioritizes performance, visual clarity, and seamless integration with existing game systems.

## Architecture

### Core Components

```typescript
// Core particle system architecture
ParticleSystemManager
├── ParticlePool (object pooling for performance)
├── EffectRegistry (predefined effect configurations)
├── EmitterManager (manages active Phaser particle emitters)
├── PerformanceMonitor (tracks FPS and adjusts quality)
└── SettingsManager (user preferences and quality levels)

// Effect-specific managers
MatchEffectManager (handles dice match explosions)
CascadeEffectManager (handles falling piece trails)
ComboEffectManager (handles multiplier celebrations)
PlacementEffectManager (handles piece placement impacts)
SpecialDiceEffectManager (handles booster and special dice auras)
```

### Integration Points

- **Game Scene**: Main integration point for all particle effects
- **Match Detection System**: Triggers match explosion effects
- **Gravity System**: Triggers cascade trail effects
- **Score System**: Triggers combo celebration effects
- **Piece Movement**: Triggers placement and movement effects
- **Special Dice System**: Triggers enhanced dice effects
- **Settings Service**: Manages user preferences and performance settings

## Components and Interfaces

### 1. Core Particle System Manager

```typescript
interface ParticleSystemConfig {
  maxParticles: number;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  enableEffects: boolean;
  performanceMode: boolean;
}

class ParticleSystemManager {
  private scene: Phaser.Scene;
  private particlePool: ParticlePool;
  private emitterManager: EmitterManager;
  private performanceMonitor: PerformanceMonitor;
  private config: ParticleSystemConfig;
  
  // Core lifecycle methods
  initialize(scene: Phaser.Scene, config: ParticleSystemConfig): void;
  update(deltaTime: number): void;
  destroy(): void;
  
  // Effect creation methods
  createMatchExplosion(position: Vector2, diceColor: string, matchSize: number): void;
  createCascadeTrail(startPos: Vector2, endPos: Vector2, diceType: string): void;
  createComboEffect(position: Vector2, multiplier: number): void;
  createPlacementImpact(position: Vector2, pieceSize: number): void;
  createSpecialDiceAura(position: Vector2, diceType: SpecialDiceType): void;
  
  // Performance management
  adjustQuality(newLevel: QualityLevel): void;
  getPerformanceStats(): PerformanceStats;
}
```

### 2. Match Effect Manager

```typescript
interface MatchEffectConfig {
  baseParticleCount: number;
  colorMapping: Record<string, number>; // dice color to particle color
  explosionRadius: number;
  duration: number;
  scaleWithMatchSize: boolean;
}

class MatchEffectManager {
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>;
  private config: MatchEffectConfig;
  
  createExplosion(matches: MatchGroup[]): void;
  private createSingleExplosion(position: Vector2, color: string, intensity: number): void;
  private getParticleCountForMatch(matchSize: number): number;
  private getExplosionConfig(diceColor: string, matchSize: number): ParticleEmitterConfig;
}
```

### 3. Cascade Effect Manager

```typescript
interface CascadeEffectConfig {
  trailLength: number;
  particleLifetime: number;
  speedBasedIntensity: boolean;
  colorByDiceType: boolean;
}

class CascadeEffectManager {
  private activeTrails: Map<string, ParticleTrail>;
  private config: CascadeEffectConfig;
  
  startCascadeTrail(diceId: string, startPos: Vector2, diceType: string): void;
  updateTrailPosition(diceId: string, newPos: Vector2, velocity: Vector2): void;
  endCascadeTrail(diceId: string, finalPos: Vector2): void;
  private createTrailParticles(position: Vector2, velocity: Vector2, diceType: string): void;
}
```

### 4. Combo Effect Manager

```typescript
interface ComboEffectConfig {
  baseEffectSize: number;
  multiplierScaling: number;
  celebrationThresholds: number[]; // combo levels that trigger special effects
  fireworksConfig: FireworksConfig;
}

class ComboEffectManager {
  private comboLevel: number;
  private config: ComboEffectConfig;
  
  triggerComboEffect(position: Vector2, multiplier: number): void;
  private createBasicComboEffect(position: Vector2, intensity: number): void;
  private createFireworksEffect(position: Vector2): void;
  private getEffectIntensity(multiplier: number): number;
}
```

### 5. Performance Monitor (Simplified)

```typescript
class PerformanceMonitor {
  private activeParticleCount: number = 0;
  private maxParticles: number = 200; // Conservative limit for performance
  
  canCreateParticles(requestedCount: number): boolean;
  incrementParticleCount(count: number): void;
  decrementParticleCount(count: number): void;
  getActiveCount(): number;
}
```

## Data Models

### Particle Effect Configurations (Performance-Focused)

```typescript
// Single performance-optimized configuration for all effects
const EFFECT_CONFIGS = {
  match_explosion: { particles: 8, duration: 400, radius: 25 },
  cascade_trail: { particles: 3, lifetime: 300, frequency: 150 },
  combo_celebration: { particles: 12, duration: 600, scale: 1.0 },
  placement_impact: { particles: 5, duration: 250, radius: 15 },
  special_dice_aura: { particles: 4, lifetime: 2000, frequency: 200 }
};

// Color mappings for dice types
const DICE_COLORS = {
  red: 0xff3366,
  blue: 0x3366ff,
  green: 0x33ff66,
  yellow: 0xffff33,
  purple: 0x9933ff,
  orange: 0xff9933,
  white: 0xffffff,
  black: 0x333333
};
```

### Particle Pool System

```typescript
interface PooledParticle {
  id: string;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  active: boolean;
  effectType: string;
  createdAt: number;
  priority: number;
}

class ParticlePool {
  private availableParticles: PooledParticle[];
  private activeParticles: Map<string, PooledParticle>;
  private maxPoolSize: number;
  
  getParticle(effectType: string): PooledParticle | null;
  returnParticle(particle: PooledParticle): void;
  cleanup(): void;
  private createNewParticle(effectType: string): PooledParticle;
}
```

## Error Handling

### Performance Degradation Handling

```typescript
class PerformanceHandler {
  // Automatic quality adjustment when FPS drops
  handleLowPerformance(): void {
    if (this.averageFPS < 45) {
      this.reduceParticleCount(0.7); // Reduce by 30%
      this.shortenEffectDuration(0.8); // Reduce duration by 20%
    }
    
    if (this.averageFPS < 30) {
      this.setQualityLevel('low');
      this.enablePerformanceMode();
    }
  }
  
  // Graceful degradation strategies
  private enablePerformanceMode(): void {
    this.disableComplexEffects();
    this.reduceParticleLifetime();
    this.simplifyParticleTextures();
  }
}
```

### Memory Management

```typescript
class MemoryManager {
  // Prevent memory leaks from particle systems
  cleanupExpiredEffects(): void {
    const now = Date.now();
    this.activeEffects.forEach((effect, id) => {
      if (now - effect.createdAt > effect.maxLifetime) {
        this.destroyEffect(id);
      }
    });
  }
  
  // Emergency cleanup when memory is low
  emergencyCleanup(): void {
    this.destroyAllNonEssentialEffects();
    this.clearParticlePool();
    this.forceGarbageCollection();
  }
}
```

## Testing Strategy

### Core Tests

```typescript
describe('ParticleSystemManager', () => {
  test('should create and cleanup particle effects');
  test('should respect particle count limits');
  test('should integrate with game events');
});
```

## Implementation Phases

### Phase 1: Core Infrastructure
- Implement ParticleSystemManager and basic pooling
- Create performance monitoring system
- Set up integration with Game scene
- Implement basic particle emitter management

### Phase 2: Match Effects
- Implement MatchEffectManager
- Create explosion effects for dice matches
- Add color-coded particles based on dice types
- Scale effects based on match size

### Phase 3: Movement Effects
- Implement CascadeEffectManager for falling pieces
- Add PlacementEffectManager for piece impacts
- Create trail effects for piece movement
- Add rotation and movement feedback

### Phase 4: Advanced Effects
- Implement ComboEffectManager for multiplier celebrations
- Add SpecialDiceEffectManager for booster effects
- Create fireworks and celebration effects
- Implement special dice auras and enhancements

### Phase 5: Optimization and Polish
- Fine-tune performance monitoring
- Implement quality settings and user preferences
- Add mobile-specific optimizations
- Polish effect timings and visual appeal
