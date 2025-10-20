import { MatchGroup } from './MatchGroup.js';
import { BoosterManager } from './BoosterManager.js';
import { CascadeSequenceResult } from './CascadeManager.js';
import { ScoreBreakdown } from '../../../shared/types/game.js';
import { AILogger } from '../../../shared/utils/ai-logger.js';

/**
 * ScoreManager handles all scoring calculations for Dicetrix
 * Implements the complete scoring system as per requirements 7.1-7.5
 */
export class ScoreManager {
  private boosterManager: BoosterManager;
  private totalScore: number = 0;
  private sessionScore: number = 0;
  
  // Score tracking for analytics
  private scoreHistory: ScoreBreakdown[] = [];
  private highestSingleTurn: number = 0;
  private longestChain: number = 0;
  private totalUltimateComboScore: number = 0;

  constructor(boosterManager: BoosterManager) {
    this.boosterManager = boosterManager;
    
    AILogger.logDecision(
      'ScoreManager',
      'Initialize scoring system',
      'Created comprehensive scoring system with base score, chain multipliers, and Ultimate Combo support'
    );
  }

  /**
   * Calculate base score for a match group
   * Requirement 7.1: Base score = sum of die sides × match size × matched number
   */
  public calculateBaseScore(matchGroup: MatchGroup): number {
    let totalSides = 0;
    
    // Sum all die sides in the match
    for (const die of matchGroup.dice) {
      totalSides += die.sides;
    }
    
    // For wild dice matches, use 1 as the matched number
    const effectiveMatchedNumber = matchGroup.matchedNumber === 0 ? 1 : matchGroup.matchedNumber;
    
    // Base score formula: sum of die sides × match size × matched number
    const baseScore = totalSides * matchGroup.size * effectiveMatchedNumber;
    
    AILogger.logDecision(
      'ScoreManager',
      'Calculate base score',
      `Match of ${matchGroup.size} dice (sides: ${totalSides}, number: ${effectiveMatchedNumber}) = ${baseScore} points`
    );
    
    return baseScore;
  }

  /**
   * Calculate chain multiplier for cascade
   * Requirement 7.2: Chain multiplier = floor(log2(chain_index))
   */
  public calculateChainMultiplier(cascadeIndex: number): number {
    if (cascadeIndex <= 0) {
      return 0;
    }
    
    // Base chain multiplier using logarithmic formula
    const baseMultiplier = Math.floor(Math.log2(cascadeIndex));
    
    // Apply booster modifications
    const finalMultiplier = this.boosterManager.applyChainBonus(baseMultiplier);
    
    AILogger.logDecision(
      'ScoreManager',
      'Calculate chain multiplier',
      `Cascade ${cascadeIndex}: base multiplier ${baseMultiplier}, final multiplier ${finalMultiplier}`
    );
    
    return finalMultiplier;
  }

  /**
   * Calculate comprehensive score breakdown for a complete turn
   * Integrates all scoring requirements (7.1-7.5)
   */
  public calculateTurnScore(
    initialMatchScore: number,
    cascadeResult: CascadeSequenceResult,
    ultimateComboTriggered: boolean = false
  ): ScoreBreakdown {
    // Start with base scores
    let totalBaseScore = initialMatchScore + cascadeResult.totalScore;
    
    // Calculate effective chain multiplier from cascades
    const maxChainMultiplier = cascadeResult.chainMultipliers.length > 0 
      ? Math.max(...cascadeResult.chainMultipliers.map(c => c.finalMultiplier))
      : 0;
    
    // Apply Ultimate Combo 5x multiplier if triggered
    // Requirement 7.3: Ultimate Combo applies 5x multiplier to resulting cascades
    let ultimateComboMultiplier = 1;
    if (ultimateComboTriggered || cascadeResult.ultimateComboTriggered) {
      ultimateComboMultiplier = 5;
      totalBaseScore *= ultimateComboMultiplier;
      
      AILogger.logDecision(
        'ScoreManager',
        'Apply Ultimate Combo multiplier',
        `Ultimate Combo triggered! Applying 5x multiplier to base score of ${totalBaseScore / 5}`
      );
    }
    
    // Apply color booster score modifications
    // Requirement 7.4: Color booster effects modify scoring
    const boosterModifiers = this.boosterManager.applyScoreMultipliers(1);
    
    // Calculate final score
    const finalScore = Math.floor(totalBaseScore * boosterModifiers);
    
    const breakdown: ScoreBreakdown = {
      baseScore: initialMatchScore + (cascadeResult.totalScore / ultimateComboMultiplier),
      chainMultiplier: maxChainMultiplier,
      ultimateComboMultiplier,
      boosterModifiers,
      totalScore: finalScore
    };
    
    // Update session tracking
    this.updateSessionTracking(breakdown, cascadeResult);
    
    AILogger.logDecision(
      'ScoreManager',
      'Complete turn scoring',
      `Turn score: base ${breakdown.baseScore}, chain x${breakdown.chainMultiplier}, combo x${breakdown.ultimateComboMultiplier}, boosters x${breakdown.boosterModifiers} = ${breakdown.totalScore}`
    );
    
    return breakdown;
  }

