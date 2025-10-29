import * as Phaser from 'phaser';
import { GameMode, ScoreBreakdown } from '../../../shared/types/game';
import { RedditScoreSubmissionRequest, RedditScoreSubmissionResponse } from '../../../shared/types/api';
import Logger from '../../utils/Logger';
import FontLoader from '../../utils/FontLoader';
import { audioHandler } from '../services/AudioHandler';

export interface GameEndData {
  score: number;
  level: number;
  mode: GameMode;
  breakdown: ScoreBreakdown;
  timestamp: number; // When the score was achieved
}

export interface ScoreSubmissionCallbacks {
  onSubmit: (data: RedditScoreSubmissionRequest) => Promise<RedditScoreSubmissionResponse>;
  onCancel: () => void;
  onContinue: () => void;
}

export class ScoreSubmissionUI {
  private scene: Phaser.Scene;
  private callbacks: ScoreSubmissionCallbacks;
  private gameEndData: GameEndData;
  
  // UI Elements
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private scoreDisplay: Phaser.GameObjects.Text;
  private difficultyDisplay: Phaser.GameObjects.Text;
  private timestampDisplay: Phaser.GameObjects.Text;
  private breakdownDisplay: Phaser.GameObjects.Text;
  
  // Reddit posting option
  private shareToRedditCheckbox: Phaser.GameObjects.Container;
  private checkboxBackground: Phaser.GameObjects.Graphics;
  private checkboxCheck: Phaser.GameObjects.Graphics;
  private checkboxLabel: Phaser.GameObjects.Text;
  private shareToReddit: boolean = false;
  
  // Buttons
  private submitButton: Phaser.GameObjects.Container;
  private submitButtonBg: Phaser.GameObjects.Graphics;
  private submitButtonText: Phaser.GameObjects.Text;
  
  private continueButton: Phaser.GameObjects.Container;
  private continueButtonBg: Phaser.GameObjects.Graphics;
  private continueButtonText: Phaser.GameObjects.Text;
  
  // Status display
  private statusText: Phaser.GameObjects.Text;
  private isSubmitting: boolean = false;

  constructor(scene: Phaser.Scene, gameEndData: GameEndData, callbacks: ScoreSubmissionCallbacks) {
    this.scene = scene;
    this.gameEndData = gameEndData;
    this.callbacks = callbacks;
    
    // Create main container
    this.container = scene.add.container(0, 0);
    
    this.createUI();
    this.setupInteractions();
    
    Logger.log('ScoreSubmissionUI: Created with score submission interface');
  }

  private createUI(): void {
    const { width, height } = this.scene.scale;
    
    // Semi-transparent background overlay
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRect(0, 0, width, height);
    this.container.add(this.background);
    
    // Main dialog background
    const dialogWidth = Math.min(600, width * 0.9);
    const dialogHeight = Math.min(500, height * 0.8);
    const dialogX = (width - dialogWidth) / 2;
    const dialogY = (height - dialogHeight) / 2;
    
    const dialogBg = this.scene.add.graphics();
    dialogBg.fillStyle(0x1a1a2e, 1);
    dialogBg.lineStyle(2, 0x00ff88, 1);
    dialogBg.fillRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, 10);
    dialogBg.strokeRoundedRect(dialogX, dialogY, dialogWidth, dialogHeight, 10);
    this.container.add(dialogBg);
    
