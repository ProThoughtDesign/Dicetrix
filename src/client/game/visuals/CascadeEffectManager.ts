import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { EmitterManager } from './EmitterManager';
import { PerformanceMonitor } from './PerformanceMonitor';

/**
 * Configuration interface for cascade trail effects
 * Requirements: 3.1, 3.2
 */
export interface CascadeEffectConfig {
  trailLength: number;
  particleLifetime: number;
  speedBasedIntensity: boolean;
  colorByDiceType: boolean;
  maxActiveTrails: number;
  trailUpdateInterval: number;
}

/**
 * Interface for active particle trails
 * Requirements: 3.1, 3.2
 */
export interface ParticleTrail {
  id: string;
  diceId: string;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter | null;
  startTime: number;
  lastPosition: Phaser.Math.Vector2;
  diceType: string;
  active: boolean;
}

/**
 * Manages cascade effects for falling dice during gravity application
 * Creates particle trails that follow moving dice as they fall
 * Requirements: 3.1, 3.2
 */
export class CascadeEffectManager {
  private scene: Phaser.Scene;
  private emitterManager: EmitterManager;
  private performanceMonitor: PerformanceMonitor;
  private config: CascadeEffectConfig;
  private activeTrails: Map<string, ParticleTrail> = new Map();
  private initialized: boolean = false;

  constructor(scene: Phaser.Scene, emitterManager: EmitterManager, performanceMonitor: PerformanceMonitor) {
    this.scene = scene;
    this.emitterManager = emitterManager;
    this.performanceMonitor = performanceMonitor;
    
    // Default configuration optimized for performance
    this.config = {
      trailLength: 3,
      particleLifetime: 300,
      speedBasedIntensity: true,
      colorByDiceType: true,
      maxActiveTrails: 10, // Limit concurrent trails for performance
      trailUpdateInterval: 50 // Update trails every 50ms
    };
    
    this.initialized = true;
    Logger.log('CascadeEffectManager: Initialized');
  }

