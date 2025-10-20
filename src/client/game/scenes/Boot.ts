import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load minimal assets needed for the preloader
    // These should be small files for fast initial loading
    
    // Background for preloader
    this.load.image('preloader-bg', 'assets/dicetrix-bg.png');
    
    // Logo for splash screen
    this.load.image('dicetrix-logo', 'assets/dicetrix-logo.png');
    
    // Loading bar assets
    this.load.image('loading-bar-bg', 'assets/loading-bar-bg.png');
    this.load.image('loading-bar-fill', 'assets/loading-bar-fill.png');
  }

  create() {
    // Set up any global game configuration
    this.registry.set('gameVersion', '1.0.0');
    this.registry.set('gameTitle', 'Dicetrix');
    
    // Start the preloader scene
    this.scene.start('Preloader');
  }
}