  /**
   * Calculate score for a single cascade step
   */
  public calculateCascadeScore(
    baseMatchScore: number,
    cascadeIndex: number,
    ultimateComboActive: boolean = false
  ): number {
    // Calculate chain multiplier
    const chainMultiplier = this.calculateChainMultiplier(cascadeIndex);
    
    // Apply chain multiplier (minimum 1x)
    let cascadeScore = baseMatchScore * Math.max(1, chainMultiplier);
    
    // Apply Ultimate Combo multiplier if active
    if (ultimateComboActive) {
      cascadeScore *= 5;
    }
    
    // Apply booster modifiers
    cascadeScore = Math.floor(cascadeScore * this.boosterManager.applyScoreMultipliers(1));
    
    return cascadeScore;
  }

  /**
   * Add score to total and update tracking
   */
  public addScore(scoreBreakdown: ScoreBreakdown): void {
    this.totalScore += scoreBreakdown.totalScore;
    this.sessionScore += scoreBreakdown.totalScore;
    this.scoreHistory.push(scoreBreakdown);
    
    // Update high score tracking
    if (scoreBreakdown.totalScore > this.highestSingleTurn) {
      this.highestSingleTurn = scoreBreakdown.totalScore;
    }
    
    AILogger.logDecision(
      'ScoreManager',
      'Add score to total',
      `Added ${scoreBreakdown.totalScore} points. Total score: ${this.totalScore}`
    );
  }

  /**
   * Update session tracking with turn results
   */
  private updateSessionTracking(breakdown: ScoreBreakdown, cascadeResult: CascadeSequenceResult): void {
    // Track longest chain
    if (cascadeResult.cascadeCount > this.longestChain) {
      this.longestChain = cascadeResult.cascadeCount;
    }
    
    // Track Ultimate Combo score
    if (breakdown.ultimateComboMultiplier > 1) {
      this.totalUltimateComboScore += breakdown.totalScore;
    }
  }

  /**
   * Get current total score
   */
  public getTotalScore(): number {
    return this.totalScore;
  }

  /**
   * Get current session score (since last reset)
   */
  public getSessionScore(): number {
    return this.sessionScore;
  }

  /**
   * Get score statistics for display
   */
  public getScoreStatistics(): ScoreStatistics {
    return {
      totalScore: this.totalScore,
      sessionScore: this.sessionScore,
      highestSingleTurn: this.highestSingleTurn,
      longestChain: this.longestChain,
      totalUltimateComboScore: this.totalUltimateComboScore,
      averageTurnScore: this.scoreHistory.length > 0 
        ? Math.floor(this.sessionScore / this.scoreHistory.length)
        : 0,
      totalTurns: this.scoreHistory.length
    };
  }

  /**
   * Get recent score breakdown for HUD display
   */
  public getRecentScoreBreakdown(): ScoreBreakdown | null {
    if (this.scoreHistory.length > 0) {
      const lastIndex = this.scoreHistory.length - 1;
      const lastBreakdown = this.scoreHistory[lastIndex];
      return lastBreakdown || null;
    }
    return null;
  }

  /**
   * Get score history for analytics
   */
  public getScoreHistory(): ScoreBreakdown[] {
    return [...this.scoreHistory];
  }

  /**
   * Reset session score (for new game)
   */
  public resetSession(): void {
    this.sessionScore = 0;
    this.scoreHistory = [];
    this.highestSingleTurn = 0;
    this.longestChain = 0;
    this.totalUltimateComboScore = 0;
    
    AILogger.logDecision(
      'ScoreManager',
      'Reset session',
      'Reset session scoring statistics for new game'
    );
  }

  /**
   * Reset total score (for complete restart)
   */
  public resetTotal(): void {
    this.totalScore = 0;
    this.resetSession();
    
    AILogger.logDecision(
      'ScoreManager',
      'Reset total score',
      'Reset all scoring data for complete restart'
    );
  }

  /**
   * Format score for display with appropriate separators
   */
  public static formatScore(score: number): string {
    return score.toLocaleString();
  }

  /**
   * Format score breakdown for display
   */
  public static formatScoreBreakdown(breakdown: ScoreBreakdown): string {
    const parts: string[] = [];
    
    parts.push(`Base: ${ScoreManager.formatScore(breakdown.baseScore)}`);
    
    if (breakdown.chainMultiplier > 0) {
      parts.push(`Chain: x${breakdown.chainMultiplier}`);
    }
    
    if (breakdown.ultimateComboMultiplier > 1) {
      parts.push(`Ultimate: x${breakdown.ultimateComboMultiplier}`);
    }
    
    if (breakdown.boosterModifiers !== 1) {
      parts.push(`Boosters: x${breakdown.boosterModifiers.toFixed(1)}`);
    }
    
    parts.push(`Total: ${ScoreManager.formatScore(breakdown.totalScore)}`);
    
    return parts.join(' | ');
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.scoreHistory = [];
    
    AILogger.logDecision(
      'ScoreManager',
      'Destroy score manager',
      'Cleaned up score manager resources'
    );
  }
}

/**
 * Score statistics interface
 */
export interface ScoreStatistics {
  totalScore: number;
  sessionScore: number;
  highestSingleTurn: number;
  longestChain: number;
  totalUltimateComboScore: number;
  averageTurnScore: number;
  totalTurns: number;
}
