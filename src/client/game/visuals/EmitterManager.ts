import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { PerformanceMonitor } from './PerformanceMonitor';

/**
 * Particle effect configurations optimized for performance
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4
 */
const EFFECT_CONFIGS = {
  match_explosion: { 
    particles: 8, 
    duration: 400, 
    radius: 25,
    speed: { min: 50, max: 150 },
    scale: { start: 0.8, end: 0.1 },
    alpha: { start: 1.0, end: 0.0 }
  },
  cascade_trail: { 
    particles: 3, 
    lifetime: 300, 
    frequency: 150,
    speed: { min: 20, max: 60 },
    scale: { start: 0.5, end: 0.1 },
    alpha: { start: 0.8, end: 0.0 }
  },
  combo_celebration: { 
    particles: 12, 
    duration: 600, 
    scale: 1.0,
    speed: { min: 80, max: 200 },
    alpha: { start: 1.0, end: 0.0 }
  },
  placement_impact: { 
    particles: 5, 
    duration: 250, 
    radius: 15,
    speed: { min: 30, max: 80 },
    scale: { start: 0.6, end: 0.1 },
    alpha: { start: 0.9, end: 0.0 }
  },
  special_dice_aura: { 
    particles: 4, 
    lifetime: 2000, 
    frequency: 200,
    speed: { min: 10, max: 30 },
    scale: { start: 0.4, end: 0.2 },
    alpha: { start: 0.6, end: 0.3 }
  }
};

/**
 * Color mappings for different dice types and effects
 * Requirements: 2.2, 5.2, 5.3, 5.4
 */
const DICE_COLORS = {
  red: 0xff3366,
  blue: 0x3366ff,
  green: 0x33ff66,
  yellow: 0xffff33,
  purple: 0x9933ff,
  orange: 0xff9933,
  teal: 0x33ffff,
  gray: 0x888888,
  white: 0xffffff,
  black: 0x333333,
  // Special effect colors
  combo: 0xffd700, // Gold for combo effects
  impact: 0xcccccc, // Light gray for impacts
  aura: 0x00ffff // Cyan for auras
};

/**
 * Manages Phaser particle emitters for all game effects
 * Handles creation, configuration, and lifecycle of particle effects
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4
 */
export class EmitterManager {
  private scene: Phaser.Scene;
  private performanceMonitor: PerformanceMonitor;
  private activeEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private particleTexture: string = 'particle'; // Default particle texture key

  constructor(scene: Phaser.Scene, performanceMonitor: PerformanceMonitor) {
    this.scene = scene;
    this.performanceMonitor = performanceMonitor;
    
    // Create a simple particle texture if it doesn't exist
    this.createParticleTexture();
    
    Logger.log('EmitterManager: Initialized');
  }

  /**
   * Create match explosion effect
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  public createMatchExplosion(
    position: Phaser.Math.Vector2, 
    diceColor: string, 
    particleCount: number
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    try {
      const config = EFFECT_CONFIGS.match_explosion;
      const color = this.getDiceColor(diceColor);
      
      const emitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: particleCount,
        lifespan: config.duration,
        speed: config.speed,
        scale: config.scale,
        alpha: config.alpha,
        tint: color,
        emitZone: { 
          type: 'edge', 
          source: new Phaser.Geom.Circle(0, 0, config.radius),
          quantity: particleCount
        },
        blendMode: 'ADD'
      });

      // Auto-destroy after effect completes
      this.scene.time.delayedCall(config.duration + 100, () => {
        this.performanceMonitor.decrementParticleCount(particleCount);
        this.destroyEmitter(emitter);
      });

      const emitterId = `match_explosion_${Date.now()}`;
      this.activeEmitters.set(emitterId, emitter);
      
      Logger.log(`EmitterManager: Created match explosion with ${particleCount} particles`);
      return emitter;
      
    } catch (error) {
      Logger.log(`EmitterManager: Match explosion creation failed - ${error}`);
      return null;
    }
  }

  /**
   * Create cascade trail effect
   * Requirements: 3.1, 3.2
   */
  public createCascadeTrail(
    startPos: Phaser.Math.Vector2,
    endPos: Phaser.Math.Vector2,
    diceType: string,
    particleCount: number
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    try {
      const config = EFFECT_CONFIGS.cascade_trail;
      const color = this.getDiceColor(diceType);
      
      // Calculate trail direction
      const direction = new Phaser.Math.Vector2(endPos.x - startPos.x, endPos.y - startPos.y);
      const distance = direction.length();
      direction.normalize();

      const emitter = this.scene.add.particles(startPos.x, startPos.y, this.particleTexture, {
        quantity: particleCount,
        lifespan: config.lifetime,
        speed: config.speed,
        scale: config.scale,
        alpha: config.alpha,
        tint: color,
        gravityY: 100, // Slight downward gravity for falling effect
        blendMode: 'ADD'
      });

      // Move emitter along the trail path
      this.scene.tweens.add({
        targets: emitter,
        x: endPos.x,
        y: endPos.y,
        duration: Math.min(distance * 2, 500), // Speed based on distance
        ease: 'Power2',
        onComplete: () => {
          emitter.stop();
          this.scene.time.delayedCall(config.lifetime, () => {
            this.destroyEmitter(emitter);
          });
        }
      });

      const emitterId = `cascade_trail_${Date.now()}`;
      this.activeEmitters.set(emitterId, emitter);
      
      Logger.log(`EmitterManager: Created cascade trail effect`);
      return emitter;
      
    } catch (error) {
      Logger.log(`EmitterManager: Cascade trail creation failed - ${error}`);
      return null;
    }
  }

