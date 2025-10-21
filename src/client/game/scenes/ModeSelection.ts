import { Scene, GameObjects } from 'phaser';
import { GameMode } from '../../../shared/types/game.js';
import { AudioEvents } from '../audio/AudioEvents.js';

export interface ModeSelectionData {
  currentMode: GameMode;
  unlockedModes: GameMode[];
  onModeSelect: (mode: GameMode) => void;
  onClose: () => void;
}

/**
 * ModeSelection Scene - Modal overlay for selecting game difficulty
 * Launched as a separate scene to ensure proper focus management
 */
export class ModeSelection extends Scene {
  private sceneData: ModeSelectionData;
  private audioEvents: AudioEvents | null = null;
  
  // UI elements
  private container: GameObjects.Container | null = null;
  private background: GameObjects.Rectangle | null = null;
  private titleText: GameObjects.Text | null = null;
  private modeButtons: GameObjects.Container[] = [];
  private closeButton: GameObjects.Text | null = null;
  
  // Layout properties
  private panelWidth: number = 600;
  private panelHeight: number = 500;

  constructor() {
    super('ModeSelection');
  }

  public override init(data: ModeSelectionData): void {
    this.sceneData = data;
    
    // Clear previous elements
    this.container = null;
    this.background = null;
    this.titleText = null;
    this.modeButtons = [];
    this.closeButton = null;
  }

  public override create(): void {
    // Get audio events from the calling scene
    const startMenuScene = this.scene.get('StartMenu');
    if (startMenuScene && (startMenuScene as any).audioEvents) {
      this.audioEvents = (startMenuScene as any).audioEvents;
    }
    
    this.createUI();
    this.refreshLayout();
    
    // Handle resize and input
    this.scale.on('resize', () => this.refreshLayout());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    
    // Animate in
    this.animateIn();
  }

  /**
   * Create the modal UI
   */
  private createUI(): void {
    const { width, height } = this.scale;
    
    // Create main container
    this.container = this.add.container(width / 2, height / 2);
    this.container.setDepth(1000);
    
    // Main background panel
    this.background = this.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x1a1a2e, 0.95);
    this.background.setStrokeStyle(4, 0x00ff88);
    this.container.add(this.background);
    
    // Title
    this.titleText = this.add.text(0, -this.panelHeight / 2 + 50, 'SELECT DIFFICULTY', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.container.add(this.titleText);
    
    // Close button
    this.closeButton = this.add.text(this.panelWidth / 2 - 30, -this.panelHeight / 2 + 30, '✕', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
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
      this.close();
    });
    this.container.add(this.closeButton);
    
    // Create mode buttons
    this.createModeButtons();
  }

  /**
   * Create buttons for each game mode
   */
  private createModeButtons(): void {
    const modes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
    const buttonHeight = 70;
    const buttonSpacing = 80;
    const startY = -150;

    modes.forEach((mode, index) => {
      const isUnlocked = this.sceneData.unlockedModes.includes(mode);
      const isCurrent = this.sceneData.currentMode === mode;
      const yPos = startY + index * buttonSpacing;
      
      // Create button container
      const buttonContainer = this.add.container(0, yPos);
      
      // Button background
      const buttonBg = this.add.rectangle(0, 0, this.panelWidth - 60, buttonHeight, 
        isCurrent ? 0x00ff88 : (isUnlocked ? 0x444444 : 0x222222), 
        isUnlocked ? 0.9 : 0.5
      );
      buttonBg.setStrokeStyle(3, isCurrent ? 0xffffff : (isUnlocked ? 0x666666 : 0x333333));
      buttonContainer.add(buttonBg);

      // Mode info
      const modeTitle = this.getModeTitle(mode);
      const modeDesc = this.getModeDescription(mode);
      
      // Title text
      const titleText = this.add.text(-220, -12, modeTitle, {
        fontFamily: 'Arial Black',
        fontSize: '22px',
        color: isCurrent ? '#000000' : (isUnlocked ? '#ffffff' : '#666666'),
        stroke: isCurrent ? '#ffffff' : '#000000',
        strokeThickness: isCurrent ? 2 : 1,
      }).setOrigin(0, 0.5);
      buttonContainer.add(titleText);

      // Description text
      const descText = this.add.text(-220, 12, modeDesc, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: isCurrent ? '#000000' : (isUnlocked ? '#cccccc' : '#555555'),
      }).setOrigin(0, 0.5);
      buttonContainer.add(descText);

      // Difficulty indicators
      const difficultyLevel = this.getDifficultyLevel(mode);
      for (let i = 0; i < 5; i++) {
        const dieIcon = this.add.text(120 + i * 30, 0, '⚀', {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: i < difficultyLevel ? '#ffd700' : '#333333',
        }).setOrigin(0.5);
        buttonContainer.add(dieIcon);
      }

      // Lock icon for locked modes
      if (!isUnlocked) {
        const lockIcon = this.add.text(200, 0, '🔒', {
          fontFamily: 'Arial',
          fontSize: '24px',
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

      this.modeButtons.push(buttonContainer);
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
      easy: '4-6 sided dice, 3 colors, relaxed pace',
      medium: '4-10 sided dice, 4 colors, moderate pace',
      hard: '4-12 sided dice, 5 colors, black dice, faster pace',
      expert: '4-20 sided dice, 6 colors, more black dice, intense pace',
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
    if (!this.sceneData.unlockedModes.includes(mode)) {
      return;
    }

    this.sceneData.onModeSelect(mode);
    this.close();
  }

  /**
   * Close the modal
   */
  private close(): void {
    this.animateOut(() => {
      this.sceneData.onClose();
    });
  }

  /**
   * Animate modal in
   */
  private animateIn(): void {
    if (!this.container) return;
    
    this.container.setScale(0.7);
    this.container.setAlpha(0);
    
    this.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Animate modal out
   */
  private animateOut(onComplete: () => void): void {
    if (!this.container) {
      onComplete();
      return;
    }
    
    this.tweens.add({
      targets: this.container,
      scale: 0.7,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: onComplete
    });
  }

  /**
   * Update layout for responsive design
   */
  private refreshLayout(): void {
    const { width, height } = this.scale;
    
    if (this.container) {
      this.container.setPosition(width / 2, height / 2);
      
      // Scale for smaller screens
      const scale = Math.min(1, Math.min(width / 700, height / 600));
      this.container.setScale(scale);
    }
  }

  /**
   * Clean up when scene shuts down
   */
  shutdown(): void {
    this.scale.off('resize');
    this.input.keyboard?.off('keydown-ESC');
  }
}
