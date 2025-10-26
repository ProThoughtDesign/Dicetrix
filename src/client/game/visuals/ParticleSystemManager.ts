import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { ParticlePool } from './ParticlePool';
import { PerformanceMonitor } from './PerformanceMonitor';
import { EmitterManager } from './EmitterManager';
import { MatchEffectManager } from './MatchEffectManager';
import { CascadeEffectManager } from './CascadeEffectManager';
import { PlacementEffectManager } from './PlacementEffectManager';
import { ComboEffectManager } from './ComboEffectManager';
import { MatchGroup } from '../logic/types';

/**
 * Configuration interface for the particle system
 * Requirements: 1.1, 1.2, 6.1, 6.3
 */
export interface ParticleSystemConfig {
  maxParticles: number;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  enableEffects: boolean;
  performanceMode: boolean;
}

/**
 * Performance statistics interface
 * Requirements: 6.1, 6.3
 */
export interface PerformanceStats {
  activeParticleCount: number;
  maxParticles: number;
  averageFPS: number;
  qualityLevel: string;
  performanceMode: boolean;
}

/**
 * Pooled particle interface for object pooling
 * Requirements: 1.2, 6.1
 */
export interface PooledParticle {
  id: string;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  active: boolean;
  effectType: string;
  createdAt: number;
  priority: number;
}

/**
 * Core particle system manager that handles all particle effects in the game
 * Provides performance-optimized particle management with object pooling
 * Requirements: 1.1, 1.2, 1.4, 6.1, 6.3
 */
export class ParticleSystemManager {
  private scene: Phaser.Scene;
  private config: ParticleSystemConfig;
  private particlePool: ParticlePool;
  private emitterManager: EmitterManager;
  private performanceMonitor: PerformanceMonitor;
  private matchEffectManager: MatchEffectManager;
  private cascadeEffectManager: CascadeEffectManager;
  private placementEffectManager: PlacementEffectManager;
  private comboEffectManager: ComboEffectManager;
  private initialized: boolean = false;

  constructor() {
    Logger.log('ParticleSystemManager: Constructor called');
  }

