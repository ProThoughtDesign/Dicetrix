import { Grid } from './Grid.js';
import { MatchProcessor } from './MatchProcessor.js';
import { CascadeManager, CascadeSequenceResult } from './CascadeManager.js';
import { BoosterManager } from './BoosterManager.js';
import { ScoreManager } from './ScoreManager.js';
import { Piece } from './Piece.js';

import { GameMode, GameState, ScoreBreakdown } from '../../../shared/types/game.js';
import { GAME_MODES } from '../../../shared/config/game-modes.js';
import { AILogger } from '../../../shared/utils/ai-logger.js';

/**
 * GameStateManager coordinates all game systems and manages the complete game flow
 * Handles piece placement, match processing, cascades, scoring, and game state
 */
export class GameStateManager {
  private scene: Phaser.Scene;
  private grid: Grid;
  private matchProcessor: MatchProcessor;
  private cascadeManager: CascadeManager;
  private boosterManager: BoosterManager;
  private scoreManager: ScoreManager;
  
  // Game state
  private gameState: GameState;
  private currentPiece: Piece | null = null;
  private nextPiece: Piece | null = null;
  private processingTurn: boolean = false;
  
  // Scoring
  private totalScore: number = 0;
  private level: number = 1;
  private linesCleared: number = 0;
  
  // Game mode configuration
  private gameMode: GameMode = 'medium';
  private modeConfig: any;

  constructor(scene: Phaser.Scene, gameMode: GameMode = 'medium') {
    this.scene = scene;
    this.gameMode = gameMode;
    this.modeConfig = GAME_MODES[gameMode];
    
    // Initialize game systems
    this.initializeGameSystems();
    
    // Initialize game state
    this.gameState = {
      score: 0,
      level: 1,
      mode: gameMode,
      chainMultiplier: 0,
      isGameOver: false,
      activeBoosters: []
    };
    
    AILogger.logDecision(
      'GameStateManager',
      'Initialize game state manager',
      `Created game state manager for ${gameMode} mode`
    );
  }

  /**
   * Initialize all game systems
   */
  private initializeGameSystems(): void {
    // Create grid with appropriate sizing
    this.grid = new Grid(32, 100, 50); // cellSize, offsetX, offsetY
    
    // Create booster manager
    this.boosterManager = new BoosterManager(this.scene);
    
    // Create score manager
    this.scoreManager = new ScoreManager(this.boosterManager);
    
    // Create match processor
    this.matchProcessor = new MatchProcessor(this.grid, this.scene, this.boosterManager);
    this.matchProcessor.setMaxSides(Math.max(...this.modeConfig.diceTypes));
    
    // Create cascade manager
    this.cascadeManager = new CascadeManager(
      this.grid, 
      this.matchProcessor, 
      this.scene, 
      this.boosterManager
    );
    
    // Configure cascade manager for game mode
    this.cascadeManager.setMaxCascades(10); // Standard cascade limit
    this.cascadeManager.setAnimationTiming(300, 200); // Smooth animations
    this.cascadeManager.setScoreManager(this.scoreManager); // Connect scoring system
  }

