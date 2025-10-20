import { VisualEffectsManager } from './VisualEffectsManager.js';
import { VISUAL_CONFIG } from './VisualConfig.js';
import { DieColor } from '../../../shared/types/game.js';

/**
 * VisualIntegration provides helper methods for integrating visual effects with game logic
 * Simplifies the interface between game systems and visual effects
 */
export class VisualIntegration {
  private visualEffects: VisualEffectsManager;

  constructor(visualEffects: VisualEffectsManager) {
    this.visualEffects = visualEffects;
  }

  /**
   * Handle match clearing with appropriate visual feedback
   */
  public async handleMatchClearing(matchData: {
    dice: Array<{ sprite: Phaser.GameObjects.Sprite, x: number, y: number, color: DieColor }>,
    size: number,
    effectType: string,
    score: number
  }): Promise<void> {
    const { dice, size, effectType, score } = matchData;
    
    if (dice.length === 0) return;
    
    // Create visual feedback for the match
    this.visualEffects.createMatchFeedback(
      dice.map(d => ({ x: d.x, y: d.y, color: d.color })),
      size,
      effectType
    );

    // Animate dice clearing
    await this.visualEffects.animateDiceClearing(
      dice.map(d => d.sprite),
      { color: dice[0]!.color, size, effectType }
    );

    // Show score popup
    const centerX = dice.reduce((sum, d) => sum + d.x, 0) / dice.length;
    const centerY = dice.reduce((sum, d) => sum + d.y, 0) / dice.length;
    this.visualEffects.createScorePopup(centerX, centerY, score);
  }

  /**
   * Handle cascade effects
   */
  public handleCascade(cascadeData: {
    x: number,
    y: number,
    chainLevel: number,
    score: number,
    multiplier: number
  }): void {
    const { x, y, chainLevel, score, multiplier } = cascadeData;
    
    // Create cascade visual feedback
    this.visualEffects.createCascadeFeedback(x, y, chainLevel);
    
    // Show score with multiplier
    this.visualEffects.createScorePopup(x, y, score, multiplier);
  }

  /**
   * Handle Ultimate Combo activation
   */
  public handleUltimateCombo(x: number, y: number, totalScore: number): void {
    // Create spectacular Ultimate Combo effect
    this.visualEffects.createUltimateComboFeedback(x, y);
    
    // Show massive score popup
    this.visualEffects.createScorePopup(x, y - 50, totalScore, 5);
  }

  /**
   * Handle piece movement with visual feedback
   */
  public async handlePieceMovement(
    piece: Phaser.GameObjects.Group,
    movement: {
      type: 'fall' | 'move' | 'rotate' | 'lock',
      params?: any
    }
  ): Promise<void> {
    await this.visualEffects.animatePieceMovement(piece, movement.type, movement.params);
  }

  /**
   * Handle gravity application
   */
  public async handleGravity(
    diceMovements: Array<{ die: Phaser.GameObjects.Sprite, fromY: number, toY: number }>
  ): Promise<void> {
    await this.visualEffects.animateGravityApplication(diceMovements);
  }

  /**
   * Handle booster activation
   */
  public handleBoosterActivation(
    boosterType: string,
    color: DieColor,
    x: number,
    y: number
  ): void {
    this.visualEffects.createBoosterActivation(boosterType, color, x, y);
  }

  /**
   * Handle level progression
   */
  public handleLevelUp(level: number): void {
    this.visualEffects.createLevelUpCelebration(level);
  }

  /**
   * Handle scene transitions
   */
  public async handleSceneTransition(
    type: 'fade' | 'slide' | 'zoom',
    direction: 'in' | 'out' = 'out'
  ): Promise<void> {
    await this.visualEffects.createTransition(type, direction);
  }

  /**
   * Add neon glow to any game object
   */
  public addGlow(
    target: Phaser.GameObjects.GameObject,
    color?: DieColor,
    intensity: number = VISUAL_CONFIG.NEON_THEME.GLOW_EFFECTS.intensity
  ): Phaser.GameObjects.Sprite | null {
    const glowColor = color ? VISUAL_CONFIG.COLORS.PALETTE[color] : VISUAL_CONFIG.COLORS.SPECIAL.wild;
    return this.visualEffects.addNeonGlow(target, glowColor, intensity);
  }

  /**
   * Create custom particle effect
   */
  public createCustomEffect(
    x: number,
    y: number,
    effectType: 'celebration' | 'warning' | 'success' | 'error',
    intensity: number = 1
  ): void {
    const colors: Record<string, DieColor> = {
      celebration: 'yellow',
      warning: 'orange',
      success: 'green',
      error: 'red'
    };

    const color = colors[effectType] || 'cyan';
    this.visualEffects.createMatchFeedback([{ x, y, color }], Math.ceil(intensity * 5), 'standard');
  }

  /**
   * Get visual configuration
   */
  public getConfig() {
    return VISUAL_CONFIG;
  }
}

/**
 * Factory function to create visual integration
 */
export function createVisualIntegration(scene: Phaser.Scene): VisualIntegration {
  const visualEffects = new VisualEffectsManager(scene);
  visualEffects.initialize();
  return new VisualIntegration(visualEffects);
}
