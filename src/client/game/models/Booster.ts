import { DieColor, BoosterEffect } from '../../../shared/types/game.js';

/**
 * Abstract base class for all boosters in the game
 * Handles activation/deactivation lifecycle and duration tracking
 */
export abstract class Booster {
  public type: BoosterEffect['type'];
  public duration: number;
  public remainingDuration: number;
  public isActive: boolean;
  public value: number;

  constructor(effect: BoosterEffect) {
    this.type = effect.type;
    this.duration = effect.duration;
    this.remainingDuration = effect.duration;
    this.value = effect.value;
    this.isActive = false;
  }

  /**
   * Activate the booster
   */
  public activate(): void {
    if (!this.isActive) {
      this.isActive = true;
      this.onActivate();
    }
  }

  /**
   * Update the booster (called each frame)
   * @param delta Time elapsed since last update in milliseconds
   * @returns true if booster is still active, false if expired
   */
  public update(delta: number): boolean {
    if (!this.isActive) {
      return false;
    }

    // Update duration based on booster type
    const eventBasedTypes: BoosterEffect['type'][] = ['wild_chance', 'extra_time'];
    if (eventBasedTypes.includes(this.type)) {
      // These boosters count pieces/events, not time
      // Duration will be decremented manually when events occur
    } else {
      // Time-based boosters
      this.remainingDuration -= delta;
    }

    if (this.remainingDuration <= 0) {
      this.deactivate();
      return false;
    }

    return true;
  }

  /**
   * Deactivate the booster
   */
  public deactivate(): void {
    if (this.isActive) {
      this.isActive = false;
      this.onDeactivate();
    }
  }

  /**
   * Get the progress of this booster (0-1)
   */
  public getProgress(): number {
    if (this.duration <= 0) return 0;
    return Math.max(0, this.remainingDuration / this.duration);
  }

  /**
   * Reset the booster to its initial state
   */
  public reset(): void {
    this.remainingDuration = this.duration;
    this.isActive = false;
  }

  /**
   * Extend the duration of this booster
   */
  public extend(additionalDuration: number): void {
    this.remainingDuration += additionalDuration;
  }

  /**
   * Called when the booster is activated
   * Override in subclasses for specific activation logic
   */
  protected abstract onActivate(): void;

  /**
   * Called when the booster is deactivated
   * Override in subclasses for specific deactivation logic
   */
  protected abstract onDeactivate(): void;

  /**
   * Get display information for the HUD
   */
  public abstract getDisplayInfo(): {
    icon: string;
    name: string;
    description: string;
    color: string;
  };

  /**
   * Decrement remaining duration by a specific amount (for event-based boosters)
   */
  public decrementDuration(amount: number = 1): void {
    this.remainingDuration -= amount;
    if (this.remainingDuration <= 0) {
      this.deactivate();
    }
  }
}

/**
 * Color-specific booster implementation
 */
export class ColorBooster extends Booster {
  public color: DieColor;

  constructor(color: DieColor, effect: BoosterEffect) {
    super(effect);
    this.color = color;
  }

  protected onActivate(): void {
    console.log(`${this.color} booster activated: ${this.type}`);
    // Specific activation logic will be handled by the BoosterManager
  }

  protected onDeactivate(): void {
    console.log(`${this.color} booster deactivated: ${this.type}`);
    // Specific deactivation logic will be handled by the BoosterManager
  }

  public getDisplayInfo(): {
    icon: string;
    name: string;
    description: string;
    color: string;
  } {
    const colorNames: Record<DieColor, string> = {
      red: 'Red',
      blue: 'Blue',
      green: 'Green',
      yellow: 'Yellow',
      purple: 'Purple',
      orange: 'Orange',
      cyan: 'Cyan'
    };

    const descriptions: Record<BoosterEffect['type'], string> = {
      score_multiplier: `${this.value}x Score Multiplier`,
      slow_fall: `${(1 - this.value) * 100}% Slower Fall`,
      wild_chance: `${this.value * 100}% Wild Chance`,
      extra_time: `+${this.value / 1000}s Time`,
      chain_bonus: `+${this.value} Chain Bonus`,
      size_boost: `+${this.value} Size Boost`,
      gravity_delay: `${this.value / 1000}s Gravity Delay`
    };

    const colorHex: Record<DieColor, string> = {
      red: '#ff4444',
      blue: '#4444ff',
      green: '#44ff44',
      yellow: '#ffff44',
      purple: '#ff44ff',
      orange: '#ff8844',
      cyan: '#44ffff'
    };

    return {
      icon: `booster-${this.color}`,
      name: `${colorNames[this.color]} Booster`,
      description: descriptions[this.type] || 'Unknown Effect',
      color: colorHex[this.color]
    };
  }

  /**
   * Create a ColorBooster from a match group's color analysis
   */
  public static fromColor(color: DieColor): ColorBooster {
    const effects: Record<DieColor, BoosterEffect> = {
      red: { type: 'score_multiplier', value: 1.5, duration: 10000 },
      blue: { type: 'slow_fall', value: 0.5, duration: 15000 },
      green: { type: 'wild_chance', value: 0.1, duration: 3 }, // 3 pieces
      yellow: { type: 'extra_time', value: 5000, duration: 1 }, // 1 use
      purple: { type: 'chain_bonus', value: 2, duration: 8000 },
      orange: { type: 'size_boost', value: 1, duration: 5000 },
      cyan: { type: 'gravity_delay', value: 2000, duration: 12000 }
    };

    const effect = effects[color];
    return new ColorBooster(color, effect);
  }

  /**
   * Check if this booster can stack with another booster of the same color
   */
  public canStackWith(other: ColorBooster): boolean {
    return this.color === other.color && this.type === other.type;
  }

  /**
   * Stack this booster with another (extend duration)
   */
  public stackWith(other: ColorBooster): void {
    if (this.canStackWith(other)) {
      this.extend(other.duration);
    }
  }

  /**
   * Clone this booster
   */
  public clone(): ColorBooster {
    const cloned = new ColorBooster(this.color, {
      type: this.type,
      value: this.value,
      duration: this.duration
    });
    cloned.remainingDuration = this.remainingDuration;
    cloned.isActive = this.isActive;
    return cloned;
  }
}
