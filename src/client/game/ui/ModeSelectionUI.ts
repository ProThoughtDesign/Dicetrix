import { Scene, GameObjects } from 'phaser';
import { GameMode } from '../../../shared/types/game.js';
import { GAME_MODES } from '../../../shared/config/game-modes.js';
import { AudioEvents } from '../audio/AudioEvents.js';

export interface ModeSelectionConfig {
  onModeSelect: (mode: GameMode) => void;
  currentMode: GameMode;
  unlockedModes: GameMode[];
}

/**
 * UI component for selecting game difficulty modes
 */
export class ModeSelectionUI {
  private scene: Scene;
  private config: ModeSelectionConfig;
  private audioEvents: AudioEvents | null = null;
  
  // UI elements
  private container: GameObjects.Container | null = null;
  private background: GameObjects.Rectangle | null = null;
  private titleText: GameObjects.Text | null = null;
  private modeButtons: Map<GameMode, GameObjects.Container> = new Map();
  private closeButton: GameObjects.Text | null = null;
  
  // Layout properties
  private isVisible: boolean = false;
  private width: number = 600;
  private height: number = 500;

  constructor(scene: Scene, config: ModeSelectionConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Set audio events for sound feedback
   */
  public setAudioEvents(audioEvents: AudioEvents): void {
    this.audioEvents = audioEvents;
  }

  /**
   * Create the mode selection UI
   */
  public create(): void {
    // Create main container
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    this.container.setDepth(1000); // Ensure it's on top

    // Create semi-transparent background overlay
    const overlay = this.scene.add.rectangle(0, 0, this.scene.scale.width * 2, this.scene.scale.height * 2, 0x000000, 0.7);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hide());
    this.container.add(overlay);

    // Create main background panel
    this.background = this.scene.add.rectangle(0, 0, this.width, this.height, 0x1a1a2e, 0.95);
    this.background.setStrokeStyle(3, 0x00ff88);
    this.container.add(this.background);

    // Create title
    this.titleText = this.scene.add.text(0, -this.height / 2 + 40, 'SELECT DIFFICULTY', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.container.add(this.titleText);

    // Create mode buttons
    this.createModeButtons();

    // Create close button
    this.closeButton = this.scene.add.text(this.width / 2 - 20, -this.height / 2 + 20, '✕', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      this.audioEvents?.onMenuHover();
      this.closeButton!.setStyle({ color: '#ff6666' });
    })
    .on('pointerout', () => {
      this.closeButton!.setStyle({ color: '#ff4444' });
    })
    .on('pointerdown', () => {
      this.audioEvents?.onMenuSelect();
      this.hide();
    });
    this.container.add(this.closeButton);

    // Update layout
    this.updateLayout(this.scene.scale.width, this.scene.scale.height);
  }

  /**
   * Create buttons for each game mode
   */
  private createModeButtons(): void {
    const modes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
    const buttonHeight = 60;
    const buttonSpacing = 70;
    const startY = -150;

    modes.forEach((mode, index) => {
      const modeConfig = GAME_MODES[mode];
      const isUnlocked = this.config.unlockedModes.includes(mode);
      const isCurrent = this.config.currentMode === mode;
      
      // Create button container
      const buttonContainer = this.scene.add.container(0, startY + index * buttonSpacing);
      
      // Button background
      const buttonBg = this.scene.add.rectangle(0, 0, this.width - 80, buttonHeight, 
        isCurrent ? 0x00ff88 : (isUnlocked ? 0x444444 : 0x222222), 
        isUnlocked ? 0.9 : 0.5
      );
      buttonBg.setStrokeStyle(2, isCurrent ? 0xffffff : (isUnlocked ? 0x666666 : 0x333333));
      buttonContainer.add(buttonBg);

      // Mode name and description
      const modeTitle = this.getModeTitle(mode);
      const modeDesc = this.getModeDescription(mode);
      
      const titleText = this.scene.add.text(-200, -10, modeTitle, {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: isCurrent ? '#000000' : (isUnlocked ? '#ffffff' : '#666666'),
        stroke: isCurrent ? '#ffffff' : '#000000',
        strokeThickness: isCurrent ? 2 : 1,
      }).setOrigin(0, 0.5);
      buttonContainer.add(titleText);

      const descText = this.scene.add.text(-200, 10, modeDesc, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: isCurrent ? '#000000' : (isUnlocked ? '#cccccc' : '#555555'),
      }).setOrigin(0, 0.5);
      buttonContainer.add(descText);

      // Difficulty indicators (dice icons)
      const difficultyLevel = this.getDifficultyLevel(mode);
      for (let i = 0; i < 5; i++) {
        const dieIcon = this.scene.add.text(150 + i * 25, 0, '⚀', {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: i < difficultyLevel ? '#ffd700' : '#333333',
        }).setOrigin(0.5);
        buttonContainer.add(dieIcon);
      }

      // Lock icon for locked modes
      if (!isUnlocked) {
        const lockIcon = this.scene.add.text(200, 0, '🔒', {
          fontFamily: 'Arial',
          fontSize: '20px',
        }).setOrigin(0.5);
        buttonContainer.add(lockIcon);
      }

      // Make button interactive if unlocked
      if (isUnlocked) {
        buttonBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            this.audioEvents?.onMenuHover();
            buttonBg.setFillStyle(isCurrent ? 0x00ff88 : 0x555555);
          })
          .on('pointerout', () => {
            buttonBg.setFillStyle(isCurrent ? 0x00ff88 : 0x444444);
          })
          .on('pointerdown', () => {
            this.audioEvents?.onMenuSelect();
            this.selectMode(mode);
          });
      }

