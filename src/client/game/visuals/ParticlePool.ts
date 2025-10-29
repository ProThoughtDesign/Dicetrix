import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { PooledParticle } from './ParticleSystemManager';

/**
 * Particle pool system for performance optimization
 * Manages reusable particle emitters to minimize garbage collection
 * Requirements: 1.2, 6.1, 6.3
 */
export class ParticlePool {
  private availableParticles: PooledParticle[] = [];
  private activeParticles: Map<string, PooledParticle> = new Map();
  private maxPoolSize: number;
  private nextId: number = 0;

  constructor(maxPoolSize: number) {
    this.maxPoolSize = maxPoolSize;
    Logger.log(`ParticlePool: Initialized with max pool size: ${maxPoolSize}`);
  }

  /**
   * Get a particle from the pool or create a new one
   * Requirements: 1.2, 6.1
   */
  public getParticle(effectType: string): PooledParticle | null {
    try {
      // Try to reuse an available particle
      let particle = this.availableParticles.find(p => p.effectType === effectType);
      
      if (particle) {
        // Remove from available pool
        const index = this.availableParticles.indexOf(particle);
        this.availableParticles.splice(index, 1);
        
        // Reset particle state
        particle.active = true;
        particle.createdAt = Date.now();
        particle.priority = this.calculatePriority(effectType);
        
        // Add to active pool
        this.activeParticles.set(particle.id, particle);
        
        Logger.log(`ParticlePool: Reused particle ${particle.id} for ${effectType}`);
        return particle;
      }

      // Check if we can create a new particle
      if (this.getTotalParticleCount() >= this.maxPoolSize) {
        Logger.log(`ParticlePool: Pool full, cannot create new particle for ${effectType}`);
        return null;
      }

      // Create new particle (emitter will be set by the caller)
      particle = this.createNewParticle(effectType);
      this.activeParticles.set(particle.id, particle);
      
      Logger.log(`ParticlePool: Created new particle ${particle.id} for ${effectType}`);
      return particle;
      
    } catch (error) {
      Logger.log(`ParticlePool: Error getting particle - ${error}`);
      return null;
    }
  }

  /**
   * Return a particle to the pool for reuse
   * Requirements: 1.2, 6.1
   */
  public returnParticle(particle: PooledParticle): void {
    try {
      if (!this.activeParticles.has(particle.id)) {
        Logger.log(`ParticlePool: Warning - particle ${particle.id} not in active pool`);
        return;
      }

      // Remove from active pool
      this.activeParticles.delete(particle.id);
      
      // Reset particle state
      particle.active = false;
      particle.createdAt = 0;
      particle.priority = 0;
      
      // Stop the emitter if it exists
      if (particle.emitter && particle.emitter.active) {
        particle.emitter.stop();
      }
      
      // Add to available pool for reuse
      this.availableParticles.push(particle);
      
      Logger.log(`ParticlePool: Returned particle ${particle.id} to pool`);
      
    } catch (error) {
      Logger.log(`ParticlePool: Error returning particle - ${error}`);
    }
  }

  /**
   * Clean up expired particles
   * Requirements: 1.2, 6.1, 6.3
   */
  public cleanup(): void {
    try {
      const now = Date.now();
      const expiredParticles: PooledParticle[] = [];
      
      // Find expired active particles
      this.activeParticles.forEach((particle) => {
        const age = now - particle.createdAt;
        const maxAge = this.getMaxAgeForEffect(particle.effectType);
        
        if (age > maxAge || (particle.emitter && !particle.emitter.active)) {
          expiredParticles.push(particle);
        }
      });
      
      // Return expired particles to pool
      expiredParticles.forEach((particle) => {
        this.returnParticle(particle);
      });
      
      if (expiredParticles.length > 0) {
        Logger.log(`ParticlePool: Cleaned up ${expiredParticles.length} expired particles`);
      }
      
      // Limit available pool size to prevent memory bloat
      if (this.availableParticles.length > this.maxPoolSize / 2) {
        const excess = this.availableParticles.length - Math.floor(this.maxPoolSize / 2);
        const removed = this.availableParticles.splice(0, excess);
        
        // Destroy excess particles
        removed.forEach((particle) => {
          this.destroyParticle(particle);
        });
        
        Logger.log(`ParticlePool: Removed ${excess} excess particles from available pool`);
      }
      
    } catch (error) {
      Logger.log(`ParticlePool: Cleanup error - ${error}`);
    }
  }

