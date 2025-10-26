import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { EmitterManager } from './EmitterManager';
import { PerformanceMonitor } from './PerformanceMonitor';

/**
 * Configuration interface for placement impact effects
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export interface PlacementEffectConfig {
  baseParticleCount: number;
  impactRadius: number;
  effectDuration: number;
  scaleWithPieceSize: boolean;
  rotationFeedbackEnabled: boolean;
  movementTrailEnabled: boolean;
  maxConcurrentEffects: number;
}

/**
 * Interface for active placement effects
 * Requirements: 4.1, 4.2
 */
export interface PlacementEffect {
  id: string;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter | null;
  startTime: number;
  position: Phaser.Math.Vector2;
  effectType: 'impact' | 'rotation' | 'movement';
  active: boolean;
}

/**
 * Manages placement and movement particle effects for game pieces
 * Creates impact effects when pieces land and movement feedback during piece manipulation
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export class PlacementEffectManager {
  private scene: Phaser.Scene;
  private emitterManager: EmitterManager;
  private performanceMonitor: PerformanceMonitor;
  private config: PlacementEffectConfig;
  private activeEffects: Map<string, PlacementEffect> = new Map();
  private initialized: boolean = false;

  constructor(scene: Phaser.Scene, emitterManager: EmitterManager, performanceMonitor: PerformanceMonitor) {
    this.scene = scene;
    this.emitterManager = emitterManager;
    this.performanceMonitor = performanceMonitor;
    
    // Default configuration optimized for performance
    this.config = {
      baseParticleCount: 5,
      impactRadius: 15,
      effectDuration: 250,
      scaleWithPieceSize: true,
      rotationFeedbackEnabled: true,
      movementTrailEnabled: true,
      maxConcurrentEffects: 8 // Limit concurrent effects for performance
    };
    
    this.initialized = true;
    Logger.log('PlacementEffectManager: Initialized');
  }

  /**
   * Create piece placement impact effect
   * Requirements: 4.1, 4.2
   */
  public createPlacementImpact(position: Phaser.Math.Vector2, pieceSize: number): void {
    if (!this.initialized) return;

    try {
      // Check effect limit
      if (this.activeEffects.size >= this.config.maxConcurrentEffects) {
        Logger.log(`PlacementEffectManager: Effect limit reached (${this.config.maxConcurrentEffects}), skipping impact`);
        return;
      }

      // Calculate particle count based on piece size
      let particleCount = this.config.baseParticleCount;
      if (this.config.scaleWithPieceSize) {
        particleCount = Math.min(this.config.baseParticleCount + pieceSize, 15);
      }

      // Check performance budget
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        Logger.log('PlacementEffectManager: Cannot create impact - particle limit reached');
        return;
      }

      // Create the impact effect
      const emitter = this.emitterManager.createPlacementImpact(position, particleCount);
      
      if (emitter) {
        const effect: PlacementEffect = {
          id: `impact_${Date.now()}`,
          emitter,
          startTime: Date.now(),
          position: new Phaser.Math.Vector2(position.x, position.y),
          effectType: 'impact',
          active: true
        };

        this.activeEffects.set(effect.id, effect);
        this.performanceMonitor.incrementParticleCount(particleCount);

        // Schedule cleanup
        this.scene.time.delayedCall(this.config.effectDuration + 100, () => {
          this.cleanupEffect(effect.id);
        });

        Logger.log(`PlacementEffectManager: Created placement impact with ${particleCount} particles at (${position.x}, ${position.y})`);
      } else {
        Logger.log('PlacementEffectManager: Failed to create placement impact emitter');
      }

    } catch (error) {
      Logger.log(`PlacementEffectManager: Error creating placement impact - ${error}`);
    }
  }

  /**
   * Create rotation feedback effect
   * Requirements: 4.3, 4.4
   */
  public createRotationFeedback(position: Phaser.Math.Vector2, rotationDirection: number): void {
    if (!this.initialized || !this.config.rotationFeedbackEnabled) return;

    try {
      // Check effect limit
      if (this.activeEffects.size >= this.config.maxConcurrentEffects) {
        return;
      }

      const particleCount = 3; // Small number for subtle feedback
      
      // Check performance budget
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      // Create subtle rotation particles
      const emitter = this.scene.add.particles(position.x, position.y, 'particle', {
        quantity: particleCount,
        lifespan: 200,
        speed: { min: 20, max: 40 },
        scale: { start: 0.3, end: 0.1 },
        alpha: { start: 0.6, end: 0.0 },
        tint: 0x88ccff, // Light blue for rotation feedback
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 10),
          quantity: particleCount
        },
        // Create spiral effect based on rotation direction
        gravityX: rotationDirection * 20,
        blendMode: 'ADD'
      });

      if (emitter) {
        const effect: PlacementEffect = {
          id: `rotation_${Date.now()}`,
          emitter,
          startTime: Date.now(),
          position: new Phaser.Math.Vector2(position.x, position.y),
          effectType: 'rotation',
          active: true
        };

        this.activeEffects.set(effect.id, effect);
        this.performanceMonitor.incrementParticleCount(particleCount);

        // Schedule cleanup
        this.scene.time.delayedCall(300, () => {
          this.cleanupEffect(effect.id);
        });

        Logger.log(`PlacementEffectManager: Created rotation feedback at (${position.x}, ${position.y})`);
      }

    } catch (error) {
      Logger.log(`PlacementEffectManager: Error creating rotation feedback - ${error}`);
    }
  }

  /**
   * Create movement trail effect
   * Requirements: 4.3, 4.4
   */
  public createMovementTrail(startPos: Phaser.Math.Vector2, endPos: Phaser.Math.Vector2): void {
    if (!this.initialized || !this.config.movementTrailEnabled) return;

    try {
      // Check effect limit
      if (this.activeEffects.size >= this.config.maxConcurrentEffects) {
        return;
      }

      const particleCount = 2; // Minimal for subtle movement feedback
      
      // Check performance budget
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      // Calculate movement distance and direction
      const distance = Phaser.Math.Distance.Between(startPos.x, startPos.y, endPos.x, endPos.y);
      
      // Only create trail for significant movement
      if (distance < 10) {
        return;
      }

      // Create movement trail particles
      const emitter = this.scene.add.particles(startPos.x, startPos.y, 'particle', {
        quantity: particleCount,
        lifespan: 150,
        speed: { min: 15, max: 30 },
        scale: { start: 0.2, end: 0.05 },
        alpha: { start: 0.4, end: 0.0 },
        tint: 0xcccccc, // Light gray for movement trails
        blendMode: 'ADD'
      });

      if (emitter) {
        // Animate emitter along movement path
        this.scene.tweens.add({
          targets: emitter,
          x: endPos.x,
          y: endPos.y,
          duration: Math.min(distance * 2, 200),
          ease: 'Power2',
          onComplete: () => {
            emitter.stop();
          }
        });

        const effect: PlacementEffect = {
          id: `movement_${Date.now()}`,
          emitter,
          startTime: Date.now(),
          position: new Phaser.Math.Vector2(startPos.x, startPos.y),
          effectType: 'movement',
          active: true
        };

        this.activeEffects.set(effect.id, effect);
        this.performanceMonitor.incrementParticleCount(particleCount);

        // Schedule cleanup
        this.scene.time.delayedCall(350, () => {
          this.cleanupEffect(effect.id);
        });

        Logger.log(`PlacementEffectManager: Created movement trail from (${startPos.x}, ${startPos.y}) to (${endPos.x}, ${endPos.y})`);
      }

    } catch (error) {
      Logger.log(`PlacementEffectManager: Error creating movement trail - ${error}`);
    }
  }

  /**
   * Create horizontal movement feedback
   * Requirements: 4.3, 4.4
   */
  public createHorizontalMovementFeedback(position: Phaser.Math.Vector2, direction: number): void {
    if (!this.initialized) return;

    try {
      const particleCount = 2;
      
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      // Create directional movement particles
      const emitter = this.scene.add.particles(position.x, position.y, 'particle', {
        quantity: particleCount,
        lifespan: 120,
        speed: { min: 25, max: 45 },
        scale: { start: 0.25, end: 0.05 },
        alpha: { start: 0.5, end: 0.0 },
        tint: 0xaaffaa, // Light green for horizontal movement
        gravityX: direction * 30, // Push particles in movement direction
        blendMode: 'ADD'
      });

      if (emitter) {
        this.performanceMonitor.incrementParticleCount(particleCount);

        // Auto-cleanup
        this.scene.time.delayedCall(200, () => {
          if (emitter && emitter.active) {
            emitter.destroy();
            this.performanceMonitor.decrementParticleCount(particleCount);
          }
        });

        Logger.log(`PlacementEffectManager: Created horizontal movement feedback at (${position.x}, ${position.y})`);
      }

    } catch (error) {
      Logger.log(`PlacementEffectManager: Error creating horizontal movement feedback - ${error}`);
    }
  }

  /**
   * Create hard drop impact effect
   * Requirements: 4.1, 4.2
   */
  public createHardDropImpact(position: Phaser.Math.Vector2, dropDistance: number): void {
    if (!this.initialized) return;

    try {
      // Scale effect intensity based on drop distance
      const intensity = Math.min(dropDistance / 100, 2.0);
      const particleCount = Math.ceil(this.config.baseParticleCount * intensity);
      
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      // Create enhanced impact effect for hard drops
      const emitter = this.scene.add.particles(position.x, position.y, 'particle', {
        quantity: particleCount,
        lifespan: this.config.effectDuration * intensity,
        speed: { min: 40 * intensity, max: 100 * intensity },
        scale: { start: 0.8 * intensity, end: 0.1 },
        alpha: { start: 0.9, end: 0.0 },
        tint: 0xffaa44, // Orange for hard drop impacts
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, this.config.impactRadius * intensity),
          quantity: particleCount
        },
        gravityY: 150, // Strong downward gravity for impact
        blendMode: 'ADD'
      });

      if (emitter) {
        const effect: PlacementEffect = {
          id: `harddrop_${Date.now()}`,
          emitter,
          startTime: Date.now(),
          position: new Phaser.Math.Vector2(position.x, position.y),
          effectType: 'impact',
          active: true
        };

        this.activeEffects.set(effect.id, effect);
        this.performanceMonitor.incrementParticleCount(particleCount);

        // Schedule cleanup
        this.scene.time.delayedCall(this.config.effectDuration * intensity + 100, () => {
          this.cleanupEffect(effect.id);
        });

        Logger.log(`PlacementEffectManager: Created hard drop impact with intensity ${intensity.toFixed(1)} at (${position.x}, ${position.y})`);
      }

    } catch (error) {
      Logger.log(`PlacementEffectManager: Error creating hard drop impact - ${error}`);
    }
  }

  /**
   * Clean up a specific effect
   * Requirements: 4.1, 4.2
   */
  private cleanupEffect(effectId: string): void {
    try {
      const effect = this.activeEffects.get(effectId);
      if (!effect) return;

      // Destroy emitter if it exists
      if (effect.emitter && effect.emitter.active) {
        effect.emitter.destroy();
        
        // Decrement particle count based on effect type
        let particleCount = this.config.baseParticleCount;
        if (effect.effectType === 'rotation' || effect.effectType === 'movement') {
          particleCount = 2; // Smaller effects use fewer particles
        }
        this.performanceMonitor.decrementParticleCount(particleCount);
      }

      // Remove from active effects
      this.activeEffects.delete(effectId);
      
      Logger.log(`PlacementEffectManager: Cleaned up effect ${effectId}`);

    } catch (error) {
      Logger.log(`PlacementEffectManager: Error cleaning up effect - ${error}`);
    }
  }

  /**
   * Clean up all active effects
   * Requirements: 4.1, 4.2
   */
  public cleanup(): void {
    try {
      Logger.log(`PlacementEffectManager: Cleaning up ${this.activeEffects.size} active effects`);
      
      // Clean up all effects
      const effectIds = Array.from(this.activeEffects.keys());
      effectIds.forEach(effectId => {
        this.cleanupEffect(effectId);
      });
      
      this.activeEffects.clear();
      Logger.log('PlacementEffectManager: Cleanup complete');

    } catch (error) {
      Logger.log(`PlacementEffectManager: Cleanup error - ${error}`);
    }
  }

  /**
   * Destroy the placement effect manager
   * Requirements: 4.1, 4.2
   */
  public destroy(): void {
    try {
      Logger.log('PlacementEffectManager: Destroying');
      
      this.cleanup();
      this.initialized = false;
      
      Logger.log('PlacementEffectManager: Destroyed successfully');

    } catch (error) {
      Logger.log(`PlacementEffectManager: Destruction error - ${error}`);
    }
  }

  /**
   * Get current active effect count for debugging
   * Requirements: 4.1, 4.2
   */
  public getActiveEffectCount(): number {
    return this.activeEffects.size;
  }

  /**
   * Update configuration
   * Requirements: 4.1, 4.2
   */
  public updateConfig(newConfig: Partial<PlacementEffectConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Logger.log('PlacementEffectManager: Configuration updated');
  }

  /**
   * Enable or disable specific effect types
   * Requirements: 4.3, 4.4
   */
  public setEffectEnabled(effectType: 'rotation' | 'movement', enabled: boolean): void {
    if (effectType === 'rotation') {
      this.config.rotationFeedbackEnabled = enabled;
    } else if (effectType === 'movement') {
      this.config.movementTrailEnabled = enabled;
    }
    
    Logger.log(`PlacementEffectManager: ${effectType} effects ${enabled ? 'enabled' : 'disabled'}`);
  }
}
