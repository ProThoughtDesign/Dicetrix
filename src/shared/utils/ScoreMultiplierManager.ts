import { DifficultyModeConfig } from '../types/difficulty';
import Logger from '../../client/utils/Logger';

/**
 * ScoreMultiplierManager handles difficulty-based score scaling
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export class ScoreMultiplierManager {
  private currentMultiplier: number = 1.0;
  private difficultyConfig: DifficultyModeConfig | null = null;

  /**
   * Set the current difficulty configuration
   * @param config The difficulty configuration containing the score multiplier
   */
  public setDifficultyConfig(config: DifficultyModeConfig): void {
    this.difficultyConfig = config;
    this.currentMultiplier = config.scoreMultiplier;
    Logger.log(`ScoreMultiplierManager: Set multiplier to ${this.currentMultiplier}x for ${config.id} mode`);
  }

  /**
   * Get the current score multiplier
   * @returns The current score multiplier value
   */
  public getMultiplier(): number {
    return this.currentMultiplier;
  }

  /**
   * Apply the score multiplier to a base score
   * @param baseScore The base score before multiplier application
   * @returns The final score after applying the difficulty multiplier
   */
  public applyMultiplier(baseScore: number): number {
    if (baseScore <= 0) {
      return baseScore;
    }

    const finalScore = Math.floor(baseScore * this.currentMultiplier);
    Logger.log(`ScoreMultiplierManager: Applied ${this.currentMultiplier}x multiplier: ${baseScore} -> ${finalScore}`);
    return finalScore;
  }

  /**
   * Get the current difficulty mode ID
   * @returns The current difficulty mode ID or null if not set
   */
  public getCurrentDifficultyId(): string | null {
    return this.difficultyConfig?.id || null;
  }

  /**
   * Get a formatted string representation of the current multiplier
   * @returns Formatted multiplier string (e.g., "1.25x", "0.9x")
   */
  public getFormattedMultiplier(): string {
    return `${this.currentMultiplier}x`;
  }

  /**
   * Check if the current multiplier is different from the default (1.0x)
   * @returns True if multiplier is not 1.0x
   */
  public hasActiveMultiplier(): boolean {
    return this.currentMultiplier !== 1.0;
  }
}
