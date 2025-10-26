import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import GameBoard from '../logic/GameBoard';
import { settings } from '../services/Settings';
import { getMode } from '../config/GameMode';
import { 
  drawDie, 
  setBoosterChance, 
  determineGlowColor, 
  cleanupDie, 
  hideDieText,
  initializeGlowPool, 
  cleanupGlowPool 
} from '../visuals/DiceRenderer';
import { detectMatches, detectMatchesWithBlackDieEffects } from '../logic/MatchDetector';
import { applyGravity } from '../logic/Gravity';
// import { applyIndividualGravity } from '../logic/Gravity'; // Disabled for now
import Logger from '../../utils/Logger';
import FontLoader from '../../utils/FontLoader';
import { GameUI, GameUICallbacks } from '../ui/GameUI';
import { GAME_CONSTANTS, SPAWN_POSITIONS } from '../../../shared/constants/GameConstants';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';
import { ScoreBreakdown } from '../../../shared/types/game';
import { GridBoundaryValidator } from '../../../shared/utils/GridBoundaryValidator';
import { audioHandler } from '../services/AudioHandler';
import { SoundEffectLibrary } from '../services/SoundEffectLibrary';
import { PauseMenuUI, PauseMenuCallbacks } from '../ui/PauseMenuUI';
import { BackgroundBouncer, BackgroundBouncerConfig } from '../utils/BackgroundBouncer';
import { ProceduralPieceGenerator } from '../../../shared/utils/ProceduralPieceGenerator';
import { BlackDieManager } from '../../../shared/utils/BlackDieManager';
import { BoosterEffectSystem } from '../../../shared/utils/BoosterEffectSystem';
import { ScoreMultiplierManager } from '../../../shared/utils/ScoreMultiplierManager';
import { ParticleSystemManager, ParticleSystemConfig } from '../visuals/ParticleSystemManager';
import { DifficultyModeConfig } from '../../../shared/types/difficulty';
import { ScoreSubmissionUI, GameEndData, ScoreSubmissionCallbacks } from '../ui/ScoreSubmissionUI';
import { RedditScoreSubmissionRequest, RedditScoreSubmissionResponse } from '../../../shared/types/api';

export class Game extends Scene {
  // Simple game phase state machine to manage scene flow
  private phase: 'Idle' | 'Dropping' | 'Cascading' | 'Animating' | 'Spawning' = 'Idle';
  private gameUI: GameUI;
  private gameBoard: GameBoard;
  private score: number = 0;
  private cascadeMultiplier: number = 1;
  
  // Score tracking for submission
  private gameStartTime: number = 0;
  private scoreAchievementTime: number = 0;
  private currentLevel: number = 1;
  private scoreBreakdown: ScoreBreakdown = {
    baseScore: 0,
    chainMultiplier: 1,
    ultimateComboMultiplier: 1,
    boosterModifiers: 0,
    totalScore: 0
  };
  
  // Score submission UI
  private scoreSubmissionUI: ScoreSubmissionUI | null = null;
  private coordinateConverter: CoordinateConverter;
  private activePiece: any;
  private nextPiece: any;
  private dropTimer: Phaser.Time.TimerEvent | null = null;
  private gravityTimer: Phaser.Time.TimerEvent | null = null;
  private activeSprites: Phaser.GameObjects.Container[] = [];
  private nextSprites: Phaser.GameObjects.Container[] = [];
  private lockedSprites: Phaser.GameObjects.Container[] = [];
  
  // Enhanced audio integration
  private soundEffectLibrary: SoundEffectLibrary | null = null;
  private currentGameMode: string = 'medium';
  
  // Booster chance system for dice glow effects
  private boosterChance: number = 0.15; // 15% chance by default
  
  // Pause menu integration
  private pauseMenuUI: PauseMenuUI | null = null;
  private isPaused: boolean = false;
  
  // Bouncing background
  private backgroundSprite: Phaser.GameObjects.Sprite | null = null;
  private backgroundBouncer: BackgroundBouncer | null = null;

  // Procedural generation systems
  private blackDieManager: BlackDieManager | null = null;
  private boosterEffectSystem: BoosterEffectSystem | null = null;
  private scoreMultiplierManager: ScoreMultiplierManager | null = null;
  private currentDifficultyConfig: DifficultyModeConfig | null = null;

  // Particle system for visual effects
  private particleSystemManager: ParticleSystemManager | null = null;

  // Diagnostic timing metrics for initialization debugging
  private initializationMetrics = {
    sceneCreateStart: 0,
    backgroundSetComplete: 0,
    registrySetupComplete: 0,
    gameBoardInitComplete: 0,
    coordinateConverterInitComplete: 0,
    gameUICreateStart: 0,
    gameUICreateComplete: 0,
    firstPieceGenerationStart: 0,
    firstPieceGenerationComplete: 0,
    firstPieceSpawnStart: 0,
    firstPieceSpawnComplete: 0,
    timersSetupComplete: 0,
    initialRenderStart: 0,
    initialRenderComplete: 0,
    sceneCreateEnd: 0,
  };

  constructor() {
    super('Game');
  }

  /**
   * Initialize enhanced audio system with SoundEffectLibrary integration
   * Requirements: 1.4, 2.1, 2.2, 2.3, 2.4
   */
  private initializeAudioSystem(): void {
    try {
      // Initialize SoundEffectLibrary for comprehensive sound effects
      this.soundEffectLibrary = new SoundEffectLibrary(this);
      
      // Sync with AudioHandler settings
      this.soundEffectLibrary.syncWithAudioHandler();
      
      Logger.log('Game: SoundEffectLibrary initialized and synced with AudioHandler');

      // Start appropriate music for the current game mode
      this.startGameModeMusic();
      
    } catch (error) {
      Logger.log(`Game: Failed to initialize audio system - ${error}`);
      // Continue without audio - graceful degradation
      this.soundEffectLibrary = null;
    }
  }

  /**
   * Start music appropriate for the current game mode
   * Requirements: 1.4
   */
  private startGameModeMusic(): void {
    try {
      // Check if music is enabled in settings (respects global mute state)
      if (!audioHandler.getMusicEnabled()) {
        Logger.log(`Game: Music is disabled in settings, skipping game mode music`);
        return;
      }

      // Only play music if audio is properly initialized
      if (!audioHandler.isInitialized()) {
        Logger.log(`Game: Audio not initialized, skipping game mode music`);
        return;
      }

      // Map game modes to music keys
      const musicKey = this.getMusicKeyForMode(this.currentGameMode);
      
      Logger.log(`Game: Starting music for mode '${this.currentGameMode}' -> '${musicKey}' (respecting global audio state)`);
      
      // Transition from menu music to game music
      audioHandler.stopMusic();
      audioHandler.playMusic(musicKey, true);
      
    } catch (error) {
      Logger.log(`Game: Failed to start game mode music - ${error}`);
    }
  }

  /**
   * Get appropriate music key for game mode
   * Requirements: 1.4
   */
  private getMusicKeyForMode(gameMode: string): string {
    switch (gameMode.toLowerCase()) {
      case 'easy':
        return 'easy-mode';
      case 'medium':
        return 'medium-mode';
      case 'hard':
        return 'hard-mode';
      case 'expert':
        return 'expert-mode';
      case 'zen':
        return 'zen-mode';
      default:
        Logger.log(`Game: Unknown game mode '${gameMode}', using medium-mode music`);
        return 'medium-mode';
    }
  }

  /**
   * Set the booster chance for dice glow effects
   * @param chance Probability between 0 and 1 (0% to 100%)
   */
  public setBoosterChance(chance: number): void {
    this.boosterChance = Math.max(0, Math.min(1, chance));
    setBoosterChance(this.boosterChance);
    Logger.log(`Game: Booster chance set to ${(this.boosterChance * 100).toFixed(1)}%`);
  }

  /**
   * Get the current booster chance
   * @returns Current booster chance (0-1)
   */
  public getBoosterChance(): number {
    return this.boosterChance;
  }

  /**
   * Initialize booster chance based on game mode
   * Different modes can have different booster frequencies
   */
  private initializeBoosterChance(): void {
    switch (this.currentGameMode.toLowerCase()) {
      case 'easy':
        this.setBoosterChance(0.20); // 20% chance in easy mode
        break;
      case 'medium':
        this.setBoosterChance(0.15); // 15% chance in medium mode
        break;
      case 'hard':
        this.setBoosterChance(0.10); // 10% chance in hard mode
        break;
      case 'expert':
        this.setBoosterChance(0.05); // 5% chance in expert mode
        break;
      case 'zen':
        this.setBoosterChance(0.25); // 25% chance in zen mode (more relaxed)
        break;
      default:
        this.setBoosterChance(0.15); // Default 15%
        break;
    }
  }

  /**
   * Initialize procedural generation systems
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private initializeProceduralSystems(): void {
    try {
      Logger.log('Game: Initializing procedural generation systems');

      // Initialize BlackDieManager for wild matching and area conversion
      this.blackDieManager = new BlackDieManager();
      Logger.log('Game: BlackDieManager initialized');

      // Initialize BoosterEffectSystem for visual glow effects
      this.boosterEffectSystem = new BoosterEffectSystem();
      Logger.log('Game: BoosterEffectSystem initialized');

      // Initialize ScoreMultiplierManager for difficulty-based score scaling
      this.scoreMultiplierManager = new ScoreMultiplierManager();
      Logger.log('Game: ScoreMultiplierManager initialized');

      // Get current difficulty configuration
      const gameConfig = this.registry.get('gameConfig') as any;
      if (gameConfig) {
        // Convert GameConfig to DifficultyModeConfig format
        this.currentDifficultyConfig = {
          id: this.currentGameMode as any,
          fallSpeed: gameConfig.fallSpeed || 800,
          scoreMultiplier: gameConfig.scoreMultiplier || 1.0,
          allowGravity: gameConfig.allowGravity !== false,
          maxPieceWidth: gameConfig.maxPieceWidth || 4,
          maxPieceHeight: gameConfig.maxPieceHeight || 4,
          maxDicePerPiece: gameConfig.maxDicePerPiece || 8,
          diceTypes: gameConfig.diceTypes || [6],
          allowBlackDice: gameConfig.allowBlackDice || false,
          uniformDiceRule: gameConfig.uniformDiceRule || false,
          boosterChance: gameConfig.boosterChance || 0.15
        };
        Logger.log(`Game: Difficulty config loaded for ${this.currentGameMode} mode`);
        Logger.log(`Game: Constraints - ${this.currentDifficultyConfig.maxPieceWidth}×${this.currentDifficultyConfig.maxPieceHeight}×${this.currentDifficultyConfig.maxDicePerPiece}`);
        Logger.log(`Game: Dice types: [${this.currentDifficultyConfig.diceTypes.join(', ')}]`);
        Logger.log(`Game: Black dice allowed: ${this.currentDifficultyConfig.allowBlackDice}`);
        Logger.log(`Game: Uniform dice rule: ${this.currentDifficultyConfig.uniformDiceRule}`);
        Logger.log(`Game: Booster chance: ${(this.currentDifficultyConfig.boosterChance * 100).toFixed(1)}%`);
        Logger.log(`Game: Score multiplier: ${this.currentDifficultyConfig.scoreMultiplier}x`);

        // Set difficulty config in ScoreMultiplierManager
        if (this.scoreMultiplierManager) {
          this.scoreMultiplierManager.setDifficultyConfig(this.currentDifficultyConfig);
        }
      } else {
        Logger.log('Game: Warning - No game config found, using default difficulty config');
        this.currentDifficultyConfig = {
          id: 'medium' as any,
          fallSpeed: 800,
          scoreMultiplier: 1.0,
          allowGravity: true,
          maxPieceWidth: 4,
          maxPieceHeight: 4,
          maxDicePerPiece: 8,
          diceTypes: [6, 8, 10, 12],
          allowBlackDice: false,
          uniformDiceRule: false,
          boosterChance: 0.15
        };

        // Set fallback difficulty config in ScoreMultiplierManager
        if (this.scoreMultiplierManager) {
          this.scoreMultiplierManager.setDifficultyConfig(this.currentDifficultyConfig);
        }
      }

      Logger.log('Game: Procedural generation systems initialized successfully');
    } catch (error) {
      Logger.log(`Game: Failed to initialize procedural systems - ${error}`);
      // Set fallback systems to null for graceful degradation
      this.blackDieManager = null;
      this.boosterEffectSystem = null;
      this.scoreMultiplierManager = null;
      this.currentDifficultyConfig = null;
    }
  }

  /**
   * Initialize particle system for visual effects
   * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 6.1, 6.3
   */
  private initializeParticleSystem(): void {
    try {
      Logger.log('Game: Initializing particle system');

      // Create particle system configuration based on game settings
      const particleConfig: ParticleSystemConfig = {
        maxParticles: 200, // Conservative limit for performance
        qualityLevel: 'medium', // Default quality level
        enableEffects: true,
        performanceMode: false
      };

      // Adjust quality based on device capabilities or user settings
      // TODO: Add settings integration for particle quality
      
      this.particleSystemManager = new ParticleSystemManager();
      this.particleSystemManager.initialize(this, particleConfig);
      
      Logger.log('Game: ParticleSystemManager initialized successfully');
      Logger.log(`Game: Particle system configured with max ${particleConfig.maxParticles} particles`);
      Logger.log(`Game: Particle quality level: ${particleConfig.qualityLevel}`);
      
    } catch (error) {
      Logger.log(`Game: Failed to initialize particle system - ${error}`);
      // Set fallback to null for graceful degradation
      this.particleSystemManager = null;
    }
  }

  /**
   * Hide text on matched dice immediately to prevent visual glitches
   * Requirements: 2.1, 2.4
   */
  private hideMatchedDiceText(matches: any[]): void {
    if (!matches || matches.length === 0) return;
    
    try {
      for (const match of matches) {
        if (match.positions && Array.isArray(match.positions)) {
          for (const position of match.positions) {
            // Find the sprite at this grid position in locked sprites
            const matchingSprite = this.lockedSprites.find((sprite) => {
              if (!sprite || !sprite.getData) return false;
              
              const spriteGridX = sprite.getData('gridX');
              const spriteGridY = sprite.getData('gridY');
              
              return spriteGridX === position.x && spriteGridY === position.y;
            });
            
            if (matchingSprite) {
              hideDieText(matchingSprite);
            }
          }
        }
      }
      
      Logger.log(`Game: Hidden text on matched dice for ${matches.length} match groups`);
      
    } catch (error) {
      Logger.log(`Game: Error hiding matched dice text - ${error}`);
    }
  }

