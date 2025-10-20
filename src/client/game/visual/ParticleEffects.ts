import { DieColor } from '../../../shared/types/game.js';

/**
 * ParticleEffects manages all particle systems for visual feedback
 * Handles match effects, cascades, Ultimate Combo, and other visual enhancements
 */
export class ParticleEffects {
  private scene: Phaser.Scene;
  private particleManagers: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();
  }

  /**
   * Create procedural particle textures
   */
  private createParticleTextures(): void {
    this.createGlowParticle();
    this.createStarParticle();
    this.createSparkParticle();
    this.createExplosionParticle();
  }

  /**
   * Create glow particle texture
   */
  private createGlowParticle(): void {
    const graphics = this.scene.add.graphics();
    const size = 16;
    
    // Create gradient glow
    graphics.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 1, 1, 0.5, 0);
    graphics.fillCircle(0, 0, size / 2);
    
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    renderTexture.draw(graphics, size / 2, size / 2);
    renderTexture.saveTexture('particle-glow');
    
    graphics.destroy();
    renderTexture.destroy();
  }

  /**
   * Create star particle texture
   */
  private createStarParticle(): void {
    const graphics = this.scene.add.graphics();
    const size = 20;
    
    graphics.fillStyle(0xffffff, 1);
    // Draw star shape manually
    graphics.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      
      const outerX = Math.cos(angle) * outerRadius;
      const outerY = Math.sin(angle) * outerRadius;
      
      const innerAngle = angle + Math.PI / 5;
      const innerX = Math.cos(innerAngle) * innerRadius;
      const innerY = Math.sin(innerAngle) * innerRadius;
      
      if (i === 0) {
        graphics.moveTo(outerX, outerY);
      } else {
        graphics.lineTo(outerX, outerY);
      }
      graphics.lineTo(innerX, innerY);
    }
    graphics.closePath();
    graphics.fillPath();
    
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    renderTexture.draw(graphics, size / 2, size / 2);
    renderTexture.saveTexture('particle-star');
    
    graphics.destroy();
    renderTexture.destroy();
  }

  /**
   * Create spark particle texture
   */
  private createSparkParticle(): void {
    const graphics = this.scene.add.graphics();
    const size = 8;
    
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(-size / 2, -1, size, 2);
    graphics.fillRect(-1, -size / 2, 2, size);
    
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    renderTexture.draw(graphics, size / 2, size / 2);
    renderTexture.saveTexture('particle-spark');
    
    graphics.destroy();
    renderTexture.destroy();
  }

  /**
   * Create explosion particle texture
   */
  private createExplosionParticle(): void {
    const graphics = this.scene.add.graphics();
    const size = 12;
    
    graphics.fillGradientStyle(0xffff00, 0xff6600, 0xff0000, 0x660000, 1, 0.8, 0.6, 0);
    graphics.fillCircle(0, 0, size / 2);
    
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    renderTexture.draw(graphics, size / 2, size / 2);
    renderTexture.saveTexture('particle-explosion');
    
    graphics.destroy();
    renderTexture.destroy();
  }

  /**
   * Create match clear effect
   */
  public createMatchEffect(
    x: number,
    y: number,
    color: DieColor,
    matchSize: number
  ): void {
    const colorValue = this.getColorValue(color);
    
    // Main explosion effect
    const emitter = this.scene.add.particles(x, y, 'particle-glow', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      tint: colorValue,
      lifespan: 600,
      quantity: matchSize * 3,
      blendMode: 'ADD'
    });

    // Star burst for larger matches
    if (matchSize >= 4) {
      const starEmitter = this.scene.add.particles(x, y, 'particle-star', {
        speed: { min: 80, max: 200 },
        scale: { start: 0.8, end: 0.2 },
        tint: colorValue,
        lifespan: 800,
        quantity: matchSize * 2,
        blendMode: 'ADD'
      });

      this.scene.time.delayedCall(800, () => {
        starEmitter.destroy();
      });
    }

    // Clean up after animation
    this.scene.time.delayedCall(600, () => {
      emitter.destroy();
    });

    // Screen shake for large matches
    if (matchSize >= 5) {
      this.scene.cameras.main.shake(200, 0.01);
    }
  }

  /**
   * Create cascade effect
   */
  public createCascadeEffect(
    x: number,
    y: number,
    chainLevel: number
  ): void {
    const intensity = Math.min(chainLevel, 10);
    
    // Cascade sparks
    const sparkEmitter = this.scene.add.particles(x, y, 'particle-spark', {
      speed: { min: 100, max: 300 },
      scale: { start: 0.6, end: 0.1 },
      rotate: { min: 0, max: 360 },
      tint: [0x00ff88, 0x88ff00, 0xffff00],
      lifespan: 500 + (intensity * 50),
      quantity: intensity * 2,
      blendMode: 'ADD'
    });

    // Chain level indicator
    if (chainLevel > 1) {
      this.createChainLevelText(x, y, chainLevel);
    }

    // Clean up
    this.scene.time.delayedCall(500 + (intensity * 50), () => {
      if (sparkEmitter) sparkEmitter.destroy();
    });
  }

  /**
   * Create Ultimate Combo effect
   */
  public createUltimateComboEffect(x: number, y: number): void {
    // Massive explosion effect
    const mainEmitter = this.scene.add.particles(x, y, 'particle-explosion', {
      speed: { min: 200, max: 500 },
      scale: { start: 1.5, end: 0 },
      rotate: { min: 0, max: 360 },
      tint: [0xff0066, 0x6600ff, 0x00ff66, 0xffff00],
      lifespan: 1500,
      quantity: 50,
      blendMode: 'ADD'
    });

    // Secondary glow wave
    const glowEmitter = this.scene.add.particles(x, y, 'particle-glow', {
      speed: { min: 100, max: 300 },
      scale: { start: 2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0xffffff,
      lifespan: 2000,
      quantity: 30,
      blendMode: 'ADD'
    });

    // Screen effects
    this.scene.cameras.main.shake(1000, 0.02);
    this.scene.cameras.main.flash(500, 255, 255, 255, false, 0.3);

    // Ultimate Combo text
    this.createUltimateComboText(x, y);

    // Clean up
    this.scene.time.delayedCall(2000, () => {
      if (mainEmitter) mainEmitter.destroy();
      if (glowEmitter) glowEmitter.destroy();
    });
  }

  /**
   * Create size effect visualization
   */
  public createSizeEffect(
    x: number,
    y: number,
    effectType: string,
    affectedArea?: { x: number, y: number, width: number, height: number }
  ): void {
    switch (effectType) {
      case 'line_clear':
        this.createLineClearEffect(x, y, affectedArea);
        break;
      case 'area_clear':
        this.createAreaClearEffect(x, y, affectedArea);
        break;
      case 'grid_clear':
        this.createGridClearEffect();
        break;
      case 'spawn_wild':
        this.createWildSpawnEffect(x, y);
        break;
    }
  }

  /**
   * Create line clear effect
   */
  private createLineClearEffect(
    x: number,
    y: number,
    area?: { x: number, y: number, width: number, height: number }
  ): void {
    if (!area) return;

    // Lightning effect across the line
    const emitter = this.scene.add.particles(area.x, area.y, 'particle-spark', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0.2 },
      tint: 0x00ffff,
      lifespan: 800,
      x: { min: area.x, max: area.x + area.width },
      y: { min: area.y, max: area.y + area.height },
      blendMode: 'ADD'
    });

    this.scene.time.delayedCall(800, () => {
      if (emitter) emitter.destroy();
    });
  }

  /**
   * Create area clear effect
   */
  private createAreaClearEffect(
    _x: number,
    _y: number,
    area?: { x: number, y: number, width: number, height: number }
  ): void {
    if (!area) return;

    // Expanding circle effect
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(4, 0xff6600, 0.8);
    
    this.scene.tweens.add({
      targets: graphics,
      duration: 600,
      onUpdate: (tween) => {
        const progress = tween.progress;
        const radius = progress * Math.max(area!.width, area!.height) / 2;
        
        graphics.clear();
        graphics.lineStyle(4 * (1 - progress), 0xff6600, 0.8 * (1 - progress));
        graphics.strokeCircle(area!.x + area!.width / 2, area!.y + area!.height / 2, radius);
      },
      onComplete: () => {
        graphics.destroy();
      }
    });
  }

  /**
   * Create grid clear effect
   */
  private createGridClearEffect(): void {
    // Full screen flash and particle explosion
    this.scene.cameras.main.flash(800, 255, 255, 255, false, 0.5);
    
    const { width, height } = this.scene.scale;
    
    // Multiple emitters across the screen
    for (let i = 0; i < 5; i++) {
      const emitterX = (width / 6) * (i + 1);
      const emitterY = height / 2;
      
      const emitter = this.scene.add.particles(emitterX, emitterY, 'particle-star', {
        speed: { min: 200, max: 400 },
        scale: { start: 1, end: 0 },
        tint: [0xff3366, 0x33ff66, 0x3366ff, 0xffff33],
        lifespan: 1200,
        quantity: 20,
        blendMode: 'ADD'
      });

        this.scene.time.delayedCall(1200, () => {
        if (emitter) emitter.destroy();
      });
    }
  }

  /**
   * Create wild spawn effect
   */
  private createWildSpawnEffect(x: number, y: number): void {
    // Rainbow spiral effect
    const colors = [0xff3366, 0xffff33, 0x33ff66, 0x33ffff, 0x3366ff, 0xcc33ff];
    
    colors.forEach((color, index) => {
      const angle = (index / colors.length) * Math.PI * 2;
      const offsetX = Math.cos(angle) * 30;
      const offsetY = Math.sin(angle) * 30;
      
      const emitter = this.scene.add.particles(x + offsetX, y + offsetY, 'particle-glow', {
        speed: { min: 20, max: 80 },
        scale: { start: 0.6, end: 0.1 },
        tint: color,
        lifespan: 1000,
        quantity: 5,
        blendMode: 'ADD'
      });

      this.scene.time.delayedCall(1000, () => {
        if (emitter) emitter.destroy();
      });
    });
  }

  /**
   * Create chain level text
   */
  private createChainLevelText(x: number, y: number, chainLevel: number): void {
    const text = this.scene.add.text(x, y - 30, `${chainLevel}x CHAIN!`, {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Animate text
    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Create Ultimate Combo text
   */
  private createUltimateComboText(x: number, y: number): void {
    const text = this.scene.add.text(x, y - 50, 'ULTIMATE COMBO!', {
      fontSize: '32px',
      color: '#ff0066',
      fontFamily: 'Arial Black',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Pulsing animation
    this.scene.tweens.add({
      targets: text,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    });

    // Fade out
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: y - 100,
      duration: 2000,
      delay: 600,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Get color value for particle effects
   */
  private getColorValue(color: DieColor): number {
    const colorMap: Record<DieColor, number> = {
      red: 0xff3366,
      blue: 0x3366ff,
      green: 0x33ff66,
      yellow: 0xffff33,
      purple: 0xcc33ff,
      orange: 0xff9933,
      cyan: 0x33ffff
    };
    return colorMap[color];
  }

  /**
   * Clean up all particle effects
   */
  public destroy(): void {
    this.particleManagers.forEach(emitter => {
      if (emitter && emitter.destroy) {
        emitter.destroy();
      }
    });
    this.particleManagers.clear();
  }
}
