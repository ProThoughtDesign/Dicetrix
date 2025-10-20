import { Scene, GameObjects } from 'phaser';
import { AudioManager, AudioEvents } from '../audio/index.js';
import { AudioSettingsUI } from '../ui/AudioSettingsUI.js';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  logo: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  audioButton: GameObjects.Text | null = null;
  
  // Audio system
  private audioManager: AudioManager;
  private audioEvents: AudioEvents;
  private audioSettingsUI: AudioSettingsUI;

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
    
    // Initialize audio system
    this.audioManager = new AudioManager(this);
    this.audioEvents = new AudioEvents(this.audioManager);
    this.audioSettingsUI = new AudioSettingsUI(this, this.audioManager);
  }

  create() {
    // Initialize audio system
    this.audioManager.initialize();
    
    // Start menu music
    this.audioEvents.onMenuEnter();
    
    this.refreshLayout();

    // Re-calculate positions whenever the game canvas is resized (e.g. orientation change).
    this.scale.on('resize', () => this.refreshLayout());

    this.input.once('pointerdown', () => {
      this.audioEvents.onMenuSelect();
      this.scene.start('Game');
    });
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
        .text(0, 0, 'DICETRIX\nTap to Play', {
          fontFamily: 'Arial Black',
          fontSize: `${baseFontSize}px`,
          color: '#00ff88',
          stroke: '#000000',
          strokeThickness: 8,
          align: 'center',
        })
        .setOrigin(0.5);
    }
    this.title!.setPosition(width / 2, height * 0.6);
    this.title!.setScale(scaleFactor);

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
  }
}
