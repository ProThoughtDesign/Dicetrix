import { Grid } from './Grid.js';
import { MatchProcessor } from './MatchProcessor.js';
import { MatchEffects } from './MatchEffects.js';
import { BoosterManager } from './BoosterManager.js';
import { ScoreManager } from './ScoreManager.js';
import { Die } from './Die.js';
import { GridPosition, ColorBooster } from '../../../shared/types/game.js';
import { AILogger } from '../../../shared/utils/ai-logger.js';
import { AudioEvents } from '../audio/AudioEvents.js';

/**
 * CascadeManager handles the gravity and cascade system for Dicetrix
 * Manages the complete flow of gravity application, match detection, and chain reactions
 */
export class CascadeManager {
  private grid: Grid;
  private matchProcessor: MatchProcessor;
  private effects: MatchEffects;
  private boosterManager: BoosterManager;
  private scoreManager: ScoreManager | null = null;
  private scene: Phaser.Scene;
  private audioEvents: AudioEvents | null = null;
  
  // Cascade state
  private maxCascades: number = 10;
  private currentCascadeCount: number = 0;
  private totalChainScore: number = 0;
  private isProcessingCascade: boolean = false;
  
  // Chain multiplier tracking
  private chainMultiplier: number = 0;
  private baseChainMultiplier: number = 0;
  
  // Visual effects timing
  private gravityAnimationDuration: number = 300; // ms
  private cascadeDelay: number = 200; // ms between cascades

  constructor(
    grid: Grid, 
    matchProcessor: MatchProcessor, 
    scene: Phaser.Scene, 
    boosterManager: BoosterManager
  ) {
    this.grid = grid;
    this.matchProcessor = matchProcessor;
    this.scene = scene;
    this.boosterManager = boosterManager;
    this.effects = new MatchEffects(scene);
    
    AILogger.logDecision(
      'CascadeManager',
      'Initialize cascade system',
      'Created cascade manager with gravity animation and chain multiplier tracking'
    );
  }

  /**
   * Process complete cascade sequence after dice are cleared
   * This is the main entry point for the cascade system
   */
  public async processCascadeSequence(): Promise<CascadeSequenceResult> {
    if (this.isProcessingCascade) {
      console.warn('Cascade already in progress, skipping');
      return this.createEmptyResult();
    }

    this.isProcessingCascade = true;
    this.resetCascadeState();
    
    AILogger.logDecision(
      'CascadeManager',
      'Start cascade sequence',
      `Beginning cascade processing with max ${this.maxCascades} cascades`
    );

    try {
      const result = await this.executeCascadeLoop();
      
      AILogger.logDecision(
        'CascadeManager',
        'Complete cascade sequence',
        `Completed ${result.cascadeCount} cascades with total score ${result.totalScore}`
      );
      
      return result;
    } finally {
      this.isProcessingCascade = false;
    }
  }

  /**
   * Execute the main cascade loop
   */
  private async executeCascadeLoop(): Promise<CascadeSequenceResult> {
    const result: CascadeSequenceResult = {
      cascadeCount: 0,
      totalScore: 0,
      clearedDice: [],
      activatedBoosters: [],
      ultimateComboTriggered: false,
      maxCascadesReached: false,
      chainMultipliers: []
    };

    while (this.currentCascadeCount < this.maxCascades) {
      // Step 1: Apply gravity with animation
      const gravityResult = await this.applyGravityWithAnimation();
      
      if (!gravityResult.diceMovedDown) {
        // No dice moved, cascade sequence is complete
        break;
      }

      // Step 2: Check for new matches after gravity
      const matches = this.grid.detectMatches();
      
      if (matches.length === 0) {
        // No new matches formed, cascade sequence is complete
        break;
      }

      // Step 3: Process the cascade
      this.currentCascadeCount++;
      const cascadeResult = await this.processSingleCascade(matches);
      
      // Step 4: Update results
      this.updateCascadeResults(result, cascadeResult);
      
      // Step 5: Apply cascade delay for visual pacing
      await this.applyCascadeDelay();
    }

    // Check if we hit the cascade limit
    if (this.currentCascadeCount >= this.maxCascades) {
      result.maxCascadesReached = true;
      console.warn(`Cascade limit of ${this.maxCascades} reached, stopping to prevent infinite loops`);
      
      AILogger.logDecision(
        'CascadeManager',
        'Cascade limit reached',
        `Hit maximum cascade limit of ${this.maxCascades} to prevent infinite loops`
      );
    }

    return result;
  }

  /**
   * Apply gravity with smooth animation
   */
  private async applyGravityWithAnimation(): Promise<GravityResult> {
    // Get all dice positions before gravity
    const diceBeforeGravity = this.getAllDicePositions();
    
    // Apply gravity logic
    const diceMovedDown = this.grid.applyGravity();
    
    if (!diceMovedDown) {
      return { diceMovedDown: false, animationPromise: Promise.resolve() };
    }

    // Play gravity sound
    if (this.audioEvents) {
      this.audioEvents.onGravityApply();
    }

    // Get all dice positions after gravity
    const diceAfterGravity = this.getAllDicePositions();
    
    // Create smooth falling animations
    const animationPromise = this.animateGravityFall(diceBeforeGravity, diceAfterGravity);
    
    return { diceMovedDown: true, animationPromise };
  }