  /**
   * Process a complete turn after a piece is locked
   * This is the main game flow method
   */
  public async processTurn(): Promise<TurnResult> {
    if (this.processingTurn) {
      console.warn('Turn already in progress');
      return this.createEmptyTurnResult();
    }

    this.processingTurn = true;
    
    AILogger.logDecision(
      'GameStateManager',
      'Start turn processing',
      'Beginning complete turn processing with match detection and cascades'
    );

    try {
      const turnResult: TurnResult = {
        matchesProcessed: false,
        cascadeResult: null,
        scoreBreakdown: null,
        gameOver: false,
        levelUp: false,
        newLevel: this.level
      };

      // Step 1: Check for initial matches
      const initialMatches = this.grid.detectMatches();
      
      if (initialMatches.length === 0) {
        // No matches, turn is complete
        return turnResult;
      }

      // Step 2: Process initial matches
      const matchResult = await this.matchProcessor.processMatches();
      turnResult.matchesProcessed = matchResult.matchesFound;

      if (!matchResult.matchesFound) {
        return turnResult;
      }

      // Step 3: Process cascade sequence
      const cascadeResult = await this.cascadeManager.processCascadeSequence();
      turnResult.cascadeResult = cascadeResult;

      // Step 4: Calculate final score
      const scoreBreakdown = this.calculateScoreBreakdown(matchResult, cascadeResult);
      turnResult.scoreBreakdown = scoreBreakdown;

      // Step 5: Update game state
      this.updateGameState(scoreBreakdown, cascadeResult);

      // Step 6: Check for level progression
      const levelUp = this.checkLevelProgression();
      turnResult.levelUp = levelUp.leveledUp;
      turnResult.newLevel = levelUp.newLevel;

      // Step 7: Check game over conditions
      turnResult.gameOver = this.checkGameOverConditions();

      AILogger.logDecision(
        'GameStateManager',
        'Complete turn processing',
        `Processed turn with ${cascadeResult.cascadeCount} cascades, score: ${scoreBreakdown.totalScore}`
      );

      return turnResult;
    } finally {
      this.processingTurn = false;
    }
  }

  /**
   * Lock a piece to the grid and start turn processing
   */
  public async lockPieceAndProcess(piece: Piece): Promise<TurnResult> {
    // Add piece to grid
    const success = this.grid.addPiece(piece);
    
    if (!success) {
      // Could not place piece - game over
      this.gameState.isGameOver = true;
      return {
        matchesProcessed: false,
        cascadeResult: null,
        scoreBreakdown: null,
        gameOver: true,
        levelUp: false,
        newLevel: this.level
      };
    }

    // Process the complete turn
    return await this.processTurn();
  }

  /**
   * Calculate comprehensive score breakdown using ScoreManager
   */
  private calculateScoreBreakdown(matchResult: any, cascadeResult: CascadeSequenceResult): ScoreBreakdown {
    const ultimateComboTriggered = matchResult.ultimateComboTriggered || cascadeResult.ultimateComboTriggered;
    
    // Use ScoreManager for comprehensive scoring calculation
    return this.scoreManager.calculateTurnScore(
      matchResult.totalScore,
      cascadeResult,
      ultimateComboTriggered
    );
  }

  /**
   * Update game state with turn results
   */
  private updateGameState(scoreBreakdown: ScoreBreakdown, cascadeResult: CascadeSequenceResult): void {
    // Update score using ScoreManager
    this.scoreManager.addScore(scoreBreakdown);
    this.totalScore = this.scoreManager.getTotalScore();
    this.gameState.score = this.totalScore;
    
    // Update chain multiplier
    this.gameState.chainMultiplier = cascadeResult.cascadeCount;
    
    // Update active boosters - convert to shared type format
    this.gameState.activeBoosters = this.boosterManager.getActiveBoosters().map(booster => ({
      color: booster.color,
      effect: {
        type: booster.type,
        value: booster.value,
        duration: booster.duration
      },
      remainingDuration: booster.remainingDuration,
      isActive: booster.isActive
    }));
    
    // Update lines cleared (for level progression)
    this.linesCleared += this.calculateLinesCleared(cascadeResult);
  }

  /**
   * Calculate equivalent lines cleared for level progression
   */
  private calculateLinesCleared(cascadeResult: CascadeSequenceResult): number {
    // Each cascade counts as partial line clear
    // Large cascades count as more lines
    let linesEquivalent = 0;
    
    for (const multiplierInfo of cascadeResult.chainMultipliers) {
      if (multiplierInfo.cascadeNumber <= 2) {
        linesEquivalent += 0.5; // Small cascades
      } else if (multiplierInfo.cascadeNumber <= 5) {
        linesEquivalent += 1; // Medium cascades
      } else {
        linesEquivalent += 2; // Large cascades
      }
    }
    
    return Math.floor(linesEquivalent);
  }

