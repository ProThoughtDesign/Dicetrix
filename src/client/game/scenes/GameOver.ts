import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AudioManager, AudioEvents } from '../audio/index.js';

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameover_text: Phaser.GameObjects.Text;
  
  // Audio system
  private audioManager: AudioManager;
  private audioEvents: AudioEvents;

  constructor() {
    super('GameOver');
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
    this.camera.setBackgroundColor(0xff0000);

    // Background – create once, full-screen
    this.background = this.add.image(0, 0, 'background').setOrigin(0).setAlpha(0.5);

    // "Game Over" text – created once and scaled responsively
    this.gameover_text = this.add
      .text(0, 0, 'Game Over', {
        fontFamily: 'Arial Black',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Initial responsive layout
    this.updateLayout(this.scale.width, this.scale.height);

    // Update layout on canvas resize / orientation change
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.updateLayout(width, height);
    });

    // Return to Main Menu on tap / click
    this.input.once('pointerdown', () => {
      this.audioEvents.onMenuSelect();
      this.scene.start('MainMenu');
    });
  }

  private updateLayout(width: number, height: number): void {
    // Resize camera viewport to prevent black bars
    this.cameras.resize(width, height);

    // Stretch background to fill entire screen
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }

    // Compute scale factor (never enlarge above 1×)
    const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

    // Centre and scale the game-over text
    if (this.gameover_text) {
      this.gameover_text.setPosition(width / 2, height / 2);
      this.gameover_text.setScale(scaleFactor);
    }
  }
}
