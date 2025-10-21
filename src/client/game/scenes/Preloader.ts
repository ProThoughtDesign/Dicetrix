import { Scene } from 'phaser';
import { VisualEffectsManager } from '../visual/index.js';

export class Preloader extends Scene {
  private visualEffects: VisualEffectsManager;
  private loadingBar: Phaser.GameObjects.Graphics;
  private progressBox: Phaser.GameObjects.Graphics;
  private loadingText: Phaser.GameObjects.Text;
  private percentText: Phaser.GameObjects.Text;
  private assetText: Phaser.GameObjects.Text;

  constructor() {
    super('Preloader');
  }

  public override init(): void {
    // Disable visual effects system for now
    // this.visualEffects = new VisualEffectsManager(this);

    // Create loading screen with Dicetrix theme
    const { width, height } = this.scale;

    // Dark background with neon accent
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Add background if available, otherwise use gradient
    if (this.textures.exists('preloader-bg')) {
      const bg = this.add.image(width / 2, height / 2, 'preloader-bg');
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.3);
    }

    // Create loading UI
    this.createLoadingUI();

    // Set up progress tracking
    this.setupProgressTracking();
  }

  public override preload(): void {
    // Disable visual effects initialization for now
    // this.visualEffects.initialize();

    // Set asset path
    this.load.setPath('assets/');

    // Load additional assets (most dice textures are now procedural)
    this.loadUIAssets();
    this.loadAudioAssets();
    this.loadBackgroundAssets();
  }

  public override create(): void {
    // Create global animations and configurations
    this.createAnimations();

    // Initialize game registry values
    this.registry.set('assetsLoaded', true);

    // Transition to start menu with fade effect
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StartMenu');
    });
  }

  private createLoadingUI(): void {
    const { width, height } = this.scale;

    // Progress box background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

    // Progress bar
    this.loadingBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add
      .text(width / 2, height / 2 - 80, 'Loading Dicetrix...', {
        fontFamily: 'Stalinist One',
        fontSize: '32px',
        color: '#00ff88',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Percentage text
    this.percentText = this.add
      .text(width / 2, height / 2, '0%', {
        fontFamily: 'Stalinist One',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Asset loading text
    this.assetText = this.add
      .text(width / 2, height / 2 + 60, '', {
        fontFamily: 'Stalinist One',
        fontSize: '14px',
        color: '#888888',
      })
      .setOrigin(0.5);
  }

  private setupProgressTracking(): void {
    const { width, height } = this.scale;

    this.load.on('progress', (value: number) => {
      const percentage = Math.round(value * 100);
      this.percentText.setText(`${percentage}%`);

      // Update progress bar
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x00ff88, 1);
      this.loadingBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 5);
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText.setText(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.assetText.setText('Loading complete!');
    });
  }

  private loadBackgroundAssets(): void {
    // Grid and game board (optional - can be procedural)
    // this.load.image('grid-cell', 'grid/cell.png');
    // this.load.image('grid-border', 'grid/border.png');
    // Background and theme assets (optional - using procedural neon theme)
    // this.load.image('game-bg', 'backgrounds/game-bg.png');
    // this.load.image('menu-bg', 'backgrounds/menu-bg.png');
    // Next piece preview background
    // this.load.image('next-piece-bg', 'ui/next-piece-bg.png');
  }

  private loadUIAssets(): void {
    // Button assets
    this.load.image('button-normal', 'ui/button-normal.png');
    this.load.image('button-hover', 'ui/button-hover.png');
    this.load.image('button-pressed', 'ui/button-pressed.png');

    // HUD elements
    this.load.image('score-panel', 'ui/score-panel.png');
    this.load.image('level-panel', 'ui/level-panel.png');
    this.load.image('booster-panel', 'ui/booster-panel.png');

    // Booster icons for each color
    this.load.image('booster-red', 'boosters/red-icon.png');
    this.load.image('booster-blue', 'boosters/blue-icon.png');
    this.load.image('booster-green', 'boosters/green-icon.png');
    this.load.image('booster-yellow', 'boosters/yellow-icon.png');
    this.load.image('booster-purple', 'boosters/purple-icon.png');
    this.load.image('booster-orange', 'boosters/orange-icon.png');
    this.load.image('booster-cyan', 'boosters/cyan-icon.png');

    // Mode selection icons
    this.load.image('mode-easy', 'modes/easy-icon.png');
    this.load.image('mode-medium', 'modes/medium-icon.png');
    this.load.image('mode-hard', 'modes/hard-icon.png');
    this.load.image('mode-expert', 'modes/expert-icon.png');
    this.load.image('mode-zen', 'modes/zen-icon.png');
  }

  private loadAudioAssets(): void {
    // Sound effects - piece actions
    this.load.audio('piece-move', 'audio/sfx/piece-move.mp3');
    this.load.audio('piece-rotate', 'audio/sfx/piece-rotate.mp3');
    this.load.audio('piece-lock', 'audio/sfx/piece-lock.mp3');

    // Sound effects - match clearing (different sizes)
    this.load.audio('match-clear', 'audio/sfx/match-clear.mp3');
    this.load.audio('match-clear-medium', 'audio/sfx/match-clear-medium.mp3');
    this.load.audio('match-clear-large', 'audio/sfx/match-clear-large.mp3');
    this.load.audio('match-clear-massive', 'audio/sfx/match-clear-massive.mp3');

    // Sound effects - cascades
    this.load.audio('cascade', 'audio/sfx/cascade.mp3');
    this.load.audio('cascade-big', 'audio/sfx/cascade-big.mp3');
    this.load.audio('cascade-epic', 'audio/sfx/cascade-epic.mp3');

    // Sound effects - special events
    this.load.audio('ultimate-combo', 'audio/sfx/ultimate-combo.mp3');
    this.load.audio('wild-die-spawn', 'audio/sfx/wild-die-spawn.mp3');
    this.load.audio('black-die-debuff', 'audio/sfx/black-die-debuff.mp3');

    // Sound effects - boosters
    this.load.audio('booster-activate', 'audio/sfx/booster-activate.mp3');
    this.load.audio('booster-deactivate', 'audio/sfx/booster-deactivate.mp3');
    this.load.audio('booster-red', 'audio/sfx/booster-red.mp3');
    this.load.audio('booster-blue', 'audio/sfx/booster-blue.mp3');
    this.load.audio('booster-green', 'audio/sfx/booster-green.mp3');
    this.load.audio('booster-yellow', 'audio/sfx/booster-yellow.mp3');
    this.load.audio('booster-purple', 'audio/sfx/booster-purple.mp3');
    this.load.audio('booster-orange', 'audio/sfx/booster-orange.mp3');
    this.load.audio('booster-cyan', 'audio/sfx/booster-cyan.mp3');

    // Sound effects - game events
    this.load.audio('level-up', 'audio/sfx/level-up.mp3');
    this.load.audio('game-over', 'audio/sfx/game-over.mp3');
    this.load.audio('high-score', 'audio/sfx/high-score.mp3');
    this.load.audio('warning', 'audio/sfx/warning.mp3');
    this.load.audio('gravity-fall', 'audio/sfx/gravity-fall.mp3');

    // Sound effects - UI
    this.load.audio('menu-select', 'audio/sfx/menu-select.mp3');
    this.load.audio('menu-hover', 'audio/sfx/menu-hover.mp3');
    this.load.audio('menu-back', 'audio/sfx/menu-back.mp3');
    this.load.audio('game-pause', 'audio/sfx/game-pause.mp3');
    this.load.audio('game-resume', 'audio/sfx/game-resume.mp3');

    // Background music - menu
    this.load.audio('menu-music', 'audio/music/menu-theme.mp3');

    // Background music - game modes
    this.load.audio('game-music-easy', 'audio/music/easy-mode.mp3');
    this.load.audio('game-music-medium', 'audio/music/medium-mode.mp3');
    this.load.audio('game-music-hard', 'audio/music/hard-mode.mp3');
    this.load.audio('game-music-expert', 'audio/music/expert-mode.mp3');
    this.load.audio('game-music-zen', 'audio/music/zen-mode.mp3');
  }

  // Particle effects are now generated procedurally by ParticleEffects class
  // No need to load external particle textures

  private createAnimations(): void {
    // Create reusable animations for dice, effects, etc.
    // These will be available to all scenes

    // Dice glow animation for matches
    if (!this.anims.exists('dice-glow')) {
      this.anims.create({
        key: 'dice-glow',
        frames: [{ key: 'match-highlight', frame: 0 }],
        frameRate: 8,
        repeat: -1,
        yoyo: true,
      });
    }

    // Cascade effect animation
    if (!this.anims.exists('cascade-effect')) {
      this.anims.create({
        key: 'cascade-effect',
        frames: [{ key: 'cascade-effect', frame: 0 }],
        frameRate: 12,
        repeat: 0,
      });
    }
  }
}