  /**
   * Load fonts asynchronously before creating UI elements
   * Uses the shared FontLoader utility for consistent font loading across scenes
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private async loadFonts(): Promise<void> {
    try {
      Logger.log('Game: Starting font loading using FontLoader utility');
      
      // Use FontLoader utility to load Asimovian font (primary game font)
      await FontLoader.loadAsimovianFont(3000);
      
      Logger.log('Game: Font loading completed via FontLoader utility');
    } catch (error) {
      // FontLoader handles all error logging and fallback behavior internally
      Logger.log(`Game: FontLoader completed with fallback behavior - ${error}`);
    }
  }

  /**
   * Pause the game and show pause menu with audio controls
   * Requirements: 2.2, 2.4, 3.3, 3.4
   */
  private pauseGame(): void {
    try {
      if (this.isPaused) {
        Logger.log('Game: Already paused, ignoring pause request');
        return;
      }

      // Play pause sound effect
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playPause();
      }

      // Pause game timers
      this.pauseGameTimers();

      // Create pause menu with callbacks
      const pauseCallbacks: PauseMenuCallbacks = {
        onResume: () => this.resumeGame(),
        onSettings: () => this.openSettingsFromPause(),
        onMainMenu: () => this.returnToMainMenuFromPause(),
        onRestart: () => this.restartGameFromPause()
      };

      this.pauseMenuUI = new PauseMenuUI(this, pauseCallbacks);
      this.isPaused = true;
      
      Logger.log('Game: Paused with compact audio controls menu');
    } catch (error) {
      Logger.log(`Game: Error during pause - ${error}`);
      // Fallback to simple pause
      this.pauseGameTimers();
      this.isPaused = true;
    }
  }

  /**
   * Resume the game from pause menu
   * Requirements: 2.2, 2.4, 3.3, 3.4
   */
  private resumeGame(): void {
    try {
      if (!this.isPaused) {
        Logger.log('Game: Not paused, ignoring resume request');
        return;
      }

      // Clean up pause menu
      if (this.pauseMenuUI) {
        this.pauseMenuUI.destroy();
        this.pauseMenuUI = null;
      }

      // Resume game timers
      this.resumeGameTimers();

      // Play resume sound effect
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playResume();
      }

      this.isPaused = false;
      Logger.log('Game: Resumed from pause menu');
    } catch (error) {
      Logger.log(`Game: Error during resume - ${error}`);
      // Fallback to simple resume
      this.resumeGameTimers();
      this.isPaused = false;
    }
  }

  /**
   * Pause game timers
   */
  private pauseGameTimers(): void {
    if (this.dropTimer) {
      this.dropTimer.paused = true;
    }
    if (this.gravityTimer) {
      this.gravityTimer.paused = true;
    }
  }

  /**
   * Resume game timers
   */
  private resumeGameTimers(): void {
    if (this.dropTimer) {
      this.dropTimer.paused = false;
    }
    if (this.gravityTimer) {
      this.gravityTimer.paused = false;
    }
  }

  /**
   * Open full settings from pause menu
   * Requirements: 3.3, 3.4
   */
  private openSettingsFromPause(): void {
    try {
      // Clean up pause menu
      if (this.pauseMenuUI) {
        this.pauseMenuUI.destroy();
        this.pauseMenuUI = null;
      }

      // Store game state for return
      this.registry.set('pausedGameState', {
        gameMode: this.currentGameMode,
        score: this.score,
        activePiece: this.activePiece,
        nextPiece: this.nextPiece,
        gameBoard: this.gameBoard?.state
      });

      // Go to settings scene
      this.scene.start('Settings');
      Logger.log('Game: Opened settings from pause menu');
    } catch (error) {
      Logger.log(`Game: Error opening settings from pause - ${error}`);
      // Fallback to resume
      this.resumeGame();
    }
  }

  /**
   * Return to main menu from pause menu
   * Requirements: 3.3, 3.4
   */
  private returnToMainMenuFromPause(): void {
    try {
      // Clean up pause menu
      if (this.pauseMenuUI) {
        this.pauseMenuUI.destroy();
        this.pauseMenuUI = null;
      }

      // Stop game music and return to menu music (respecting global mute state)
      audioHandler.stopMusic();
      if (audioHandler.getMusicEnabled() && audioHandler.isInitialized()) {
        audioHandler.playMusic('menu-theme', true);
        Logger.log('Game: Returned to menu music (respecting global audio state)');
      } else {
        Logger.log('Game: Music disabled or not initialized, skipping menu music');
      }

      // Go to start menu
      this.scene.start('StartMenu');
      Logger.log('Game: Returned to main menu from pause');
    } catch (error) {
      Logger.log(`Game: Error returning to main menu from pause - ${error}`);
      // Fallback to direct scene transition
      this.scene.start('StartMenu');
    }
  }

  /**
   * Restart game from pause menu
   * Requirements: 3.3, 3.4
   */
  private restartGameFromPause(): void {
    try {
      // Clean up pause menu
      if (this.pauseMenuUI) {
        this.pauseMenuUI.destroy();
        this.pauseMenuUI = null;
      }

      // Restart the game scene with same mode
      this.scene.restart({ gameMode: this.currentGameMode });
      Logger.log('Game: Restarted from pause menu');
    } catch (error) {
      Logger.log(`Game: Error restarting from pause - ${error}`);
      // Fallback to scene restart
      this.scene.restart();
    }
  }

  /**
   * Validates UI system readiness after GameUI creation
   */
  private validateUISystemReadiness(): void {
    Logger.log('VALIDATION: Checking UI system readiness');

    if (!this.gameUI) {
      Logger.log('VALIDATION ERROR: GameUI not created');
      return;
    }

    // Check if board metrics are available and valid
    const boardMetrics = (this.gameUI as any).boardMetrics;
    if (!boardMetrics) {
      Logger.log('VALIDATION WARNING: Board metrics not available in GameUI');
    } else {
      Logger.log(
        `VALIDATION: Board metrics available - cellW: ${boardMetrics.cellW}, cellH: ${boardMetrics.cellH}`
      );
      Logger.log(
        `VALIDATION: Board dimensions - boardW: ${boardMetrics.boardW}, boardH: ${boardMetrics.boardH}`
      );
      Logger.log(
        `VALIDATION: Board position - boardX: ${boardMetrics.boardX}, boardY: ${boardMetrics.boardY}`
      );

      if (boardMetrics.cellW <= 0 || boardMetrics.cellH <= 0) {
        Logger.log('VALIDATION ERROR: Invalid cell dimensions in board metrics');
      }
    }

    // Check if next piece metrics are available
    const nextMetrics = (this.gameUI as any).nextMetrics;
    if (!nextMetrics) {
      Logger.log('VALIDATION WARNING: Next piece metrics not available in GameUI');
    } else {
      Logger.log(
        `VALIDATION: Next piece metrics available - cellW: ${nextMetrics.cellW}, cellH: ${nextMetrics.cellH}`
      );
    }

    // Check if Phaser scene is ready for sprite creation
    if (!this.scene || !this.add) {
      Logger.log('VALIDATION ERROR: Phaser scene or add manager not ready');
    } else {
      Logger.log('VALIDATION: Phaser scene and add manager ready');
    }

    Logger.log('VALIDATION: UI system readiness check complete');
  }

  /**
   * Validates the result of first piece spawn
   */
  private validateFirstPieceSpawn(): void {
    Logger.log('VALIDATION: Checking first piece spawn result');

    if (!this.activePiece) {
      Logger.log('VALIDATION ERROR: No active piece after spawn attempt');
      return;
    }

    Logger.log(
      `VALIDATION: Active piece created - ID: ${this.activePiece.id}, shape: ${this.activePiece.shape}`
    );
    Logger.log(`VALIDATION: Active piece position: (${this.activePiece.x}, ${this.activePiece.y})`);
    Logger.log(`VALIDATION: Active piece rotation: ${this.activePiece.rotation}°`);

    if (!this.activePiece.dice || !Array.isArray(this.activePiece.dice)) {
      Logger.log('VALIDATION ERROR: Active piece has no dice array');
      return;
    }

    Logger.log(`VALIDATION: Active piece has ${this.activePiece.dice.length} dice`);

    this.activePiece.dice.forEach((die: any, index: number) => {
      Logger.log(
        `VALIDATION: Die ${index} - ID: ${die.id}, color: ${die.color}, sides: ${die.sides}, number: ${die.number}`
      );
      Logger.log(
        `VALIDATION: Die ${index} relative position: (${die.relativePos.x}, ${die.relativePos.y})`
      );

      const absoluteX = this.activePiece.x + die.relativePos.x;
      const absoluteY = this.activePiece.y + die.relativePos.y;
      Logger.log(`VALIDATION: Die ${index} absolute position: (${absoluteX}, ${absoluteY})`);
    });

    Logger.log('VALIDATION: First piece spawn validation complete');
  }

  /**
   * Validates the result of initial render
   */
  private validateInitialRender(): void {
    Logger.log('VALIDATION: Checking initial render result');

    Logger.log(`VALIDATION: Active sprites count: ${this.activeSprites.length}`);
    Logger.log(`VALIDATION: Next sprites count: ${this.nextSprites.length}`);
    Logger.log(`VALIDATION: Locked sprites count: ${this.lockedSprites.length}`);

    if (this.activePiece && this.activePiece.dice) {
      const expectedActiveSprites = this.activePiece.dice.length;
      const actualActiveSprites = this.activeSprites.length;

      Logger.log(
        `VALIDATION: Expected ${expectedActiveSprites} active sprites, got ${actualActiveSprites}`
      );

      if (expectedActiveSprites !== actualActiveSprites) {
        Logger.log('VALIDATION ERROR: Mismatch between expected and actual active sprites');
        Logger.log(
          'VALIDATION ERROR: This indicates a sprite creation failure for the first piece'
        );
      }
    }

    // Check sprite visibility and properties
    this.activeSprites.forEach((sprite, index) => {
      if (sprite) {
        Logger.log(
          `VALIDATION: Active sprite ${index} - visible: ${sprite.visible}, alpha: ${sprite.alpha}, x: ${sprite.x}, y: ${sprite.y}`
        );
      } else {
        Logger.log(`VALIDATION ERROR: Active sprite ${index} is null or undefined`);
      }
    });

    Logger.log('VALIDATION: Initial render validation complete');
  }

  /**
   * Logs a comprehensive summary of the initialization process
   */
  private logInitializationSummary(): void {
    const totalTime =
      this.initializationMetrics.sceneCreateEnd - this.initializationMetrics.sceneCreateStart;

    Logger.log('=== INITIALIZATION SUMMARY ===');
    Logger.log(`TOTAL INITIALIZATION TIME: ${totalTime.toFixed(2)}ms`);
    Logger.log('');
    Logger.log('TIMING BREAKDOWN:');
    Logger.log(
      `  Background setup: ${(this.initializationMetrics.backgroundSetComplete - this.initializationMetrics.sceneCreateStart).toFixed(2)}ms`
    );
    Logger.log(
      `  Registry setup: ${(this.initializationMetrics.registrySetupComplete - this.initializationMetrics.backgroundSetComplete).toFixed(2)}ms`
    );
    Logger.log(
      `  GameBoard init: ${(this.initializationMetrics.gameBoardInitComplete - this.initializationMetrics.registrySetupComplete).toFixed(2)}ms`
    );
    Logger.log(
      `  CoordinateConverter init: ${(this.initializationMetrics.coordinateConverterInitComplete - this.initializationMetrics.gameBoardInitComplete).toFixed(2)}ms`
    );
    Logger.log(
      `  GameUI creation: ${(this.initializationMetrics.gameUICreateComplete - this.initializationMetrics.gameUICreateStart).toFixed(2)}ms`
    );
    Logger.log(
      `  First piece generation: ${(this.initializationMetrics.firstPieceGenerationComplete - this.initializationMetrics.firstPieceGenerationStart).toFixed(2)}ms`
    );
    Logger.log(
      `  First piece spawn: ${(this.initializationMetrics.firstPieceSpawnComplete - this.initializationMetrics.firstPieceSpawnStart).toFixed(2)}ms`
    );
    Logger.log(
      `  Timers setup: ${(this.initializationMetrics.timersSetupComplete - this.initializationMetrics.firstPieceSpawnComplete).toFixed(2)}ms`
    );
    Logger.log(
      `  Initial render: ${(this.initializationMetrics.initialRenderComplete - this.initializationMetrics.initialRenderStart).toFixed(2)}ms`
    );
    Logger.log('');
    Logger.log('CRITICAL TIMING ANALYSIS:');

    const uiCreationTime =
      this.initializationMetrics.gameUICreateComplete -
      this.initializationMetrics.gameUICreateStart;
    const firstSpawnTime =
      this.initializationMetrics.firstPieceSpawnComplete -
      this.initializationMetrics.firstPieceSpawnStart;
    const initialRenderTime =
      this.initializationMetrics.initialRenderComplete -
      this.initializationMetrics.initialRenderStart;

    if (uiCreationTime > 100) {
      Logger.log(
        `  WARNING: GameUI creation took ${uiCreationTime.toFixed(2)}ms (>100ms threshold)`
      );
    }

    if (firstSpawnTime > 50) {
      Logger.log(
        `  WARNING: First piece spawn took ${firstSpawnTime.toFixed(2)}ms (>50ms threshold)`
      );
    }

    if (initialRenderTime > 100) {
      Logger.log(
        `  WARNING: Initial render took ${initialRenderTime.toFixed(2)}ms (>100ms threshold)`
      );
    }

    Logger.log('=== END INITIALIZATION SUMMARY ===');
  }

  private renderGameState(): void {
    const renderStartTime = performance.now();
    Logger.log('=== RENDER STATE DIAGNOSTIC: Starting renderGameState() ===');

    if (!this.gameUI) {
      Logger.log('RENDER ERROR: No gameUI available for rendering');
      return;
    }

    const { boardMetrics, nextMetrics } = this.gameUI;

    // Validate metrics before rendering
    Logger.log('RENDER METRICS: Validating UI metrics');
    Logger.log(`RENDER METRICS: Board metrics available: ${!!boardMetrics}`);
    Logger.log(`RENDER METRICS: Next metrics available: ${!!nextMetrics}`);

    if (boardMetrics) {
      Logger.log(
        `RENDER METRICS: Board - cellW: ${boardMetrics.cellW}, cellH: ${boardMetrics.cellH}`
      );
      Logger.log(
        `RENDER METRICS: Board - position: (${boardMetrics.boardX}, ${boardMetrics.boardY})`
      );
      Logger.log(
        `RENDER METRICS: Board - dimensions: ${boardMetrics.boardW}x${boardMetrics.boardH}`
      );
      Logger.log(`RENDER METRICS: Board - grid: ${boardMetrics.cols}x${boardMetrics.rows}`);
    } else {
      Logger.log('RENDER ERROR: Board metrics not available');
    }

    if (nextMetrics) {
      Logger.log(`RENDER METRICS: Next - cellW: ${nextMetrics.cellW}, cellH: ${nextMetrics.cellH}`);
      Logger.log(`RENDER METRICS: Next - position: (${nextMetrics.nextX}, ${nextMetrics.nextY})`);
    } else {
      Logger.log('RENDER WARNING: Next metrics not available');
    }

    // Clear existing sprites
    const clearStartTime = performance.now();
    Logger.log('RENDER CLEAR: Clearing existing sprites');
    this.clearSprites();
    const clearEndTime = performance.now();
    Logger.log(
      `RENDER CLEAR: Sprite clearing took ${(clearEndTime - clearStartTime).toFixed(2)}ms`
    );

    // Render active piece
    const activeRenderStart = performance.now();
    Logger.log('RENDER ACTIVE: Starting active piece render');
    this.renderActivePiece(boardMetrics);
    const activeRenderEnd = performance.now();
    Logger.log(
      `RENDER ACTIVE: Active piece render took ${(activeRenderEnd - activeRenderStart).toFixed(2)}ms`
    );

    // Render next piece
    const nextRenderStart = performance.now();
    Logger.log('RENDER NEXT: Starting next piece render');
    this.renderNextPiece(nextMetrics);
    const nextRenderEnd = performance.now();
    Logger.log(
      `RENDER NEXT: Next piece render took ${(nextRenderEnd - nextRenderStart).toFixed(2)}ms`
    );

    // Render locked pieces
    const lockedRenderStart = performance.now();
    Logger.log('RENDER LOCKED: Starting locked pieces render');
    this.renderLockedPieces(boardMetrics);
    const lockedRenderEnd = performance.now();
    Logger.log(
      `RENDER LOCKED: Locked pieces render took ${(lockedRenderEnd - lockedRenderStart).toFixed(2)}ms`
    );

    const totalRenderTime = performance.now() - renderStartTime;
    Logger.log(`RENDER COMPLETE: Total renderGameState() time: ${totalRenderTime.toFixed(2)}ms`);
    Logger.log(
      `RENDER SUMMARY: Active sprites: ${this.activeSprites.length}, Next sprites: ${this.nextSprites.length}, Locked sprites: ${this.lockedSprites.length}`
    );
    Logger.log('=== RENDER STATE DIAGNOSTIC: renderGameState() completed ===');
  }

  private clearSprites(): void {
    // Clear active piece sprites
    this.activeSprites.forEach((sprite) => {
      try {
        cleanupDie(sprite);
      } catch (e) {
        /* ignore */
      }
    });
    this.activeSprites = [];

    // Clear next piece sprites
    this.nextSprites.forEach((sprite) => {
      try {
        cleanupDie(sprite);
      } catch (e) {
        /* ignore */
      }
    });
    this.nextSprites = [];
  }

  private renderActivePiece(boardMetrics: any): void {
    if (!this.activePiece || !this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('RENDER ACTIVE: No active piece or dice to render');
      return;
    }

    Logger.log(
      `RENDER ACTIVE: Starting render of active piece with ${this.activePiece.dice.length} dice`
    );
    Logger.log(
      `RENDER ACTIVE: Piece position: (${this.activePiece.x}, ${this.activePiece.y}), shape: ${this.activePiece.shape}`
    );
    Logger.log(
      `RENDER ACTIVE: Board metrics available: ${!!boardMetrics}, cellW: ${boardMetrics?.cellW}, cellH: ${boardMetrics?.cellH}`
    );

    let successfulSprites = 0;
    let failedSprites = 0;

    this.activePiece.dice.forEach((die: any, index: number) => {
      const renderStartTime = performance.now();
      const gridX = this.activePiece.x + die.relativePos.x;
      const gridY = this.activePiece.y + die.relativePos.y;

      Logger.log(
        `RENDER ACTIVE DIE ${index}: Starting render for die ID=${die.id}, color=${die.color}, sides=${die.sides}`
      );
      Logger.log(
        `RENDER ACTIVE DIE ${index}: Relative pos=(${die.relativePos.x}, ${die.relativePos.y}), absolute grid pos=(${gridX}, ${gridY})`
      );

      // Validate coordinate conversion inputs
      if (!this.coordinateConverter) {
        Logger.log(`RENDER ACTIVE DIE ${index}: ERROR - CoordinateConverter not available`);
        failedSprites++;
        return;
      }

      if (
        !boardMetrics ||
        typeof boardMetrics.cellW !== 'number' ||
        typeof boardMetrics.cellH !== 'number'
      ) {
        Logger.log(
          `RENDER ACTIVE DIE ${index}: ERROR - Invalid board metrics: ${JSON.stringify(boardMetrics)}`
        );
        failedSprites++;
        return;
      }

      // Convert grid coordinates to screen pixel coordinates using CoordinateConverter
      const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);
      Logger.log(
        `RENDER ACTIVE DIE ${index}: Coordinate conversion: grid(${gridX}, ${gridY}) -> screen(${screenPos.x}, ${screenPos.y})`
      );

      // Validate screen position
      if (
        typeof screenPos.x !== 'number' ||
        typeof screenPos.y !== 'number' ||
        !isFinite(screenPos.x) ||
        !isFinite(screenPos.y)
      ) {
        Logger.log(
          `RENDER ACTIVE DIE ${index}: ERROR - Invalid screen position: (${screenPos.x}, ${screenPos.y})`
        );
        failedSprites++;
        return;
      }

      // Attempt sprite creation with detailed logging
      Logger.log(
        `RENDER ACTIVE DIE ${index}: Attempting sprite creation at screen(${screenPos.x}, ${screenPos.y}) with size(${boardMetrics.cellW}, ${boardMetrics.cellH})`
      );

      try {
        const sprite = drawDie(
          this,
          screenPos.x,
          screenPos.y,
          boardMetrics.cellW,
          boardMetrics.cellH,
          die
        ) as Phaser.GameObjects.Container | null;

        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;

        if (sprite) {
          this.activeSprites.push(sprite);
          successfulSprites++;
          Logger.log(
            `RENDER ACTIVE DIE ${index}: SUCCESS - Created sprite in ${renderDuration.toFixed(2)}ms at screen(${screenPos.x}, ${screenPos.y})`
          );
          Logger.log(
            `RENDER ACTIVE DIE ${index}: Sprite properties: visible=${sprite.visible}, alpha=${sprite.alpha}, scale=${sprite.scale}`
          );
        } else {
          failedSprites++;
          Logger.log(
            `RENDER ACTIVE DIE ${index}: FAILED - drawDie returned null after ${renderDuration.toFixed(2)}ms`
          );
        }
      } catch (error) {
        failedSprites++;
        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;
        Logger.log(
          `RENDER ACTIVE DIE ${index}: ERROR - Exception during sprite creation after ${renderDuration.toFixed(2)}ms: ${error}`
        );
      }
    });

    Logger.log(
      `RENDER ACTIVE: Completed - ${successfulSprites} successful, ${failedSprites} failed sprites`
    );
    Logger.log(`RENDER ACTIVE: Total active sprites now: ${this.activeSprites.length}`);
  }

  private renderNextPiece(nextMetrics: any): void {
    if (!this.nextPiece || !this.nextPiece.dice) {
      Logger.log('RENDER NEXT: No next piece or dice to render');
      return;
    }

    Logger.log(
      `RENDER NEXT: Starting render of next piece with ${this.nextPiece.dice.length} dice`
    );
    Logger.log(`RENDER NEXT: Piece shape: ${this.nextPiece.shape}, ID: ${this.nextPiece.id}`);
    Logger.log(
      `RENDER NEXT: Next metrics available: ${!!nextMetrics}, cellW: ${nextMetrics?.cellW}, cellH: ${nextMetrics?.cellH}`
    );
    Logger.log(
      `RENDER NEXT: Local coords - nextX: ${nextMetrics?.nextX}, nextY: ${nextMetrics?.nextY}`
    );
    Logger.log(
      `RENDER NEXT: Global coords - globalNextX: ${nextMetrics?.globalNextX}, globalNextY: ${nextMetrics?.globalNextY}`
    );

    // Find the minimum coordinates to align piece to bottom-left of display area
    const minX = Math.min(...this.nextPiece.dice.map((die: any) => die.relativePos.x));
    const minY = Math.min(...this.nextPiece.dice.map((die: any) => die.relativePos.y));

    Logger.log(`RENDER NEXT: Piece bounds - minX: ${minX}, minY: ${minY}`);

    // Align piece to bottom-left of next piece display (grid-aligned, not centered)
    // Offset to normalize the piece so its bottom-left die starts at (0,0) in the display
    const offsetX = -minX;
    const offsetY = -minY;

    Logger.log(
      `RENDER NEXT: Using grid-aligned positioning - offsetX: ${offsetX}, offsetY: ${offsetY}`
    );

    let successfulSprites = 0;
    let failedSprites = 0;

    this.nextPiece.dice.forEach((die: any, index: number) => {
      const renderStartTime = performance.now();

      // Apply offset to align piece to grid
      const gridX = die.relativePos.x + offsetX;
      const gridY = die.relativePos.y + offsetY;

      // Calculate global pixel position for sprite rendering
      // Use global coordinates since sprites are added to the main scene, not the right column container
      const px = nextMetrics.globalNextX + gridX * nextMetrics.cellW;
      const py = nextMetrics.globalNextY + gridY * nextMetrics.cellH;

      Logger.log(
        `RENDER NEXT DIE ${index}: Die ID=${die.id}, color=${die.color}, sides=${die.sides}`
      );
      Logger.log(
        `RENDER NEXT DIE ${index}: Relative pos=(${die.relativePos.x}, ${die.relativePos.y}), grid pos=(${gridX}, ${gridY})`
      );
      Logger.log(`RENDER NEXT DIE ${index}: Pixel position=(${px}, ${py})`);

      // Validate pixel position
      if (typeof px !== 'number' || typeof py !== 'number' || !isFinite(px) || !isFinite(py)) {
        Logger.log(`RENDER NEXT DIE ${index}: ERROR - Invalid pixel position: (${px}, ${py})`);
        failedSprites++;
        return;
      }

      try {
        const sprite = drawDie(
          this,
          px,
          py,
          nextMetrics.cellW,
          nextMetrics.cellH,
          die
        ) as Phaser.GameObjects.Container | null;

        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;

        if (sprite) {
          this.nextSprites.push(sprite);
          successfulSprites++;
          Logger.log(
            `RENDER NEXT DIE ${index}: SUCCESS - Created sprite in ${renderDuration.toFixed(2)}ms at pixel(${px}, ${py})`
          );
          Logger.log(
            `RENDER NEXT DIE ${index}: Sprite properties: visible=${sprite.visible}, alpha=${sprite.alpha}, scale=${sprite.scale}`
          );
        } else {
          failedSprites++;
          Logger.log(
            `RENDER NEXT DIE ${index}: FAILED - drawDie returned null after ${renderDuration.toFixed(2)}ms`
          );
        }
      } catch (error) {
        failedSprites++;
        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;
        Logger.log(
          `RENDER NEXT DIE ${index}: ERROR - Exception during sprite creation after ${renderDuration.toFixed(2)}ms: ${error}`
        );
      }
    });

    Logger.log(
      `RENDER NEXT: Completed - ${successfulSprites} successful, ${failedSprites} failed sprites`
    );
    Logger.log(`RENDER NEXT: Total next sprites now: ${this.nextSprites.length}`);
    Logger.log(
      `RENDER NEXT: Next piece positioned with grid alignment (bottom-left aligned, not centered)`
    );
  }

  private renderLockedPieces(boardMetrics: any): void {
    if (!this.gameBoard) return;

    const { height, width, cells } = this.gameBoard.state;

    // Clear old locked sprites
    this.lockedSprites.forEach((sprite) => {
      try {
        cleanupDie(sprite);
      } catch (e) {
        /* ignore */
      }
    });
    this.lockedSprites = [];

    // Render all locked dice using bottom-left coordinate system
    for (let gridY = 0; gridY < height; gridY++) {
      // Convert grid Y to array index for accessing the cells array
      const arrayY = this.coordinateConverter.gridToArrayY(gridY);
      const row = cells[arrayY];
      if (!row) continue;

      for (let gridX = 0; gridX < width; gridX++) {
        const die = row[gridX];
        if (!die) continue;

        // Convert grid coordinates to screen pixel coordinates
        const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);

        const sprite = drawDie(
          this,
          screenPos.x,
          screenPos.y,
          boardMetrics.cellW,
          boardMetrics.cellH,
          die
        ) as Phaser.GameObjects.Container | null;

        if (sprite) {
          this.lockedSprites.push(sprite);
        }
      }
    }
  }

  /**
   * Generate a multi-die piece using procedural generation system
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private generateMultiDiePiece(): any {
    try {
      // Use procedural generation if systems are available
      if (this.currentDifficultyConfig) {
        Logger.log('Game: Generating piece using ProceduralPieceGenerator');
        Logger.log(`Game: Using constraints - ${this.currentDifficultyConfig.maxPieceWidth}×${this.currentDifficultyConfig.maxPieceHeight}×${this.currentDifficultyConfig.maxDicePerPiece}`);
        
        const proceduralPiece = ProceduralPieceGenerator.generatePiece(this.currentDifficultyConfig);
        
        // Convert procedural piece to game-compatible format
        const convertedDice = proceduralPiece.dice.map((enhancedDie) => {
          const die: any = {
            id: enhancedDie.id,
            sides: enhancedDie.sides,
            number: enhancedDie.number,
            color: enhancedDie.color,
            relativePos: enhancedDie.relativePos,
            // Preserve enhanced properties for future use
            isBlack: enhancedDie.isBlack,
            isWild: enhancedDie.isWild,
            boosterType: enhancedDie.boosterType
          };
          
          // Only set glowColor if it exists
          if (enhancedDie.glowColor) {
            die.glowColor = enhancedDie.glowColor;
          }
          
          // Apply existing glow color determination for compatibility
          // This ensures the existing renderer can handle the dice
          if (!die.glowColor && enhancedDie.boosterType && enhancedDie.boosterType !== 'none') {
            determineGlowColor(die);
          }
          
          return die;
        });

        // Generate a descriptive shape name based on piece characteristics
        const shapeDescription = this.generateShapeDescription(proceduralPiece);

        const piece = {
          id: `procedural-piece-${Date.now()}`,
          shape: shapeDescription,
          dice: convertedDice,
          rotation: 0,
          // Store procedural metadata for debugging
          proceduralMetadata: {
            width: proceduralPiece.width,
            height: proceduralPiece.height,
            centerX: proceduralPiece.centerX,
            centerY: proceduralPiece.centerY,
            diceCount: proceduralPiece.dice.length,
            hasBlackDice: proceduralPiece.dice.some(d => d.isBlack),
            boosterCount: proceduralPiece.dice.filter(d => d.boosterType && d.boosterType !== 'none').length
          }
        };

        Logger.log(`Game: Generated ${shapeDescription} piece with ${convertedDice.length} dice`);
        Logger.log(`Game: Piece dimensions: ${proceduralPiece.width}×${proceduralPiece.height}`);
        Logger.log(`Game: Black dice: ${piece.proceduralMetadata.hasBlackDice ? 'Yes' : 'No'}`);
        Logger.log(`Game: Booster dice: ${piece.proceduralMetadata.boosterCount}/${convertedDice.length}`);

        return piece;
      }
    } catch (error) {
      Logger.log(`Game: Procedural generation failed, falling back to legacy system - ${error}`);
    }

    // Fallback to legacy hardcoded piece generation
    Logger.log('Game: Using legacy piece generation system');
    return this.generateLegacyPiece();
  }

  /**
   * Legacy piece generation system as fallback
   * Maintains compatibility with existing game logic
   */
  private generateLegacyPiece(): any {
    // Define piece shapes (relative positions from origin)
    const pieceShapes = [
      // Single die
      { name: 'single', positions: [{ x: 0, y: 0 }] },
      // Line pieces
      {
        name: 'line2',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
      {
        name: 'line3',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      },
      // L-shapes
      {
        name: 'L3',
        positions: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      // Square
      {
        name: 'square',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      // T-shape
      {
        name: 'T',
        positions: [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
    ];

    const diceTypes: number[] = (this.registry.get('gameConfig') as any)?.diceTypes || [6];
    const palette: string[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'teal', 'gray'];

    // Select random shape
    const shape = pieceShapes[Math.floor(Math.random() * pieceShapes.length)];
    if (!shape) {
      // Fallback to single die if no shape found
      const fallbackShape = { name: 'single', positions: [{ x: 0, y: 0 }] };
      const dice = fallbackShape.positions.map((pos, index) => {
        const sides = diceTypes[Math.floor(Math.random() * diceTypes.length)] || 6;
        const color: string = palette[sides % palette.length] || 'gray';
        
        const die = {
          id: `legacy-${Date.now()}-${index}`,
          sides,
          number: Math.ceil(Math.random() * sides),
          color,
          relativePos: pos,
        };
        
        // Determine and store glow color for this die
        determineGlowColor(die);
        
        return die;
      });
      return {
        id: `legacy-piece-${Date.now()}`,
        shape: fallbackShape.name,
        dice,
        rotation: 0,
      };
    }

    // Create dice for each position
    const dice = shape.positions.map((pos, index) => {
      const sides = diceTypes[Math.floor(Math.random() * diceTypes.length)] || 6;
      const color: string = palette[sides % palette.length] || 'gray';
      
      const die = {
        id: `legacy-${Date.now()}-${index}`,
        sides,
        number: Math.ceil(Math.random() * sides),
        color,
        relativePos: pos,
      };
      
      // Determine and store glow color for this die
      determineGlowColor(die);
      
      return die;
    });

    return {
      id: `legacy-piece-${Date.now()}`,
      shape: shape.name,
      dice,
      rotation: 0,
    };
  }

  /**
   * Generate a descriptive shape name for procedurally generated pieces
   * @param piece The procedural piece to describe
   * @returns A descriptive shape name
   */
  private generateShapeDescription(piece: any): string {
    const diceCount = piece.dice.length;
    const width = piece.width;
    const height = piece.height;

    // Generate description based on piece characteristics
    if (diceCount === 1) {
      return 'single';
    } else if (width === 1 && height > 1) {
      return `vertical-line-${diceCount}`;
    } else if (height === 1 && width > 1) {
      return `horizontal-line-${diceCount}`;
    } else if (width === height && width === 2) {
      return 'square';
    } else if (width === height) {
      return `square-${width}x${height}`;
    } else {
      return `procedural-${width}x${height}-${diceCount}dice`;
    }
  }

  private handleBoardTouch(gridX: number, gridY: number): void {
    Logger.log(`Board touched at bottom-left grid position (${gridX}, ${gridY})`);
    
    if (!this.activePiece || !this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('No active piece to move via touch');
      return;
    }

    // Calculate the target X position for the piece based on touch
    const targetX = gridX;
    
    // Try to move the piece horizontally to align with the touched column
    const currentX = this.activePiece.x;
    const deltaX = targetX - currentX;
    
    Logger.log(`Touch-based movement: current X=${currentX}, target X=${targetX}, delta=${deltaX}`);
    
    if (deltaX !== 0) {
      // Move piece horizontally towards the touched position
      const moveDirection = deltaX > 0 ? 1 : -1;
      const movesNeeded = Math.abs(deltaX);
      
      // Perform multiple single-step moves to reach the target position
      // This ensures collision detection works properly for each step
      let movesMade = 0;
      for (let i = 0; i < movesNeeded; i++) {
        const newX = this.activePiece.x + moveDirection;
        
        if (this.canPlacePiece(this.activePiece, newX, this.activePiece.y)) {
          this.activePiece.x = newX;
          movesMade++;
          Logger.log(`Touch move step ${i + 1}: moved to X=${this.activePiece.x}`);
        } else {
          Logger.log(`Touch move blocked at step ${i + 1}: cannot move to X=${newX}`);
          break; // Stop if we hit an obstacle
        }
      }
      
      if (movesMade > 0) {
        // Play movement sound effect for successful touch movement
        if (this.soundEffectLibrary) {
          this.soundEffectLibrary.playPieceRotation(); // Use rotation sound for touch movement
        }
        
        this.renderGameState();
        Logger.log(`Touch movement complete: moved ${movesMade} steps to X=${this.activePiece.x}`);
      } else {
        Logger.log('Touch movement failed: no valid moves possible');
      }
    } else {
      Logger.log('Touch movement: piece already at target X position');
    }
  }

  private spawnPiece(): void {
    const spawnStartTime = performance.now();
    Logger.log('=== SPAWN PIECE DIAGNOSTIC: Starting spawnPiece() ===');
    Logger.log(`SPAWN TIMING: spawnPiece() called at ${spawnStartTime}ms`);

    // Reset cascade multiplier for new piece (cascades are per-piece)
    this.cascadeMultiplier = 1;
    Logger.log('SPAWN: Reset cascade multiplier to 1 for new piece');

    // Validate system readiness before spawning
    if (!this.gameBoard) {
      Logger.log('SPAWN ERROR: No gameBoard available in spawnPiece');
      return;
    }

    if (!this.coordinateConverter) {
      Logger.log('SPAWN ERROR: No coordinateConverter available in spawnPiece');
      return;
    }

    if (!this.gameUI) {
      Logger.log('SPAWN ERROR: No gameUI available in spawnPiece');
      return;
    }

    const w = this.gameBoard.state.width;
    Logger.log(`SPAWN STATE: Grid width: ${w}, height: ${this.gameBoard.state.height}`);
    Logger.log(`SPAWN STATE: CoordinateConverter ready: ${!!this.coordinateConverter}`);
    Logger.log(`SPAWN STATE: GameUI ready: ${!!this.gameUI}`);

    // Check UI metrics availability
    const boardMetrics = (this.gameUI as any).boardMetrics;
    const nextMetrics = (this.gameUI as any).nextMetrics;
    Logger.log(`SPAWN STATE: Board metrics available: ${!!boardMetrics}`);
    Logger.log(`SPAWN STATE: Next metrics available: ${!!nextMetrics}`);

    if (boardMetrics) {
      Logger.log(
        `SPAWN STATE: Board metrics - cellW: ${boardMetrics.cellW}, cellH: ${boardMetrics.cellH}`
      );
      Logger.log(
        `SPAWN STATE: Board metrics - boardX: ${boardMetrics.boardX}, boardY: ${boardMetrics.boardY}`
      );
    }

    // If there's a nextPiece preview, promote it to active; otherwise generate new
    const next = this.nextPiece;
    let pieceToUse = next || this.generateMultiDiePiece();

    if (next) {
      Logger.log(
        `SPAWN PIECE: Using existing next piece: ${next.shape} with ${next.dice.length} dice`
      );
      Logger.log(`SPAWN PIECE: Next piece ID: ${next.id}, rotation: ${next.rotation}°`);
    } else {
      Logger.log('SPAWN PIECE: No next piece available, generated new piece');
      Logger.log(
        `SPAWN PIECE: Generated piece: ${pieceToUse.shape} with ${pieceToUse.dice.length} dice`
      );
    }

    // Log piece dice details
    pieceToUse.dice.forEach((die: any, index: number) => {
      Logger.log(
        `SPAWN PIECE DIE ${index}: ID=${die.id}, color=${die.color}, sides=${die.sides}, relativePos=(${die.relativePos.x}, ${die.relativePos.y})`
      );
    });

    // Position piece ABOVE the grid using bottom-left coordinate system
    const x = GAME_CONSTANTS.SPAWN_X_CENTER; // Use constant for spawn X position

    // Find the lowest die in the piece (smallest Y in relative coordinates)
    const minRelativeY = Math.min(...pieceToUse.dice.map((die: any) => die.relativePos.y));

    // Calculate spawn Y position using constants: spawn so the lowest die starts closer to visible grid
    // When it falls one step, lowest die will be at Y=16, then Y=15, etc.
    const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);

    Logger.log(`SPAWN POSITION: Calculated spawn position with bottom-left coordinates:`);
    Logger.log(`SPAWN POSITION: - Spawn X: ${x} (center of grid)`);
    Logger.log(`SPAWN POSITION: - Min relative Y: ${minRelativeY}`);
    Logger.log(`SPAWN POSITION: - Calculated spawn Y: ${spawnY}`);
    Logger.log(
      `SPAWN POSITION: - Lowest die absolute Y: ${spawnY + minRelativeY} (should be 17 for closer spawn)`
    );

    // Create the piece object to test collision
    const newActivePiece = {
      ...pieceToUse,
      x,
      y: spawnY,
    };

    Logger.log(`SPAWN COLLISION: Testing piece placement at (${x}, ${spawnY})`);

    // Check if the piece can enter the grid (game over condition)
    // Try to move the piece down one step to see if it can enter the grid from Y=17 to Y=16
    const enterGridY = spawnY - 1; // Moving down means decreasing Y in bottom-left system
    Logger.log(`SPAWN COLLISION: Testing grid entry from Y=${spawnY} to Y=${enterGridY}`);

    if (!this.canPlacePiece(newActivePiece, x, enterGridY)) {
      Logger.log(
        `SPAWN GAME OVER: Cannot enter grid - collision detected when trying to move from Y=${spawnY} to Y=${enterGridY}`
      );
      
      // Play game over sound effect
      // Requirements: 2.2, 2.4
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playGameOver();
      }
      
      // Show score submission interface instead of directly going to GameOver
      this.showScoreSubmissionInterface();
      return;
    }

    Logger.log(`SPAWN COLLISION: Grid entry test passed - piece can spawn safely`);

    this.activePiece = newActivePiece;
    const spawnCompleteTime = performance.now();
    Logger.log(
      `SPAWN SUCCESS: Active piece created at bottom-left coordinates (${x}, ${spawnY}): ${newActivePiece.shape}`
    );
    Logger.log(
      `SPAWN SUCCESS: Piece spawn took ${(spawnCompleteTime - spawnStartTime).toFixed(2)}ms`
    );

    // Log final active piece state
    Logger.log(`SPAWN RESULT: Active piece final state:`);
    Logger.log(`SPAWN RESULT: - ID: ${this.activePiece.id}`);
    Logger.log(`SPAWN RESULT: - Shape: ${this.activePiece.shape}`);
    Logger.log(`SPAWN RESULT: - Position: (${this.activePiece.x}, ${this.activePiece.y})`);
    Logger.log(`SPAWN RESULT: - Rotation: ${this.activePiece.rotation}°`);
    Logger.log(`SPAWN RESULT: - Dice count: ${this.activePiece.dice.length}`);

    // Generate fresh nextPiece for preview
    const nextGenStartTime = performance.now();
    this.nextPiece = this.generateMultiDiePiece();
    const nextGenEndTime = performance.now();
    Logger.log(
      `SPAWN NEXT: Generated next piece: ${this.nextPiece.shape} in ${(nextGenEndTime - nextGenStartTime).toFixed(2)}ms`
    );

    // Render update with timing
    const renderStartTime = performance.now();
    Logger.log('SPAWN RENDER: Starting renderGameState() call');
    this.renderGameState();
    const renderEndTime = performance.now();
    Logger.log(
      `SPAWN RENDER: renderGameState() completed in ${(renderEndTime - renderStartTime).toFixed(2)}ms`
    );

    const totalSpawnTime = performance.now() - spawnStartTime;
    Logger.log(`SPAWN COMPLETE: Total spawnPiece() time: ${totalSpawnTime.toFixed(2)}ms`);
    Logger.log('=== SPAWN PIECE DIAGNOSTIC: spawnPiece() completed ===');
  }

  /**
   * Show the score submission interface when the game ends
   * Requirements: 1.1, 1.2, 1.4, 1.5
   */
  private showScoreSubmissionInterface(): void {
    try {
      Logger.log('Game: Showing score submission interface');
      
      // Pause any active timers
      this.pauseGameTimers();
      
      // Prepare game end data
      const gameEndData: GameEndData = {
        score: this.score,
        level: this.currentLevel,
        mode: this.currentGameMode as any,
        breakdown: this.scoreBreakdown,
        timestamp: this.scoreAchievementTime
      };
      
      // Create submission callbacks
      const callbacks: ScoreSubmissionCallbacks = {
        onSubmit: (data: RedditScoreSubmissionRequest) => this.handleScoreSubmission(data),
        onCancel: () => this.handleScoreSubmissionCancel(),
        onContinue: () => this.handleScoreSubmissionContinue()
      };
      
      // Create and show the score submission UI
      this.scoreSubmissionUI = new ScoreSubmissionUI(this, gameEndData, callbacks);
      
      Logger.log(`Game: Score submission interface created for score ${this.score} in ${this.currentGameMode} mode`);
    } catch (error) {
      Logger.log(`Game: Error showing score submission interface - ${error}`);
      // Fallback to direct GameOver transition
      this.scene.start('GameOver');
    }
  }

  /**
   * Handle score submission to the server
   * Requirements: 1.2, 1.3, 1.4
   */
  private async handleScoreSubmission(data: RedditScoreSubmissionRequest): Promise<RedditScoreSubmissionResponse> {
    try {
      Logger.log(`Game: Submitting score ${data.score} for ${data.mode} mode, Reddit post: ${data.createPost}`);
      
      // Make API call to submit score
      const response = await fetch('/api/reddit/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: RedditScoreSubmissionResponse = await response.json();
      
      Logger.log(`Game: Score submission ${result.success ? 'successful' : 'failed'}: ${result.message}`);
      if (result.leaderboardPosition) {
        Logger.log(`Game: Leaderboard position: #${result.leaderboardPosition}`);
      }
      if (result.redditPostUrl) {
        Logger.log(`Game: Reddit post created: ${result.redditPostUrl}`);
      }
      
      return result;
    } catch (error) {
      Logger.log(`Game: Score submission error - ${error}`);
      return {
        success: false,
        message: `Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle score submission cancellation
   */
  private handleScoreSubmissionCancel(): void {
    Logger.log('Game: Score submission cancelled');
    this.cleanupScoreSubmissionUI();
    this.scene.start('GameOver');
  }

  /**
   * Handle score submission completion (continue to game over)
   */
  private handleScoreSubmissionContinue(): void {
    Logger.log('Game: Score submission completed, continuing to game over');
    this.cleanupScoreSubmissionUI();
    this.scene.start('GameOver');
  }

  /**
   * Clean up the score submission UI
   */
  private cleanupScoreSubmissionUI(): void {
    if (this.scoreSubmissionUI) {
      this.scoreSubmissionUI.destroy();
      this.scoreSubmissionUI = null;
      Logger.log('Game: Score submission UI cleaned up');
    }
  }

  /**
   * Returns a descriptive name for the collision scenario based on dice counts
   * @param dicesToLock Number of dice that will be locked
   * @param diceToContinue Number of dice that will continue falling
   * @returns Human-readable scenario name
   */
  private getCollisionScenarioName(dicesToLock: number, diceToContinue: number): string {
    if (dicesToLock === 0 && diceToContinue > 0) {
      return `No Collisions (${diceToContinue} dice continue)`;
    } else if (dicesToLock > 0 && diceToContinue === 0) {
      return `All Collisions (${dicesToLock} dice lock)`;
    } else if (dicesToLock > 0 && diceToContinue > 0) {
      return `Mixed Collisions (${dicesToLock} lock, ${diceToContinue} continue)`;
    } else {
      return `Empty Scenario (0 dice total)`;
    }
  }

  private async stepDrop(): Promise<void> {
    Logger.log('=== stepDrop() START ===');
    this.phase = 'Dropping';
    if (!this.gameBoard) {
      Logger.log('ERROR: No gameBoard found');
      return;
    }

    let active = this.activePiece;
    if (!active) {
      Logger.log('No active piece, spawning new one');
      this.spawnPiece();
      return;
    }

    // If no dice remain in the piece, it's already fully locked
    if (!active.dice || active.dice.length === 0) {
      Logger.log('No unlocked dice remaining - finalizing piece');
      this.finalizePieceLocking(active);
      return;
    }

    // Log initial active piece state for debugging
    Logger.log(
      `COLLISION DETECTION: Active piece "${active.shape || 'unknown'}" at bottom-left coordinates (${active.x}, ${active.y}) with ${active.dice.length} unlocked dice`
    );
    Logger.log(`PIECE STATE: ID=${active.id}, rotation=${active.rotation}°`);

    // Enhanced validation and error handling before processing
    const preProcessValidation = this.validateActivePieceState();
    Logger.log(`PRE-PROCESS VALIDATION: ${preProcessValidation ? 'PASSED' : 'FAILED'}`);

    if (!preProcessValidation) {
      Logger.log('PRE-PROCESS VALIDATION FAILED: Attempting error recovery');
      const recoverySuccess = this.handleActivePieceErrors('stepDrop pre-process validation');
      if (!recoverySuccess) {
        Logger.log('ERROR RECOVERY FAILED: Aborting stepDrop operation');
        return;
      }

      // Re-validate after recovery
      const postRecoveryValidation = this.validateActivePieceState();
      if (!postRecoveryValidation) {
        Logger.log('POST-RECOVERY VALIDATION FAILED: Critical error - finalizing piece');
        this.finalizePieceLocking(active);
        return;
      }
      Logger.log('POST-RECOVERY VALIDATION: Successful - continuing with stepDrop');
    }

    // Bottom-up per-die collision processing to ensure dice above detect newly locked dice below.
    // Build list of absolute positions for remaining dice and sort by Y ascending (bottom first).
    const diceInfos: Array<{ die: any; index: number; absX: number; absY: number }> = [];
    for (let i = 0; i < active.dice.length; i++) {
      const die = active.dice[i];
      const absX = active.x + die.relativePos.x;
      const absY = active.y + die.relativePos.y;
      diceInfos.push({ die, index: i, absX, absY });
    }

    // Sort bottom (low Y) first so that locking a lower die updates the grid for upper dice
    diceInfos.sort((a, b) => a.absY - b.absY || a.absX - b.absX);

    Logger.log(
      `INDIVIDUAL DIE ANALYSIS (BOTTOM-UP): Processing ${diceInfos.length} dice for collision/locking`
    );

    const successfullyLocked: number[] = [];
    const lockingErrors: Array<{ index: number; error: string }> = [];
    const diceToContinue: Array<{ die: any; index: number }> = [];

    for (const info of diceInfos) {
      const { die, index, absX, absY } = info;
      const attemptedX = absX;
      const attemptedY = absY + GAME_CONSTANTS.FALL_STEP; // -1 step

      Logger.log(`DIE ${index} POSITION ANALYSIS:`);
      Logger.log(
        `  - Die ID: ${die.id}, Color: ${die.color}, Sides: ${die.sides}, Number: ${die.number}`
      );
      Logger.log(`  - Relative position: (${die.relativePos.x}, ${die.relativePos.y})`);
      Logger.log(`  - Current absolute position: (${absX}, ${absY})`);
      Logger.log(`  - Attempted position after fall: (${attemptedX}, ${attemptedY})`);

      const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
      const outOfBounds = absX < 0 || absX >= this.gameBoard.state.width;
      // Important: check against the authoritative grid so any previously locked dice in this same loop are taken into account
      const hitPiece =
        attemptedY >= GAME_CONSTANTS.GROUND_Y &&
        attemptedY <= GAME_CONSTANTS.MAX_VALID_Y &&
        !this.gameBoard.isEmpty(attemptedX, attemptedY);

      Logger.log(
        `DIE ${index} COLLISION CHECKS: hitBottom=${hitBottom}, outOfBounds=${outOfBounds}, hitPiece=${hitPiece}`
      );

      if (hitBottom || outOfBounds || hitPiece) {
        // Immediately lock this die into the grid so that upper dice will see it as an obstacle
        let finalX = Math.max(0, Math.min(absX, this.gameBoard.state.width - 1));
        let finalY = Math.max(
          GAME_CONSTANTS.MIN_VALID_Y,
          Math.min(absY, GAME_CONSTANTS.MAX_VALID_Y)
        );
        let positionClamped = false;

        // Use GridBoundaryValidator to clamp if needed
        const isValidPosition = GridBoundaryValidator.validatePosition(
          finalX,
          finalY,
          this.gameBoard.state.width,
          this.gameBoard.state.height
        );
        if (!isValidPosition) {
          const clamped = GridBoundaryValidator.clampPosition(
            finalX,
            finalY,
            this.gameBoard.state.width,
            this.gameBoard.state.height
          );
          finalX = clamped.x;
          finalY = clamped.y;
          positionClamped = true;
          Logger.log(`POSITION CLAMPING: (${absX}, ${absY}) -> (${finalX}, ${finalY})`);
        }

        try {
          Logger.log(`LOCKING DIE ${index}: locking immediately at (${finalX}, ${finalY})`);
          // Use batched lock: write to grid but defer match detection until after the batch
          this.gameBoard.lockCell({ x: finalX, y: finalY }, die);
          Logger.log(
            `LOCK SUCCESS: Die ${index} provisionally locked at (${finalX}, ${finalY})${positionClamped ? ' (clamped)' : ''}`
          );
          successfullyLocked.push(index);
          
          // Create placement impact effect for locked die
          // Requirements: 4.1, 4.2
          if (this.particleSystemManager && this.gameUI) {
            const boardMetrics = (this.gameUI as any).boardMetrics;
            if (boardMetrics) {
              const screenPos = this.coordinateConverter.gridToScreen(finalX, finalY, boardMetrics);
              this.particleSystemManager.createPlacementImpact(
                new Phaser.Math.Vector2(screenPos.x, screenPos.y),
                1 // Single die placement
              );
            }
          }
          
          // Play piece placement sound for each locked die
          // Requirements: 2.1, 2.2
          if (this.soundEffectLibrary) {
            this.soundEffectLibrary.playPiecePlacement();
          }
        } catch (err) {
          const errorMsg = `Failed to lock die ${index} at (${finalX}, ${finalY}): ${err}`;
          Logger.log(`LOCK ERROR: ${errorMsg}`);
          lockingErrors.push({ index, error: errorMsg });
        }
      } else {
        // No collision for this die at this time; it can continue falling
        Logger.log(
          `DIE ${index} COLLISION RESULT: CONTINUE FALLING -> will attempt to move to (${attemptedX}, ${attemptedY})`
        );
        diceToContinue.push({ die, index });
      }
    }

    // Summary
    Logger.log(`COLLISION DETECTION SUMMARY:`);
    Logger.log(`  - Total dice processed: ${diceInfos.length}`);
    Logger.log(`  - Dice locked this step: ${successfullyLocked.length}`);
    Logger.log(`  - Dice to continue falling: ${diceToContinue.length}`);
    Logger.log(
      `  - Collision scenario: ${this.getCollisionScenarioName(successfullyLocked.length, diceToContinue.length)}`
    );

    if (lockingErrors.length > 0) {
      Logger.log(`LOCKING ERRORS (${lockingErrors.length}):`);
      lockingErrors.forEach((le) => Logger.log(`  - Index ${le.index}: ${le.error}`));
    }

    // Remove successfully locked dice from the active piece using safe removal
    if (successfullyLocked.length > 0) {
      Logger.log(
        `DICE REMOVAL: Removing ${successfullyLocked.length} successfully locked dice from active piece`
      );
      const removedCount = this.safeRemoveDiceByIndices(successfullyLocked);
      Logger.log(
        `DICE REMOVAL RESULT: Expected to remove ${successfullyLocked.length}, actually removed ${removedCount}`
      );
      if (removedCount !== successfullyLocked.length) {
        Logger.log(
          `WARNING: Dice removal count mismatch - expected ${successfullyLocked.length}, removed ${removedCount}`
        );
      }

      // Validate post-removal state
      const postRemovalValidation = this.validateActivePieceState();
      Logger.log(`POST-REMOVAL VALIDATION: ${postRemovalValidation ? 'PASSED' : 'FAILED'}`);
      if (!postRemovalValidation) {
        Logger.log('POST-REMOVAL VALIDATION FAILED: Attempting recovery');
        const recoverySuccess = this.handleActivePieceErrors('stepDrop post-removal validation');
        if (!recoverySuccess) {
          Logger.log('POST-REMOVAL RECOVERY FAILED: Aborting stepDrop');
          return;
        }
        const finalValidation = this.validateActivePieceState();
        if (!finalValidation) {
          Logger.log('FINAL VALIDATION FAILED: Forcing piece finalization');
          this.activePiece.dice = [];
        }
      }
    }

    // After batching locks, run match detection and handle cascades with animations
    if (successfullyLocked.length > 0) {
      this.phase = 'Cascading';
      try {
        const boardMetrics = (this.gameUI && (this.gameUI as any).boardMetrics) || null;

        // Cascade loop: detect -> animate -> clear -> gravity -> repeat until no matches
        // Use enhanced detection that handles Black Die area conversion effects
        let cascadeMatches: any[] = detectMatchesWithBlackDieEffects(this.gameBoard.state, this.gameBoard);
        if (cascadeMatches && cascadeMatches.length > 0) {
          Logger.log(`INITIAL CASCADE: ${cascadeMatches.length} match groups detected`);
          
          // Hide text on matched dice immediately to prevent visual glitches
          this.hideMatchedDiceText(cascadeMatches);
          
          // Create particle effects for match explosions
          // Requirements: 2.1, 2.2, 2.3, 2.4
          if (this.particleSystemManager && boardMetrics) {
            this.particleSystemManager.setBoardMetrics(boardMetrics);
            this.particleSystemManager.createMatchExplosions(cascadeMatches);
          }
        }

        while (cascadeMatches && cascadeMatches.length > 0) {
          // Build footer messages
          const msgs: string[] = [];
          const allPositions: Array<{ x: number; y: number }> = [];
          // Scoring: accumulate score for this cascade iteration
          let cascadeIterationScore = 0;
          for (const m of cascadeMatches) {
            const size = m.size || (m.positions ? m.positions.length : 0);
            const num = m.matchedNumber ?? '?';
            msgs.push(`Matched: ${size} dice with value ${num}`);
            if (m.positions && Array.isArray(m.positions)) {
              allPositions.push(...m.positions.map((p: any) => ({ x: p.x, y: p.y })));
            }
          }

          const footerText = msgs.join(' | ');
          try {
            this.gameUI?.updateMatchFooter(footerText);
          } catch (e) {
            /* ignore UI errors */
          }

          // Animate matched positions before clearing
          try {
            this.phase = 'Animating';
            await this.animateMatchPositions(allPositions, boardMetrics);
          } catch (e) {
            Logger.log(`ERROR: animateMatchPositions failed: ${e}`);
          } finally {
            this.phase = 'Cascading';
          }

          // Clear matched positions from authoritative grid
          try {
            const clearPositions = allPositions.map((p) => ({ x: p.x, y: p.y }));
            // Before clearing, compute score for each match group using authoritative grid
            for (const m of cascadeMatches) {
              const positions = (m.positions || []) as Array<{ x: number; y: number }>;
              const size = m.size || positions.length;
              const matchedNumber = m.matchedNumber ?? 0;

              // Sum of sides (total possible die faces) for this match
              let facesTotal = 0;
              for (const p of positions) {
                const die = this.gameBoard.getCell(p as any);
                if (die) facesTotal += die.sides || 0;
              }

              const base = size * (matchedNumber as number);
              const groupScore = (base + facesTotal) * this.cascadeMultiplier;
              cascadeIterationScore += groupScore;

              // Play dice match sound effect based on match size
              // Requirements: 5.1, 5.4
              if (this.soundEffectLibrary && size > 0) {
                // Validate dice count parameter before passing to sound system
                const diceCount = Math.max(1, Math.floor(size));
                this.soundEffectLibrary.playDiceMatch(diceCount);
              }

              // Play combo effect sound for cascades
              // Requirements: 2.3
              if (this.cascadeMultiplier > 1 && this.soundEffectLibrary) {
                this.soundEffectLibrary.playComboEffect(this.cascadeMultiplier);
              }

              // Create combo celebration particle effect
              // Requirements: 3.3, 3.4, 3.5
              if (this.cascadeMultiplier > 1 && this.particleSystemManager && positions.length > 0) {
                // Calculate center position of the match for combo effect
                const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
                const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
                
                // Convert grid position to screen coordinates
                if (boardMetrics) {
                  const screenX = boardMetrics.boardX + (centerX * boardMetrics.cellW) + (boardMetrics.cellW / 2);
                  const screenY = boardMetrics.boardY + (centerY * boardMetrics.cellH) + (boardMetrics.cellH / 2);
                  
                  const comboPosition = new Phaser.Math.Vector2(screenX, screenY);
                  this.particleSystemManager.createComboEffect(comboPosition, this.cascadeMultiplier);
                }
              }

              // Increase multiplier for next match (per-match increase)
              this.cascadeMultiplier++;
            }

            // Clear cells
            this.gameBoard.clearCells(clearPositions);
          } catch (e) {
            Logger.log(`ERROR: clearCells failed: ${e}`);
          }

          // Apply gravity once after clears and animate falling pieces
          try {
            // animateGravityMovements will apply gravity and animate moved dice, then re-render
            await this.animateGravityMovements(boardMetrics);
          } catch (e) {
            Logger.log(`ERROR: applyGravity/animate failed: ${e}`);
            // As fallback, apply gravity and re-render
            try {
              applyGravity(this.gameBoard.state);
            } catch (ee) {
              /* ignore */
            }
            this.renderGameState();
          }

          // Update score for this cascade iteration and propagate to UI
          if (cascadeIterationScore > 0) {
            // Apply difficulty-based score multiplier
            const multipliedScore = this.scoreMultiplierManager 
              ? this.scoreMultiplierManager.applyMultiplier(cascadeIterationScore)
              : cascadeIterationScore;
            
            this.score += multipliedScore;
            
            // Update score achievement time and breakdown
            this.scoreAchievementTime = Date.now();
            this.scoreBreakdown = {
              baseScore: cascadeIterationScore,
              chainMultiplier: this.cascadeMultiplier,
              ultimateComboMultiplier: 1, // TODO: Implement ultimate combo tracking
              boosterModifiers: 0, // TODO: Implement booster modifier tracking
              totalScore: this.score
            };
            
            try {
              this.gameUI?.updateScore(this.score);
            } catch (e) {
              /* ignore UI */
            }
          }

          // Detect again for potential cascades with Black Die effects
          cascadeMatches = detectMatchesWithBlackDieEffects(this.gameBoard.state, this.gameBoard);
          if (cascadeMatches && cascadeMatches.length > 0) {
            Logger.log(`CASCADE CONTINUED: ${cascadeMatches.length} new match groups detected`);
            
            // Hide text on matched dice immediately to prevent visual glitches
            this.hideMatchedDiceText(cascadeMatches);
            
            // Create particle effects for continued cascade matches
            // Requirements: 2.1, 2.2, 2.3, 2.4
            if (this.particleSystemManager && boardMetrics) {
              this.particleSystemManager.createMatchExplosions(cascadeMatches);
            }
          }
        }
      } catch (e) {
        Logger.log(`ERROR: Cascade handling failed: ${e}`);
      }
    }

    // Handle piece movement based on collision scenarios
    Logger.log(`\nPIECE MOVEMENT LOGIC:`);
    const scenarioName = this.getCollisionScenarioName(
      successfullyLocked.length,
      diceToContinue.length
    );
    Logger.log(`MOVEMENT SCENARIO: ${scenarioName}`);

    if (diceToContinue.length > 0 && successfullyLocked.length === 0) {
      // Scenario 1: No collisions - move entire piece down
      const oldY = active.y;
      active.y += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
      Logger.log(
        `NO COLLISIONS: Moving entire piece from Y=${oldY} to Y=${active.y} (${Math.abs(GAME_CONSTANTS.FALL_STEP)} units down)`
      );
      Logger.log(`PIECE MOVEMENT: All ${diceToContinue.length} dice continue falling together`);
    } else if (diceToContinue.length > 0 && successfullyLocked.length > 0) {
      // Scenario 3: Mixed collisions - some dice lock, others continue falling
      // The remaining dice should continue falling, so move the piece down
      const oldY = active.y;
      active.y += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
      Logger.log(
        `MIXED COLLISION: ${successfullyLocked.length} dice locked, ${diceToContinue.length} dice continue falling`
      );
      Logger.log(`PIECE MOVEMENT: Moving piece from Y=${oldY} to Y=${active.y} for remaining dice`);
      Logger.log(
        `CONTINUING DICE: ${diceToContinue.map((d) => `Die ${d.index} (ID: ${d.die.id})`).join(', ')}`
      );
    } else if (diceToContinue.length === 0 && successfullyLocked.length > 0) {
      // Scenario 2: All collisions - all dice locked, no movement needed
      Logger.log(
        `ALL COLLISIONS: ${successfullyLocked.length} dice locked, no remaining dice to move`
      );
      Logger.log(`PIECE MOVEMENT: No movement - piece will be finalized`);
    } else {
      // Edge case: no dice in either category (shouldn't happen)
      Logger.log(`WARNING: Unexpected collision scenario - no dice in either category`);
      Logger.log(`PIECE MOVEMENT: No action taken`);
    }

    // Log final active piece state
    const finalDiceCount = active.dice ? active.dice.length : 0;
    Logger.log(
      `FINAL ACTIVE PIECE STATE: ${finalDiceCount} dice at position (${active.x}, ${active.y})`
    );

    // Update visuals to show current state
    Logger.log(`RENDERING: Updating visual representation`);
    this.renderGameState();

    // Check if piece is completely locked and log the decision
    if (finalDiceCount === 0) {
      Logger.log(
        `PIECE FINALIZATION: All dice locked - finalizing piece "${active.shape || 'unknown'}"`
      );
      this.finalizePieceLocking(active);
    } else {
      Logger.log(`STEP COMPLETION: ${finalDiceCount} dice still falling - step complete`);

      // Log remaining dice details for next step
      if (active.dice && active.dice.length > 0) {
        Logger.log(`REMAINING DICE FOR NEXT STEP:`);
        active.dice.forEach((die: any, index: number) => {
          const absX = active.x + die.relativePos.x;
          const absY = active.y + die.relativePos.y;
          Logger.log(
            `  - Die ${index} (ID: ${die.id}): relative (${die.relativePos.x}, ${die.relativePos.y}) -> absolute (${absX}, ${absY})`
          );
        });
      }
    }

    Logger.log('=== stepDrop() END ===\n');
  }

  private finalizePieceLocking(_active: any): void {
    Logger.log('Finalizing piece locking - all dice settled');

    // Clear active piece and spawn new one
    this.activePiece = undefined;
    Logger.log('Cleared active piece, about to spawn new one');

    // Re-render grid to show final locked state and spawn a new piece
    this.renderGameState();
    this.phase = 'Spawning';
    this.spawnPiece();
  }

  // Animate matched positions (fade out) and return a Promise that resolves when animations complete
  private animateMatchPositions(
    positions: Array<{ x: number; y: number }>,
    boardMetrics: any
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!positions || positions.length === 0) return resolve();
      const tweens: Phaser.Tweens.Tween[] = [];
      let completed = 0;

      const onComplete = () => {
        completed++;
        if (completed >= positions.length) resolve();
      };

      for (const p of positions) {
        // Create a temporary sprite at the grid position
        try {
          const screenPos = this.coordinateConverter.gridToScreen(p.x, p.y, boardMetrics);
          const sprite = drawDie(
            this,
            screenPos.x,
            screenPos.y,
            boardMetrics.cellW,
            boardMetrics.cellH,
            // create a lightweight visual die for animation
            { id: `anim-${p.x}-${p.y}-${Date.now()}`, sides: 6, number: 1, color: 'white' } as any
          ) as Phaser.GameObjects.Container | null;

          if (!sprite) {
            onComplete();
            continue;
          }

          // Ensure origin placement matches existing renders
          sprite.setAlpha(1);
          this.add.existing(sprite);

          const tw = this.tweens.add({
            targets: sprite,
            alpha: 0,
            scale: 0.8,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              try {
                cleanupDie(sprite);
              } catch (e) {
                /* ignore */
              }
              onComplete();
            },
          });

          tweens.push(tw);
        } catch (e) {
          onComplete();
        }
      }

      // Safety timeout in case tweens never call complete
      this.time.delayedCall(400, () => {
        if (completed < positions.length) resolve();
      });
    });
  }

  // Animate gravity movements: apply gravity to grid state, animate dice that moved from their
  // previous positions to new positions, then re-render the locked pieces. Returns after
  // animations complete and grid is up-to-date.
  private animateGravityMovements(boardMetrics: any): Promise<void> {
    return new Promise((resolve) => {
      if (!this.gameBoard) return resolve();

      const beforeMap: Record<
        string,
        { gridX: number; gridY: number; screenX: number; screenY: number; die: any }
      > = {};
      const { width, height, cells } = this.gameBoard.state;

      // Capture before positions
      for (let gridY = 0; gridY < height; gridY++) {
        const arrayY = this.coordinateConverter.gridToArrayY(gridY);
        const row = cells[arrayY];
        if (!row) continue;
        for (let gridX = 0; gridX < width; gridX++) {
          const die = row[gridX];
          if (!die) continue;
          const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);
          if (die.id) {
            beforeMap[die.id] = { gridX, gridY, screenX: screenPos.x, screenY: screenPos.y, die };
          }
        }
      }

      // Apply gravity to authoritative grid (mutates state)
      try {
        applyGravity(this.gameBoard.state);
      } catch (e) {
        Logger.log(`animateGravityMovements: applyGravity failed: ${e}`);
        // Still attempt to render
        this.renderGameState();
        return resolve();
      }

      // Capture after positions and determine moved dice
      const moved: Array<{
        id: string;
        die: any;
        from: { x: number; y: number };
        to: { x: number; y: number };
      }> = [];

      for (let gridY = 0; gridY < height; gridY++) {
        const arrayY = this.coordinateConverter.gridToArrayY(gridY);
        const row = this.gameBoard.state.cells[arrayY];
        if (!row) continue;
        for (let gridX = 0; gridX < width; gridX++) {
          const die = row[gridX];
          if (!die || !die.id) continue;
          const before = beforeMap[die.id];
          const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);
          if (before) {
            if (before.screenX !== screenPos.x || before.screenY !== screenPos.y) {
              moved.push({
                id: die.id,
                die,
                from: { x: before.screenX, y: before.screenY },
                to: { x: screenPos.x, y: screenPos.y },
              });
            }
          }
        }
      }

      if (moved.length === 0) {
        // Nothing moved; just render and resolve
        this.renderGameState();
        return resolve();
      }

      // Create temporary sprites for moved dice and tween them
      const tweens: Phaser.Tweens.Tween[] = [];
      const tempSprites: Phaser.GameObjects.Container[] = [];
      let completed = 0;

      const onComplete = () => {
        completed++;
        if (completed >= moved.length) {
          // destroy temp sprites and re-render authoritative locked pieces
          tempSprites.forEach((s) => {
            try {
              cleanupDie(s);
            } catch (e) {}
          });
          this.renderGameState();
          resolve();
        }
      };

      for (const mv of moved) {
        try {
          // Start cascade trail for falling die
          // Requirements: 3.1, 3.2
          if (this.particleSystemManager && mv.die.id) {
            this.particleSystemManager.startCascadeTrail(
              mv.die.id,
              new Phaser.Math.Vector2(mv.from.x, mv.from.y),
              mv.die.color || 'white'
            );
          }

          const spr = drawDie(
            this,
            mv.from.x,
            mv.from.y,
            boardMetrics.cellW,
            boardMetrics.cellH,
            mv.die
          ) as Phaser.GameObjects.Container | null;
          if (!spr) {
            onComplete();
            continue;
          }
          tempSprites.push(spr);
          this.add.existing(spr);

          const tw = this.tweens.add({
            targets: spr,
            x: mv.to.x,
            y: mv.to.y,
            duration: 300,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
              // Update cascade trail position during animation
              // Requirements: 3.1, 3.2
              if (this.particleSystemManager && mv.die.id) {
                const currentPos = new Phaser.Math.Vector2(spr.x, spr.y);
                const velocity = new Phaser.Math.Vector2(
                  (mv.to.x - mv.from.x) / 300, // pixels per ms
                  (mv.to.y - mv.from.y) / 300
                );
                this.particleSystemManager.updateCascadeTrail(mv.die.id, currentPos, velocity);
              }
            },
            onComplete: () => {
              // End cascade trail when die stops falling
              // Requirements: 3.1, 3.2
              if (this.particleSystemManager && mv.die.id) {
                this.particleSystemManager.endCascadeTrail(
                  mv.die.id,
                  new Phaser.Math.Vector2(mv.to.x, mv.to.y)
                );
              }
              
              try {
                cleanupDie(spr);
              } catch (e) {}
              onComplete();
            },
          });

          tweens.push(tw);
        } catch (e) {
          onComplete();
        }
      }

      // Safety timeout
      this.time.delayedCall(500, () => {
        if (completed < moved.length) {
          tempSprites.forEach((s) => {
            try {
              cleanupDie(s);
            } catch (e) {}
          });
          this.renderGameState();
          resolve();
        }
      });
    });
  }

  private stepGravity(): void {
    // Disabled for now - individual gravity conflicts with piece-based falling
    // This will be re-enabled when we implement match clearing
    return;

    // const lg: any = (this as any).gameBoard;
    // if (!lg) return;

    // // Apply individual gravity to make dice fall independently
    // const gravityResult = applyIndividualGravity(lg.state);

    // if (gravityResult.changed) {
    //   Logger.log('Individual gravity applied - dice fell');
    //   // Re-render the grid to show the updated positions
    //   this.renderGridPlaceholder();
    // }
  }

  async create(): Promise<void> {
    // DIAGNOSTIC: Start timing the initialization sequence
    this.initializationMetrics.sceneCreateStart = performance.now();
    Logger.log('=== INITIALIZATION DIAGNOSTIC: Scene create() started ===');
    Logger.log(
      `INIT TIMING: Scene create start at ${this.initializationMetrics.sceneCreateStart}ms`
    );

    // Initialize glow effect pool for booster rendering
    Logger.log('INIT STEP 0: Initializing glow effect pool');
    initializeGlowPool(this);

    // Set background
    Logger.log('INIT STEP 1: Setting background and registry');
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // Create bouncing background using BackgroundBouncer utility (physics-free approach)
    this.createBouncingBackground();
    
    this.registry.set('gameSceneReady', true);
    this.initializationMetrics.backgroundSetComplete = performance.now();
    Logger.log(
      `INIT TIMING: Background setup complete at ${this.initializationMetrics.backgroundSetComplete}ms (took ${this.initializationMetrics.backgroundSetComplete - this.initializationMetrics.sceneCreateStart}ms)`
    );

    // Read selected mode from registry and apply config
    Logger.log('INIT STEP 2: Reading game mode configuration');
    const selectedMode =
      (this.registry.get('selectedMode') as string) || settings.get('selectedMode') || 'medium';
    const mode = getMode(selectedMode);
    const cfg = mode.getConfig();
    this.registry.set('gameMode', mode.id);
    this.registry.set('gameConfig', cfg);
    this.currentGameMode = selectedMode;
    
    // Initialize game timing for score submission
    this.gameStartTime = Date.now();
    this.scoreAchievementTime = this.gameStartTime;
    this.currentLevel = 1;
    Logger.log(`Game: Game started at ${new Date(this.gameStartTime).toISOString()}`);
    
    this.initializationMetrics.registrySetupComplete = performance.now();
    Logger.log(
      `INIT TIMING: Registry setup complete at ${this.initializationMetrics.registrySetupComplete}ms (took ${this.initializationMetrics.registrySetupComplete - this.initializationMetrics.backgroundSetComplete}ms)`
    );
    Logger.log(
      `INIT CONFIG: Selected mode: ${selectedMode}, fallSpeed: ${(cfg as any)?.fallSpeed || 'default'}`
    );

    // Initialize game board and coordinate converter
    Logger.log('INIT STEP 3: Initializing game board and coordinate converter');
    this.gameBoard = new GameBoard(GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
    this.initializationMetrics.gameBoardInitComplete = performance.now();
    Logger.log(
      `INIT TIMING: GameBoard initialized at ${this.initializationMetrics.gameBoardInitComplete}ms (took ${this.initializationMetrics.gameBoardInitComplete - this.initializationMetrics.registrySetupComplete}ms)`
    );
    Logger.log(
      `INIT STATE: GameBoard dimensions: ${this.gameBoard.state.width}x${this.gameBoard.state.height}`
    );

    this.coordinateConverter = new CoordinateConverter(GAME_CONSTANTS.GRID_HEIGHT);
    this.initializationMetrics.coordinateConverterInitComplete = performance.now();
    Logger.log(
      `INIT TIMING: CoordinateConverter initialized at ${this.initializationMetrics.coordinateConverterInitComplete}ms (took ${this.initializationMetrics.coordinateConverterInitComplete - this.initializationMetrics.gameBoardInitComplete}ms)`
    );
    Logger.log(`INIT STATE: CoordinateConverter ready for grid height: ${GAME_CONSTANTS.GRID_HEIGHT}`);

    // Load fonts before creating UI elements
    Logger.log('INIT STEP 4: Loading fonts before UI creation');
    await this.loadFonts();

    // Create UI with game callbacks
    Logger.log('INIT STEP 5: Creating GameUI system');
    this.initializationMetrics.gameUICreateStart = performance.now();
    Logger.log(
      `INIT TIMING: GameUI creation started at ${this.initializationMetrics.gameUICreateStart}ms`
    );

    const uiCallbacks: GameUICallbacks = {
      onMoveLeft: () => this.movePiece(-1, 0),
      onMoveRight: () => this.movePiece(1, 0),
      onMoveDown: () => this.movePiece(0, GAME_CONSTANTS.FALL_STEP), // Use FALL_STEP (-1) for downward movement
      onRotateClockwise: () => this.rotatePiece(1),
      onRotateCounterClockwise: () => this.rotatePiece(-1),
      onHardDrop: () => this.hardDrop(),
      onPause: () => this.pauseGame(),
      onBoardTouch: (gridX, gridY) => this.handleBoardTouch(gridX, gridY),
    };

    this.gameUI = new GameUI(this, uiCallbacks);
    this.initializationMetrics.gameUICreateComplete = performance.now();
    Logger.log(
      `INIT TIMING: GameUI creation complete at ${this.initializationMetrics.gameUICreateComplete}ms (took ${this.initializationMetrics.gameUICreateComplete - this.initializationMetrics.gameUICreateStart}ms)`
    );

    // Update score multiplier display if available
    if (this.scoreMultiplierManager) {
      const multiplier = this.scoreMultiplierManager.getMultiplier();
      this.gameUI.updateScoreMultiplier(multiplier);
      Logger.log(`Game: Score multiplier display updated to ${multiplier}x`);
    }

    // Initialize enhanced audio system
    Logger.log('INIT STEP 5.5: Initializing enhanced audio system');
    this.initializeAudioSystem();

    // Initialize booster chance system for dice glow effects
    Logger.log('INIT STEP 5.6: Initializing booster chance system');
    this.initializeBoosterChance();

    // Initialize procedural generation systems
    Logger.log('INIT STEP 5.7: Initializing procedural generation systems');
    this.initializeProceduralSystems();

    // Initialize particle system for visual effects
    Logger.log('INIT STEP 5.8: Initializing particle system');
    this.initializeParticleSystem();

    // Validate UI system readiness
    this.validateUISystemReadiness();

    // Initialize the piece generation system
    Logger.log('INIT STEP 6: Initializing piece generation system');
    this.initializationMetrics.firstPieceGenerationStart = performance.now();
    Logger.log(
      `INIT TIMING: First piece generation started at ${this.initializationMetrics.firstPieceGenerationStart}ms`
    );

    // First, generate the initial next piece
    this.nextPiece = this.generateMultiDiePiece();
    this.initializationMetrics.firstPieceGenerationComplete = performance.now();
    Logger.log(
      `INIT TIMING: First piece generation complete at ${this.initializationMetrics.firstPieceGenerationComplete}ms (took ${this.initializationMetrics.firstPieceGenerationComplete - this.initializationMetrics.firstPieceGenerationStart}ms)`
    );
    Logger.log(
      `INIT STATE: Generated initial next piece: ${this.nextPiece.shape} with ${this.nextPiece.dice.length} dice`
    );

    // Then spawn the first active piece (which will use the next piece)
    Logger.log('INIT STEP 7: Spawning first active piece');
    this.initializationMetrics.firstPieceSpawnStart = performance.now();
    Logger.log(
      `INIT TIMING: First piece spawn started at ${this.initializationMetrics.firstPieceSpawnStart}ms`
    );

    this.phase = 'Spawning';
    this.spawnPiece();

    this.initializationMetrics.firstPieceSpawnComplete = performance.now();
    Logger.log(
      `INIT TIMING: First piece spawn complete at ${this.initializationMetrics.firstPieceSpawnComplete}ms (took ${this.initializationMetrics.firstPieceSpawnComplete - this.initializationMetrics.firstPieceSpawnStart}ms)`
    );

    // Validate first piece spawn result
    this.validateFirstPieceSpawn();

    // Set up timers
    Logger.log('INIT STEP 8: Setting up game timers');
    const cfgAny: any = cfg;
    const ms = Number(cfgAny?.fallSpeed) || 800;
    Logger.log(`INIT CONFIG: Setting up drop timer with ${ms}ms delay`);

    this.dropTimer = this.time.addEvent({
      delay: ms,
      callback: () => this.stepDrop(),
      loop: true,
    });

    // Set up gravity timer (if enabled)
    const allowGravity = cfgAny?.allowGravity !== false;
    if (allowGravity) {
      const gravityMs = Math.max(100, Math.floor(ms / 4));
      this.gravityTimer = this.time.addEvent({
        delay: gravityMs,
        callback: () => this.stepGravity(),
        loop: true,
      });
      Logger.log(`INIT CONFIG: Gravity timer created with ${gravityMs}ms delay`);
    } else {
      Logger.log('INIT CONFIG: Gravity disabled for this mode');
    }

    this.initializationMetrics.timersSetupComplete = performance.now();
    Logger.log(
      `INIT TIMING: Timers setup complete at ${this.initializationMetrics.timersSetupComplete}ms (took ${this.initializationMetrics.timersSetupComplete - this.initializationMetrics.firstPieceSpawnComplete}ms)`
    );

    // Initial render
    Logger.log('INIT STEP 9: Performing initial render');
    this.initializationMetrics.initialRenderStart = performance.now();
    Logger.log(
      `INIT TIMING: Initial render started at ${this.initializationMetrics.initialRenderStart}ms`
    );

    this.renderGameState();

    this.initializationMetrics.initialRenderComplete = performance.now();
    Logger.log(
      `INIT TIMING: Initial render complete at ${this.initializationMetrics.initialRenderComplete}ms (took ${this.initializationMetrics.initialRenderComplete - this.initializationMetrics.initialRenderStart}ms)`
    );

    // Validate initial render result
    this.validateInitialRender();

    this.phase = 'Dropping';
    this.initializationMetrics.sceneCreateEnd = performance.now();

    // Log complete initialization summary
    this.logInitializationSummary();

    Logger.log('=== INITIALIZATION DIAGNOSTIC: Scene create() completed ===');
  }

  private movePiece(dx: number, dy: number): void {
    if (!this.activePiece || !this.gameBoard) return;

    // If no dice remain in the piece, it's already fully locked
    if (!this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('Cannot move piece - no dice remaining (all locked)');
      return;
    }

    const newX = this.activePiece.x + dx;
    const newY = this.activePiece.y + dy;

    Logger.log(
      `Attempting to move piece from bottom-left (${this.activePiece.x}, ${this.activePiece.y}) to (${newX}, ${newY})`
    );

    // For downward movement (dy < 0), we're decreasing Y which moves the piece down in bottom-left coordinates
    // For left/right movement (dx != 0), X coordinates remain unchanged in behavior
    // For upward movement (dy > 0), we're increasing Y which moves the piece up in bottom-left coordinates

    // Check if the new position is valid for remaining dice in the piece
    if (this.canPlacePiece(this.activePiece, newX, newY)) {
      const oldPos = new Phaser.Math.Vector2(this.activePiece.x, this.activePiece.y);
      this.activePiece.x = newX;
      this.activePiece.y = newY;
      
      // Create movement particle effects
      // Requirements: 4.3, 4.4
      if (this.particleSystemManager && this.gameUI) {
        const boardMetrics = (this.gameUI as any).boardMetrics;
        if (boardMetrics) {
          // Convert grid positions to screen coordinates for particle effects
          const oldScreenPos = this.coordinateConverter.gridToScreen(oldPos.x, oldPos.y, boardMetrics);
          const newScreenPos = this.coordinateConverter.gridToScreen(newX, newY, boardMetrics);
          
          if (dx !== 0) {
            // Horizontal movement feedback
            this.particleSystemManager.createHorizontalMovementFeedback(
              new Phaser.Math.Vector2(newScreenPos.x, newScreenPos.y), 
              dx
            );
          } else if (dy !== 0) {
            // Vertical movement trail
            this.particleSystemManager.createMovementTrail(
              new Phaser.Math.Vector2(oldScreenPos.x, oldScreenPos.y),
              new Phaser.Math.Vector2(newScreenPos.x, newScreenPos.y)
            );
          }
        }
      }
      
      this.renderGameState();
      Logger.log(`Successfully moved piece to bottom-left (${newX}, ${newY})`);
      
      // Play movement sound effect for downward movement (soft drop)
      // Requirements: 2.1, 2.2
      if (dy < 0 && this.soundEffectLibrary) {
        this.soundEffectLibrary.playPieceDrop();
      }
    } else {
      Logger.log(`Cannot move piece to bottom-left (${newX}, ${newY}) - collision detected`);
    }
  }

  private hardDrop(): void {
    if (!this.activePiece || !this.gameBoard) return;

    // If no dice remain in the piece, it's already fully locked
    if (!this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('Cannot hard drop - no dice remaining (all locked)');
      return;
    }

    // Find the lowest valid Y position for the remaining dice in the piece
    // In bottom-left system, we need to find the smallest Y where the piece can still be placed
    // Start from current position and move down (decrease Y) until we find a collision
    let dropY = this.activePiece.y;
    let testY = dropY + GAME_CONSTANTS.FALL_STEP; // Start testing one step down

    // Keep moving down (decreasing Y) while the piece can still be placed
    while (
      testY >= GAME_CONSTANTS.MIN_VALID_Y &&
      this.canPlacePiece(this.activePiece, this.activePiece.x, testY)
    ) {
      dropY = testY;
      testY += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
    }

    const originalY = this.activePiece.y;
    this.activePiece.y = dropY;
    const dropDistance = Math.abs(originalY - dropY);
    
    Logger.log(`Hard dropped piece to lowest valid Y=${dropY}, distance=${dropDistance}`);

    // Create hard drop impact particle effect
    // Requirements: 4.1, 4.2
    if (this.particleSystemManager && this.gameUI) {
      const boardMetrics = (this.gameUI as any).boardMetrics;
      if (boardMetrics) {
        // Create impact effect at the final position
        const screenPos = this.coordinateConverter.gridToScreen(this.activePiece.x, dropY, boardMetrics);
        this.particleSystemManager.createHardDropImpact(
          new Phaser.Math.Vector2(screenPos.x, screenPos.y),
          dropDistance
        );
      }
    }

    // Play hard drop sound effect
    // Requirements: 2.1, 2.2
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playPieceDrop();
    }

    // Force immediate collision detection by calling stepDrop
    this.stepDrop();
  }

  private rotateMatrix(
    positions: Array<{ x: number; y: number }>,
    clockwise: boolean
  ): Array<{ x: number; y: number }> {
    if (positions.length === 0) return positions;

    Logger.log(
      `Rotating ${positions.length} positions ${clockwise ? 'clockwise' : 'counter-clockwise'}`
    );
    Logger.log(`Input positions: ${JSON.stringify(positions)}`);

    // Simple rotation around origin (0,0)
    const rotated = positions.map((p) => {
      let newX, newY;
      if (clockwise) {
        // 90° clockwise: (x,y) -> (-y, x)
        newX = -p.y;
        newY = p.x;
      } else {
        // 90° counter-clockwise: (x,y) -> (y, -x)
        newX = p.y;
        newY = -p.x;
      }
      return { x: newX, y: newY };
    });

    Logger.log(`After rotation: ${JSON.stringify(rotated)}`);

    // Find the minimum X and Y to normalize back to positive coordinates
    const xValues = rotated.map((p) => p.x);
    const yValues = rotated.map((p) => p.y);
    const minX = Math.min(...xValues);
    const minY = Math.min(...yValues);

    // Normalize to ensure all coordinates are >= 0
    const normalized = rotated.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    Logger.log(`After normalization: ${JSON.stringify(normalized)}`);
    return normalized;
  }

  private canPlacePiece(
    piece: any,
    newX: number,
    newY: number,
    newPositions?: Array<{ x: number; y: number }>
  ): boolean {
    if (!this.gameBoard) {
      Logger.log('canPlacePiece: No gameBoard available');
      return false;
    }

    if (!piece || !piece.dice || piece.dice.length === 0) {
      Logger.log('canPlacePiece: Invalid piece or no dice remaining');
      return false;
    }

    const positions =
      newPositions ||
      piece.dice.map((die: any) => ({
        x: die.relativePos.x,
        y: die.relativePos.y,
      }));

    // Check each remaining die position using bottom-left coordinate system
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const absoluteX = newX + pos.x;
      const absoluteY = newY + pos.y;

      // Check X bounds (must be within grid width)
      if (absoluteX < 0 || absoluteX >= this.gameBoard.state.width) {
        Logger.log(
          `canPlacePiece: Die ${i} out of X bounds at bottom-left (${absoluteX}, ${absoluteY})`
        );
        return false;
      }

      // Check Y bounds: pieces can be above the grid (Y > MAX_VALID_Y) but not below (Y < MIN_VALID_Y)
      if (absoluteY < GAME_CONSTANTS.MIN_VALID_Y) {
        Logger.log(
          `canPlacePiece: Die ${i} below grid bottom at bottom-left (${absoluteX}, ${absoluteY})`
        );
        return false;
      }

      // Check collision with existing pieces (only if within visible grid bounds)
      if (
        absoluteY >= GAME_CONSTANTS.MIN_VALID_Y &&
        absoluteY <= GAME_CONSTANTS.MAX_VALID_Y &&
        !this.gameBoard.isEmpty(absoluteX, absoluteY)
      ) {
        Logger.log(
          `canPlacePiece: Die ${i} collision with existing piece at bottom-left (${absoluteX}, ${absoluteY})`
        );
        return false;
      }
    }

    Logger.log(
      `canPlacePiece: All ${positions.length} dice positions valid for piece at bottom-left (${newX}, ${newY})`
    );
    return true;
  }

  private rotatePiece(direction: number): void {
    if (!this.activePiece || !this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('No active dice to rotate - piece fully locked');
      return;
    }

    Logger.log(
      `Rotating piece ${direction > 0 ? 'clockwise' : 'counter-clockwise'} with ${this.activePiece.dice.length} remaining dice`
    );

    // Get current relative positions of remaining dice
    const currentPositions = this.activePiece.dice.map((die: any) => die.relativePos);
    Logger.log(`Current positions before rotation: ${JSON.stringify(currentPositions)}`);

    // Calculate rotated positions
    const rotatedPositions = this.rotateMatrix(currentPositions, direction > 0);
    Logger.log(`Rotated positions: ${JSON.stringify(rotatedPositions)}`);

    // Try rotation at current position first
    if (
      this.canPlacePiece(this.activePiece, this.activePiece.x, this.activePiece.y, rotatedPositions)
    ) {
      this.applyRotation(rotatedPositions, direction);
      return;
    }

    // If rotation fails at current position, try wall kicks
    Logger.log('Rotation blocked at current position, attempting wall kicks');
    const wallKickOffsets = this.getWallKickOffsets(direction > 0);

    for (const offset of wallKickOffsets) {
      const testX = this.activePiece.x + offset.x;
      const testY = this.activePiece.y + offset.y;

      Logger.log(
        `Trying wall kick at offset (${offset.x}, ${offset.y}) -> position (${testX}, ${testY})`
      );

      if (this.canPlacePiece(this.activePiece, testX, testY, rotatedPositions)) {
        // Apply wall kick and rotation
        this.activePiece.x = testX;
        this.activePiece.y = testY;
        this.applyRotation(rotatedPositions, direction);
        Logger.log(`Wall kick successful at offset (${offset.x}, ${offset.y})`);
        return;
      }
    }

    Logger.log('Rotation blocked - no valid wall kick positions found');
  }

  private getWallKickOffsets(_clockwise: boolean): Array<{ x: number; y: number }> {
    // Wall kick offsets for bottom-left coordinate system
    // Try moving left, right, up, and combinations
    // Note: Could be customized based on rotation direction in the future
    return [
      { x: -1, y: 0 }, // Try one left
      { x: 1, y: 0 }, // Try one right
      { x: -2, y: 0 }, // Try two left
      { x: 2, y: 0 }, // Try two right
      { x: 0, y: 1 }, // Try one up
      { x: -1, y: 1 }, // Try left and up
      { x: 1, y: 1 }, // Try right and up
      { x: 0, y: -1 }, // Try one down (if above ground)
    ];
  }

  private applyRotation(
    rotatedPositions: Array<{ x: number; y: number }>,
    direction: number
  ): void {
    // Apply rotation to remaining dice
    this.activePiece.dice.forEach((die: any, index: number) => {
      Logger.log(
        `Die ${index}: ${JSON.stringify(die.relativePos)} -> ${JSON.stringify(rotatedPositions[index])}`
      );
      die.relativePos = rotatedPositions[index];
    });

    // Update rotation angle for reference
    this.activePiece.rotation =
      (this.activePiece.rotation + (direction > 0 ? 90 : -90) + 360) % 360;

    // Create rotation feedback particle effect
    // Requirements: 4.3, 4.4
    if (this.particleSystemManager && this.gameUI) {
      const boardMetrics = (this.gameUI as any).boardMetrics;
      if (boardMetrics) {
        // Create rotation effect at piece center
        const screenPos = this.coordinateConverter.gridToScreen(this.activePiece.x, this.activePiece.y, boardMetrics);
        this.particleSystemManager.createRotationFeedback(
          new Phaser.Math.Vector2(screenPos.x, screenPos.y),
          direction
        );
      }
    }

    // Play rotation sound effect
    // Requirements: 2.1, 2.2
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playPieceRotation();
    }

    // Validate the rotation result
    this.validateRotationResult();

    this.renderGameState();
    Logger.log(`Piece rotated successfully to ${this.activePiece.rotation}°`);

    // Verify the positions after rotation
    Logger.log(
      `Final positions after rotation: ${JSON.stringify(this.activePiece.dice.map((die: any) => die.relativePos))}`
    );
  }

  private validateRotationResult(): void {
    if (!this.activePiece || !this.activePiece.dice) return;

    // Ensure all dice positions are valid after rotation
    for (let i = 0; i < this.activePiece.dice.length; i++) {
      const die = this.activePiece.dice[i];
      const absoluteX = this.activePiece.x + die.relativePos.x;
      const absoluteY = this.activePiece.y + die.relativePos.y;

      // Validate coordinates are within expected bounds
      if (absoluteX < 0 || absoluteX >= this.gameBoard.state.width) {
        Logger.log(`WARNING: Die ${i} has invalid X coordinate after rotation: ${absoluteX}`);
      }

      if (absoluteY < GAME_CONSTANTS.MIN_VALID_Y) {
        Logger.log(
          `WARNING: Die ${i} has invalid Y coordinate after rotation: ${absoluteY} (below grid)`
        );
      }

      // Check relative positions are non-negative (normalized correctly)
      if (die.relativePos.x < 0 || die.relativePos.y < 0) {
        Logger.log(
          `WARNING: Die ${i} has negative relative position after rotation: (${die.relativePos.x}, ${die.relativePos.y})`
        );
      }
    }

    Logger.log(
      `Rotation validation complete for piece at (${this.activePiece.x}, ${this.activePiece.y})`
    );
  }

  /**
   * Safely removes dice from the active piece by indices in reverse order to maintain array integrity
   * Enhanced with detailed logging for debugging collision detection issues
   * @param indices Array of dice indices to remove
   * @returns Number of dice actually removed
   */
  private safeRemoveDiceByIndices(indices: number[]): number {
    Logger.log('DICE REMOVAL: Starting enhanced safe dice removal process');

    // Enhanced validation for active piece state
    if (!this.activePiece) {
      Logger.log('DICE REMOVAL ERROR: No active piece exists - cannot remove dice');
      return 0;
    }

    if (!this.activePiece.dice) {
      Logger.log(
        'DICE REMOVAL ERROR: Active piece has no dice property - initializing empty array'
      );
      this.activePiece.dice = [];
      return 0;
    }

    if (!Array.isArray(this.activePiece.dice)) {
      Logger.log('DICE REMOVAL ERROR: Active piece dice is not an array - attempting recovery');
      Logger.log(
        `DICE REMOVAL ERROR: dice type: ${typeof this.activePiece.dice}, value: ${JSON.stringify(this.activePiece.dice)}`
      );

      // Attempt to recover by converting to array or resetting
      try {
        if (typeof this.activePiece.dice === 'object' && this.activePiece.dice !== null) {
          // Try to convert object to array if it has array-like properties
          const keys = Object.keys(this.activePiece.dice);
          const isArrayLike = keys.every((key) => /^\d+$/.test(key));
          if (isArrayLike) {
            Logger.log('DICE REMOVAL RECOVERY: Converting array-like object to proper array');
            this.activePiece.dice = Object.values(this.activePiece.dice);
          } else {
            throw new Error('Not array-like object');
          }
        } else {
          throw new Error('Invalid dice data type');
        }
      } catch (recoveryError) {
        Logger.log(`DICE REMOVAL RECOVERY FAILED: ${recoveryError} - resetting to empty array`);
        this.activePiece.dice = [];
        return 0;
      }
    }

    // Enhanced input validation
    if (!indices || !Array.isArray(indices)) {
      Logger.log('DICE REMOVAL ERROR: Invalid indices parameter - must be an array');
      Logger.log(
        `DICE REMOVAL ERROR: indices type: ${typeof indices}, value: ${JSON.stringify(indices)}`
      );
      return 0;
    }

    if (indices.length === 0) {
      Logger.log('DICE REMOVAL: No dice indices provided for removal - nothing to do');
      return 0;
    }

    // Check for empty dice array edge case
    if (this.activePiece.dice.length === 0) {
      Logger.log(
        'DICE REMOVAL WARNING: Active piece has empty dice array - cannot remove any dice'
      );
      return 0;
    }

    const originalLength = this.activePiece.dice.length;
    Logger.log(`DICE REMOVAL: Attempting to remove ${indices.length} dice from active piece`);
    Logger.log(
      `DICE REMOVAL: Current active piece state - length: ${originalLength}, shape: ${this.activePiece.shape || 'unknown'}`
    );
    Logger.log(`DICE REMOVAL: Indices to remove: [${indices.join(', ')}]`);

    // Log current dice state before removal
    Logger.log(`DICE REMOVAL: Current dice before removal:`);
    this.activePiece.dice.forEach((die: any, index: number) => {
      Logger.log(
        `  - Index ${index}: ID=${die.id}, pos=(${die.relativePos?.x}, ${die.relativePos?.y}), color=${die.color}`
      );
    });

    // Enhanced validation for all indices with detailed error reporting
    const maxValidIndex = originalLength - 1;
    const validIndices: number[] = [];
    const invalidIndices: Array<{ index: any; reason: string }> = [];

    indices.forEach((index) => {
      // Check for various types of invalid indices
      if (index === null || index === undefined) {
        invalidIndices.push({ index, reason: 'null or undefined' });
      } else if (!Number.isInteger(index)) {
        invalidIndices.push({ index, reason: `not an integer (type: ${typeof index})` });
      } else if (index < 0) {
        invalidIndices.push({ index, reason: 'negative index' });
      } else if (index > maxValidIndex) {
        invalidIndices.push({
          index,
          reason: `index exceeds array bounds (max: ${maxValidIndex})`,
        });
      } else if (isNaN(index)) {
        invalidIndices.push({ index, reason: 'NaN value' });
      } else if (!isFinite(index)) {
        invalidIndices.push({ index, reason: 'infinite value' });
      } else {
        validIndices.push(index);
      }
    });

    // Log detailed validation results
    if (invalidIndices.length > 0) {
      Logger.log(`DICE REMOVAL VALIDATION: Found ${invalidIndices.length} invalid indices:`);
      invalidIndices.forEach(({ index, reason }) => {
        Logger.log(`  - Index ${index}: ${reason}`);
      });
    }

    if (validIndices.length === 0) {
      Logger.log(
        'DICE REMOVAL WARNING: No valid indices found for dice removal - all indices were invalid'
      );
      return 0;
    }

    if (validIndices.length !== indices.length) {
      const invalidCount = indices.length - validIndices.length;
      Logger.log(`DICE REMOVAL WARNING: ${invalidCount} invalid indices detected and skipped`);
      Logger.log(`DICE REMOVAL WARNING: Valid indices: [${validIndices.join(', ')}]`);
    }

    // Enhanced array modification safety validation
    const safetyValidation = this.validateArrayModificationSafety(validIndices, originalLength);

    // Log safety validation results
    if (safetyValidation.warnings.length > 0) {
      Logger.log(`DICE REMOVAL SAFETY WARNINGS:`);
      safetyValidation.warnings.forEach((warning) => {
        Logger.log(`  - ${warning}`);
      });
    }

    if (safetyValidation.errors.length > 0) {
      Logger.log(`DICE REMOVAL SAFETY ERRORS:`);
      safetyValidation.errors.forEach((error) => {
        Logger.log(`  - ${error}`);
      });
    }

    if (!safetyValidation.isSafe) {
      Logger.log('DICE REMOVAL ABORTED: Array modification safety validation failed');
      return 0;
    }

    const uniqueIndices = safetyValidation.safeIndices;
    Logger.log(
      `DICE REMOVAL SAFETY: Using ${uniqueIndices.length} validated indices for safe removal: [${uniqueIndices.join(', ')}]`
    );

    // Remove dice in reverse order with detailed logging
    let removedCount = 0;
    const removedDice: Array<{ index: number; die: any }> = [];

    Logger.log(`DICE REMOVAL: Processing ${uniqueIndices.length} unique indices in reverse order`);

    uniqueIndices.forEach((index, removalStep) => {
      const currentLength = this.activePiece.dice.length;
      Logger.log(
        `DICE REMOVAL STEP ${removalStep + 1}: Attempting to remove index ${index} (current array length: ${currentLength})`
      );

      if (index < currentLength) {
        // Double-check bounds before each removal
        const dieToRemove = this.activePiece.dice[index];
        Logger.log(
          `DICE REMOVAL STEP ${removalStep + 1}: Removing die at index ${index} - ID: ${dieToRemove.id}, color: ${dieToRemove.color}`
        );

        this.activePiece.dice.splice(index, 1);
        removedDice.push({ index, die: dieToRemove });
        removedCount++;

        Logger.log(
          `DICE REMOVAL STEP ${removalStep + 1}: Successfully removed die, new array length: ${this.activePiece.dice.length}`
        );
      } else {
        Logger.log(
          `DICE REMOVAL ERROR: Index ${index} out of bounds during removal (current array length: ${currentLength})`
        );
        Logger.log(
          `DICE REMOVAL ERROR: This indicates an array manipulation error or race condition`
        );
      }
    });

    // Log removed dice details
    if (removedDice.length > 0) {
      Logger.log(`DICE REMOVAL SUMMARY: Successfully removed ${removedDice.length} dice:`);
      removedDice.forEach(({ index, die }) => {
        Logger.log(
          `  - Original index ${index}: ID=${die.id}, color=${die.color}, pos=(${die.relativePos?.x}, ${die.relativePos?.y})`
        );
      });
    }

    // Validate final state with detailed logging
    const finalLength = this.activePiece.dice.length;
    const expectedLength = originalLength - removedCount;

    Logger.log(`DICE REMOVAL VALIDATION:`);
    Logger.log(`  - Original length: ${originalLength}`);
    Logger.log(`  - Removed count: ${removedCount}`);
    Logger.log(`  - Expected final length: ${expectedLength}`);
    Logger.log(`  - Actual final length: ${finalLength}`);

    if (finalLength !== expectedLength) {
      Logger.log(
        `DICE REMOVAL ERROR: Unexpected dice count after removal - length mismatch detected`
      );
      Logger.log(`DICE REMOVAL ERROR: This indicates a critical array manipulation error`);
    }

    if (finalLength < 0) {
      Logger.log(`DICE REMOVAL ERROR: Invalid negative dice count after removal: ${finalLength}`);
      Logger.log(`DICE REMOVAL RECOVERY: Resetting dice array to empty to prevent further errors`);
      this.activePiece.dice = [];
      return originalLength; // All dice were effectively removed
    }

    // Log final dice state after removal
    if (finalLength > 0) {
      Logger.log(`DICE REMOVAL: Remaining dice after removal:`);
      this.activePiece.dice.forEach((die: any, index: number) => {
        Logger.log(
          `  - Index ${index}: ID=${die.id}, pos=(${die.relativePos?.x}, ${die.relativePos?.y}), color=${die.color}`
        );
      });
    } else {
      Logger.log(`DICE REMOVAL: No dice remaining in active piece - piece will be finalized`);
    }

    Logger.log(
      `DICE REMOVAL COMPLETE: Successfully removed ${removedCount} dice. Active piece now has ${finalLength} dice remaining`
    );
    return removedCount;
  }

  /**
   * Validates the consistency of the active piece state with detailed logging
   * @returns true if the active piece state is valid, false otherwise
   */
  private validateActivePieceState(): boolean {
    Logger.log('VALIDATION: Starting enhanced active piece state validation');

    if (!this.activePiece) {
      Logger.log('VALIDATION RESULT: No active piece - valid state');
      return true; // No piece is a valid state
    }

    Logger.log(
      `VALIDATION: Checking piece "${this.activePiece.shape || 'unknown'}" (ID: ${this.activePiece.id || 'unknown'})`
    );

    // Enhanced position validation
    const pieceX = this.activePiece.x;
    const pieceY = this.activePiece.y;
    const rotation = this.activePiece.rotation || 0;

    Logger.log(`VALIDATION: Piece position: (${pieceX}, ${pieceY}), rotation: ${rotation}°`);

    // Validate piece position coordinates
    if (typeof pieceX !== 'number' || typeof pieceY !== 'number') {
      Logger.log(
        `VALIDATION ERROR: Invalid piece position coordinates - x: ${typeof pieceX}, y: ${typeof pieceY}`
      );
      return false;
    }

    if (!isFinite(pieceX) || !isFinite(pieceY)) {
      Logger.log(
        `VALIDATION ERROR: Non-finite piece position coordinates - x: ${pieceX}, y: ${pieceY}`
      );
      return false;
    }

    if (isNaN(pieceX) || isNaN(pieceY)) {
      Logger.log(`VALIDATION ERROR: NaN piece position coordinates - x: ${pieceX}, y: ${pieceY}`);
      return false;
    }

    // Validate rotation value
    if (typeof rotation !== 'number' || !isFinite(rotation) || isNaN(rotation)) {
      Logger.log(
        `VALIDATION ERROR: Invalid rotation value - type: ${typeof rotation}, value: ${rotation}`
      );
      return false;
    }

    if (!this.activePiece.dice || !Array.isArray(this.activePiece.dice)) {
      Logger.log('VALIDATION ERROR: Active piece has invalid dice array');
      Logger.log(
        `VALIDATION ERROR: dice property type: ${typeof this.activePiece.dice}, isArray: ${Array.isArray(this.activePiece.dice)}`
      );
      return false;
    }

    const diceCount = this.activePiece.dice.length;
    Logger.log(`VALIDATION: Checking ${diceCount} dice in active piece`);

    if (diceCount < 0) {
      Logger.log(`VALIDATION ERROR: Active piece has negative dice count: ${diceCount}`);
      return false;
    }

    // Check for duplicate dice IDs
    const diceIds = this.activePiece.dice
      .map((die: any) => die.id)
      .filter((id: any) => id !== undefined);
    const uniqueIds = new Set(diceIds);
    Logger.log(`VALIDATION: Dice ID check - ${diceIds.length} IDs found, ${uniqueIds.size} unique`);

    if (diceIds.length !== uniqueIds.size) {
      Logger.log('VALIDATION ERROR: Duplicate dice IDs detected in active piece');
      const duplicates = diceIds.filter((id: any, index: number) => diceIds.indexOf(id) !== index);
      Logger.log(`VALIDATION ERROR: Duplicate IDs: ${JSON.stringify([...new Set(duplicates)])}`);
      return false;
    }

    // Enhanced dice structure validation with boundary checks
    let validationErrors = 0;
    const gameBoard = this.gameBoard;

    for (let i = 0; i < this.activePiece.dice.length; i++) {
      const die = this.activePiece.dice[i];
      Logger.log(`VALIDATION: Checking die ${i} - ID: ${die?.id || 'undefined'}`);

      if (!die || typeof die !== 'object') {
        Logger.log(`VALIDATION ERROR: Invalid die object at index ${i} - type: ${typeof die}`);
        validationErrors++;
        continue;
      }

      // Check required die properties with enhanced validation
      const requiredProps = ['id', 'sides', 'number', 'color', 'relativePos'];
      for (const prop of requiredProps) {
        if (!(prop in die)) {
          Logger.log(`VALIDATION ERROR: Die ${i} missing required property: ${prop}`);
          validationErrors++;
        } else if (die[prop] === null || die[prop] === undefined) {
          Logger.log(`VALIDATION ERROR: Die ${i} has null/undefined value for property: ${prop}`);
          validationErrors++;
        }
      }

      // Enhanced relative position validation
      if (!die.relativePos || typeof die.relativePos !== 'object') {
        Logger.log(
          `VALIDATION ERROR: Die ${i} has invalid relativePos object - type: ${typeof die.relativePos}`
        );
        validationErrors++;
      } else {
        const relX = die.relativePos.x;
        const relY = die.relativePos.y;

        // Validate coordinate types and values
        if (typeof relX !== 'number' || typeof relY !== 'number') {
          Logger.log(
            `VALIDATION ERROR: Die ${i} has invalid relative position coordinate types - x: ${typeof relX}, y: ${typeof relY}`
          );
          validationErrors++;
        } else if (!isFinite(relX) || !isFinite(relY)) {
          Logger.log(
            `VALIDATION ERROR: Die ${i} has non-finite relative position coordinates - x: ${relX}, y: ${relY}`
          );
          validationErrors++;
        } else if (isNaN(relX) || isNaN(relY)) {
          Logger.log(
            `VALIDATION ERROR: Die ${i} has NaN relative position coordinates - x: ${relX}, y: ${relY}`
          );
          validationErrors++;
        } else {
          // Calculate absolute position and validate boundaries
          const absX = pieceX + relX;
          const absY = pieceY + relY;

          Logger.log(
            `VALIDATION: Die ${i} position analysis - relative (${relX}, ${relY}) -> absolute (${absX}, ${absY})`
          );

          // Enhanced boundary validation using GridBoundaryValidator
          if (gameBoard) {
            const isWithinBounds = GridBoundaryValidator.validatePosition(
              absX,
              absY,
              gameBoard.state.width,
              gameBoard.state.height
            );
            const isAboveGrid = GridBoundaryValidator.isAboveGrid(absY, gameBoard.state.height);
            const isBelowGrid = GridBoundaryValidator.isBelowGrid(absY);

            Logger.log(
              `VALIDATION: Die ${i} boundary checks - withinBounds: ${isWithinBounds}, aboveGrid: ${isAboveGrid}, belowGrid: ${isBelowGrid}`
            );

            // Allow dice to be above grid (spawn area) but warn about other boundary issues
            if (absX < 0 || absX >= gameBoard.state.width) {
              Logger.log(
                `VALIDATION WARNING: Die ${i} has X coordinate outside grid bounds: ${absX} (valid: 0-${gameBoard.state.width - 1})`
              );
            }

            if (isBelowGrid) {
              Logger.log(
                `VALIDATION WARNING: Die ${i} is below grid bottom: Y=${absY} (should be >= 0)`
              );
            }

            // Check for extremely large coordinates that might indicate corruption
            const maxReasonableCoord = 1000;
            if (Math.abs(absX) > maxReasonableCoord || Math.abs(absY) > maxReasonableCoord) {
              Logger.log(
                `VALIDATION ERROR: Die ${i} has unreasonably large coordinates - absolute (${absX}, ${absY})`
              );
              validationErrors++;
            }
          }

          Logger.log(`VALIDATION: Die ${i} coordinate validation complete`);
        }
      }

      // Validate other die properties
      if (
        die.sides &&
        (typeof die.sides !== 'number' || die.sides < 1 || !Number.isInteger(die.sides))
      ) {
        Logger.log(
          `VALIDATION ERROR: Die ${i} has invalid sides value: ${die.sides} (must be positive integer)`
        );
        validationErrors++;
      }

      if (
        die.number &&
        (typeof die.number !== 'number' || die.number < 1 || !Number.isInteger(die.number))
      ) {
        Logger.log(
          `VALIDATION ERROR: Die ${i} has invalid number value: ${die.number} (must be positive integer)`
        );
        validationErrors++;
      }

      if (die.color && typeof die.color !== 'string') {
        Logger.log(
          `VALIDATION ERROR: Die ${i} has invalid color value: ${die.color} (must be string)`
        );
        validationErrors++;
      }
    }

    if (validationErrors > 0) {
      Logger.log(`VALIDATION FAILED: ${validationErrors} validation errors found in active piece`);
      return false;
    }

    Logger.log(
      `VALIDATION PASSED: Active piece state is valid - ${diceCount} dice, shape: ${this.activePiece.shape || 'unknown'}`
    );
    return true;
  }

  /**
   * Enhanced error handling and recovery for edge cases
   * @param context Description of the operation context for logging
   * @returns True if recovery was successful, false if critical error
   */
  private handleActivePieceErrors(context: string): boolean {
    Logger.log(`ERROR HANDLING: Starting error recovery for context: ${context}`);

    if (!this.activePiece) {
      Logger.log('ERROR HANDLING: No active piece - spawning new piece');
      this.spawnPiece();
      return true;
    }

    // Handle corrupted dice array
    if (!this.activePiece.dice || !Array.isArray(this.activePiece.dice)) {
      Logger.log('ERROR HANDLING: Corrupted dice array detected - attempting recovery');

      try {
        if (this.activePiece.dice === null || this.activePiece.dice === undefined) {
          Logger.log('ERROR RECOVERY: Dice array is null/undefined - initializing empty array');
          this.activePiece.dice = [];
        } else if (typeof this.activePiece.dice === 'object') {
          Logger.log('ERROR RECOVERY: Dice is object but not array - attempting conversion');
          const keys = Object.keys(this.activePiece.dice);
          if (keys.length === 0) {
            this.activePiece.dice = [];
          } else {
            // Try to extract array-like values
            const values = Object.values(this.activePiece.dice);
            if (values.every((v) => v && typeof v === 'object' && 'id' in v)) {
              Logger.log('ERROR RECOVERY: Converting object to dice array');
              this.activePiece.dice = values;
            } else {
              Logger.log('ERROR RECOVERY: Object values are not valid dice - resetting to empty');
              this.activePiece.dice = [];
            }
          }
        } else {
          Logger.log('ERROR RECOVERY: Dice array is invalid type - resetting to empty');
          this.activePiece.dice = [];
        }

        Logger.log(
          `ERROR RECOVERY: Dice array recovered with ${this.activePiece.dice.length} dice`
        );
      } catch (recoveryError) {
        Logger.log(`ERROR RECOVERY FAILED: ${recoveryError} - finalizing corrupted piece`);
        this.finalizePieceLocking(this.activePiece);
        return false;
      }
    }

    // Handle invalid piece position
    if (
      typeof this.activePiece.x !== 'number' ||
      typeof this.activePiece.y !== 'number' ||
      !isFinite(this.activePiece.x) ||
      !isFinite(this.activePiece.y) ||
      isNaN(this.activePiece.x) ||
      isNaN(this.activePiece.y)
    ) {
      Logger.log(
        'ERROR HANDLING: Invalid piece position detected - applying emergency positioning'
      );

      this.activePiece.x = GAME_CONSTANTS.SPAWN_X_CENTER;
      this.activePiece.y = GAME_CONSTANTS.SPAWN_Y;

      Logger.log(
        `ERROR RECOVERY: Reset piece position to (${this.activePiece.x}, ${this.activePiece.y})`
      );
    }

    // Validate and clean up dice array
    if (this.activePiece.dice.length > 0) {
      const validDice: any[] = [];
      const invalidDiceIndices: number[] = [];

      this.activePiece.dice.forEach((die: any, index: number) => {
        if (this.validateDieStructure(die, index)) {
          validDice.push(die);
        } else {
          invalidDiceIndices.push(index);
        }
      });

      if (invalidDiceIndices.length > 0) {
        Logger.log(
          `ERROR RECOVERY: Removed ${invalidDiceIndices.length} invalid dice from active piece`
        );
        this.activePiece.dice = validDice;
      }

      // If no valid dice remain, finalize the piece
      if (validDice.length === 0) {
        Logger.log('ERROR RECOVERY: No valid dice remaining - finalizing piece');
        this.finalizePieceLocking(this.activePiece);
        return false;
      }
    }

    Logger.log(`ERROR HANDLING: Recovery complete for context: ${context}`);
    return true;
  }

  /**
   * Validate individual die structure for error recovery
   * @param die Die object to validate
   * @param index Die index for logging
   * @returns True if die is valid
   */
  private validateDieStructure(die: any, index: number): boolean {
    if (!die || typeof die !== 'object') {
      Logger.log(`DIE VALIDATION: Die ${index} is not a valid object`);
      return false;
    }

    const requiredProps = ['id', 'sides', 'number', 'color', 'relativePos'];
    for (const prop of requiredProps) {
      if (!(prop in die) || die[prop] === null || die[prop] === undefined) {
        Logger.log(`DIE VALIDATION: Die ${index} missing or null property: ${prop}`);
        return false;
      }
    }

    // Validate relativePos structure
    if (
      !die.relativePos ||
      typeof die.relativePos !== 'object' ||
      typeof die.relativePos.x !== 'number' ||
      typeof die.relativePos.y !== 'number' ||
      !isFinite(die.relativePos.x) ||
      !isFinite(die.relativePos.y) ||
      isNaN(die.relativePos.x) ||
      isNaN(die.relativePos.y)
    ) {
      Logger.log(`DIE VALIDATION: Die ${index} has invalid relativePos structure`);
      return false;
    }

    // Validate numeric properties
    if (
      typeof die.sides !== 'number' ||
      die.sides < 1 ||
      !Number.isInteger(die.sides) ||
      typeof die.number !== 'number' ||
      die.number < 1 ||
      !Number.isInteger(die.number)
    ) {
      Logger.log(`DIE VALIDATION: Die ${index} has invalid numeric properties`);
      return false;
    }

    // Validate color
    if (typeof die.color !== 'string' || die.color.length === 0) {
      Logger.log(`DIE VALIDATION: Die ${index} has invalid color property`);
      return false;
    }

    return true;
  }

  /**
   * Validates array modification safety before performing dice removal operations
   * @param indices Array of indices to be removed
   * @param arrayLength Current length of the dice array
   * @returns Validation result with safety recommendations
   */
  private validateArrayModificationSafety(
    indices: number[],
    arrayLength: number
  ): {
    isSafe: boolean;
    safeIndices: number[];
    warnings: string[];
    errors: string[];
  } {
    const result = {
      isSafe: true,
      safeIndices: [] as number[],
      warnings: [] as string[],
      errors: [] as string[],
    };

    Logger.log(
      `ARRAY SAFETY: Validating modification safety for ${indices.length} indices on array of length ${arrayLength}`
    );

    if (arrayLength <= 0) {
      result.isSafe = false;
      result.errors.push('Cannot modify empty or invalid array');
      return result;
    }

    if (indices.length === 0) {
      result.warnings.push('No indices provided for modification');
      return result;
    }

    // Check for various safety issues
    const uniqueIndices = [...new Set(indices)];
    if (uniqueIndices.length !== indices.length) {
      result.warnings.push(
        `Duplicate indices detected: ${indices.length - uniqueIndices.length} duplicates removed`
      );
    }

    const maxValidIndex = arrayLength - 1;
    const validIndices: number[] = [];
    const invalidIndices: number[] = [];

    uniqueIndices.forEach((index) => {
      if (Number.isInteger(index) && index >= 0 && index <= maxValidIndex) {
        validIndices.push(index);
      } else {
        invalidIndices.push(index);
      }
    });

    if (invalidIndices.length > 0) {
      result.warnings.push(
        `Invalid indices detected: [${invalidIndices.join(', ')}] (valid range: 0-${maxValidIndex})`
      );
    }

    // Check for potential array modification issues
    if (validIndices.length === arrayLength) {
      result.warnings.push('All array elements will be removed - array will become empty');
    }

    if (validIndices.length > arrayLength / 2) {
      result.warnings.push(
        `Removing ${validIndices.length}/${arrayLength} elements (>${Math.round((arrayLength / 2) * 100) / 100}%) - consider array reconstruction`
      );
    }

    // Sort indices for safe removal (descending order)
    result.safeIndices = validIndices.sort((a, b) => b - a);

    if (result.errors.length > 0) {
      result.isSafe = false;
    }

    Logger.log(
      `ARRAY SAFETY RESULT: Safe=${result.isSafe}, ValidIndices=${result.safeIndices.length}, Warnings=${result.warnings.length}, Errors=${result.errors.length}`
    );

    return result;
  }

  override update(time: number, delta: number): void {
    // Update UI system
    if (this.gameUI) {
      this.gameUI.update();
    }
    
    // Update particle system
    if (this.particleSystemManager) {
      this.particleSystemManager.update(delta);
    }
    
    // Update background bouncing using BackgroundBouncer
    if (this.backgroundBouncer && this.backgroundSprite) {
      try {
        // Update bouncer logic with delta time
        this.backgroundBouncer.update(delta);
        
        // Get sprite dimensions for positioning calculation
        const spriteWidth = this.backgroundSprite.width;
        const spriteHeight = this.backgroundSprite.height;
        const scaleX = this.backgroundSprite.scaleX;
        const scaleY = this.backgroundSprite.scaleY;
        
        // Validate sprite dimensions
        if (spriteWidth > 0 && spriteHeight > 0) {
          // Update background sprite position based on BackgroundBouncer calculations
          const position = this.backgroundBouncer.getBackgroundPosition(spriteWidth, spriteHeight, scaleX, scaleY);
          
          // Validate position before applying
          if (isFinite(position.x) && isFinite(position.y)) {
            this.backgroundSprite.setPosition(position.x, position.y);
          } else {
            Logger.log(`Background update warning: Invalid position calculated (${position.x}, ${position.y})`);
          }
        } else {
          Logger.log(`Background update warning: Invalid sprite dimensions ${spriteWidth}x${spriteHeight}`);
        }
      } catch (error) {
        Logger.log(`Background update error: ${error}`);
        // Continue without background animation on error
      }
    }
  }



  /**
   * Create a bouncing background sprite that moves around the screen
   */
  private createBouncingBackground(): void {
    try {
      const { width, height } = this.scale;
      
      // Validate screen dimensions
      if (width <= 0 || height <= 0) {
        Logger.log(`Background creation failed: Invalid screen dimensions ${width}x${height}`);
        return;
      }
      
      // Create regular sprite (no physics body needed for BackgroundBouncer system)
      this.backgroundSprite = this.add.sprite(width / 2, height / 2, 'dicetrix-bg');
      
      if (!this.backgroundSprite) {
        Logger.log('Background creation failed: Unable to create background sprite');
        return;
      }
      
      // Set the background to be behind everything else
      this.backgroundSprite.setDepth(-1000);
      
      // Set initial scale to 100% (no scaling)
      this.backgroundSprite.setScale(1.0);
      
      // Center the background image properly
      this.backgroundSprite.setOrigin(0.5, 0.5); // Center the sprite's origin
      
      // Initialize BackgroundBouncer with screen dimensions and 80% bounding box
      const bouncerConfig: BackgroundBouncerConfig = {
        screenWidth: width,
        screenHeight: height,
        boundingBoxScale: 0.8, // 80% of screen size
        initialSpeed: 50 // Medium-slow speed to match original
      };
      
      try {
        this.backgroundBouncer = new BackgroundBouncer(bouncerConfig);
        Logger.log(`Background created using non-physics BackgroundBouncer system at center (${width/2}, ${height/2})`);
        Logger.log(`Logical point bouncing within 80% bounding box (${width * 0.8}x${height * 0.8})`);
        Logger.log(`Physics system not required - using manual collision detection and movement calculations`);
      } catch (bouncerError) {
        Logger.log(`Background creation failed: BackgroundBouncer initialization error - ${bouncerError}`);
        // Clean up sprite if bouncer creation fails
        if (this.backgroundSprite) {
          this.backgroundSprite.destroy();
          this.backgroundSprite = null;
        }
      }
    } catch (error) {
      Logger.log(`Background creation failed: Unexpected error - ${error}`);
      // Ensure cleanup on any error
      if (this.backgroundSprite) {
        this.backgroundSprite.destroy();
        this.backgroundSprite = null;
      }
      this.backgroundBouncer = null;
    }
  }


  /**
   * Reset all game state variables to initial values
   * Prevents memory leaks and ensures fresh game starts
   */
  private resetGameState(): void {
    Logger.log('Game: Resetting all game state variables');

    // Reset core game state
    this.phase = 'Idle';
    this.score = 0;
    this.cascadeMultiplier = 1;
    this.currentLevel = 1;
    this.gameStartTime = 0;
    this.scoreAchievementTime = 0;
    this.isPaused = false;

    // Reset score breakdown
    this.scoreBreakdown = {
      baseScore: 0,
      chainMultiplier: 1,
      ultimateComboMultiplier: 1,
      boosterModifiers: 0,
      totalScore: 0
    };

    // Clear piece references
    this.activePiece = null;
    this.nextPiece = null;

    // Reset booster chance to default
    this.boosterChance = 0.15;

    // Clear sprite arrays (they should already be cleaned up, but ensure they're empty)
    this.activeSprites = [];
    this.nextSprites = [];
    this.lockedSprites = [];

    // Reset procedural system references (they should be destroyed, but clear references)
    this.blackDieManager = null;
    this.boosterEffectSystem = null;
    this.scoreMultiplierManager = null;
    this.currentDifficultyConfig = null;

    // Reset initialization metrics
    this.initializationMetrics = {
      sceneCreateStart: 0,
      backgroundSetComplete: 0,
      registrySetupComplete: 0,
      gameBoardInitComplete: 0,
      coordinateConverterInitComplete: 0,
      gameUICreateStart: 0,
      gameUICreateComplete: 0,
      firstPieceGenerationStart: 0,
      firstPieceGenerationComplete: 0,
      firstPieceSpawnStart: 0,
      firstPieceSpawnComplete: 0,
      timersSetupComplete: 0,
      initialRenderStart: 0,
      initialRenderComplete: 0,
      sceneCreateEnd: 0
    };

    // Reset game board if it exists
    if (this.gameBoard) {
      try {
        // Clear all cells in the game board
        const allPositions: Array<{ x: number; y: number }> = [];
        for (let x = 0; x < this.gameBoard.state.width; x++) {
          for (let y = 0; y < this.gameBoard.state.height; y++) {
            if (!this.gameBoard.isEmpty(x, y)) {
              allPositions.push({ x, y });
            }
          }
        }
        if (allPositions.length > 0) {
          this.gameBoard.clearCells(allPositions);
          Logger.log(`Game: Cleared ${allPositions.length} cells from game board`);
        } else {
          Logger.log('Game: Game board was already empty');
        }
      } catch (error) {
        Logger.log(`Game: Error clearing game board - ${error}`);
      }
    }

    Logger.log('Game: Game state reset completed');
  }

  shutdown(): void {
    try {
      Logger.log('Game scene: Starting shutdown cleanup process');

      // Clean up timers when scene shuts down
      try {
        if (this.dropTimer) {
          this.dropTimer.remove(false);
          this.dropTimer = null;
        }

        if (this.gravityTimer) {
          this.gravityTimer.remove(false);
          this.gravityTimer = null;
        }
        Logger.log('Game scene: Timers cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up timers - ${error}`);
      }

      // Clean up UI
      try {
        if (this.gameUI) {
          this.gameUI.destroy();
        }
        Logger.log('Game scene: GameUI cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up GameUI - ${error}`);
      }

      // Clean up audio
      try {
        if (this.soundEffectLibrary) {
          this.soundEffectLibrary.destroy();
          this.soundEffectLibrary = null;
        }
        Logger.log('Game scene: Audio system cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up audio system - ${error}`);
      }

      // Clean up particle system
      try {
        if (this.particleSystemManager) {
          this.particleSystemManager.destroy();
          this.particleSystemManager = null;
        }
        Logger.log('Game scene: Particle system cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up particle system - ${error}`);
      }

      // Clean up pause menu
      try {
        if (this.pauseMenuUI) {
          this.pauseMenuUI.destroy();
          this.pauseMenuUI = null;
        }
        Logger.log('Game scene: Pause menu cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up pause menu - ${error}`);
      }

      // Clean up score submission UI
      try {
        this.cleanupScoreSubmissionUI();
        Logger.log('Game scene: Score submission UI cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up score submission UI - ${error}`);
      }

      // Clean up background system (sprite and bouncer)
      try {
        // Clean up background sprite (regular sprite, not physics sprite)
        if (this.backgroundSprite) {
          this.backgroundSprite.destroy();
          this.backgroundSprite = null;
        }
        
        // Clean up BackgroundBouncer instance
        if (this.backgroundBouncer) {
          // BackgroundBouncer is a simple utility class with no explicit cleanup needed
          // Just clear the reference to allow garbage collection
          this.backgroundBouncer = null;
        }
        
        Logger.log('Game scene: Background system (sprite and bouncer) cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up background system - ${error}`);
        // Ensure references are cleared even if cleanup fails
        this.backgroundSprite = null;
        this.backgroundBouncer = null;
      }

      // Clean up sprite arrays
      try {
        this.clearSprites();
        Logger.log('Game scene: Sprite arrays cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up sprite arrays - ${error}`);
      }

      // Clean up glow effect pool
      try {
        cleanupGlowPool();
        Logger.log('Game scene: Glow effect pool cleaned up successfully');
      } catch (error) {
        Logger.log(`Game scene: Error cleaning up glow effect pool - ${error}`);
      }

      // Reset all game state variables to prevent memory leaks and ensure fresh starts
      try {
        this.resetGameState();
        Logger.log('Game scene: Game state variables reset successfully');
      } catch (error) {
        Logger.log(`Game scene: Error resetting game state - ${error}`);
      }

      Logger.log('Game scene: Shutdown cleanup completed successfully');
    } catch (error) {
      Logger.log(`Game scene: Critical error during shutdown - ${error}`);
      // Ensure critical references are cleared even if shutdown fails
      this.backgroundSprite = null;
      this.backgroundBouncer = null;
      this.soundEffectLibrary = null;
      this.pauseMenuUI = null;
    }
  }
}
