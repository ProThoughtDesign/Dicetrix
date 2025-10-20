import { DiceRenderer } from './DiceRenderer.js';
import { ParticleEffects } from './ParticleEffects.js';
import { AnimationManager } from './AnimationManager.js';
import { VISUAL_CONFIG } from './VisualConfig.js';
import { DieColor } from '../../../shared/types/game.js';

/**
 * VisualEffectsManager coordinates all visual systems
 * Provides a unified interface for visual effects, animations, and rendering
 */
export class VisualEffectsManager {
  private scene: Phaser.Scene;
  private diceRenderer: DiceRenderer;
  private particleEffects: ParticleEffects;
  private animationManager: AnimationManager;
  private neonTheme: NeonTheme;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.diceRenderer = new DiceRenderer(scene);
    this.particleEffects = new ParticleEffects(scene);
    this.animationManager = new AnimationManager(scene);
    this.neonTheme = new NeonTheme(scene);
  }

  /**
   * Initialize all visual systems
   */
  public initialize(): void {
    this.diceRenderer.generateAllDiceTextures();
    this.neonTheme.setupNeonEnvironment();
  }

  /**
   * Create visual feedback for match clearing
   */
  public createMatchFeedback(
    dice: Array<{ x: number, y: number, color: DieColor }>,
    matchSize: number,
    effectType: string
  ): void {
    // Calculate center point of match
    const centerX = dice.reduce((sum, die) => sum + die.x, 0) / dice.length;
    const centerY = dice.reduce((sum, die) => sum + die.y, 0) / dice.length;
    
    // Get dominant color
    const colorCounts = dice.reduce((counts, die) => {
      counts[die.color] = (counts[die.color] || 0) + 1;
      return counts;
    }, {} as Record<DieColor, number>);
    
    const dominantColor = Object.entries(colorCounts)
      .reduce((a, b) => colorCounts[a[0] as DieColor] > colorCounts[b[0] as DieColor] ? a : b)[0] as DieColor;

    // Create particle effect
    this.particleEffects.createMatchEffect(centerX, centerY, dominantColor, matchSize);

    // Create size effect if applicable
    if (effectType !== 'standard') {
      this.particleEffects.createSizeEffect(centerX, centerY, effectType);
    }

    // Add screen shake for large matches
    if (matchSize >= 5) {
      this.neonTheme.addScreenPulse(0.02, 200);
    }
  }

  /**
   * Create cascade visual feedback
   */
  public createCascadeFeedback(
    x: number,
    y: number,
    chainLevel: number
  ): void {
    this.particleEffects.createCascadeEffect(x, y, chainLevel);
    
    // Increase intensity with chain level
    if (chainLevel > 3) {
      this.neonTheme.addScreenPulse(0.01 * chainLevel, 150);
    }
  }

  /**
   * Create Ultimate Combo visual spectacle
   */
  public createUltimateComboFeedback(x: number, y: number): void {
    this.particleEffects.createUltimateComboEffect(x, y);
    this.neonTheme.addScreenFlash(0xffffff, 0.5, 1000);
    this.neonTheme.addScreenPulse(0.03, 1000);
  }

  /**
   * Animate piece movement with visual feedback
   */
  public async animatePieceMovement(
    piece: Phaser.GameObjects.Group,
    action: 'fall' | 'move' | 'rotate' | 'lock',
    params?: any
  ): Promise<void> {
    switch (action) {
      case 'fall':
        await this.animationManager.animatePieceFall(
          piece,
          params.fromY,
          params.toY,
          params.duration
        );
        break;
        
      case 'move':
        await this.animationManager.animatePieceMove(
          piece,
          params.direction,
          params.distance,
          params.duration
        );
        break;
        
      case 'rotate':
        await this.animationManager.animatePieceRotation(
          piece,
          params.angle,
          params.duration
        );
        break;
        
      case 'lock':
        await this.animationManager.animatePieceLock(piece);
        break;
    }
  }

  /**
   * Animate dice clearing with coordinated effects
   */
  public async animateDiceClearing(
    dice: Phaser.GameObjects.Sprite[],
    _matchData: { color: DieColor, size: number, effectType: string }
  ): Promise<void> {
    // Highlight matches first
    this.animationManager.animateMatchHighlight(dice);
    
    // Wait a moment for highlight
    await new Promise(resolve => this.scene.time.delayedCall(300, resolve));
    
    // Clear with effects
    await this.animationManager.animateDiceClear(dice);
  }

  /**
   * Animate gravity with visual feedback
   */
  public async animateGravityApplication(
    diceMovements: Array<{ die: Phaser.GameObjects.Sprite, fromY: number, toY: number }>
  ): Promise<void> {
    await this.animationManager.animateGravity(diceMovements);
  }

  /**
   * Create booster activation effect
   */
  public createBoosterActivation(
    boosterType: string,
    color: DieColor,
    x: number,
    y: number
  ): void {
    const colorValue = this.getColorValue(color);
    
    // Create activation burst
    this.particleEffects.createMatchEffect(x, y, color, 3);
    
    // Add UI glow effect
    this.neonTheme.addUIGlow(boosterType, colorValue, 2000);
  }

  /**
   * Create score popup with neon styling
   */
  public createScorePopup(
    x: number,
    y: number,
    score: number,
    multiplier?: number
  ): void {
    let color = '#ffff00';
    
    if (multiplier && multiplier > 1) {
      color = multiplier > 5 ? '#ff0066' : '#00ff88';
    }
    
    this.animationManager.animateScorePopup(x, y, score, color);
  }

  /**
   * Create level up celebration
   */
  public createLevelUpCelebration(level: number): void {
    this.animationManager.animateLevelUp(level);
    this.neonTheme.addScreenFlash(0x00ff88, 0.3, 500);
    
    // Create celebration particles
    const { width, height } = this.scene.scale;
    this.particleEffects.createMatchEffect(width / 2, height / 2, 'green', 10);
  }

  /**
   * Apply neon glow to game object
   */
  public addNeonGlow(
    target: Phaser.GameObjects.GameObject,
    color: number = 0xffffff,
    intensity: number = 0.5
  ): Phaser.GameObjects.Sprite | null {
    return this.animationManager.addNeonGlow(target, color, intensity);
  }

  /**
   * Create screen transition
   */
  public async createTransition(
    type: 'fade' | 'slide' | 'zoom',
    direction: 'in' | 'out' = 'out',
    duration: number = 500
  ): Promise<void> {
    return this.animationManager.createScreenTransition(type, direction, duration);
  }

  /**
   * Get color value for effects
   */
  private getColorValue(color: DieColor): number {
    return VISUAL_CONFIG.COLORS.PALETTE[color];
  }

  /**
   * Clean up all visual systems
   */
  public destroy(): void {
    this.diceRenderer.destroy();
    this.particleEffects.destroy();
    this.animationManager.destroy();
    this.neonTheme.destroy();
  }
}

