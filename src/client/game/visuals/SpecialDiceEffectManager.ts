import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { PerformanceMonitor } from './PerformanceMonitor';
import { EmitterManager } from './EmitterManager';
import { BoosterType } from '../../../shared/types/difficulty';
import { Die } from '../logic/types';

/**
 * Configuration for special dice effects
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
interface SpecialDiceEffectConfig {
  auraParticleCount: number;
  auraRadius: number;
  auraLifetime: number;
  auraFrequency: number;
  burstParticleCount: number;
  burstDuration: number;
  transformationDuration: number;
  transformationParticleCount: number;
}

/**
 * Color mappings for different booster types and special effects
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
const BOOSTER_COLORS = {
  [BoosterType.RED_GLOW]: 0xff3366,
  [BoosterType.BLUE_GLOW]: 0x3366ff,
  [BoosterType.GREEN_GLOW]: 0x33ff66,
  [BoosterType.YELLOW_GLOW]: 0xffff33,
  [BoosterType.PURPLE_GLOW]: 0x9933ff,
  [BoosterType.ORANGE_GLOW]: 0xff9933,
  [BoosterType.MAGENTA_GLOW]: 0xff33ff,
  [BoosterType.CYAN_GLOW]: 0x33ffff,
  [BoosterType.TEAL_GLOW]: 0x33ff99,
  [BoosterType.NONE]: 0xffffff
};

/**
 * Special effect colors for black dice and transformations
 * Requirements: 5.3, 5.4
 */
const SPECIAL_EFFECT_COLORS = {
  BLACK_DICE_AURA: 0x9933ff, // Purple for magical effect
  WILD_TRANSFORMATION: 0xffd700, // Gold for transformation
  ENERGY_BURST: 0x00ffff, // Cyan for energy
  ACTIVATION_FLASH: 0xffffff // White for activation flash
};

