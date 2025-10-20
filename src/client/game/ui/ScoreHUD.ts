import { ScoreManager, ScoreStatistics } from '../models/ScoreManager.js';
import { ScoreBreakdown } from '../../../shared/types/game.js';

/**
 * HUD component for displaying score information and breakdown
 * Shows current score, recent breakdown, and statistics
 */
export class ScoreHUD {
  private scene: Phaser.Scene;
  private scoreManager: ScoreManager;
  private container: Phaser.GameObjects.Container;
  
  // Main score display
  private scoreText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  
  // Score breakdown display
  private breakdownContainer: Phaser.GameObjects.Container;
  private breakdownBackground: Phaser.GameObjects.Rectangle;
  private breakdownTitle: Phaser.GameObjects.Text;
  private breakdownDetails: Phaser.GameObjects.Text[];
  
  // Statistics display
  private statsContainer: Phaser.GameObjects.Container;
  private statsBackground: Phaser.GameObjects.Rectangle;
  private statsText: Phaser.GameObjects.Text[];
  
  // Animation state
  private isShowingBreakdown: boolean = false;
  private breakdownTimer: Phaser.Time.TimerEvent | null = null;
  
  // Layout configuration
  private width: number = 300;
  private currentLevel: number = 1;

  constructor(scene: Phaser.Scene, scoreManager: ScoreManager, x: number = 20, y: number = 20) {
    this.scene = scene;
    this.scoreManager = scoreManager;

    this.container = scene.add.container(x, y);
    this.container.setDepth(1000); // Ensure HUD is on top
    
    this.breakdownDetails = [];
    this.statsText = [];

    this.createMainScoreDisplay();
    this.createBreakdownDisplay();
    this.createStatsDisplay();
    
    this.update();
  }

