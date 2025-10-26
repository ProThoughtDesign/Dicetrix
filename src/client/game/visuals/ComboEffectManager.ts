import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { PerformanceMonitor } from './PerformanceMonitor';

/**
 * Configuration interface for combo effects
 * Requirements: 3.3, 3.4, 3.5
 */
interface ComboEffectConfig {
  baseEffectSize: number;
  multiplierScaling: number;
  celebrationThresholds: number[]; // combo levels that trigger special effects
  fireworksConfig: FireworksConfig;
}

/**
 * Configuration for fireworks effects at high combo levels
 * Requirements: 3.5
 */
interface FireworksConfig {
  minMultiplierForFireworks: number;
  maxBursts: number;
  burstDelay: number;
  burstRadius: number;
  particlesPerBurst: number;
}

/**
 * Manages combo celebration particle effects based on multiplier levels
 * Provides escalating visual feedback for combo chains and special fireworks for high multipliers
 * Requirements: 3.3, 3.4, 3.5
 */
export class ComboEffectManager {
  private scene: Phaser.Scene;
  private performanceMonitor: PerformanceMonitor;
  private config: ComboEffectConfig;
  private activeComboEffects: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene, performanceMonitor: PerformanceMonitor) {
    this.scene = scene;
    this.performanceMonitor = performanceMonitor;
    
    // Initialize combo effect configuration
    this.config = {
      baseEffectSize: 12,
      multiplierScaling: 1.5,
      celebrationThresholds: [2, 3, 5, 7, 10], // Escalating celebration levels
      fireworksConfig: {
        minMultiplierForFireworks: 5,
        maxBursts: 8,
        burstDelay: 150,
        burstRadius: 80,
        particlesPerBurst: 8
      }
    };
    
    Logger.log('ComboEffectManager: Initialized with escalating celebration system');
  }

  /**
   * Trigger combo celebration effect based on multiplier level
   * Requirements: 3.3, 3.4, 3.5
   */
  public triggerComboEffect(position: Phaser.Math.Vector2, multiplier: number): void {
    try {
      if (multiplier < 2) {
        // No combo effect for single matches
        return;
      }

      Logger.log(`ComboEffectManager: Triggering combo effect for ${multiplier}x multiplier at (${position.x}, ${position.y})`);

      // Calculate effect intensity based on multiplier
      const intensity = this.getEffectIntensity(multiplier);
      
      // Check if we can create particles within performance limits
      const particleCount = Math.ceil(this.config.baseEffectSize * intensity);
      if (!this.performanceMonitor.canCreateParticles(particleCount)) {
        Logger.log('ComboEffectManager: Cannot create combo effect - particle limit reached');
        return;
      }

      // Create basic combo celebration effect
      this.createBasicComboEffect(position, multiplier, intensity);

      // Create special fireworks effect for high multipliers (5x+)
      if (multiplier >= this.config.fireworksConfig.minMultiplierForFireworks) {
        this.createFireworksEffect(position, multiplier);
      }

      // Create screen-wide celebration for very high multipliers (10x+)
      if (multiplier >= 10) {
        this.createScreenWideCelebration(position, multiplier);
      }

      Logger.log(`ComboEffectManager: Created combo celebration for ${multiplier}x multiplier with intensity ${intensity.toFixed(2)}`);
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Error creating combo effect - ${error}`);
    }
  }

  /**
   * Create basic combo celebration effect with escalating intensity
   * Requirements: 3.3, 3.4
   */
  private createBasicComboEffect(position: Phaser.Math.Vector2, multiplier: number, intensity: number): void {
    try {
      const particleCount = Math.ceil(this.config.baseEffectSize * intensity);
      const duration = 600 + (multiplier * 100); // Longer duration for higher multipliers
      
      // Create golden celebration particles
      const emitter = this.scene.add.particles(position.x, position.y, 'particle', {
        quantity: particleCount,
        lifespan: duration,
        speed: { 
          min: 80 * intensity, 
          max: 200 * intensity 
        },
        scale: { 
          start: 0.8 * intensity, 
          end: 0.1 
        },
        alpha: { start: 1.0, end: 0.0 },
        tint: 0xffd700 as any, // Gold color for combo effects
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 30 * intensity),
          quantity: particleCount
        },
        blendMode: 'ADD'
      });

      // Add pulsing effect for higher multipliers
      if (multiplier >= 5) {
        this.scene.tweens.add({
          targets: emitter,
          scaleX: intensity * 1.2,
          scaleY: intensity * 1.2,
          duration: 200,
          yoyo: true,
          repeat: Math.min(multiplier - 4, 3) // Up to 3 pulses
        });
      }

      // Track particle count for performance monitoring
      this.performanceMonitor.incrementParticleCount(particleCount);

      // Auto-cleanup after effect completes
      this.scene.time.delayedCall(duration + 100, () => {
        this.performanceMonitor.decrementParticleCount(particleCount);
        this.destroyEmitter(emitter);
      });

      const effectId = `combo_basic_${Date.now()}`;
      this.activeComboEffects.set(effectId, emitter);
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Error creating basic combo effect - ${error}`);
    }
  }

  /**
   * Create fireworks effect for high combo chains (5x+)
   * Requirements: 3.5
   */
  private createFireworksEffect(position: Phaser.Math.Vector2, multiplier: number): void {
    try {
      const config = this.config.fireworksConfig;
      const burstCount = Math.min(multiplier - 4, config.maxBursts);
      
      Logger.log(`ComboEffectManager: Creating fireworks effect with ${burstCount} bursts for ${multiplier}x multiplier`);

      // Create multiple firework bursts with staggered timing
      for (let i = 0; i < burstCount; i++) {
        this.scene.time.delayedCall(i * config.burstDelay, () => {
          this.createFireworkBurst(position, i, multiplier);
        });
      }
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Error creating fireworks effect - ${error}`);
    }
  }

  /**
   * Create individual firework burst
   * Requirements: 3.5
   */
  private createFireworkBurst(centerPosition: Phaser.Math.Vector2, burstIndex: number, multiplier: number): void {
    try {
      const config = this.config.fireworksConfig;
      
      // Randomize burst position around center
      const offsetX = (Math.random() - 0.5) * config.burstRadius;
      const offsetY = (Math.random() - 0.5) * config.burstRadius;
      const burstPosition = new Phaser.Math.Vector2(
        centerPosition.x + offsetX,
        centerPosition.y + offsetY
      );

      // Check particle limits
      if (!this.performanceMonitor.canCreateParticles(config.particlesPerBurst)) {
        return;
      }

      // Create colorful firework burst
      const colors = [0xffd700, 0xff6b35, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
      const burstColor = colors[burstIndex % colors.length];

      const emitter = this.scene.add.particles(burstPosition.x, burstPosition.y, 'particle', {
        quantity: config.particlesPerBurst,
        lifespan: 800 + (multiplier * 50),
        speed: { min: 60, max: 150 },
        scale: { start: 0.8, end: 0.1 },
        alpha: { start: 1.0, end: 0.0 },
        tint: burstColor as any,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 20),
          quantity: config.particlesPerBurst
        },
        gravityY: 50, // Slight gravity for realistic firework fall
        blendMode: 'ADD'
      });

      // Track particles for performance
      this.performanceMonitor.incrementParticleCount(config.particlesPerBurst);

      // Cleanup burst emitter
      this.scene.time.delayedCall(1000, () => {
        this.performanceMonitor.decrementParticleCount(config.particlesPerBurst);
        this.destroyEmitter(emitter);
      });

      const effectId = `firework_burst_${Date.now()}_${burstIndex}`;
      this.activeComboEffects.set(effectId, emitter);
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Error creating firework burst - ${error}`);
    }
  }

  /**
   * Create screen-wide celebration for extremely high multipliers (10x+)
   * Requirements: 3.5
   */
  private createScreenWideCelebration(_position: Phaser.Math.Vector2, multiplier: number): void {
    try {
      Logger.log(`ComboEffectManager: Creating screen-wide celebration for ${multiplier}x multiplier`);

      // Get screen dimensions
      const screenWidth = this.scene.cameras.main.width;
      const screenHeight = this.scene.cameras.main.height;

      // Create celebration particles across the screen
      const celebrationCount = Math.min(multiplier * 2, 30); // Cap at 30 particles for performance
      
      if (!this.performanceMonitor.canCreateParticles(celebrationCount)) {
        Logger.log('ComboEffectManager: Cannot create screen-wide celebration - particle limit reached');
        return;
      }

      // Create multiple celebration emitters across the screen
      const emitterCount = Math.min(Math.floor(multiplier / 3), 5);
      
      for (let i = 0; i < emitterCount; i++) {
        const emitterX = (screenWidth / (emitterCount + 1)) * (i + 1);
        const emitterY = screenHeight * 0.2; // Top portion of screen

        const emitter = this.scene.add.particles(emitterX, emitterY, 'particle', {
          quantity: Math.ceil(celebrationCount / emitterCount),
          lifespan: 1500,
          speed: { min: 100, max: 250 },
          scale: { start: 1.0, end: 0.2 },
          alpha: { start: 1.0, end: 0.0 },
          tint: [0xffd700, 0xff6b35, 0x4ecdc4, 0x45b7d1, 0x96ceb4] as any,
          emitZone: {
            type: 'edge',
            source: new Phaser.Geom.Rectangle(-50, -20, 100, 40),
            quantity: Math.ceil(celebrationCount / emitterCount)
          },
          gravityY: 80,
          blendMode: 'ADD'
        });

        // Track particles
        this.performanceMonitor.incrementParticleCount(Math.ceil(celebrationCount / emitterCount));

        // Cleanup
        this.scene.time.delayedCall(1600, () => {
          this.performanceMonitor.decrementParticleCount(Math.ceil(celebrationCount / emitterCount));
          this.destroyEmitter(emitter);
        });

        const effectId = `screen_celebration_${Date.now()}_${i}`;
        this.activeComboEffects.set(effectId, emitter);
      }
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Error creating screen-wide celebration - ${error}`);
    }
  }

  /**
   * Calculate effect intensity based on combo multiplier
   * Requirements: 3.4
   */
  private getEffectIntensity(multiplier: number): number {
    // Logarithmic scaling to prevent excessive particle counts
    const baseIntensity = Math.log(multiplier + 1) * this.config.multiplierScaling;
    
    // Cap intensity to prevent performance issues
    return Math.min(baseIntensity, 3.0);
  }

  /**
   * Destroy all active combo effects
   * Requirements: 3.3, 3.4, 3.5
   */
  public destroy(): void {
    try {
      Logger.log(`ComboEffectManager: Destroying ${this.activeComboEffects.size} active combo effects`);
      
      this.activeComboEffects.forEach((emitter) => {
        this.destroyEmitter(emitter);
      });
      
      this.activeComboEffects.clear();
      Logger.log('ComboEffectManager: Destroyed successfully');
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Destruction error - ${error}`);
    }
  }

  /**
   * Destroy individual emitter and clean up resources
   */
  private destroyEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    try {
      if (emitter && emitter.active) {
        emitter.destroy();
      }
      
      // Remove from active effects map
      for (const [id, activeEmitter] of this.activeComboEffects.entries()) {
        if (activeEmitter === emitter) {
          this.activeComboEffects.delete(id);
          break;
        }
      }
      
    } catch (error) {
      Logger.log(`ComboEffectManager: Error destroying emitter - ${error}`);
    }
  }
}
