import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { BoosterManager } from '../models/BoosterManager.js';
import { BoosterHUD } from '../ui/BoosterHUD.js';
import { GameController } from '../controllers/GameController.js';
import { Grid } from '../models/Grid.js';
import { Piece } from '../models/Piece.js';
import { GameMode } from '../../../shared/types/game.js';
import { AudioManager, AudioEvents } from '../audio/index.js';
import { AudioSettingsUI } from '../ui/AudioSettingsUI.js';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  
  // Game state
  score: number = 0;
  level: number = 1;
  gameMode: GameMode = 'medium';
  previousHighScore: number = 0;
  
  // Core game systems
  grid: Grid;
  gameController: GameController;
  currentPiece: Piece | null = null;
  nextPiece: Piece | null = null;
  
  // Booster system
  boosterManager: BoosterManager;
  boosterHUD: BoosterHUD;
  
  // Audio system
  private audioManager: AudioManager;
  private audioEvents: AudioEvents;
  private audioSettingsUI: AudioSettingsUI;
  
  // UI elements
  scoreText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  gameOverButton: Phaser.GameObjects.Text;
  pauseText: Phaser.GameObjects.Text;
  audioButton: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  update(time: number, delta: number): void {
    // Update game controller (handles input and piece movement)
    if (this.gameController) {
      this.gameController.update(delta);
    }
    
    // Update booster system
    if (this.boosterManager) {
      this.boosterManager.update(delta);
    }
    
    // Update booster HUD
    if (this.boosterHUD) {
      this.boosterHUD.update();
    }
  }

  create() {
    // Initialize audio system
    this.audioManager = new AudioManager(this);
    this.audioEvents = new AudioEvents(this.audioManager);
    this.audioSettingsUI = new AudioSettingsUI(this, this.audioManager);
    this.audioManager.initialize();
    
    // Start game music for current mode
    this.audioEvents.onModeStart(this.gameMode);

    // Configure camera & background with dark theme for Dicetrix
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x1a1a2e);

    // Semi-transparent background
    this.background = this.add.image(512, 384, 'background').setAlpha(0.1);

    // Initialize core game systems
    this.initializeGameSystems();

    // Initialize booster system
    this.boosterManager = new BoosterManager(this);
    this.boosterHUD = new BoosterHUD(this, this.boosterManager);
    
    // Connect audio events to booster manager
    this.boosterManager.setAudioEvents(this.audioEvents);

    // Initialize game session with server
    void this.initializeGame();

    // Create UI elements
    this.createUI();

    // Setup responsive layout
    this.updateLayout(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.updateLayout(width, height);
    });

    // Display game instructions
    const instructionsText = this.add.text(this.scale.width / 2, this.scale.height / 2, 
      'Dicetrix Controls:\n\n' +
      'Arrow Keys / Swipe: Move & Rotate\n' +
      'Space / Double Tap: Hard Drop\n' +
      'ESC: Pause\n\n' +
      'Match 3+ dice with same number!', {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5);

    // Add test button to demonstrate input system
    const testButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 150, 'Test Input System', {
      fontFamily: 'Arial Black',
      fontSize: 20,
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 15, y: 8 } as Phaser.Types.GameObjects.Text.TextPadding,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => testButton.setStyle({ backgroundColor: '#555555' }))
    .on('pointerout', () => testButton.setStyle({ backgroundColor: '#444444' }))
    .on('pointerdown', () => this.testInputSystem());

    // Add audio test button
    const audioTestButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 200, 'Test Audio System', {
      fontFamily: 'Arial Black',
      fontSize: 20,
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 15, y: 8 } as Phaser.Types.GameObjects.Text.TextPadding,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => audioTestButton.setStyle({ backgroundColor: '#555555' }))
    .on('pointerout', () => audioTestButton.setStyle({ backgroundColor: '#444444' }))
    .on('pointerdown', () => this.testAudioSystem());
  }

  /**
   * Initialize core game systems (grid, controller, etc.)
   */
  private initializeGameSystems(): void {
    // Calculate grid layout for responsive design
    const cellSize = Math.min(
      Math.floor(this.scale.width / 15), // Leave room for UI
      Math.floor(this.scale.height / 25)  // Leave room for UI
    );
    
    const gridWidth = 10 * cellSize;
    const gridHeight = 20 * cellSize;
    const offsetX = (this.scale.width - gridWidth) / 2;
    const offsetY = (this.scale.height - gridHeight) / 2;

    // Initialize grid
    this.grid = new Grid(cellSize, offsetX, offsetY);

    // Initialize game controller
    this.gameController = new GameController(this, {
      currentPiece: null,
      nextPiece: null,
      grid: this.grid,
      gameMode: this.gameMode,
      isPaused: false,
      isGameOver: false,
      canMove: true
    });

    // Setup game controller callbacks
    this.setupGameControllerCallbacks();
    
    // Connect audio events to game controller
    this.gameController.setAudioEvents(this.audioEvents);
  }

  /**
   * Setup callbacks for game controller events
   */
  private setupGameControllerCallbacks(): void {
    this.gameController.onPieceLockedCallback((piece, positions) => {
      console.log('Piece locked at positions:', positions);
      this.audioEvents.onPieceLock();
      // Here we would trigger match detection, cascades, etc.
      // For now, just log the event
    });

    this.gameController.onGameOverCallback(() => {
      console.log('Game Over!');
      this.audioEvents.onGameOver();
      this.scene.start('GameOver');
    });

    this.gameController.onPauseCallback((paused) => {
      if (this.pauseText) {
        this.pauseText.setVisible(paused);
      }
      
      if (paused) {
        this.audioEvents.onGamePause();
      } else {
        this.audioEvents.onGameResume();
      }
    });

    this.gameController.onScoreUpdateCallback((points) => {
      const oldScore = this.score;
      this.score += points;
      
      // Check for level up (every 10,000 points)
      const oldLevel = this.level;
      this.level = Math.floor(this.score / 10000) + 1;
      
      if (this.level > oldLevel) {
        this.audioEvents.onLevelUp();
      }
      
      // Check for high score
      if (this.score > this.previousHighScore && this.previousHighScore > 0) {
        this.audioEvents.onHighScore();
        this.previousHighScore = this.score;
      }
      
      this.updateUI();
    });
  }

  private async initializeGame(): Promise<void> {
    try {
      const response = await fetch('/api/game/init');
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      this.score = data.score || 0;
      this.level = data.level || 1;
      this.gameMode = data.mode || 'medium';
      this.previousHighScore = data.highScore || 0;
      this.updateUI();
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }

  private createUI(): void {
    // Score display
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });

    // Level display
    this.levelText = this.add.text(20, 60, `Level: ${this.level}`, {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 3,
    });

    // Pause indicator (hidden by default)
    this.pauseText = this.add.text(this.scale.width / 2, 100, 'PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: 48,
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setVisible(false);

    // Game Over button for testing
    this.gameOverButton = this.add.text(0, 0, 'Game Over', {
      fontFamily: 'Arial Black',
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 15, y: 8 } as Phaser.Types.GameObjects.Text.TextPadding,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.gameOverButton.setStyle({ backgroundColor: '#555555' }))
    .on('pointerout', () => this.gameOverButton.setStyle({ backgroundColor: '#444444' }))
    .on('pointerdown', () => {
      this.audioEvents.onMenuSelect();
      this.scene.start('GameOver');
    });

    // Audio settings button
    this.audioButton = this.add.text(0, 0, '🔊', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 10, y: 8 } as Phaser.Types.GameObjects.Text.TextPadding
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      this.audioEvents.onMenuHover();
      this.audioButton.setStyle({ backgroundColor: '#555555' });
    })
    .on('pointerout', () => {
      this.audioButton.setStyle({ backgroundColor: '#444444' });
    })
    .on('pointerdown', () => {
      this.audioEvents.onMenuSelect();
      this.audioSettingsUI.toggle();
    });
  }

  private updateLayout(width: number, height: number): void {
    // Resize camera viewport
    this.cameras.resize(width, height);

    // Position background
    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      if (this.background.width && this.background.height) {
        const scale = Math.max(width / this.background.width, height / this.background.height);
        this.background.setScale(scale);
      }
    }

    // Position Game Over button
    if (this.gameOverButton) {
      this.gameOverButton.setPosition(width - 80, height - 30);
    }

    // Position audio button
    if (this.audioButton) {
      this.audioButton.setPosition(width - 20, 20);
    }

    // Position pause text
    if (this.pauseText) {
      this.pauseText.setPosition(width / 2, 100);
    }

    // Update grid layout if it exists
    if (this.grid) {
      const cellSize = Math.min(
        Math.floor(width / 15),
        Math.floor(height / 25)
      );
      
      const gridWidth = 10 * cellSize;
      const gridHeight = 20 * cellSize;
      const offsetX = (width - gridWidth) / 2;
      const offsetY = (height - gridHeight) / 2;
      
      this.grid.setLayout(cellSize, offsetX, offsetY);
    }

    // Update input manager layout (for touch controls)
    if (this.gameController) {
      this.gameController.getInputManager().updateLayout(width, height);
    }

    // Update booster HUD layout
    if (this.boosterHUD) {
      this.boosterHUD.updateLayout(width, height);
    }

    // Update audio settings UI layout
    if (this.audioSettingsUI) {
      this.audioSettingsUI.updateLayout(width, height);
    }
  }

  private updateUI(): void {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
    }
    if (this.levelText) {
      this.levelText.setText(`Level: ${this.level}`);
    }
  }

  /**
   * Test input system functionality
   */
  private testInputSystem(): void {
    if (!this.gameController) {
      console.log('Game controller not initialized');
      return;
    }

    const inputManager = this.gameController.getInputManager();
    
    // Test input configuration
    console.log('Current input config:', inputManager.getConfig());
    
    // Test input events by logging them
    inputManager.onInput('*', (event) => {
      console.log('Input event:', event);
      
      // Show visual feedback
      const feedbackText = this.add.text(
        this.scale.width / 2, 
        this.scale.height - 100, 
        `${event.type.toUpperCase()} (${event.source})`,
        {
          fontFamily: 'Arial Black',
          fontSize: 20,
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 2,
        }
      ).setOrigin(0.5);
      
      // Remove feedback after 1 second
      this.time.delayedCall(1000, () => {
        feedbackText.destroy();
      });
    });
    
    console.log('Input system test activated! Try using keyboard or touch controls.');
  }

  /**
   * Test audio system functionality
   */
  private testAudioSystem(): void {
    console.log('Testing audio system...');
    
    // Test various sound effects
    this.audioEvents.onPieceMove();
    
    this.time.delayedCall(500, () => {
      this.audioEvents.onPieceRotate();
    });
    
    this.time.delayedCall(1000, () => {
      this.audioEvents.onPieceLock();
    });
    
    this.time.delayedCall(1500, () => {
      this.audioEvents.onMatchClear(3);
    });
    
    this.time.delayedCall(2000, () => {
      this.audioEvents.onCascade(1);
    });
    
    this.time.delayedCall(2500, () => {
      this.audioEvents.onBoosterActivate('red');
    });
    
    this.time.delayedCall(3000, () => {
      this.audioEvents.onLevelUp();
    });
    
    console.log('Audio system test sequence started!');
  }

  private testBoosters(): void {
    // Import ColorBooster for testing
    import('../models/Booster.js').then(({ ColorBooster }) => {
      // Activate some test boosters
      const redBooster = ColorBooster.fromColor('red');
      const blueBooster = ColorBooster.fromColor('blue');
      const greenBooster = ColorBooster.fromColor('green');
      
      this.boosterManager.activateBooster(redBooster);
      this.boosterManager.activateBooster(blueBooster);
      this.boosterManager.activateBooster(greenBooster);
      
      console.log('Test boosters activated!');
    }).catch(error => {
      console.error('Failed to load booster classes:', error);
    });
  }
}
