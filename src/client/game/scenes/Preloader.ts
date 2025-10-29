import { Scene } from 'phaser';
import Logger from '../../utils/Logger';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload(): void {
    Logger.log('Preloader: Loading game assets');
    // Create a simple loading screen
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0a1a');
    
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    // apply 1px black stroke for white text to increase contrast
    // replace previous loading text with stroked one for contrast
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);

    // Preload dice images (public assets path)
    const dice = [4,6,8,10,12,20];
    for (const s of dice) {
      // key: d4, d6, ... path from client root (Vite serves public/) 
      const key = `d${s}`;
      const path = `/assets/dice/d${s}.png`;
      this.load.image(key, path);
    }

    // Preload background image
    this.load.image('dicetrix-bg', '/assets/Dicetrix-Background.png');

    // Preload placeholder SFX files (music will be handled by Strudel)
    this.loadSFXAssets();
  }

  create(): void {
    // Log audio loading results
    this.logAudioLoadingResults();
    
    // Audio initialization moved to SplashScreen after user interaction
    // This ensures proper audio context activation per browser requirements
    Logger.log('Preloader: Assets loaded, transitioning to SplashScreen');
    this.scene.start('SplashScreen');
  }

  private logAudioLoadingResults(): void {
    const audioCache = this.cache.audio;
    let loadedCount = 0;
    let totalCount = 0;

    // Check music files
    const musicKeys = ['menu-music', 'easy-music', 'medium-music', 'hard-music', 'expert-music', 'zen-music'];
    for (const key of musicKeys) {
      totalCount++;
      if (audioCache.exists(key)) {
        loadedCount++;
        Logger.log(`Preloader: ✅ Loaded music: ${key}`);
      } else {
        Logger.log(`Preloader: ❌ Missing music: ${key}`);
      }
    }

    // Check sound effect files
    const soundKeys = [
      'button-click', 'menu-navigate', 'settings-change', 'mode-select',
      'piece-placement', 'piece-rotation', 'piece-drop', 'piece-hold',
      'dice-match-3', 'dice-match-4', 'dice-match-5', 'dice-match-7', 'dice-match-9',
      'level-up', 'game-over', 'pause', 'resume',
      'combo-2x', 'combo-3x', 'combo-4x', 'perfect-clear', 'warning-alert'
    ];
    
    for (const key of soundKeys) {
      totalCount++;
      if (audioCache.exists(key)) {
        loadedCount++;
        Logger.log(`Preloader: ✅ Loaded sound: ${key}`);
      } else {
        Logger.log(`Preloader: ❌ Missing sound: ${key}`);
      }
    }

    Logger.log(`Preloader: Audio loading complete - ${loadedCount}/${totalCount} files loaded`);
    
    if (loadedCount === 0) {
      Logger.log('Preloader: No audio files found - using algorithmic generation only');
    } else if (loadedCount < totalCount) {
      Logger.log('Preloader: Some audio files missing - hybrid mode (files + algorithmic)');
    } else {
      Logger.log('Preloader: All audio files loaded successfully');
    }
  }

  private loadSFXAssets(): void {
    // Load audio files for the comprehensive music system
    // The system supports both algorithmic generation (Strudel) and audio files (Phaser)
    
    try {
      // Load music files
      const musicFiles = [
        { key: 'menu-music', filename: 'menu-theme' },
        { key: 'easy-music', filename: 'easy-mode' },
        { key: 'medium-music', filename: 'medium-mode' },
        { key: 'hard-music', filename: 'hard-mode' },
        { key: 'expert-music', filename: 'expert-mode' },
        { key: 'zen-music', filename: 'zen-mode' }
      ];

      for (const music of musicFiles) {
        // Load MP3 files only
        const mp3Path = `assets/audio/music/${music.filename}.mp3`;
        this.load.audio(music.key, mp3Path);
      }

      // Load sound effect files
      const soundFiles = [
        'button-click', 'menu-navigate', 'settings-change', 'mode-select',
        'piece-placement', 'piece-rotation', 'piece-drop', 'piece-hold',
        'dice-match-3', 'dice-match-4', 'dice-match-5', 'dice-match-7', 'dice-match-9',
        'level-up', 'game-over', 'pause', 'resume',
        'combo-2x', 'combo-3x', 'combo-4x', 'perfect-clear', 'warning-alert'
      ];

      for (const sound of soundFiles) {
        // Load MP3 files only
        const mp3Path = `assets/audio/sfx/${sound}.mp3`;
        this.load.audio(sound, mp3Path);
      }

      Logger.log('Preloader: Loading audio assets for comprehensive music system');
      
    } catch (error) {
      Logger.log(`Preloader: Audio loading setup failed - ${error}`);
      Logger.log('Preloader: Continuing with algorithmic audio generation only');
    }
  }

}