  /**
   * Create the main score and level display
   */
  private createMainScoreDisplay(): void {
    // Score background
    const scoreBg = this.scene.add.rectangle(0, 0, this.width, 80, 0x000000, 0.8);
    scoreBg.setStrokeStyle(2, 0x00ff00);
    scoreBg.setOrigin(0, 0);

    // Score text
    this.scoreText = this.scene.add.text(this.width / 2, 25, 'Score: 0', {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#00ff00'
    }).setOrigin(0.5, 0.5);

    // Level text
    this.levelText = this.scene.add.text(this.width / 2, 55, 'Level: 1', {
      fontFamily: 'Arial',
      fontSize: 16,
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    this.container.add([scoreBg, this.scoreText, this.levelText]);
  }

  /**
   * Create the score breakdown display (initially hidden)
   */
  private createBreakdownDisplay(): void {
    this.breakdownContainer = this.scene.add.container(0, 90);
    
    // Background
    this.breakdownBackground = this.scene.add.rectangle(0, 0, this.width, 120, 0x000033, 0.9);
    this.breakdownBackground.setStrokeStyle(2, 0x0066ff);
    this.breakdownBackground.setOrigin(0, 0);

    // Title
    this.breakdownTitle = this.scene.add.text(this.width / 2, 15, 'Score Breakdown', {
      fontFamily: 'Arial Black',
      fontSize: 16,
      color: '#0066ff'
    }).setOrigin(0.5, 0.5);

    this.breakdownContainer.add([this.breakdownBackground, this.breakdownTitle]);
    this.breakdownContainer.setVisible(false);
    this.container.add(this.breakdownContainer);
  }

  /**
   * Create the statistics display (initially hidden)
   */
  private createStatsDisplay(): void {
    this.statsContainer = this.scene.add.container(0, 220);
    
    // Background
    this.statsBackground = this.scene.add.rectangle(0, 0, this.width, 100, 0x330000, 0.9);
    this.statsBackground.setStrokeStyle(2, 0xff6600);
    this.statsBackground.setOrigin(0, 0);

    // Title
    const statsTitle = this.scene.add.text(this.width / 2, 15, 'Statistics', {
      fontFamily: 'Arial Black',
      fontSize: 16,
      color: '#ff6600'
    }).setOrigin(0.5, 0.5);

    this.statsContainer.add([this.statsBackground, statsTitle]);
    this.statsContainer.setVisible(false);
    this.container.add(this.statsContainer);
  }

  /**
   * Update the HUD display
   */
  public update(): void {
    this.updateMainScore();
    this.updateBreakdownIfVisible();
    this.updateStatsIfVisible();
  }

  /**
   * Update the main score display
   */
  private updateMainScore(): void {
    const totalScore = this.scoreManager.getTotalScore();
    this.scoreText.setText(`Score: ${ScoreManager.formatScore(totalScore)}`);
    this.levelText.setText(`Level: ${this.currentLevel}`);
  }

  /**
   * Show score breakdown with animation
   */
  public showScoreBreakdown(breakdown: ScoreBreakdown, duration: number = 3000): void {
    if (this.isShowingBreakdown) {
      this.hideScoreBreakdown();
    }

    this.isShowingBreakdown = true;
    
    // Clear existing breakdown details
    this.clearBreakdownDetails();
    
    // Create breakdown text elements
    this.createBreakdownText(breakdown);
    
    // Show with animation
    this.breakdownContainer.setVisible(true);
    this.breakdownContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.breakdownContainer,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Auto-hide after duration
    if (this.breakdownTimer) {
      this.breakdownTimer.destroy();
    }
    
    this.breakdownTimer = this.scene.time.delayedCall(duration, () => {
      this.hideScoreBreakdown();
    });
  }

  /**
   * Hide score breakdown with animation
   */
  public hideScoreBreakdown(): void {
    if (!this.isShowingBreakdown) return;

    this.scene.tweens.add({
      targets: this.breakdownContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.breakdownContainer.setVisible(false);
        this.isShowingBreakdown = false;
      }
    });

    if (this.breakdownTimer) {
      this.breakdownTimer.destroy();
      this.breakdownTimer = null;
    }
  }

  /**
   * Create breakdown text elements
   */
  private createBreakdownText(breakdown: ScoreBreakdown): void {
    const lines: string[] = [];
    
    lines.push(`Base Score: ${ScoreManager.formatScore(breakdown.baseScore)}`);
    
    if (breakdown.chainMultiplier > 0) {
      lines.push(`Chain Multiplier: x${breakdown.chainMultiplier}`);
    }
    
    if (breakdown.ultimateComboMultiplier > 1) {
      lines.push(`Ultimate Combo: x${breakdown.ultimateComboMultiplier}`);
    }
    
    if (breakdown.boosterModifiers !== 1) {
      lines.push(`Booster Effects: x${breakdown.boosterModifiers.toFixed(1)}`);
    }
    
    lines.push(`Total: ${ScoreManager.formatScore(breakdown.totalScore)}`);

    // Create text objects
    lines.forEach((line, index) => {
      const text = this.scene.add.text(10, 35 + (index * 16), line, {
        fontFamily: 'Arial',
        fontSize: 14,
        color: index === lines.length - 1 ? '#00ff00' : '#ffffff'
      });
      
      this.breakdownDetails.push(text);
      this.breakdownContainer.add(text);
    });

    // Adjust background height based on content
    const contentHeight = 50 + (lines.length * 16);
    this.breakdownBackground.setSize(this.width, contentHeight);
  }

  /**
   * Clear existing breakdown details
   */
  private clearBreakdownDetails(): void {
    this.breakdownDetails.forEach(text => {
      this.breakdownContainer.remove(text);
      text.destroy();
    });
    this.breakdownDetails = [];
  }

  /**
   * Update breakdown display if visible
   */
  private updateBreakdownIfVisible(): void {
    if (!this.isShowingBreakdown) return;
    
    const recentBreakdown = this.scoreManager.getRecentScoreBreakdown();
    if (recentBreakdown) {
      this.clearBreakdownDetails();
      this.createBreakdownText(recentBreakdown);
    }
  }

  /**
   * Show statistics display
   */
  public showStatistics(): void {
    const stats = this.scoreManager.getScoreStatistics();
    
    // Clear existing stats
    this.clearStatsText();
    
    // Create stats text
    this.createStatsText(stats);
    
    // Show with animation
    this.statsContainer.setVisible(true);
    this.statsContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.statsContainer,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  /**
   * Hide statistics display
   */
  public hideStatistics(): void {
    this.scene.tweens.add({
      targets: this.statsContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.statsContainer.setVisible(false);
      }
    });
  }

  /**
   * Create statistics text elements
   */
  private createStatsText(stats: ScoreStatistics): void {
    const lines: string[] = [
      `Highest Turn: ${ScoreManager.formatScore(stats.highestSingleTurn)}`,
      `Longest Chain: ${stats.longestChain}`,
      `Average Turn: ${ScoreManager.formatScore(stats.averageTurnScore)}`,
      `Total Turns: ${stats.totalTurns}`
    ];

    lines.forEach((line, index) => {
      const text = this.scene.add.text(10, 35 + (index * 16), line, {
        fontFamily: 'Arial',
        fontSize: 12,
        color: '#ffffff'
      });
      
      this.statsText.push(text);
      this.statsContainer.add(text);
    });
  }

  /**
   * Clear existing stats text
   */
  private clearStatsText(): void {
    this.statsText.forEach(text => {
      this.statsContainer.remove(text);
      text.destroy();
    });
    this.statsText = [];
  }

  /**
   * Update stats display if visible
   */
  private updateStatsIfVisible(): void {
    if (!this.statsContainer.visible) return;
    
    const stats = this.scoreManager.getScoreStatistics();
    this.clearStatsText();
    this.createStatsText(stats);
  }

  /**
   * Set current level for display
   */
  public setLevel(level: number): void {
    this.currentLevel = level;
    this.updateMainScore();
  }

  /**
   * Animate score increase
   */
  public animateScoreIncrease(oldScore: number, newScore: number): void {
    const scoreDiff = newScore - oldScore;
    
    if (scoreDiff <= 0) return;

    // Create floating score text
    const floatingText = this.scene.add.text(
      this.width / 2, 
      25, 
      `+${ScoreManager.formatScore(scoreDiff)}`, 
      {
        fontFamily: 'Arial Black',
        fontSize: 20,
        color: '#ffff00'
      }
    ).setOrigin(0.5, 0.5);

    this.container.add(floatingText);

    // Animate floating text
    this.scene.tweens.add({
      targets: floatingText,
      y: -20,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.container.remove(floatingText);
        floatingText.destroy();
      }
    });

    // Animate main score counter
    const startScore = oldScore;
    const endScore = newScore;
    const duration = Math.min(1000, Math.max(300, scoreDiff / 100));

    this.scene.tweens.addCounter({
      from: startScore,
      to: endScore,
      duration: duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        const currentScore = Math.floor(tween.getValue());
        this.scoreText.setText(`Score: ${ScoreManager.formatScore(currentScore)}`);
      }
    });
  }

  /**
   * Set the position of the HUD
   */
  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Set the visibility of the HUD
   */
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Update layout for responsive design
   */
  public updateLayout(screenWidth: number, _screenHeight: number): void {
    // Keep score HUD in top-left corner
    const hudX = 20;
    const hudY = 20;
    this.setPosition(hudX, hudY);
    
    // Adjust width based on screen size
    if (screenWidth < 600) {
      this.width = Math.min(280, screenWidth - 40);
    } else {
      this.width = 300;
    }
  }

  /**
   * Destroy the HUD
   */
  public destroy(): void {
    if (this.breakdownTimer) {
      this.breakdownTimer.destroy();
    }
    
    this.clearBreakdownDetails();
    this.clearStatsText();
    this.container.destroy();
  }
}