/**
 * Manages particle effects for special dice including boosters, black dice, and wild cards
 * Provides glowing auras, energy bursts, and magical transformation effects
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export class SpecialDiceEffectManager {
  private scene: Phaser.Scene;
  private emitterManager: EmitterManager;
  private performanceMonitor: PerformanceMonitor;
  private config: SpecialDiceEffectConfig;
  private activeAuras: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private particleTexture: string = 'particle';

  constructor(scene: Phaser.Scene, emitterManager: EmitterManager, performanceMonitor: PerformanceMonitor) {
    this.scene = scene;
    this.emitterManager = emitterManager;
    this.performanceMonitor = performanceMonitor;
    
    // Initialize configuration with performance-optimized values
    this.config = {
      auraParticleCount: 4,
      auraRadius: 20,
      auraLifetime: 2000,
      auraFrequency: 200,
      burstParticleCount: 12,
      burstDuration: 600,
      transformationDuration: 800,
      transformationParticleCount: 16
    };
    
    Logger.log('SpecialDiceEffectManager: Initialized');
  }

  /**
   * Create glowing aura effect around enhanced dice with booster types
   * Requirements: 5.1, 5.2
   */
  public createBoosterAura(diceId: string, position: Phaser.Math.Vector2, boosterType: BoosterType): void {
    try {
      // Check if we can create particles
      if (!this.performanceMonitor.canCreateParticles(this.config.auraParticleCount)) {
        Logger.log('SpecialDiceEffectManager: Cannot create booster aura - particle limit reached');
        return;
      }

      // Remove existing aura for this dice if it exists
      this.removeAura(diceId);

      const color = BOOSTER_COLORS[boosterType] || BOOSTER_COLORS[BoosterType.NONE];
      
      const emitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: 1,
        lifespan: this.config.auraLifetime,
        speed: { min: 10, max: 30 },
        scale: { start: 0.4, end: 0.2 },
        alpha: { start: 0.6, end: 0.3 },
        tint: color,
        frequency: this.config.auraFrequency,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, this.config.auraRadius),
          quantity: 1
        },
        blendMode: 'ADD'
      });

      // Store the active aura
      this.activeAuras.set(diceId, emitter);
      this.performanceMonitor.incrementParticleCount(this.config.auraParticleCount);
      
      Logger.log(`SpecialDiceEffectManager: Created booster aura for dice ${diceId} with type ${boosterType}`);
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Booster aura creation failed - ${error}`);
    }
  }

  /**
   * Create energy burst effect for booster activation
   * Requirements: 5.2
   */
  public createBoosterActivationBurst(position: Phaser.Math.Vector2, boosterType: BoosterType): void {
    try {
      if (!this.performanceMonitor.canCreateParticles(this.config.burstParticleCount)) {
        Logger.log('SpecialDiceEffectManager: Cannot create activation burst - particle limit reached');
        return;
      }

      const boosterColor = BOOSTER_COLORS[boosterType] || BOOSTER_COLORS[BoosterType.NONE];
      const energyColor = SPECIAL_EFFECT_COLORS.ENERGY_BURST;
      
      // Create main energy burst
      const burstEmitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: this.config.burstParticleCount,
        lifespan: this.config.burstDuration,
        speed: { min: 80, max: 200 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 1.0, end: 0.0 },
        tint: [boosterColor, energyColor],
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 30),
          quantity: this.config.burstParticleCount
        },
        blendMode: 'ADD'
      });

      // Create activation flash
      const flashEmitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: 6,
        lifespan: 300,
        speed: { min: 50, max: 100 },
        scale: { start: 1.0, end: 0.2 },
        alpha: { start: 0.8, end: 0.0 },
        tint: SPECIAL_EFFECT_COLORS.ACTIVATION_FLASH,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 15),
          quantity: 6
        },
        blendMode: 'ADD'
      });

      // Auto-cleanup after effects complete
      this.scene.time.delayedCall(this.config.burstDuration + 100, () => {
        this.destroyEmitter(burstEmitter);
        this.performanceMonitor.decrementParticleCount(this.config.burstParticleCount);
      });

      this.scene.time.delayedCall(400, () => {
        this.destroyEmitter(flashEmitter);
        this.performanceMonitor.decrementParticleCount(6);
      });

      this.performanceMonitor.incrementParticleCount(this.config.burstParticleCount + 6);
      
      Logger.log(`SpecialDiceEffectManager: Created booster activation burst for type ${boosterType}`);
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Booster activation burst creation failed - ${error}`);
    }
  }

  /**
   * Create magical aura effect for black dice (wild cards)
   * Requirements: 5.3, 5.4
   */
  public createBlackDiceAura(diceId: string, position: Phaser.Math.Vector2): void {
    try {
      if (!this.performanceMonitor.canCreateParticles(this.config.auraParticleCount)) {
        Logger.log('SpecialDiceEffectManager: Cannot create black dice aura - particle limit reached');
        return;
      }

      // Remove existing aura for this dice if it exists
      this.removeAura(diceId);

      const color = SPECIAL_EFFECT_COLORS.BLACK_DICE_AURA;
      
      // Create mystical swirling aura for black dice
      const emitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: 1,
        lifespan: this.config.auraLifetime,
        speed: { min: 15, max: 40 },
        scale: { start: 0.5, end: 0.2 },
        alpha: { start: 0.7, end: 0.4 },
        tint: color,
        frequency: this.config.auraFrequency * 0.8, // Slightly faster for mystical effect
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, this.config.auraRadius + 5), // Slightly larger radius
          quantity: 1
        },
        blendMode: 'ADD'
      });

      // Add swirling motion to the aura
      this.scene.tweens.add({
        targets: emitter,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
      });

      // Store the active aura
      this.activeAuras.set(diceId, emitter);
      this.performanceMonitor.incrementParticleCount(this.config.auraParticleCount);
      
      Logger.log(`SpecialDiceEffectManager: Created black dice aura for dice ${diceId}`);
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Black dice aura creation failed - ${error}`);
    }
  }

  /**
   * Create magical transformation effect for black dice wild card activation
   * Requirements: 5.4
   */
  public createWildTransformationEffect(position: Phaser.Math.Vector2, fromColor: string, toColor: string): void {
    try {
      if (!this.performanceMonitor.canCreateParticles(this.config.transformationParticleCount)) {
        Logger.log('SpecialDiceEffectManager: Cannot create transformation effect - particle limit reached');
        return;
      }

      const transformColor = SPECIAL_EFFECT_COLORS.WILD_TRANSFORMATION;
      
      // Create transformation spiral effect
      const spiralEmitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: this.config.transformationParticleCount,
        lifespan: this.config.transformationDuration,
        speed: { min: 60, max: 120 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.9, end: 0.0 },
        tint: transformColor,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 25),
          quantity: this.config.transformationParticleCount
        },
        blendMode: 'ADD'
      });

      // Create magical sparkles
      const sparkleEmitter = this.scene.add.particles(position.x, position.y, this.particleTexture, {
        quantity: 8,
        lifespan: 500,
        speed: { min: 30, max: 80 },
        scale: { start: 0.3, end: 0.1 },
        alpha: { start: 1.0, end: 0.0 },
        tint: [transformColor, 0xffffff],
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Circle(0, 0, 35),
          quantity: 8
        },
        blendMode: 'ADD'
      });

      // Add spiral motion to transformation effect
      this.scene.tweens.add({
        targets: spiralEmitter,
        angle: 720, // Two full rotations
        duration: this.config.transformationDuration,
        ease: 'Power2'
      });

      // Auto-cleanup after effects complete
      this.scene.time.delayedCall(this.config.transformationDuration + 100, () => {
        this.destroyEmitter(spiralEmitter);
        this.performanceMonitor.decrementParticleCount(this.config.transformationParticleCount);
      });

      this.scene.time.delayedCall(600, () => {
        this.destroyEmitter(sparkleEmitter);
        this.performanceMonitor.decrementParticleCount(8);
      });

      this.performanceMonitor.incrementParticleCount(this.config.transformationParticleCount + 8);
      
      Logger.log(`SpecialDiceEffectManager: Created wild transformation effect from ${fromColor} to ${toColor}`);
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Wild transformation effect creation failed - ${error}`);
    }
  }

  /**
   * Update aura position for moving dice
   * Requirements: 5.1, 5.3
   */
  public updateAuraPosition(diceId: string, newPosition: Phaser.Math.Vector2): void {
    try {
      const aura = this.activeAuras.get(diceId);
      if (aura && aura.active) {
        aura.setPosition(newPosition.x, newPosition.y);
      }
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Aura position update failed - ${error}`);
    }
  }

  /**
   * Remove aura effect for a specific dice
   * Requirements: 5.1, 5.3
   */
  public removeAura(diceId: string): void {
    try {
      const aura = this.activeAuras.get(diceId);
      if (aura) {
        this.destroyEmitter(aura);
        this.activeAuras.delete(diceId);
        this.performanceMonitor.decrementParticleCount(this.config.auraParticleCount);
        Logger.log(`SpecialDiceEffectManager: Removed aura for dice ${diceId}`);
      }
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Aura removal failed - ${error}`);
    }
  }

  /**
   * Create enhanced dice effect based on die properties
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  public createEnhancedDiceEffect(die: Die, position: Phaser.Math.Vector2): void {
    try {
      // Handle black dice (wild cards)
      if (die.isBlack || die.isWild) {
        this.createBlackDiceAura(die.id, position);
        return;
      }

      // Handle booster dice
      if (die.boosterType && die.boosterType !== BoosterType.NONE) {
        this.createBoosterAura(die.id, position, die.boosterType);
        return;
      }

      Logger.log(`SpecialDiceEffectManager: No special effects needed for dice ${die.id}`);
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Enhanced dice effect creation failed - ${error}`);
    }
  }

  /**
   * Trigger activation effect for special dice
   * Requirements: 5.2, 5.4
   */
  public triggerActivationEffect(die: Die, position: Phaser.Math.Vector2): void {
    try {
      // Handle booster activation
      if (die.boosterType && die.boosterType !== BoosterType.NONE) {
        this.createBoosterActivationBurst(position, die.boosterType);
        return;
      }

      // Handle wild card transformation
      if (die.isBlack || die.isWild) {
        this.createWildTransformationEffect(position, 'black', die.color);
        return;
      }

      Logger.log(`SpecialDiceEffectManager: No activation effects for dice ${die.id}`);
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Activation effect failed - ${error}`);
    }
  }

  /**
   * Clean up all active auras and effects
   * Requirements: 5.1, 5.3
   */
  public cleanup(): void {
    try {
      Logger.log(`SpecialDiceEffectManager: Cleaning up ${this.activeAuras.size} active auras`);
      
      this.activeAuras.forEach((aura, diceId) => {
        this.destroyEmitter(aura);
        this.performanceMonitor.decrementParticleCount(this.config.auraParticleCount);
      });
      
      this.activeAuras.clear();
      Logger.log('SpecialDiceEffectManager: Cleanup completed');
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Cleanup error - ${error}`);
    }
  }

  /**
   * Destroy the manager and clean up all resources
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  public destroy(): void {
    try {
      Logger.log('SpecialDiceEffectManager: Destroying manager');
      
      this.cleanup();
      
      Logger.log('SpecialDiceEffectManager: Destroyed successfully');
      
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Destruction error - ${error}`);
    }
  }

  // Private helper methods

  private destroyEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    try {
      if (emitter && emitter.active) {
        emitter.destroy();
      }
    } catch (error) {
      Logger.log(`SpecialDiceEffectManager: Error destroying emitter - ${error}`);
    }
  }
}