  /**
   * Create combo celebration effect
   * Requirements: 3.3, 3.4, 3.5
   */
  public createComboEffect(
    position: Phaser.Math.Vector2,
    multiplier: number,
    particleCount: number
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    try {
      const config = EFFECT_CONFIGS.combo_celebration;
      const intensity = Math.min(multiplier / 5, 2.0); // Scale intensity with multiplier
      
      // Use gold color for combo effects
      const color = DICE_COLORS.combo;
      
      const emitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: particleCount,
        lifespan: config.duration * intensity,
        speed: { 
          min: config.speed.min * intensity, 
          max: config.speed.max * intensity 
        },
        scale: { 
          start: 0.8 * intensity, 
          end: 0.1 
        },
        alpha: config.alpha,
        tint: color,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 30 * intensity),
          quantity: particleCount
        },
        blendMode: 'ADD'
      });

      // Create fireworks effect for high multipliers
      if (multiplier >= 5) {
        this.createFireworksEffect(position, multiplier);
      }

      // Auto-destroy after effect completes
      this.scene.time.delayedCall(config.duration * intensity + 100, () => {
        this.destroyEmitter(emitter);
      });

      const emitterId = `combo_effect_${Date.now()}`;
      this.activeEmitters.set(emitterId, emitter);
      
      Logger.log(`EmitterManager: Created combo effect for ${multiplier}x multiplier`);
      return emitter;
      
    } catch (error) {
      Logger.log(`EmitterManager: Combo effect creation failed - ${error}`);
      return null;
    }
  }

  /**
   * Create piece placement impact effect
   * Requirements: 4.1, 4.2
   */
  public createPlacementImpact(
    position: Phaser.Math.Vector2,
    particleCount: number
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    try {
      const config = EFFECT_CONFIGS.placement_impact;
      const color = DICE_COLORS.impact;
      
      const emitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: particleCount,
        lifespan: config.duration,
        speed: config.speed,
        scale: config.scale,
        alpha: config.alpha,
        tint: color,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, config.radius),
          quantity: particleCount
        },
        gravityY: 200, // Particles fall down after impact
        blendMode: 'NORMAL'
      });

      // Auto-destroy after effect completes
      this.scene.time.delayedCall(config.duration + 100, () => {
        this.destroyEmitter(emitter);
      });

      const emitterId = `placement_impact_${Date.now()}`;
      this.activeEmitters.set(emitterId, emitter);
      
      Logger.log(`EmitterManager: Created placement impact effect`);
      return emitter;
      
    } catch (error) {
      Logger.log(`EmitterManager: Placement impact creation failed - ${error}`);
      return null;
    }
  }

  /**
   * Create special dice aura effect
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  public createSpecialDiceAura(
    position: Phaser.Math.Vector2,
    diceType: string,
    particleCount: number
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    try {
      const config = EFFECT_CONFIGS.special_dice_aura;
      const color = this.getSpecialDiceColor(diceType);
      
      const emitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: particleCount,
        lifespan: config.lifetime,
        speed: config.speed,
        scale: config.scale,
        alpha: config.alpha,
        tint: color,
        frequency: config.frequency,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 20),
          quantity: 1
        },
        blendMode: 'ADD'
      });

      // Aura effects are longer-lived, clean up after extended time
      this.scene.time.delayedCall(config.lifetime + 500, () => {
        this.destroyEmitter(emitter);
      });

      const emitterId = `special_dice_aura_${Date.now()}`;
      this.activeEmitters.set(emitterId, emitter);
      
      Logger.log(`EmitterManager: Created special dice aura for ${diceType}`);
      return emitter;
      
    } catch (error) {
      Logger.log(`EmitterManager: Special dice aura creation failed - ${error}`);
      return null;
    }
  }

  /**
   * Destroy all active emitters
   * Requirements: 1.2, 6.1
   */
  public destroy(): void {
    try {
      Logger.log(`EmitterManager: Destroying ${this.activeEmitters.size} active emitters`);
      
      this.activeEmitters.forEach((emitter) => {
        this.destroyEmitter(emitter);
      });
      
      this.activeEmitters.clear();
      Logger.log('EmitterManager: Destroyed successfully');
      
    } catch (error) {
      Logger.log(`EmitterManager: Destruction error - ${error}`);
    }
  }

  // Private helper methods

  private createParticleTexture(): void {
    try {
      // Check if texture already exists
      if (this.scene.textures.exists(this.particleTexture)) {
        return;
      }

      // Create a simple circular particle texture
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(4, 4, 4);
      
      // Generate texture from graphics
      graphics.generateTexture(this.particleTexture, 8, 8);
      graphics.destroy();
      
      Logger.log('EmitterManager: Created particle texture');
      
    } catch (error) {
      Logger.log(`EmitterManager: Particle texture creation failed - ${error}`);
      // Fallback to a default texture key that might exist
      this.particleTexture = '__DEFAULT';
    }
  }

  private getDiceColor(diceColor: string): number {
    const colorKey = diceColor.toLowerCase() as keyof typeof DICE_COLORS;
    return DICE_COLORS[colorKey] || DICE_COLORS.white;
  }

  private getSpecialDiceColor(diceType: string): number {
    // Map special dice types to appropriate colors
    switch (diceType.toLowerCase()) {
      case 'black':
      case 'wild':
        return DICE_COLORS.purple;
      case 'booster':
        return DICE_COLORS.aura;
      case 'enhanced':
        return DICE_COLORS.combo;
      default:
        return DICE_COLORS.aura;
    }
  }

  private createFireworksEffect(position: Phaser.Math.Vector2, multiplier: number): void {
    try {
      // Create multiple small bursts for fireworks effect
      const burstCount = Math.min(multiplier - 4, 5); // Up to 5 bursts for very high multipliers
      
      for (let i = 0; i < burstCount; i++) {
        this.scene.time.delayedCall(i * 100, () => {
          const offsetX = (Math.random() - 0.5) * 100;
          const offsetY = (Math.random() - 0.5) * 100;
          
          const burstEmitter = this.scene.add.particles(
            position.x + offsetX, 
            position.y + offsetY, 
            this.particleTexture, 
            {
              quantity: 6,
              lifespan: 800,
              speed: { min: 60, max: 120 },
              scale: { start: 0.6, end: 0.1 },
              alpha: { start: 1.0, end: 0.0 },
              tint: [DICE_COLORS.combo, DICE_COLORS.yellow, DICE_COLORS.orange],
              emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, 15),
                quantity: 6
              },
              blendMode: 'ADD'
            }
          );

          // Clean up burst emitter
          this.scene.time.delayedCall(900, () => {
            this.destroyEmitter(burstEmitter);
          });
        });
      }
      
      Logger.log(`EmitterManager: Created fireworks effect with ${burstCount} bursts`);
      
    } catch (error) {
      Logger.log(`EmitterManager: Fireworks effect creation failed - ${error}`);
    }
  }

  private destroyEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    try {
      if (emitter && emitter.active) {
        emitter.destroy();
      }
      
      // Remove from active emitters map
      for (const [id, activeEmitter] of this.activeEmitters.entries()) {
        if (activeEmitter === emitter) {
          this.activeEmitters.delete(id);
          break;
        }
      }
      
    } catch (error) {
      Logger.log(`EmitterManager: Error destroying emitter - ${error}`);
    }
  }
}
