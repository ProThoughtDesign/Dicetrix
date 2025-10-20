import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AudioManager, AudioEvents } from '../audio/index.js';
import { ApiService } from '../services/ApiService.js';
import { 
  GameMode, 
  ScoreBreakdown 
} from '../../../shared/types/game.js';
import { 
  ScoreSubmissionResponse, 
  LeaderboardResponse, 
  LeaderboardEntry 
} from '../../../shared/types/api.js';
import { ProgressionSystem, ProgressionData } from '../systems/ProgressionSystem.js';

interface GameOverData {
  score: number;
  level: number;
  mode: GameMode;
  breakdown: ScoreBreakdown;
  scoreSubmission?: ScoreSubmissionResponse;
  leaderboardData?: LeaderboardResponse;
  isNewHighScore?: boolean;
  leaderboardPosition?: number;
  error?: string;
  newlyUnlockedModes?: GameMode[];
  progressionData?: ProgressionData;
}

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  
  // Audio system
  private audioManager: AudioManager;
  private audioEvents: AudioEvents;
  
  // Game data
  private gameData: GameOverData;
  
  // UI elements
  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private modeText: Phaser.GameObjects.Text;
  private highScoreText: Phaser.GameObjects.Text;
  private positionText: Phaser.GameObjects.Text;
  private breakdownText: Phaser.GameObjects.Text;
  private errorText: Phaser.GameObjects.Text;
  
  // Leaderboard UI
  private leaderboardTitle: Phaser.GameObjects.Text;
  private leaderboardEntries: Phaser.GameObjects.Text[] = [];
  
  // Buttons
  private shareButton: Phaser.GameObjects.Text;
  private playAgainButton: Phaser.GameObjects.Text;
  private mainMenuButton: Phaser.GameObjects.Text;
  
  // Loading state
  private isLoading: boolean = false;

  constructor() {
    super('GameOver');
  }

  init(data: GameOverData) {
    this.gameData = data;
  }

  create() {
    // Initialize audio system
    this.audioManager = new AudioManager(this);
    this.audioEvents = new AudioEvents(this.audioManager);
    this.audioManager.initialize();
    
    // Stop game music and play game over sound
    this.audioManager.stopMusic();

    // Configure camera
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x1a1a2e);

    // Background
    this.background = this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.3);

    this.createUI();
    this.updateLayout(this.scale.width, this.scale.height);

    // Update layout on canvas resize / orientation change
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.updateLayout(width, height);
    });
  }

  private createUI(): void {
    const { width, height } = this.scale;
    
    // Title
    this.titleText = this.add.text(width / 2, 60, 'Game Over', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);

    // Score information
    this.scoreText = this.add.text(width / 2, 120, `Final Score: ${this.gameData.score.toLocaleString()}`, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5);

    this.levelText = this.add.text(width / 2, 160, `Level Reached: ${this.gameData.level}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    const modeDisplayName = this.gameData.mode.charAt(0).toUpperCase() + this.gameData.mode.slice(1);
    this.modeText = this.add.text(width / 2, 190, `Mode: ${modeDisplayName}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // High score indicator
    if (this.gameData.isNewHighScore) {
      this.highScoreText = this.add.text(width / 2, 220, '🎉 NEW PERSONAL BEST! 🎉', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5);
    }

    // Progression notifications
    this.createProgressionNotifications();

    // Leaderboard position
    if (this.gameData.leaderboardPosition) {
      this.positionText = this.add.text(width / 2, this.gameData.isNewHighScore ? 250 : 220, 
        `Leaderboard Position: #${this.gameData.leaderboardPosition}`, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffff00',
        align: 'center',
      }).setOrigin(0.5);
    }

    // Score breakdown
    this.createScoreBreakdown();

    // Error message if any
    if (this.gameData.error) {
      this.errorText = this.add.text(width / 2, height - 200, `⚠️ ${this.gameData.error}`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ff6b6b',
        align: 'center',
      }).setOrigin(0.5);
    }

    // Leaderboard
    this.createLeaderboard();

    // Buttons
    this.createButtons();
  }

  private createProgressionNotifications(): void {
    const { width } = this.scale;
    
    // Show newly unlocked modes
    if (this.gameData.newlyUnlockedModes && this.gameData.newlyUnlockedModes.length > 0) {
      let yPos = this.gameData.isNewHighScore ? 260 : 230;
      
      this.gameData.newlyUnlockedModes.forEach((mode, index) => {
        const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
        const unlockText = this.add.text(width / 2, yPos + (index * 25), 
          `🔓 ${modeDisplayName} Mode Unlocked!`, {
          fontFamily: 'Arial Black',
          fontSize: '20px',
          color: '#00ff88',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center',
        }).setOrigin(0.5);
        
        // Add unlock animation
        unlockText.setScale(0);
        this.tweens.add({
          targets: unlockText,
          scale: 1,
          duration: 500,
          delay: index * 200,
          ease: 'Back.easeOut'
        });
      });
    }
  }

  private createScoreBreakdown(): void {
    const { width } = this.scale;
    const breakdown = this.gameData.breakdown;
    
    let yPos = this.gameData.leaderboardPosition ? 280 : 250;
    if (this.gameData.isNewHighScore) yPos += 30;
    
    // Adjust for progression notifications
    if (this.gameData.newlyUnlockedModes && this.gameData.newlyUnlockedModes.length > 0) {
      yPos += this.gameData.newlyUnlockedModes.length * 25 + 20;
    }

    const breakdownLines = [
      `Base Score: ${breakdown.baseScore.toLocaleString()}`,
      `Chain Multiplier: x${breakdown.chainMultiplier}`,
    ];

    if (breakdown.ultimateComboMultiplier > 1) {
      breakdownLines.push(`Ultimate Combo: x${breakdown.ultimateComboMultiplier}`);
    }

    if (breakdown.boosterModifiers > 0) {
      breakdownLines.push(`Booster Bonus: +${breakdown.boosterModifiers.toLocaleString()}`);
    }

    this.breakdownText = this.add.text(width / 2, yPos, breakdownLines.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cccccc',
      align: 'center',
    }).setOrigin(0.5);
  }

  private createLeaderboard(): void {
    const { width } = this.scale;
    let yPos = 350;

    this.leaderboardTitle = this.add.text(width / 2, yPos, 'Leaderboard', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5);

    yPos += 40;

    if (this.gameData.leaderboardData && this.gameData.leaderboardData.entries.length > 0) {
      const entries = this.gameData.leaderboardData.entries.slice(0, 5); // Show top 5
      
      entries.forEach((entry: LeaderboardEntry, index: number) => {
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        const entryText = `${medal} ${entry.username}: ${entry.score.toLocaleString()}`;
        
        const entryElement = this.add.text(width / 2, yPos, entryText, {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: position <= 3 ? '#ffd700' : '#ffffff',
          align: 'center',
        }).setOrigin(0.5);
        
        this.leaderboardEntries.push(entryElement);
        yPos += 25;
      });
    } else if (this.gameData.error) {
      const noDataText = this.add.text(width / 2, yPos, 'Leaderboard unavailable', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#888888',
        align: 'center',
      }).setOrigin(0.5);
      this.leaderboardEntries.push(noDataText);
    } else {
      const loadingText = this.add.text(width / 2, yPos, 'Loading leaderboard...', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#888888',
        align: 'center',
      }).setOrigin(0.5);
      this.leaderboardEntries.push(loadingText);
    }
  }

  private createButtons(): void {
    const { width, height } = this.scale;
    const buttonY = height - 120;
    const buttonSpacing = 200;

    // Share Score button (only if no error)
    if (!this.gameData.error) {
      this.shareButton = this.add.text(width / 2 - buttonSpacing, buttonY, 'Share Score', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#4267B2',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.shareButton.setStyle({ backgroundColor: '#365899' }))
      .on('pointerout', () => this.shareButton.setStyle({ backgroundColor: '#4267B2' }))
      .on('pointerdown', () => this.handleShareScore());
    }

    // Play Again button
    this.playAgainButton = this.add.text(width / 2, buttonY, 'Play Again', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.playAgainButton.setStyle({ backgroundColor: '#218838' }))
    .on('pointerout', () => this.playAgainButton.setStyle({ backgroundColor: '#28a745' }))
    .on('pointerdown', () => {
      this.audioEvents.onMenuSelect();
      this.scene.start('Game');
    });

    // Main Menu button
    this.mainMenuButton = this.add.text(width / 2 + buttonSpacing, buttonY, 'Main Menu', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#6c757d',
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.mainMenuButton.setStyle({ backgroundColor: '#5a6268' }))
    .on('pointerout', () => this.mainMenuButton.setStyle({ backgroundColor: '#6c757d' }))
    .on('pointerdown', () => {
      this.audioEvents.onMenuSelect();
      this.scene.start('MainMenu');
    });
  }

  private async handleShareScore(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.shareButton.setText('Sharing...');
    this.shareButton.setStyle({ backgroundColor: '#888888' });

    try {
      const apiService = ApiService.getInstance();
      const shareResult = await apiService.shareScore({
        score: this.gameData.score,
        level: this.gameData.level,
        mode: this.gameData.mode,
        breakdown: this.gameData.breakdown
      });

      if (shareResult.success) {
        this.shareButton.setText('Shared!');
        this.shareButton.setStyle({ backgroundColor: '#28a745' });
        
        // Show success message
        const successText = this.add.text(this.scale.width / 2, this.scale.height - 80, 
          '✅ Score shared to subreddit!', {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#00ff00',
          align: 'center',
        }).setOrigin(0.5);

        // Remove success message after 3 seconds
        this.time.delayedCall(3000, () => {
          successText.destroy();
          this.shareButton.setText('Share Score');
          this.shareButton.setStyle({ backgroundColor: '#4267B2' });
          this.isLoading = false;
        });
      }
    } catch (error) {
      console.error('Failed to share score:', error);
      this.shareButton.setText('Share Failed');
      this.shareButton.setStyle({ backgroundColor: '#dc3545' });
      
      // Reset button after 2 seconds
      this.time.delayedCall(2000, () => {
        this.shareButton.setText('Share Score');
        this.shareButton.setStyle({ backgroundColor: '#4267B2' });
        this.isLoading = false;
      });
    }
  }

  private updateLayout(width: number, height: number): void {
    // Resize camera viewport to prevent black bars
    this.cameras.resize(width, height);

    // Stretch background to fill entire screen
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }

    // Compute scale factor for responsive design
    const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

    // Update positions of all UI elements
    if (this.titleText) {
      this.titleText.setPosition(width / 2, 60 * scaleFactor);
      this.titleText.setScale(scaleFactor);
    }

    if (this.scoreText) {
      this.scoreText.setPosition(width / 2, 120 * scaleFactor);
      this.scoreText.setScale(scaleFactor);
    }

    if (this.levelText) {
      this.levelText.setPosition(width / 2, 160 * scaleFactor);
      this.levelText.setScale(scaleFactor);
    }

    if (this.modeText) {
      this.modeText.setPosition(width / 2, 190 * scaleFactor);
      this.modeText.setScale(scaleFactor);
    }

    if (this.highScoreText) {
      this.highScoreText.setPosition(width / 2, 220 * scaleFactor);
      this.highScoreText.setScale(scaleFactor);
    }

    if (this.positionText) {
      this.positionText.setPosition(width / 2, (this.gameData.isNewHighScore ? 250 : 220) * scaleFactor);
      this.positionText.setScale(scaleFactor);
    }

    if (this.breakdownText) {
      let yPos = this.gameData.leaderboardPosition ? 280 : 250;
      if (this.gameData.isNewHighScore) yPos += 30;
      this.breakdownText.setPosition(width / 2, yPos * scaleFactor);
      this.breakdownText.setScale(scaleFactor);
    }

    if (this.leaderboardTitle) {
      this.leaderboardTitle.setPosition(width / 2, 350 * scaleFactor);
      this.leaderboardTitle.setScale(scaleFactor);
    }

    // Update leaderboard entries positions
    this.leaderboardEntries.forEach((entry, index) => {
      entry.setPosition(width / 2, (390 + index * 25) * scaleFactor);
      entry.setScale(scaleFactor);
    });

    // Update button positions
    const buttonY = height - 120 * scaleFactor;
    const buttonSpacing = 200 * scaleFactor;

    if (this.shareButton) {
      this.shareButton.setPosition(width / 2 - buttonSpacing, buttonY);
      this.shareButton.setScale(scaleFactor);
    }

    if (this.playAgainButton) {
      this.playAgainButton.setPosition(width / 2, buttonY);
      this.playAgainButton.setScale(scaleFactor);
    }

    if (this.mainMenuButton) {
      this.mainMenuButton.setPosition(width / 2 + buttonSpacing, buttonY);
      this.mainMenuButton.setScale(scaleFactor);
    }

    if (this.errorText) {
      this.errorText.setPosition(width / 2, height - 200 * scaleFactor);
      this.errorText.setScale(scaleFactor);
    }
  }
}
