import { Scene, GameObjects } from 'phaser';
import { AudioManager, AudioEvents } from '../audio/index.js';
import { AudioSettingsUI } from '../ui/AudioSettingsUI.js';
import { ModeSelectionUI } from '../ui/ModeSelectionUI.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { GameMode } from '../../../shared/types/game.js';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  logo: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  audioButton: GameObjects.Text | null = null;
  modeButton: GameObjects.Text | null = null;
  playButton: GameObjects.Text | null = null;
  currentModeText: GameObjects.Text | null = null;
  
  // Audio system
  private audioManager: AudioManager;
  private audioEvents: AudioEvents;
  private audioSettingsUI: AudioSettingsUI;
  
  // Mode selection system
  private modeSelectionUI: ModeSelectionUI;
  private progressionSystem: ProgressionSystem;
  private currentMode: GameMode = 'easy';

  constructor() {
    super('MainMenu');
  }

  /**
   * Reset cached GameObject references every time the scene starts.
   * The same Scene instance is reused by Phaser, so we must ensure
   * stale (destroyed) objects are cleared out when the scene restarts.
   */
  init(): void {
    this.background = null;
    this.logo = null;
    this.title = null;
    this.audioButton = null;
    this.modeButton = null;
    this.playButton = null;
    this.currentModeText = null;
    
    // Initialize audio system
    this.audioManager = new AudioManager(this);
    this.audioEvents = new AudioEvents(this.audioManager);
    this.audioSettingsUI = new AudioSettingsUI(this, this.audioManager);
    
    // Initialize progression system
    this.progressionSystem = ProgressionSystem.getInstance();
    this.currentMode = this.progressionSystem.getCurrentMode();
    
    // Initialize mode selection UI
    this.modeSelectionUI = new ModeSelectionUI(this, {
      onModeSelect: (mode: GameMode) => this.selectMode(mode),
      currentMode: this.currentMode,
      unlockedModes: this.progressionSystem.getUnlockedModes()
    });
  }

  create() {
    // Initialize audio system
    this.audioManager.initialize();
    
    // Start menu music
    this.audioEvents.onMenuEnter();
    
    // Create mode selection UI
    this.modeSelectionUI.create();
    this.modeSelectionUI.setAudioEvents(this.audioEvents);
    
    this.refreshLayout();

    // Re-calculate positions whenever the game canvas is resized (e.g. orientation change).
    this.scale.on('resize', () => this.refreshLayout());
  }

  /**
   * Positions and (lightly) scales all UI elements based on the current game size.
   * Call this from create() and from any resize events.
   */
  private refreshLayout(): void {
    const { width, height } = this.scale;

    // Resize camera to new viewport to prevent black bars
    this.cameras.resize(width, height);

    // Background – stretch to fill the whole canvas
    if (!this.background) {
      this.background = this.add.image(0, 0, 'background').setOrigin(0);
    }
    this.background!.setDisplaySize(width, height);

    // Logo – keep aspect but scale down for very small screens
    const scaleFactor = Math.min(width / 1024, height / 768);

    if (!this.logo) {
      this.logo = this.add.image(0, 0, 'logo');
    }
    this.logo!.setPosition(width / 2, height * 0.38).setScale(scaleFactor);

    // Title text – create once, then scale on resize
    const baseFontSize = 38;
    if (!this.title) {
      this.title = this.add
        .text(0, 0, 'DICETRIX', {
          fontFamily: 'Arial Black',
          fontSize: `${baseFontSize}px`,
          color: '#00ff88',
          stroke: '#000000',
          strokeThickness: 8,
          align: 'center',
        })
        .setOrigin(0.5);
    }
    this.title!.setPosition(width / 2, height * 0.5);
    this.title!.setScale(scaleFactor);

    // Current mode display
    if (!this.currentModeText) {
      this.currentModeText = this.add.text(0, 0, `Mode: ${this.currentMode.toUpperCase()}`, {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }
    this.currentModeText!.setPosition(width / 2, height * 0.58);
    this.currentModeText!.setScale(scaleFactor);
    this.currentModeText!.setText(`Mode: ${this.currentMode.toUpperCase()}`);

    // Play button
    if (!this.playButton) {
      this.playButton = this.add.text(0, 0, 'PLAY', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#00ff88',
        padding: { x: 30, y: 15 } as Phaser.Types.GameObjects.Text.TextPadding
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.audioEvents.onMenuHover();
        this.playButton!.setStyle({ backgroundColor: '#00cc66' });
      })
      .on('pointerout', () => {
        this.playButton!.setStyle({ backgroundColor: '#00ff88' });
      })
      .on('pointerdown', () => {
        this.audioEvents.onMenuSelect();
        this.startGame();
      });
    }
    this.playButton!.setPosition(width / 2, height * 0.68);
    this.playButton!.setScale(scaleFactor);

    // Mode selection button
    if (!this.modeButton) {
      this.modeButton = this.add.text(0, 0, 'SELECT MODE', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#444444',
        padding: { x: 20, y: 10 } as Phaser.Types.GameObjects.Text.TextPadding
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.audioEvents.onMenuHover();
        this.modeButton!.setStyle({ backgroundColor: '#555555' });
      })
      .on('pointerout', () => {
        this.modeButton!.setStyle({ backgroundColor: '#444444' });
      })
      .on('pointerdown', () => {
        this.audioEvents.onMenuSelect();
        this.modeSelectionUI.show();
      });
    }
    this.modeButton!.setPosition(width / 2, height * 0.78);
    this.modeButton!.setScale(scaleFactor);

    // Audio settings button
    if (!this.audioButton) {
      this.audioButton = this.add.text(0, 0, '🔊 Audio', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#444444',
        padding: { x: 15, y: 8 } as Phaser.Types.GameObjects.Text.TextPadding
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.audioEvents.onMenuHover();
        this.audioButton!.setStyle({ backgroundColor: '#555555' });
      })
      .on('pointerout', () => {
        this.audioButton!.setStyle({ backgroundColor: '#444444' });
      })
      .on('pointerdown', () => {
        this.audioEvents.onMenuSelect();
        this.audioSettingsUI.toggle();
      });
    }
    this.audioButton!.setPosition(width - 20, 20);
    this.audioButton!.setScale(scaleFactor);

    // Update audio settings UI layout
    this.audioSettingsUI.updateLayout(width, height);
    
    // Update mode selection UI layout
    this.modeSelectionUI.updateLayout(width, height);
  }

  /**
   * Select a game mode
   */
  private selectMode(mode: GameMode): void {
    this.currentMode = mode;
    this.progressionSystem.setCurrentMode(mode);
    
    // Update UI to reflect new mode
    if (this.currentModeText) {
      this.currentModeText.setText(`Mode: ${mode.toUpperCase()}`);
    }
    
    // Update mode selection UI
    this.modeSelectionUI.updateCurrentMode(mode);
    
    console.log(`Selected mode: ${mode}`);
  }

  /**
   * Start the game with current mode
   */
  private startGame(): void {
    // Pass current mode to game scene
    this.scene.start('Game', { 
      gameMode: this.currentMode,
      progressionData: this.progressionSystem.getProgressionData()
    });
  }
}