    // Title
    this.titleText = this.scene.add.text(width / 2, dialogY + 30, 'Game Complete!', {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(this.titleText);
    
    // Score display
    this.scoreDisplay = this.scene.add.text(width / 2, dialogY + 80, `Final Score: ${this.gameEndData.score.toLocaleString()}`, {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.container.add(this.scoreDisplay);
    
    // Difficulty display
    const difficultyText = this.gameEndData.mode.charAt(0).toUpperCase() + this.gameEndData.mode.slice(1);
    this.difficultyDisplay = this.scene.add.text(width / 2, dialogY + 110, `Difficulty: ${difficultyText}`, {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '20px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.container.add(this.difficultyDisplay);
    
    // Timestamp display
    const achievedTime = new Date(this.gameEndData.timestamp);
    const timeString = achievedTime.toLocaleString();
    this.timestampDisplay = this.scene.add.text(width / 2, dialogY + 140, `Achieved: ${timeString}`, {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '16px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.container.add(this.timestampDisplay);
    
    // Score breakdown
    const breakdown = this.gameEndData.breakdown;
    const breakdownText = `Base: ${breakdown.baseScore} | Chain: ${breakdown.chainMultiplier}x | Combo: ${breakdown.ultimateComboMultiplier}x | Boosters: +${breakdown.boosterModifiers}`;
    this.breakdownDisplay = this.scene.add.text(width / 2, dialogY + 170, breakdownText, {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '14px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.container.add(this.breakdownDisplay);
    
    // Reddit sharing checkbox
    this.createRedditCheckbox(width / 2, dialogY + 220);
    
    // Buttons (both on same level now)
    this.createButtons(width / 2, dialogY + 280, dialogY + 280);
    
    // Status text (initially hidden)
    this.statusText = this.scene.add.text(width / 2, dialogY + 380, '', {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5).setVisible(false);
    this.container.add(this.statusText);
  }

  private createRedditCheckbox(x: number, y: number): void {
    this.shareToRedditCheckbox = this.scene.add.container(x, y);
    
    // Checkbox background
    this.checkboxBackground = this.scene.add.graphics();
    this.checkboxBackground.lineStyle(2, 0x00ff88, 1);
    this.checkboxBackground.fillStyle(0x333333, 1);
    this.checkboxBackground.fillRect(-10, -10, 20, 20);
    this.checkboxBackground.strokeRect(-10, -10, 20, 20);
    this.shareToRedditCheckbox.add(this.checkboxBackground);
    
    // Checkmark (initially hidden)
    this.checkboxCheck = this.scene.add.graphics();
    this.checkboxCheck.lineStyle(3, 0x00ff88, 1);
    this.checkboxCheck.beginPath();
    this.checkboxCheck.moveTo(-6, -2);
    this.checkboxCheck.lineTo(-2, 2);
    this.checkboxCheck.lineTo(6, -6);
    this.checkboxCheck.strokePath();
    this.checkboxCheck.setVisible(false);
    this.shareToRedditCheckbox.add(this.checkboxCheck);
    
    // Label
    this.checkboxLabel = this.scene.add.text(25, 0, 'Share score to Reddit', {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0, 0.5);
    this.shareToRedditCheckbox.add(this.checkboxLabel);
    
    this.container.add(this.shareToRedditCheckbox);
  }

  private createButtons(centerX: number, submitY: number, _continueY: number): void {
    // Calculate button spacing for even distribution
    const buttonSpacing = 100; // Distance between button centers
    
    // Both buttons on the same Y level (use submitY for both)
    const buttonY = submitY;
    
    // Submit button (left)
    this.submitButton = this.scene.add.container(centerX - buttonSpacing / 2, buttonY);
    
    this.submitButtonBg = this.scene.add.graphics();
    this.submitButtonBg.fillStyle(0x00aa00, 1);
    this.submitButtonBg.lineStyle(2, 0x00ff88, 1);
    this.submitButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
    this.submitButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
    this.submitButton.add(this.submitButtonBg);
    
    this.submitButtonText = this.scene.add.text(0, 0, 'Submit Score', {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.submitButton.add(this.submitButtonText);
    
    this.container.add(this.submitButton);
    
    // Continue button (right)
    this.continueButton = this.scene.add.container(centerX + buttonSpacing / 2, buttonY);
    
    this.continueButtonBg = this.scene.add.graphics();
    this.continueButtonBg.fillStyle(0x666666, 1);
    this.continueButtonBg.lineStyle(2, 0x888888, 1);
    this.continueButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
    this.continueButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
    this.continueButton.add(this.continueButtonBg);
    
    this.continueButtonText = this.scene.add.text(0, 0, 'Continue', {
      fontFamily: FontLoader.createFontFamily('Asimovian'),
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.continueButton.add(this.continueButtonText);
    
    this.container.add(this.continueButton);
  }

  private setupInteractions(): void {
    // Checkbox interaction
    this.shareToRedditCheckbox.setInteractive(
      new Phaser.Geom.Rectangle(-15, -15, 200, 30),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.shareToRedditCheckbox.on('pointerdown', () => {
      this.toggleRedditSharing();
    });
    
    this.shareToRedditCheckbox.on('pointerover', () => {
      this.checkboxBackground.clear();
      this.checkboxBackground.lineStyle(2, 0x00ff88, 1);
      this.checkboxBackground.fillStyle(0x444444, 1);
      this.checkboxBackground.fillRect(-10, -10, 20, 20);
      this.checkboxBackground.strokeRect(-10, -10, 20, 20);
    });
    
    this.shareToRedditCheckbox.on('pointerout', () => {
      this.checkboxBackground.clear();
      this.checkboxBackground.lineStyle(2, 0x00ff88, 1);
      this.checkboxBackground.fillStyle(0x333333, 1);
      this.checkboxBackground.fillRect(-10, -10, 20, 20);
      this.checkboxBackground.strokeRect(-10, -10, 20, 20);
    });
    
    // Submit button interaction
    this.submitButton.setInteractive(
      new Phaser.Geom.Rectangle(-60, -20, 120, 40),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.submitButton.on('pointerdown', () => {
      if (!this.isSubmitting) {
        this.handleSubmit();
      }
    });
    
    this.submitButton.on('pointerover', () => {
      if (!this.isSubmitting) {
        this.submitButtonBg.clear();
        this.submitButtonBg.fillStyle(0x00cc00, 1);
        this.submitButtonBg.lineStyle(2, 0x00ff88, 1);
        this.submitButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
        this.submitButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
      }
    });
    
    this.submitButton.on('pointerout', () => {
      if (!this.isSubmitting) {
        this.submitButtonBg.clear();
        this.submitButtonBg.fillStyle(0x00aa00, 1);
        this.submitButtonBg.lineStyle(2, 0x00ff88, 1);
        this.submitButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
        this.submitButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
      }
    });
    
    // Continue button interaction
    this.continueButton.setInteractive(
      new Phaser.Geom.Rectangle(-60, -20, 120, 40),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.continueButton.on('pointerdown', () => {
      if (!this.isSubmitting) {
        this.handleContinue();
      }
    });
    
    this.continueButton.on('pointerover', () => {
      if (!this.isSubmitting) {
        this.continueButtonBg.clear();
        this.continueButtonBg.fillStyle(0x888888, 1);
        this.continueButtonBg.lineStyle(2, 0xaaaaaa, 1);
        this.continueButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
        this.continueButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
      }
    });
    
    this.continueButton.on('pointerout', () => {
      if (!this.isSubmitting) {
        this.continueButtonBg.clear();
        this.continueButtonBg.fillStyle(0x666666, 1);
        this.continueButtonBg.lineStyle(2, 0x888888, 1);
        this.continueButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
        this.continueButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
      }
    });
  }

  private toggleRedditSharing(): void {
    try {
      audioHandler.playSound('menu-select');
    } catch (error) {
      Logger.log(`ScoreSubmissionUI: Failed to play checkbox sound - ${error}`);
    }
    
    this.shareToReddit = !this.shareToReddit;
    this.checkboxCheck.setVisible(this.shareToReddit);
    
    Logger.log(`ScoreSubmissionUI: Reddit sharing ${this.shareToReddit ? 'enabled' : 'disabled'}`);
  }

  private async handleSubmit(): Promise<void> {
    try {
      audioHandler.playSound('menu-select');
    } catch (error) {
      Logger.log(`ScoreSubmissionUI: Failed to play submit sound - ${error}`);
    }
    
    this.isSubmitting = true;
    this.updateSubmitButtonState(true);
    this.showStatus('Submitting score...', '#ffff00');
    
    const submissionData: RedditScoreSubmissionRequest = {
      score: this.gameEndData.score,
      level: this.gameEndData.level,
      mode: this.gameEndData.mode,
      breakdown: this.gameEndData.breakdown,
      timestamp: this.gameEndData.timestamp,
      createPost: this.shareToReddit
    };
    
    try {
      const response = await this.callbacks.onSubmit(submissionData);
      
      if (response.success) {
        let message = 'Score submitted successfully!';
        if (response.leaderboardPosition) {
          message += ` Rank: #${response.leaderboardPosition}`;
        }
        if (response.redditPostUrl && this.shareToReddit) {
          message += ' Posted to Reddit!';
        }
        
        this.showStatus(message, '#00ff00');
        
        // Auto-continue after successful submission
        setTimeout(() => {
          this.handleContinue();
        }, 2000);
      } else {
        this.showStatus(response.message || 'Submission failed', '#ff0000');
        this.isSubmitting = false;
        this.updateSubmitButtonState(false);
      }
    } catch (error) {
      Logger.log(`ScoreSubmissionUI: Submission error - ${error}`);
      this.showStatus('Network error. Please try again.', '#ff0000');
      this.isSubmitting = false;
      this.updateSubmitButtonState(false);
    }
  }

  private handleContinue(): void {
    try {
      audioHandler.playSound('menu-select');
    } catch (error) {
      Logger.log(`ScoreSubmissionUI: Failed to play continue sound - ${error}`);
    }
    
    this.callbacks.onContinue();
  }

  private updateSubmitButtonState(submitting: boolean): void {
    if (submitting) {
      this.submitButtonText.setText('Submitting...');
      this.submitButtonBg.clear();
      this.submitButtonBg.fillStyle(0x666666, 1);
      this.submitButtonBg.lineStyle(2, 0x888888, 1);
      this.submitButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
      this.submitButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
    } else {
      this.submitButtonText.setText('Submit Score');
      this.submitButtonBg.clear();
      this.submitButtonBg.fillStyle(0x00aa00, 1);
      this.submitButtonBg.lineStyle(2, 0x00ff88, 1);
      this.submitButtonBg.fillRoundedRect(-60, -20, 120, 40, 5);
      this.submitButtonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
    }
  }

  private showStatus(message: string, color: string): void {
    this.statusText.setText(message);
    this.statusText.setColor(color);
    this.statusText.setVisible(true);
  }

  public destroy(): void {
    Logger.log('ScoreSubmissionUI: Destroyed');
    if (this.container) {
      this.container.destroy();
    }
  }
}