  /**
   * Get total number of particles (active + available)
   * Requirements: 6.1, 6.3
   */
  public getTotalParticleCount(): number {
    return this.activeParticles.size + this.availableParticles.length;
  }

  /**
   * Get number of active particles
   * Requirements: 6.1, 6.3
   */
  public getActiveParticleCount(): number {
    return this.activeParticles.size;
  }

  /**
   * Get number of available particles
   * Requirements: 6.1, 6.3
   */
  public getAvailableParticleCount(): number {
    return this.availableParticles.length;
  }

  /**
   * Force cleanup of low priority particles when pool is full
   * Requirements: 1.4, 6.1, 6.3
   */
  public forceLowPriorityCleanup(): number {
    try {
      const lowPriorityParticles: PooledParticle[] = [];
      
      // Find low priority active particles
      this.activeParticles.forEach((particle) => {
        if (particle.priority <= 1) { // Low priority threshold
          lowPriorityParticles.push(particle);
        }
      });
      
      // Sort by priority (lowest first) and age (oldest first)
      lowPriorityParticles.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.createdAt - b.createdAt;
      });
      
      // Remove up to 25% of low priority particles
      const maxToRemove = Math.ceil(lowPriorityParticles.length * 0.25);
      const toRemove = lowPriorityParticles.slice(0, maxToRemove);
      
      toRemove.forEach((particle) => {
        this.returnParticle(particle);
      });
      
      if (toRemove.length > 0) {
        Logger.log(`ParticlePool: Force cleaned ${toRemove.length} low priority particles`);
      }
      
      return toRemove.length;
      
    } catch (error) {
      Logger.log(`ParticlePool: Force cleanup error - ${error}`);
      return 0;
    }
  }

  /**
   * Destroy the particle pool and all particles
   * Requirements: 1.2, 6.1
   */
  public destroy(): void {
    try {
      Logger.log('ParticlePool: Destroying particle pool');
      
      // Destroy all active particles
      this.activeParticles.forEach((particle) => {
        this.destroyParticle(particle);
      });
      this.activeParticles.clear();
      
      // Destroy all available particles
      this.availableParticles.forEach((particle) => {
        this.destroyParticle(particle);
      });
      this.availableParticles = [];
      
      Logger.log('ParticlePool: Destroyed successfully');
      
    } catch (error) {
      Logger.log(`ParticlePool: Destruction error - ${error}`);
    }
  }

  // Private helper methods

  private createNewParticle(effectType: string): PooledParticle {
    const id = `particle-${this.nextId++}`;
    
    return {
      id,
      emitter: null as any, // Will be set by the caller
      active: true,
      effectType,
      createdAt: Date.now(),
      priority: this.calculatePriority(effectType)
    };
  }

  private calculatePriority(effectType: string): number {
    // Higher priority effects are less likely to be cleaned up
    switch (effectType) {
      case 'match_explosion': return 3; // High priority - core gameplay feedback
      case 'combo_celebration': return 3; // High priority - important player feedback
      case 'placement_impact': return 2; // Medium priority
      case 'cascade_trail': return 1; // Low priority - can be sacrificed for performance
      case 'special_dice_aura': return 2; // Medium priority
      default: return 1; // Default low priority
    }
  }

  private getMaxAgeForEffect(effectType: string): number {
    // Maximum age in milliseconds before particle is considered expired
    switch (effectType) {
      case 'match_explosion': return 1000; // 1 second
      case 'combo_celebration': return 2000; // 2 seconds
      case 'placement_impact': return 500; // 0.5 seconds
      case 'cascade_trail': return 800; // 0.8 seconds
      case 'special_dice_aura': return 3000; // 3 seconds (longer for ambient effects)
      default: return 1000; // Default 1 second
    }
  }

  private destroyParticle(particle: PooledParticle): void {
    try {
      if (particle.emitter) {
        particle.emitter.destroy();
      }
    } catch (error) {
      Logger.log(`ParticlePool: Error destroying particle ${particle.id} - ${error}`);
    }
  }
}