  /**
   * Get all dice positions in the grid
   */
  private getAllDicePositions(): Map<Die, GridPosition> {
    const positions = new Map<Die, GridPosition>();
    
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const die = this.grid.getDie(x, y);
        if (die) {
          positions.set(die, { x, y });
        }
      }
    }
    
    return positions;
  }

  /**
   * Animate dice falling due to gravity
   */
  private async animateGravityFall(
    beforePositions: Map<Die, GridPosition>, 
    afterPositions: Map<Die, GridPosition>
  ): Promise<void> {
    const animations: Promise<void>[] = [];
    
    for (const [die, afterPos] of afterPositions) {
      const beforePos = beforePositions.get(die);
      
      if (beforePos && (beforePos.y !== afterPos.y)) {
        // Die moved down, animate it
        const beforeScreen = this.grid.gridToScreen(beforePos.x, beforePos.y);
        const afterScreen = this.grid.gridToScreen(afterPos.x, afterPos.y);
        
        // Set die to before position
        die.setPosition(beforeScreen.x, beforeScreen.y);
        
        // Animate to after position
        const animationPromise = new Promise<void>((resolve) => {
          this.scene.tweens.add({
            targets: die,
            y: afterScreen.y,
            duration: this.gravityAnimationDuration,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve()
          });
        });
        
        animations.push(animationPromise);
      }
    }
    
    // Wait for all animations to complete
    if (animations.length > 0) {
      await Promise.all(animations);
    }
  }

  /**
   * Process a single cascade step
   */
  private async processSingleCascade(matches: any[]): Promise<SingleCascadeResult> {
    // Process matches using the existing match processor
    const matchResult = await this.matchProcessor.processMatches();
    
    // Calculate chain multiplier and final score using ScoreManager if available
    let finalScore: number;
    let chainMultiplier: number;
    
    if (this.scoreManager) {
      // Use ScoreManager for accurate chain multiplier calculation
      chainMultiplier = this.scoreManager.calculateChainMultiplier(this.currentCascadeCount);
      finalScore = this.scoreManager.calculateCascadeScore(
        matchResult.totalScore,
        this.currentCascadeCount,
        matchResult.ultimateComboTriggered
      );
    } else {
      // Fallback to original calculation
      this.baseChainMultiplier = Math.floor(Math.log2(this.currentCascadeCount));
      chainMultiplier = this.boosterManager.applyChainBonus(this.baseChainMultiplier);
      
      finalScore = matchResult.totalScore * Math.max(1, chainMultiplier);
      
      if (matchResult.ultimateComboTriggered) {
        finalScore *= 5;
        console.log(`Ultimate Combo triggered during cascade ${this.currentCascadeCount}! Applying 5x multiplier`);
      }
    }
    
    this.chainMultiplier = chainMultiplier;
    
    // Play cascade audio
    if (this.audioEvents) {
      this.audioEvents.onCascade(this.currentCascadeCount);
    }
    
    // Play cascade visual effect
    if (matches.length > 0) {
      const firstMatch = matches[0];
      if (firstMatch && firstMatch.getCenterPosition) {
        const centerPos = firstMatch.getCenterPosition();
        await this.effects.playCascadeEffect(
          this.currentCascadeCount, 
          centerPos, 
          this.grid.gridToScreen.bind(this.grid)
        );
      }
    }
    
    return {
      cascadeNumber: this.currentCascadeCount,
      baseScore: matchResult.totalScore,
      chainMultiplier: chainMultiplier,
      finalScore: finalScore,
      clearedDice: matchResult.clearedDice,
      activatedBoosters: matchResult.activatedBoosters,
      ultimateComboTriggered: matchResult.ultimateComboTriggered
    };
  }

  /**
   * Update cascade results with single cascade data
   */
  private updateCascadeResults(
    totalResult: CascadeSequenceResult, 
    cascadeResult: SingleCascadeResult
  ): void {
    totalResult.cascadeCount = cascadeResult.cascadeNumber;
    totalResult.totalScore += cascadeResult.finalScore;
    totalResult.clearedDice.push(...cascadeResult.clearedDice);
    totalResult.activatedBoosters.push(...cascadeResult.activatedBoosters);
    
    if (cascadeResult.ultimateComboTriggered) {
      totalResult.ultimateComboTriggered = true;
    }
    
    totalResult.chainMultipliers.push({
      cascadeNumber: cascadeResult.cascadeNumber,
      baseMultiplier: this.baseChainMultiplier,
      finalMultiplier: cascadeResult.chainMultiplier,
      scoreContribution: cascadeResult.finalScore
    });
  }

  /**
   * Apply delay between cascades for visual pacing
   */
  private async applyCascadeDelay(): Promise<void> {
    if (this.cascadeDelay > 0) {
      await new Promise(resolve => {
        this.scene.time.delayedCall(this.cascadeDelay, resolve);
      });
    }
  }

  /**
   * Reset cascade state for new sequence
   */
  private resetCascadeState(): void {
    this.currentCascadeCount = 0;
    this.totalChainScore = 0;
    this.chainMultiplier = 0;
    this.baseChainMultiplier = 0;
  }

  /**
   * Create empty result for error cases
   */
  private createEmptyResult(): CascadeSequenceResult {
    return {
      cascadeCount: 0,
      totalScore: 0,
      clearedDice: [],
      activatedBoosters: [],
      ultimateComboTriggered: false,
      maxCascadesReached: false,
      chainMultipliers: []
    };
  }

  /**
   * Get current cascade state (for debugging/UI)
   */
  public getCascadeState(): CascadeState {
    return {
      isProcessing: this.isProcessingCascade,
      currentCascadeCount: this.currentCascadeCount,
      maxCascades: this.maxCascades,
      chainMultiplier: this.chainMultiplier,
      baseChainMultiplier: this.baseChainMultiplier
    };
  }

  /**
   * Set maximum cascade limit (for different game modes)
   */
  public setMaxCascades(maxCascades: number): void {
    this.maxCascades = Math.max(1, Math.min(50, maxCascades)); // Clamp between 1-50
    
    AILogger.logDecision(
      'CascadeManager',
      'Set cascade limit',
      `Updated maximum cascades to ${this.maxCascades}`
    );
  }

  /**
   * Set animation timing (for performance tuning)
   */
  public setAnimationTiming(gravityDuration: number, cascadeDelay: number): void {
    this.gravityAnimationDuration = Math.max(0, gravityDuration);
    this.cascadeDelay = Math.max(0, cascadeDelay);
    
    AILogger.logDecision(
      'CascadeManager',
      'Update animation timing',
      `Set gravity animation to ${gravityDuration}ms, cascade delay to ${cascadeDelay}ms`
    );
  }

  /**
   * Set score manager reference for accurate scoring calculations
   */
  public setScoreManager(scoreManager: ScoreManager): void {
    this.scoreManager = scoreManager;
    
    AILogger.logDecision(
      'CascadeManager',
      'Set score manager',
      'Connected cascade manager to score manager for accurate chain multiplier calculations'
    );
  }

  /**
   * Set audio events handler
   */
  public setAudioEvents(audioEvents: AudioEvents): void {
    this.audioEvents = audioEvents;
  }

  /**
   * Force stop cascade processing (emergency stop)
   */
  public forceStopCascade(): void {
    if (this.isProcessingCascade) {
      this.isProcessingCascade = false;
      this.resetCascadeState();
      
      AILogger.logDecision(
        'CascadeManager',
        'Force stop cascade',
        'Emergency stop of cascade processing'
      );
    }
  }

  /**
   * Get cascade statistics for scoring/analytics
   */
  public getCascadeStatistics(): CascadeStatistics {
    return {
      totalCascadesProcessed: this.currentCascadeCount,
      maxCascadeLimit: this.maxCascades,
      averageChainMultiplier: this.chainMultiplier,
      totalChainScore: this.totalChainScore,
      gravityAnimationDuration: this.gravityAnimationDuration,
      cascadeDelay: this.cascadeDelay
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.forceStopCascade();
    this.effects.destroy();
    
    AILogger.logDecision(
      'CascadeManager',
      'Destroy cascade manager',
      'Cleaned up cascade manager resources'
    );
  }
}

