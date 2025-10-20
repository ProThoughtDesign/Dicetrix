import { ScoreHUD } from './ScoreHUD.js';
import { BoosterHUD } from './BoosterHUD.js';
import { ScoreManager } from '../models/ScoreManager.js';
import { BoosterManager } from '../models/BoosterManager.js';
import { ScoreBreakdown } from '../../../shared/types/game.js';

/**
 * Main HUD manager that coordinates all UI elements
 * Combines score display, booster display, and other game UI
 */
export class GameHUD {
  private scene: Phaser.Scene;
  private scoreHUD: ScoreHUD;
  private boosterHUD: BoosterHUD;
  private scoreManager: ScoreManager;
  private boosterManager: BoosterManager;
  
  // Layout configuration
  private screenWidth: number;
  private screenHeight: number;

  constructor(
    scene: Phaser.Scene, 
    scoreManager: ScoreManager, 
    boosterManager: BoosterManager,
    screenWidth: number = 800,
    screenHeight: number = 600
  ) {
    this.scene = scene;
    this.scoreManager = scoreManager;
    this.boosterManager = boosterManager;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.createHUDElements();
    this.updateLayout();
  }

  /**
   * Create all HUD elements
   */
  private createHUDElements(): void {
    // Create score HUD in top-left
    this.scoreHUD = new ScoreHUD(this.scene, this.scoreManager, 20, 20);
    
    // Create booster HUD in top-right
    const boosterX = this.screenWidth - 320;
    this.boosterHUD = new BoosterHUD(this.scene, this.boosterManager, boosterX, 20);
  }

  /**
   * Update all HUD elements
   */
  public update(): void {
    this.scoreHUD.update();
    this.boosterHUD.update();
  }

  /**
   * Show score breakdown with animation
   */
  public showScoreBreakdown(breakdown: ScoreBreakdown, duration: number = 3000): void {
    this.scoreHUD.showScoreBreakdown(breakdown, duration);
  }

  /**
   * Hide score breakdown
   */
  public hideScoreBreakdown(): void {
    this.scoreHUD.hideScoreBreakdown();
  }

  /**
   * Show score statistics
   */
  public showStatistics(): void {
    this.scoreHUD.showStatistics();
  }

  /**
   * Hide score statistics
   */
  public hideStatistics(): void {
    this.scoreHUD.hideStatistics();
  }

  /**
   * Set current level for display
   */
  public setLevel(level: number): void {
    this.scoreHUD.setLevel(level);
  }

  /**
   * Animate score increase
   */
  public animateScoreIncrease(oldScore: number, newScore: number): void {
    this.scoreHUD.animateScoreIncrease(oldScore, newScore);
  }

  /**
   * Update layout for responsive design
   */
  public updateLayout(screenWidth?: number, screenHeight?: number): void {
    if (screenWidth !== undefined) {
      this.screenWidth = screenWidth;
    }
    if (screenHeight !== undefined) {
      this.screenHeight = screenHeight;
    }

    // Update score HUD layout (top-left)
    this.scoreHUD.updateLayout(this.screenWidth, this.screenHeight);
    
    // Update booster HUD layout (top-right)
    this.boosterHUD.updateLayout(this.screenWidth, this.screenHeight);
  }

  /**
   * Set visibility of all HUD elements
   */
  public setVisible(visible: boolean): void {
    this.scoreHUD.setVisible(visible);
    this.boosterHUD.setVisible(visible);
  }

  /**
   * Handle turn completion with score animation
   */
  public handleTurnComplete(scoreBreakdown: ScoreBreakdown): void {
    const oldScore = this.scoreManager.getTotalScore() - scoreBreakdown.totalScore;
    const newScore = this.scoreManager.getTotalScore();
    
    // Animate score increase
    this.animateScoreIncrease(oldScore, newScore);
    
    // Show breakdown if significant score
    if (scoreBreakdown.totalScore > 100) {
      this.showScoreBreakdown(scoreBreakdown);
    }
  }

  /**
   * Handle level up event
   */
  public handleLevelUp(newLevel: number): void {
    this.setLevel(newLevel);
    
    // Create level up animation
    this.createLevelUpAnimation(newLevel);
  }

  /**
   * Create level up animation
   */
  private createLevelUpAnimation(level: number): void {
    // Create level up text
    const levelUpText = this.scene.add.text(
      this.screenWidth / 2,
      this.screenHeight / 2,
      `LEVEL ${level}!`,
      {
        fontFamily: 'Arial Black',
        fontSize: 48,
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5, 0.5).setDepth(2000);

    // Animate level up text
    levelUpText.setScale(0);
    
    this.scene.tweens.add({
      targets: levelUpText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.scene.tweens.add({
          targets: levelUpText,
          alpha: 0,
          duration: 500,
          delay: 1000,
          onComplete: () => {
            levelUpText.destroy();
          }
        });
      }
    });
  }

  /**
   * Handle game over event
   */
  public handleGameOver(): void {
    // Show final statistics
    this.showStatistics();
    
    // Create game over animation
    this.createGameOverAnimation();
  }

  /**
   * Create game over animation
   */
  private createGameOverAnimation(): void {
    const stats = this.scoreManager.getScoreStatistics();
    
    // Create game over text
    const gameOverText = this.scene.add.text(
      this.screenWidth / 2,
      this.screenHeight / 2 - 50,
      'GAME OVER',
      {
        fontFamily: 'Arial Black',
        fontSize: 36,
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5, 0.5).setDepth(2000);

    // Create final score text
    const finalScoreText = this.scene.add.text(
      this.screenWidth / 2,
      this.screenHeight / 2 + 10,
      `Final Score: ${ScoreManager.formatScore(stats.totalScore)}`,
      {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5).setDepth(2000);

    // Animate game over elements
    gameOverText.setAlpha(0);
    finalScoreText.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [gameOverText, finalScoreText],
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });
  }

  /**
   * Reset HUD for new game
   */
  public resetForNewGame(): void {
    this.hideScoreBreakdown();
    this.hideStatistics();
    this.setLevel(1);
  }

  /**
   * Get score HUD reference
   */
  public getScoreHUD(): ScoreHUD {
    return this.scoreHUD;
  }

  /**
   * Get booster HUD reference
   */
  public getBoosterHUD(): BoosterHUD {
    return this.boosterHUD;
  }

  /**
   * Destroy all HUD elements
   */
  public destroy(): void {
    this.scoreHUD.destroy();
    this.boosterHUD.destroy();
  }
}