  /**
   * Start a cascade trail for a falling die
   * Requirements: 3.1, 3.2
   */
  public startCascadeTrail(diceId: string, startPos: Phaser.Math.Vector2, diceType: string): void {
    if (!this.initialized) return;

    try {
      // Check if we're at the trail limit
      if (this.activeTrails.size >= this.config.maxActiveTrails) {
        Logger.log(`CascadeEffectManager: Trail limit reached (${this.config.maxActiveTrails}), skipping new trail`);
        return;
      }

      // Check if trail already exists for this die
      if (this.activeTrails.has(diceId)) {
        Logger.log(`CascadeEffectManager: Trail already exists for die ${diceId}`);
        return;
      }

      // Check performance budget
      const particleCount = this.getTrailParticleCount();
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        Logger.log('CascadeEffectManager: Cannot create trail - particle limit reached');
        return;
      }

      // Create the trail
      const trail: ParticleTrail = {
        id: `trail_${diceId}_${Date.now()}`,
        diceId,
        emitter: null,
        startTime: Date.now(),
        lastPosition: new Phaser.Math.Vector2(startPos.x, startPos.y),
        diceType,
        active: true
      };

      // Create initial emitter at start position
      trail.emitter = this.emitterManager.createCascadeTrail(
        startPos,
        startPos, // Start with same position
        diceType,
        particleCount
      );

      if (trail.emitter) {
        this.activeTrails.set(diceId, trail);
        this.performanceMonitor.incrementParticleCount(particleCount);
        Logger.log(`CascadeEffectManager: Started cascade trail for die ${diceId} at (${startPos.x}, ${startPos.y})`);
      } else {
        Logger.log(`CascadeEffectManager: Failed to create emitter for trail ${diceId}`);
      }

    } catch (error) {
      Logger.log(`CascadeEffectManager: Error starting cascade trail - ${error}`);
    }
  }

  /**
   * Update trail position as die moves
   * Requirements: 3.1, 3.2
   */
  public updateTrailPosition(diceId: string, newPos: Phaser.Math.Vector2, velocity: Phaser.Math.Vector2): void {
    if (!this.initialized) return;

    try {
      const trail = this.activeTrails.get(diceId);
      if (!trail || !trail.active || !trail.emitter) {
        return;
      }

      // Calculate movement distance for intensity scaling
      const distance = Phaser.Math.Distance.Between(
        trail.lastPosition.x, trail.lastPosition.y,
        newPos.x, newPos.y
      );

      // Only update if there's significant movement
      if (distance < 5) {
        return;
      }

      // Update emitter position
      trail.emitter.setPosition(newPos.x, newPos.y);

      // Adjust particle intensity based on velocity if enabled
      if (this.config.speedBasedIntensity && velocity) {
        const speed = velocity.length();
        const intensityMultiplier = Math.min(speed / 100, 2.0); // Scale with speed
        
        // Adjust emitter properties based on speed
        if (intensityMultiplier > 1.2) {
          trail.emitter.setQuantity(this.getTrailParticleCount() * intensityMultiplier);
        }
      }

      // Create trail particles between last position and current position
      this.createTrailParticles(trail.lastPosition, newPos, trail.diceType);

      // Update last position
      trail.lastPosition.set(newPos.x, newPos.y);

      Logger.log(`CascadeEffectManager: Updated trail ${diceId} to (${newPos.x}, ${newPos.y}), distance: ${distance.toFixed(1)}`);

    } catch (error) {
      Logger.log(`CascadeEffectManager: Error updating trail position - ${error}`);
    }
  }

  /**
   * End a cascade trail when die stops falling
   * Requirements: 3.1, 3.2
   */
  public endCascadeTrail(diceId: string, finalPos: Phaser.Math.Vector2): void {
    if (!this.initialized) return;

    try {
      const trail = this.activeTrails.get(diceId);
      if (!trail) {
        return;
      }

      // Mark trail as inactive
      trail.active = false;

      // Create final burst of particles at final position
      if (trail.emitter) {
        // Move emitter to final position
        trail.emitter.setPosition(finalPos.x, finalPos.y);
        
        // Create a small burst effect
        this.createTrailParticles(trail.lastPosition, finalPos, trail.diceType);
        
        // Stop the emitter and schedule cleanup
        trail.emitter.stop();
        
        this.scene.time.delayedCall(this.config.particleLifetime + 100, () => {
          this.cleanupTrail(diceId);
        });
      } else {
        // Clean up immediately if no emitter
        this.cleanupTrail(diceId);
      }

      Logger.log(`CascadeEffectManager: Ended cascade trail for die ${diceId} at (${finalPos.x}, ${finalPos.y})`);

    } catch (error) {
      Logger.log(`CascadeEffectManager: Error ending cascade trail - ${error}`);
    }
  }

  /**
   * Create particle effects between two positions
   * Requirements: 3.1, 3.2
   */
  private createTrailParticles(startPos: Phaser.Math.Vector2, endPos: Phaser.Math.Vector2, diceType: string): void {
    try {
      // Check performance budget for additional particles
      const particleCount = 2; // Small number for trail segments
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        return;
      }

      // Create a small trail segment between positions

      const segmentEmitter = this.emitterManager.createCascadeTrail(
        startPos,
        endPos,
        diceType,
        particleCount
      );

      if (segmentEmitter) {
        this.performanceMonitor.incrementParticleCount(particleCount);
        
        // Auto-cleanup trail segment
        this.scene.time.delayedCall(this.config.particleLifetime, () => {
          this.performanceMonitor.decrementParticleCount(particleCount);
        });
      }

    } catch (error) {
      Logger.log(`CascadeEffectManager: Error creating trail particles - ${error}`);
    }
  }

  /**
   * Clean up a specific trail
   * Requirements: 3.1, 3.2
   */
  private cleanupTrail(diceId: string): void {
    try {
      const trail = this.activeTrails.get(diceId);
      if (!trail) return;

      // Destroy emitter if it exists
      if (trail.emitter && trail.emitter.active) {
        trail.emitter.destroy();
        this.performanceMonitor.decrementParticleCount(this.getTrailParticleCount());
      }

      // Remove from active trails
      this.activeTrails.delete(diceId);
      
      Logger.log(`CascadeEffectManager: Cleaned up trail for die ${diceId}`);

    } catch (error) {
      Logger.log(`CascadeEffectManager: Error cleaning up trail - ${error}`);
    }
  }

  /**
   * Get particle count for trail effects based on performance settings
   * Requirements: 3.1, 3.2
   */
  private getTrailParticleCount(): number {
    return this.config.trailLength;
  }

  /**
   * Clean up all active trails
   * Requirements: 3.1, 3.2
   */
  public cleanup(): void {
    try {
      Logger.log(`CascadeEffectManager: Cleaning up ${this.activeTrails.size} active trails`);
      
      // Clean up all trails
      const trailIds = Array.from(this.activeTrails.keys());
      trailIds.forEach(diceId => {
        this.cleanupTrail(diceId);
      });
      
      this.activeTrails.clear();
      Logger.log('CascadeEffectManager: Cleanup complete');

    } catch (error) {
      Logger.log(`CascadeEffectManager: Cleanup error - ${error}`);
    }
  }

  /**
   * Destroy the cascade effect manager
   * Requirements: 3.1, 3.2
   */
  public destroy(): void {
    try {
      Logger.log('CascadeEffectManager: Destroying');
      
      this.cleanup();
      this.initialized = false;
      
      Logger.log('CascadeEffectManager: Destroyed successfully');

    } catch (error) {
      Logger.log(`CascadeEffectManager: Destruction error - ${error}`);
    }
  }

  /**
   * Get current active trail count for debugging
   * Requirements: 3.1, 3.2
   */
  public getActiveTrailCount(): number {
    return this.activeTrails.size;
  }

  /**
   * Update configuration
   * Requirements: 3.1, 3.2
   */
  public updateConfig(newConfig: Partial<CascadeEffectConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Logger.log('CascadeEffectManager: Configuration updated');
  }
}
