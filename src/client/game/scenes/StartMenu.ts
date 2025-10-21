import { Scene, GameObjects } from 'phaser';
import { AudioManager, AudioEvents } from '../audio/index.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { GameMode } from '../../../shared/types/game.js';

/**
 * StartMenu Scene - Clean, focused main menu with proper overlay management
 * Handles the initial game entry point with mode selection and settings
 */
export class StartMenu extends Scene {
  // Core UI elements
  private background: GameObjects.Image | null = null;
  private logo: GameObjects.Image | null = null;
  private title: GameObjects.Text | null = null;
  private startButton: GameObjects.Text | null = null;
  
  // Audio system (with error handling)
  private audioManager: AudioManager | null = null;
  private audioEvents: AudioEvents | null = null;
  
  // Game state
  private progressionSystem: ProgressionSystem;
  private currentMode: GameMode = 'easy';

  constructor() {
    super('StartMenu');
  }

  public override init(): void {
    // Clear any previous references
    this.background = null;
    this.logo = null;
    this.title = null;
    this.startButton = null;
    this.audioManager = null;
    this.audioEvents = null;
    
    // Initialize systems
    this.progressionSystem = ProgressionSystem.getInstance();
    this.currentMode = this.progressionSystem.getCurrentMode();
    
    // Initialize audio system with error handling
    try {
      this.audioManager = new AudioManager(this);
      this.audioEvents = new AudioEvents(this.audioManager);
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.warn('Audio system failed to initialize:', error);
      // Continue without audio
    }
  }

  public override create(): void {
    // Initialize audio with error handling
    try {
      if (this.audioManager) {
        this.audioManager.initialize();
      }
      if (this.audioEvents) {
        this.audioEvents.onMenuEnter();
      }
    } catch (error) {
      console.warn('Audio initialization failed in create:', error);
    }
    
    // Create UI
    this.createUI();
    this.refreshLayout();

    // Handle resize events
    this.scale.on('resize', () => this.refreshLayout());
  }

  /**
   * Create all UI elements
   */
  private createUI(): void {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(0, 0, 'background').setOrigin(0);

    // Logo
    this.logo = this.add.image(width / 2, height * 0.3, 'logo');

    // Title - Clean StartMenu with Nabla font
    this.title = this.add.text(width / 2, height * 0.5, 'DICETRIX', {
      fontFamily: 'Nabla',
      fontSize: '48px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5);

    // Single Start Game button with Stalinist One font
    this.startButton = this.add.text(width / 2, height * 0.65, 'START GAME', {
      fontFamily: 'Stalinist One',
      fontSize: '36px',
      color: '#ffffff',
      backgroundColor: '#00ff88',
      padding: { x: 40, y: 20 } as Phaser.Types.GameObjects.Text.TextPadding
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      console.log('Button hover'); // Debug log
      this.onButtonHover();
    })
    .on('pointerout', () => {
      console.log('Button out'); // Debug log
      this.onButtonOut();
    })
    .on('pointerdown', () => {
      console.log('Button clicked!'); // Debug log
      this.onStartGameClick();
    });
    
    console.log('Start button created at:', width / 2, height * 0.65); // Debug log
  }

  /**
   * Handle button hover effects
   */
  private onButtonHover(): void {
    try {
      if (this.audioEvents) {
        this.audioEvents.onMenuHover();
      }
    } catch (error) {
      console.warn('Audio hover effect failed:', error);
    }
    
    if (this.startButton) {
      this.startButton.setStyle({ backgroundColor: '#00cc66' });
    }
  }

  /**
   * Handle button out effects
   */
  private onButtonOut(): void {
    if (this.startButton) {
      this.startButton.setStyle({ backgroundColor: '#00ff88' });
    }
  }

  /**
   * Handle start game button click
   */
  private onStartGameClick(): void {
    console.log('START GAME button clicked!'); // Debug log
    
    try {
      if (this.audioEvents) {
        this.audioEvents.onMenuSelect();
      }
    } catch (error) {
      console.warn('Audio menu select failed:', error);
    }
    
    this.startGame();
  }



  /**
   * Start the game
   */
  private startGame(): void {
    console.log('Starting game with mode:', this.currentMode); // Debug log
    
    try {
      // Fade out menu music
      if (this.audioEvents) {
        this.audioEvents.onMenuExit();
      }
    } catch (error) {
      console.warn('Audio menu exit failed:', error);
    }
    
    try {
      // Start game scene
      console.log('Attempting to start Game scene...'); // Debug log
      this.scene.start('Game', { 
        gameMode: this.currentMode,
        progressionData: this.progressionSystem.getProgressionData()
      });
      console.log('Game scene start called successfully'); // Debug log
    } catch (error) {
      console.error('Error starting game:', error); // Debug log
    }
  }

  /**
   * Update layout for responsive design
   */
  private refreshLayout(): void {
    const { width, height } = this.scale;
    
    // Resize camera to match viewport
    this.cameras.resize(width, height);
    
    // Calculate scale factor for responsive design
    const scaleFactor = Math.min(width / 1024, height / 768, 1);
    
    // Update background to fill screen
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }
    
    // Update logo position and scale
    if (this.logo) {
      this.logo.setPosition(width / 2, height * 0.3);
      this.logo.setScale(scaleFactor);
    }
    
    // Update title position and scale
    if (this.title) {
      this.title.setPosition(width / 2, height * 0.5);
      this.title.setScale(scaleFactor);
    }
    
    // Update start button position and scale
    if (this.startButton) {
      this.startButton.setPosition(width / 2, height * 0.65);
      this.startButton.setScale(scaleFactor);
    }
  }

  /**
   * Clean up when scene is shutdown
   */
  shutdown(): void {
    // Remove event listeners
    this.scale.off('resize');
  }
}