/**
 * NeonTheme handles the overall neon aesthetic and environmental effects
 */
class NeonTheme {
  private scene: Phaser.Scene;
  private backgroundEffects: Phaser.GameObjects.Graphics[] = [];
  private glowLayers: Map<string, Phaser.GameObjects.Sprite> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Setup neon environment effects
   */
  public setupNeonEnvironment(): void {
    this.createBackgroundGrid();
    this.createAmbientGlow();
  }

  /**
   * Create background grid with neon lines
   */
  private createBackgroundGrid(): void {
    const { width, height } = this.scene.scale;
    const graphics = this.scene.add.graphics();
    
    // Grid lines
    graphics.lineStyle(1, 0x003366, 0.3);
    
    // Vertical lines
    for (let x = 0; x < width; x += 40) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += 40) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
    
    graphics.strokePath();
    graphics.setDepth(-100);
    
    this.backgroundEffects.push(graphics);
  }

  /**
   * Create ambient glow effect
   */
  private createAmbientGlow(): void {
    const { width, height } = this.scene.scale;
    
    // Create subtle glow zones
    const glowZones = [
      { x: width * 0.2, y: height * 0.3, color: 0x003366 },
      { x: width * 0.8, y: height * 0.7, color: 0x330066 },
      { x: width * 0.5, y: height * 0.1, color: 0x006633 }
    ];
    
    glowZones.forEach((zone, index) => {
      const graphics = this.scene.add.graphics();
      graphics.fillGradientStyle(zone.color, zone.color, zone.color, zone.color, 0.1, 0.1, 0, 0);
      graphics.fillCircle(zone.x, zone.y, 200);
      graphics.setDepth(-90);
      
      // Subtle pulsing
      this.scene.tweens.add({
        targets: graphics,
        alpha: 0.05,
        duration: 3000 + (index * 500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.backgroundEffects.push(graphics);
    });
  }

  /**
   * Add screen pulse effect
   */
  public addScreenPulse(intensity: number, duration: number): void {
    const camera = this.scene.cameras.main;
    camera.shake(duration, intensity);
  }

  /**
   * Add screen flash effect
   */
  public addScreenFlash(color: number, alpha: number, duration: number): void {
    const camera = this.scene.cameras.main;
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    camera.flash(duration, r, g, b);
  }

  /**
   * Add UI glow effect
   */
  public addUIGlow(_elementId: string, color: number, duration: number): void {
    // This would be implemented based on specific UI elements
    // For now, create a general glow effect
    const { width, height } = this.scene.scale;
    
    const glow = this.scene.add.graphics();
    glow.fillGradientStyle(color, color, color, color, 0.3, 0.3, 0, 0);
    glow.fillCircle(width / 2, height / 2, 100);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        if (glow) glow.destroy();
      }
    });
  }

  /**
   * Clean up neon theme effects
   */
  public destroy(): void {
    this.backgroundEffects.forEach(effect => {
      if (effect && effect.destroy) {
        effect.destroy();
      }
    });
    this.backgroundEffects = [];
    
    this.glowLayers.forEach(glow => {
      if (glow && glow.destroy) {
        glow.destroy();
      }
    });
    this.glowLayers.clear();
  }
}