// Type definitions for cascade system

export interface CascadeSequenceResult {
  cascadeCount: number;
  totalScore: number;
  clearedDice: Die[];
  activatedBoosters: ColorBooster[];
  ultimateComboTriggered: boolean;
  maxCascadesReached: boolean;
  chainMultipliers: ChainMultiplierInfo[];
}

export interface SingleCascadeResult {
  cascadeNumber: number;
  baseScore: number;
  chainMultiplier: number;
  finalScore: number;
  clearedDice: Die[];
  activatedBoosters: ColorBooster[];
  ultimateComboTriggered: boolean;
}

export interface GravityResult {
  diceMovedDown: boolean;
  animationPromise: Promise<void>;
}

export interface CascadeState {
  isProcessing: boolean;
  currentCascadeCount: number;
  maxCascades: number;
  chainMultiplier: number;
  baseChainMultiplier: number;
}

export interface ChainMultiplierInfo {
  cascadeNumber: number;
  baseMultiplier: number;
  finalMultiplier: number;
  scoreContribution: number;
}

export interface CascadeStatistics {
  totalCascadesProcessed: number;
  maxCascadeLimit: number;
  averageChainMultiplier: number;
  totalChainScore: number;
  gravityAnimationDuration: number;
  cascadeDelay: number;
}
