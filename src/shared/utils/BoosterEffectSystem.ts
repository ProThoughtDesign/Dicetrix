import { BoosterType, EnhancedDie } from '../types/difficulty.js';

/**
 * System for managing booster visual effects and type determination
 */
export class BoosterEffectSystem {
  private static readonly BOOSTER_COLORS: Record<BoosterType, string> = {
    [BoosterType.NONE]: '',
    [BoosterType.RED_GLOW]: '#ff4444',
    [BoosterType.BLUE_GLOW]: '#4444ff',
    [BoosterType.YELLOW_GLOW]: '#ffff44',
    [BoosterType.GREEN_GLOW]: '#44ff44',
    [BoosterType.PURPLE_GLOW]: '#aa44ff',
    [BoosterType.ORANGE_GLOW]: '#ff8844',
    [BoosterType.MAGENTA_GLOW]: '#ff44aa',
    [BoosterType.CYAN_GLOW]: '#44ffff',
    [BoosterType.TEAL_GLOW]: '#44aa88'
  };

  private static readonly AVAILABLE_BOOSTER_TYPES: BoosterType[] = [
    BoosterType.RED_GLOW,
    BoosterType.BLUE_GLOW,
    BoosterType.YELLOW_GLOW,
    BoosterType.GREEN_GLOW,
    BoosterType.PURPLE_GLOW,
    BoosterType.ORANGE_GLOW,
    BoosterType.MAGENTA_GLOW,
    BoosterType.CYAN_GLOW,
    BoosterType.TEAL_GLOW
  ];

  /**
   * Applies a booster effect to a die based on the given booster chance
   * @param die The die to potentially apply booster effect to
   * @param boosterChance Probability (0.0 to 1.0) of applying booster effect
   */
  public applyBoosterEffect(die: EnhancedDie, boosterChance: number): void {
    // Validate booster chance is within valid range
    if (boosterChance < 0 || boosterChance > 1) {
      throw new Error(`Invalid booster chance: ${boosterChance}. Must be between 0.0 and 1.0`);
    }

    // Determine if this die should receive a booster effect
    if (Math.random() < boosterChance) {
      const boosterType = this.determineBoosterType();
      die.boosterType = boosterType;
      die.glowColor = BoosterEffectSystem.BOOSTER_COLORS[boosterType];
    } else {
      die.boosterType = BoosterType.NONE;
      delete die.glowColor;
    }
  }

  /**
   * Calculates booster chance based on difficulty-specific percentages
   * @param difficultyBoosterChance The booster chance from difficulty configuration (0.0 to 1.0)
   * @returns The calculated booster chance
   */
  public calculateBoosterChance(difficultyBoosterChance: number): number {
    // Validate input
    if (difficultyBoosterChance < 0 || difficultyBoosterChance > 1) {
      throw new Error(`Invalid difficulty booster chance: ${difficultyBoosterChance}. Must be between 0.0 and 1.0`);
    }

    return difficultyBoosterChance;
  }

  /**
   * Gets the glow color for a given booster type
   * @param boosterType The booster type
   * @returns The hex color string for the glow effect
   */
  public getGlowColor(boosterType: BoosterType): string {
    return BoosterEffectSystem.BOOSTER_COLORS[boosterType];
  }

  /**
   * Checks if a die has a booster effect applied
   * @param die The die to check
   * @returns True if the die has a booster effect, false otherwise
   */
  public hasBoosterEffect(die: EnhancedDie): boolean {
    return die.boosterType !== undefined && die.boosterType !== BoosterType.NONE;
  }

  /**
   * Randomly selects a booster type from available options
   * @returns A randomly selected BoosterType (excluding NONE)
   */
  private determineBoosterType(): BoosterType {
    const randomIndex = Math.floor(Math.random() * BoosterEffectSystem.AVAILABLE_BOOSTER_TYPES.length);
    const selectedType = BoosterEffectSystem.AVAILABLE_BOOSTER_TYPES[randomIndex];
    
    // Safety check - should never happen with valid array
    if (!selectedType) {
      return BoosterType.RED_GLOW; // fallback to red glow
    }
    
    return selectedType;
  }
}