  /**
   * Initialize the particle system with scene and configuration
   * Requirements: 1.1, 1.2, 6.1
   */
  public initialize(scene: Phaser.Scene, config: ParticleSystemConfig): void {
    try {
      Logger.log('ParticleSystemManager: Initializing particle system');
      
      this.scene = scene;
      this.config = { ...config };
      
      // Initialize core components
      this.performanceMonitor = new PerformanceMonitor(config.maxParticles);
      this.particlePool = new ParticlePool(config.maxParticles);
      this.emitterManager = new EmitterManager(scene, this.performanceMonitor);
      this.matchEffectManager = new MatchEffectManager(scene, this.emitterManager, this.performanceMonitor);
      this.cascadeEffectManager = new CascadeEffectManager(scene, this.emitterManager, this.performanceMonitor);
      this.placementEffectManager = new PlacementEffectManager(scene, this.emitterManager, this.performanceMonitor);
      this.comboEffectManager = new ComboEffectManager(scene, this.performanceMonitor);
      
      this.initialized = true;
      
      Logger.log(`ParticleSystemManager: Initialized with quality level: ${config.qualityLevel}`);
      Logger.log(`ParticleSystemManager: Max particles: ${config.maxParticles}`);
      Logger.log(`ParticleSystemManager: Performance mode: ${config.performanceMode}`);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Initialization failed - ${error}`);
      this.initialized = false;
    }
  }

  /**
   * Update the particle system each frame
   * Requirements: 1.2, 6.1, 6.3
   */
  public update(deltaTime: number): void {
    if (!this.initialized) return;

    try {
      // Update performance monitoring
      this.performanceMonitor.update(deltaTime);
      
      // Clean up expired particles
      this.particlePool.cleanup();
      
      // Adjust quality if performance is poor
      if (this.performanceMonitor.shouldReduceQuality()) {
        this.adjustQualityForPerformance();
      }
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Update error - ${error}`);
    }
  }

  /**
   * Create match explosion effects for multiple match groups
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  public createMatchExplosions(matches: MatchGroup[]): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.matchEffectManager.createMatchExplosions(matches);
      Logger.log(`ParticleSystemManager: Created match explosions for ${matches.length} match groups`);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Match explosions creation failed - ${error}`);
    }
  }

  /**
   * Create match explosion effect (legacy single explosion method)
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  public createMatchExplosion(position: Phaser.Math.Vector2, diceColor: string, matchSize: number): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      const particleCount = this.getParticleCountForMatch(matchSize);
      
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        Logger.log('ParticleSystemManager: Cannot create match explosion - particle limit reached');
        return;
      }

      const emitter = this.emitterManager.createMatchExplosion(position, diceColor, particleCount);
      if (emitter) {
        this.performanceMonitor.incrementParticleCount(particleCount);
        Logger.log(`ParticleSystemManager: Created match explosion with ${particleCount} particles`);
      }
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Match explosion creation failed - ${error}`);
    }
  }

  /**
   * Set board metrics for position calculations in match effects
   * Requirements: 2.1, 2.4
   */
  public setBoardMetrics(boardMetrics: any): void {
    if (!this.initialized) return;

    try {
      this.matchEffectManager.setBoardMetrics(boardMetrics);
      Logger.log('ParticleSystemManager: Board metrics updated for match effects');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Board metrics update failed - ${error}`);
    }
  }

  /**
   * Start cascade trail for a falling die
   * Requirements: 3.1, 3.2
   */
  public startCascadeTrail(diceId: string, startPos: Phaser.Math.Vector2, diceType: string): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.cascadeEffectManager.startCascadeTrail(diceId, startPos, diceType);
      Logger.log(`ParticleSystemManager: Started cascade trail for die ${diceId}`);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Cascade trail start failed - ${error}`);
    }
  }

  /**
   * Update cascade trail position
   * Requirements: 3.1, 3.2
   */
  public updateCascadeTrail(diceId: string, newPos: Phaser.Math.Vector2, velocity: Phaser.Math.Vector2): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.cascadeEffectManager.updateTrailPosition(diceId, newPos, velocity);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Cascade trail update failed - ${error}`);
    }
  }

  /**
   * End cascade trail for a die
   * Requirements: 3.1, 3.2
   */
  public endCascadeTrail(diceId: string, finalPos: Phaser.Math.Vector2): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.cascadeEffectManager.endCascadeTrail(diceId, finalPos);
      Logger.log(`ParticleSystemManager: Ended cascade trail for die ${diceId}`);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Cascade trail end failed - ${error}`);
    }
  }

  /**
   * Create cascade trail effect (legacy method for compatibility)
   * Requirements: 3.1, 3.2
   */
  public createCascadeTrail(startPos: Phaser.Math.Vector2, endPos: Phaser.Math.Vector2, diceType: string): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      const particleCount = this.getParticleCountForTrail();
      
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      const emitter = this.emitterManager.createCascadeTrail(startPos, endPos, diceType, particleCount);
      if (emitter) {
        this.performanceMonitor.incrementParticleCount(particleCount);
        Logger.log('ParticleSystemManager: Created cascade trail effect');
      }
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Cascade trail creation failed - ${error}`);
    }
  }

  /**
   * Create combo celebration effect using dedicated ComboEffectManager
   * Requirements: 3.3, 3.4, 3.5
   */
  public createComboEffect(position: Phaser.Math.Vector2, multiplier: number): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.comboEffectManager.triggerComboEffect(position, multiplier);
      Logger.log(`ParticleSystemManager: Triggered combo effect for ${multiplier}x multiplier`);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Combo effect creation failed - ${error}`);
    }
  }

  /**
   * Create piece placement impact effect
   * Requirements: 4.1, 4.2
   */
  public createPlacementImpact(position: Phaser.Math.Vector2, pieceSize: number): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.placementEffectManager.createPlacementImpact(position, pieceSize);
      Logger.log('ParticleSystemManager: Created placement impact effect');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Placement impact creation failed - ${error}`);
    }
  }

  /**
   * Create rotation feedback effect
   * Requirements: 4.3, 4.4
   */
  public createRotationFeedback(position: Phaser.Math.Vector2, rotationDirection: number): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.placementEffectManager.createRotationFeedback(position, rotationDirection);
      Logger.log('ParticleSystemManager: Created rotation feedback effect');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Rotation feedback creation failed - ${error}`);
    }
  }

  /**
   * Create movement trail effect
   * Requirements: 4.3, 4.4
   */
  public createMovementTrail(startPos: Phaser.Math.Vector2, endPos: Phaser.Math.Vector2): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.placementEffectManager.createMovementTrail(startPos, endPos);
      Logger.log('ParticleSystemManager: Created movement trail effect');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Movement trail creation failed - ${error}`);
    }
  }

  /**
   * Create horizontal movement feedback
   * Requirements: 4.3, 4.4
   */
  public createHorizontalMovementFeedback(position: Phaser.Math.Vector2, direction: number): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.placementEffectManager.createHorizontalMovementFeedback(position, direction);
      Logger.log('ParticleSystemManager: Created horizontal movement feedback');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Horizontal movement feedback creation failed - ${error}`);
    }
  }

  /**
   * Create hard drop impact effect
   * Requirements: 4.1, 4.2
   */
  public createHardDropImpact(position: Phaser.Math.Vector2, dropDistance: number): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      this.placementEffectManager.createHardDropImpact(position, dropDistance);
      Logger.log('ParticleSystemManager: Created hard drop impact effect');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Hard drop impact creation failed - ${error}`);
    }
  }

  /**
   * Create special dice aura effect
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  public createSpecialDiceAura(position: Phaser.Math.Vector2, diceType: string): void {
    if (!this.initialized || !this.config.enableEffects) return;

    try {
      const particleCount = this.getParticleCountForAura();
      
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      const emitter = this.emitterManager.createSpecialDiceAura(position, diceType, particleCount);
      if (emitter) {
        this.performanceMonitor.incrementParticleCount(particleCount);
        Logger.log(`ParticleSystemManager: Created special dice aura for ${diceType}`);
      }
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Special dice aura creation failed - ${error}`);
    }
  }

  /**
   * Adjust particle quality based on performance
   * Requirements: 6.1, 6.2, 6.3
   */
  public adjustQuality(newLevel: 'low' | 'medium' | 'high' | 'ultra'): void {
    if (!this.initialized) return;

    try {
      const oldLevel = this.config.qualityLevel;
      this.config.qualityLevel = newLevel;
      
      // Update max particles based on quality level
      const newMaxParticles = this.getMaxParticlesForQuality(newLevel);
      this.config.maxParticles = newMaxParticles;
      this.performanceMonitor.setMaxParticles(newMaxParticles);
      
      Logger.log(`ParticleSystemManager: Quality adjusted from ${oldLevel} to ${newLevel}`);
      Logger.log(`ParticleSystemManager: Max particles updated to ${newMaxParticles}`);
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Quality adjustment failed - ${error}`);
    }
  }

  /**
   * Get current performance statistics
   * Requirements: 6.1, 6.3
   */
  public getPerformanceStats(): PerformanceStats {
    if (!this.initialized) {
      return {
        activeParticleCount: 0,
        maxParticles: 0,
        averageFPS: 0,
        qualityLevel: 'low',
        performanceMode: false
      };
    }

    return {
      activeParticleCount: this.performanceMonitor.getActiveCount(),
      maxParticles: this.config.maxParticles,
      averageFPS: this.performanceMonitor.getAverageFPS(),
      qualityLevel: this.config.qualityLevel,
      performanceMode: this.config.performanceMode
    };
  }

  /**
   * Destroy the particle system and clean up resources
   * Requirements: 1.2, 6.1
   */
  public destroy(): void {
    try {
      Logger.log('ParticleSystemManager: Destroying particle system');
      
      if (this.emitterManager) {
        this.emitterManager.destroy();
      }
      
      if (this.matchEffectManager) {
        this.matchEffectManager.destroy();
      }
      
      if (this.cascadeEffectManager) {
        this.cascadeEffectManager.destroy();
      }
      
      if (this.placementEffectManager) {
        this.placementEffectManager.destroy();
      }
      
      if (this.comboEffectManager) {
        this.comboEffectManager.destroy();
      }
      
      if (this.particlePool) {
        this.particlePool.destroy();
      }
      
      this.initialized = false;
      Logger.log('ParticleSystemManager: Destroyed successfully');
      
    } catch (error) {
      Logger.log(`ParticleSystemManager: Destruction error - ${error}`);
    }
  }

  // Private helper methods

  private getParticleCountForMatch(matchSize: number): number {
    const baseCount = 8;
    const scaledCount = Math.min(baseCount + (matchSize - 3) * 2, 20);
    return this.scaleForQuality(scaledCount);
  }

  private getParticleCountForTrail(): number {
    return this.scaleForQuality(3);
  }





  private getParticleCountForAura(): number {
    return this.scaleForQuality(4);
  }

  private scaleForQuality(baseCount: number): number {
    switch (this.config.qualityLevel) {
      case 'low': return Math.ceil(baseCount * 0.5);
      case 'medium': return Math.ceil(baseCount * 0.75);
      case 'high': return baseCount;
      case 'ultra': return Math.ceil(baseCount * 1.25);
      default: return baseCount;
    }
  }

  private getMaxParticlesForQuality(quality: string): number {
    switch (quality) {
      case 'low': return 50;
      case 'medium': return 100;
      case 'high': return 200;
      case 'ultra': return 300;
      default: return 100;
    }
  }

  private adjustQualityForPerformance(): void {
    const currentQuality = this.config.qualityLevel;
    let newQuality: 'low' | 'medium' | 'high' | 'ultra' = currentQuality;

    if (currentQuality === 'ultra') newQuality = 'high';
    else if (currentQuality === 'high') newQuality = 'medium';
    else if (currentQuality === 'medium') newQuality = 'low';

    if (newQuality !== currentQuality) {
      this.adjustQuality(newQuality);
      Logger.log(`ParticleSystemManager: Auto-adjusted quality to ${newQuality} for performance`);
    }
  }
}