  /**
   * Check for level progression
   */
  private checkLevelProgression(): { leveledUp: boolean; newLevel: number } {
    const linesPerLevel = 10;
    const newLevel = Math.floor(this.linesCleared / linesPerLevel) + 1;
    
    if (newLevel > this.level) {
      this.level = newLevel;
      this.gameState.level = newLevel;
      
      AILogger.logDecision(
        'GameStateManager',
        'Level progression',
        `Advanced to level ${newLevel} after ${this.linesCleared} lines cleared`
      );
      
      return { leveledUp: true, newLevel };
    }
    
    return { leveledUp: false, newLevel: this.level };
  }

  /**
   * Check game over conditions
   */
  private checkGameOverConditions(): boolean {
    // Check if grid is full (pieces can't be placed)
    if (this.grid.isFull()) {
      this.gameState.isGameOver = true;
      
      AILogger.logDecision(
        'GameStateManager',
        'Game over',
        'Grid is full, game over condition met'
      );
      
      return true;
    }
    
    // Zen mode never ends
    if (this.gameMode === 'zen') {
      return false;
    }
    
    return false;
  }

  /**
   * Create empty turn result for error cases
   */
  private createEmptyTurnResult(): TurnResult {
    return {
      matchesProcessed: false,
      cascadeResult: null,
      scoreBreakdown: null,
      gameOver: false,
      levelUp: false,
      newLevel: this.level
    };
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get current score
   */
  public getScore(): number {
    return this.totalScore;
  }

  /**
   * Get current level
   */
  public getLevel(): number {
    return this.level;
  }

  /**
   * Get grid reference
   */
  public getGrid(): Grid {
    return this.grid;
  }

  /**
   * Get cascade manager reference
   */
  public getCascadeManager(): CascadeManager {
    return this.cascadeManager;
  }

  /**
   * Get match processor reference
   */
  public getMatchProcessor(): MatchProcessor {
    return this.matchProcessor;
  }

  /**
   * Get booster manager reference
   */
  public getBoosterManager(): BoosterManager {
    return this.boosterManager;
  }

  /**
   * Set current piece
   */
  public setCurrentPiece(piece: Piece | null): void {
    this.currentPiece = piece;
  }

  /**
   * Get current piece
   */
  public getCurrentPiece(): Piece | null {
    return this.currentPiece;
  }

  /**
   * Set next piece
   */
  public setNextPiece(piece: Piece | null): void {
    this.nextPiece = piece;
  }

  /**
   * Get next piece
   */
  public getNextPiece(): Piece | null {
    return this.nextPiece;
  }

  /**
   * Check if turn is being processed
   */
  public isProcessingTurn(): boolean {
    return this.processingTurn;
  }

  /**
   * Reset game state
   */
  public resetGame(): void {
    this.grid.reset();
    this.boosterManager.clear();
    this.cascadeManager.forceStopCascade();
    this.scoreManager.resetTotal();
    
    this.totalScore = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.currentPiece = null;
    this.nextPiece = null;
    this.processingTurn = false;
    
    this.gameState = {
      score: 0,
      level: 1,
      mode: this.gameMode,
      chainMultiplier: 0,
      isGameOver: false,
      activeBoosters: []
    };
    
    AILogger.logDecision(
      'GameStateManager',
      'Reset game',
      'Reset all game state and systems'
    );
  }

  /**
   * Get score manager reference
   */
  public getScoreManager(): ScoreManager {
    return this.scoreManager;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.cascadeManager.destroy();
    this.matchProcessor.destroy();
    this.boosterManager.clear();
    this.scoreManager.destroy();
    this.grid.reset();
    
    AILogger.logDecision(
      'GameStateManager',
      'Destroy game state manager',
      'Cleaned up all game systems'
    );
  }
}

// Type definitions

export interface TurnResult {
  matchesProcessed: boolean;
  cascadeResult: CascadeSequenceResult | null;
  scoreBreakdown: ScoreBreakdown | null;
  gameOver: boolean;
  levelUp: boolean;
  newLevel: number;
}