      this.modeButtons.set(mode, buttonContainer);
      this.container!.add(buttonContainer);
    });
  }

  /**
   * Get display title for mode
   */
  private getModeTitle(mode: GameMode): string {
    const titles: Record<GameMode, string> = {
      easy: 'EASY',
      medium: 'MEDIUM',
      hard: 'HARD',
      expert: 'EXPERT',
      zen: 'ZEN'
    };
    return titles[mode];
  }

  /**
   * Get description for mode
   */
  private getModeDescription(mode: GameMode): string {
    const descriptions: Record<GameMode, string> = {
      easy: '4-6 sided dice, 3 colors, slower pace',
      medium: '4-10 sided dice, 4 colors, moderate pace',
      hard: '4-12 sided dice, 5 colors, black dice, faster pace',
      expert: '4-20 sided dice, 6 colors, more black dice, fastest pace',
      zen: 'Relaxed mode, no game over, unlimited time'
    };
    return descriptions[mode];
  }

  /**
   * Get difficulty level (1-5) for visual indicators
   */
  private getDifficultyLevel(mode: GameMode): number {
    const levels: Record<GameMode, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
      expert: 4,
      zen: 1
    };
    return levels[mode];
  }

  /**
   * Select a game mode
   */
  private selectMode(mode: GameMode): void {
    if (!this.config.unlockedModes.includes(mode)) {
      return;
    }

    this.config.currentMode = mode;
    this.config.onModeSelect(mode);
    this.hide();
  }

  /**
   * Show the mode selection UI
   */
  public show(): void {
    if (!this.container) {
      this.create();
    }
    
    this.isVisible = true;
    this.container!.setVisible(true);
    
    // Animate in
    this.container!.setScale(0.8);
    this.container!.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Hide the mode selection UI
   */
  public hide(): void {
    if (!this.container || !this.isVisible) {
      return;
    }

    this.scene.tweens.add({
      targets: this.container,
      scale: 0.8,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.isVisible = false;
        this.container!.setVisible(false);
      }
    });
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update layout for responsive design
   */
  public updateLayout(screenWidth: number, screenHeight: number): void {
    if (!this.container) {
      return;
    }

    // Position container at screen center
    this.container.setPosition(screenWidth / 2, screenHeight / 2);

    // Adjust size for smaller screens
    const scale = Math.min(1, Math.min(screenWidth / 700, screenHeight / 600));
    this.container.setScale(scale);
  }

  /**
   * Update unlocked modes
   */
  public updateUnlockedModes(unlockedModes: GameMode[]): void {
    this.config.unlockedModes = unlockedModes;
    
    // Recreate buttons if UI is already created
    if (this.container) {
      // Remove old mode buttons
      this.modeButtons.forEach(button => {
        this.container!.remove(button);
        button.destroy();
      });
      this.modeButtons.clear();
      
      // Recreate buttons
      this.createModeButtons();
    }
  }

  /**
   * Update current mode
   */
  public updateCurrentMode(mode: GameMode): void {
    this.config.currentMode = mode;
    
    // Update button appearance if UI is created
    if (this.container) {
      this.updateUnlockedModes(this.config.unlockedModes);
    }
  }

  /**
   * Check if UI is visible
   */
  public isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.modeButtons.clear();
  }
}
