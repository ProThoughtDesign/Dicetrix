import { ColorBooster } from './Booster.js';
import { MatchGroup } from './MatchGroup.js';
import { DieColor } from '../../../shared/types/game.js';
import { AudioEvents } from '../audio/AudioEvents.js';

/**
 * Manages all active boosters in the game
 * Handles activation, deactivation, duration tracking, and effects
 */
export class BoosterManager {
  private activeBoosters: Map<string, ColorBooster>;
  private scene: Phaser.Scene;
  private audioEvents: AudioEvents | null = null;

  constructor(scene: Phaser.Scene) {
    this.activeBoosters = new Map();
    this.scene = scene;
  }

  /**
   * Update all active boosters
   * @param delta Time elapsed since last update in milliseconds
   */
  public update(delta: number): void {
    const expiredBoosters: string[] = [];

    for (const [key, booster] of this.activeBoosters.entries()) {
      if (!booster.update(delta)) {
        expiredBoosters.push(key);
      }
    }

    // Remove expired boosters
    for (const key of expiredBoosters) {
      const booster = this.activeBoosters.get(key);
      if (booster && this.audioEvents) {
        this.audioEvents.onBoosterDeactivate();
      }
      this.activeBoosters.delete(key);
    }
  }

  /**
   * Process a match group and activate any color boosters
   * @param matchGroup The match group to process
   */
  public processMatchGroup(matchGroup: MatchGroup): void {
    // Check for black dice - they remove all active boosters
    if (matchGroup.hasBlackDice()) {
      this.removeAllBoosters();
      console.log('Black die matched - all boosters removed');
      return;
    }

    // Get color boosters from the match group
    const newBoosters = matchGroup.getColorBoosters();

    for (const boosterData of newBoosters) {
      const colorBooster = new ColorBooster(boosterData.color, boosterData.effect);
      this.activateBooster(colorBooster);
      
      // Play booster activation sound
      if (this.audioEvents) {
        this.audioEvents.onBoosterActivate(boosterData.color);
      }
    }
  }

  /**
   * Activate a color booster
   * @param booster The booster to activate
   */
  public activateBooster(booster: ColorBooster): void {
    const key = this.getBoosterKey(booster.color, booster.type);
    const existingBooster = this.activeBoosters.get(key);

    if (existingBooster && existingBooster.canStackWith(booster)) {
      // Stack with existing booster (extend duration)
      existingBooster.stackWith(booster);
    } else {
      // Activate new booster
      booster.activate();
      this.activeBoosters.set(key, booster);
    }
  }

  /**
   * Remove a specific booster
   * @param color The color of the booster to remove
   * @param type The type of the booster to remove
   */
  public removeBooster(color: DieColor, type: string): void {
    const key = this.getBoosterKey(color, type);
    const booster = this.activeBoosters.get(key);
    
    if (booster) {
      booster.deactivate();
      this.activeBoosters.delete(key);
    }
  }

  /**
   * Remove all active boosters (used when black dice are matched)
   */
  public removeAllBoosters(): void {
    const removedCount = this.activeBoosters.size;
    
    for (const booster of this.activeBoosters.values()) {
      booster.deactivate();
    }
    this.activeBoosters.clear();
    
    if (removedCount > 0) {
      console.log(`Black die matched! Removed ${removedCount} active boosters`);
      
      // Emit event for visual feedback
      if (this.scene && this.scene.events) {
        this.scene.events.emit('blackDieActivated', removedCount);
      }
    }
  }

  /**
   * Get all active boosters
   */
  public getActiveBoosters(): ColorBooster[] {
    return Array.from(this.activeBoosters.values());
  }

  /**
   * Check if a specific booster is active
   * @param color The color of the booster
   * @param type The type of the booster
   */
  public isBoosterActive(color: DieColor, type: string): boolean {
    const key = this.getBoosterKey(color, type);
    return this.activeBoosters.has(key);
  }

  /**
   * Get a specific active booster
   * @param color The color of the booster
   * @param type The type of the booster
   */
  public getBooster(color: DieColor, type: string): ColorBooster | null {
    const key = this.getBoosterKey(color, type);
    return this.activeBoosters.get(key) || null;
  }

  /**
   * Apply score multiplier from active boosters
   * @param baseScore The base score to multiply
   * @returns The modified score
   */
  public applyScoreMultipliers(baseScore: number): number {
    let multipliedScore = baseScore;

    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'score_multiplier' && booster.isActive) {
        multipliedScore *= booster.value;
      }
    }

    return Math.floor(multipliedScore);
  }

  /**
   * Apply chain bonus from active boosters
   * @param baseChainMultiplier The base chain multiplier
   * @returns The modified chain multiplier
   */
  public applyChainBonus(baseChainMultiplier: number): number {
    let modifiedMultiplier = baseChainMultiplier;

    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'chain_bonus' && booster.isActive) {
        modifiedMultiplier += booster.value;
      }
    }

    return modifiedMultiplier;
  }

  /**
   * Get fall speed modifier from active boosters
   * @returns The fall speed multiplier (1.0 = normal speed, 0.5 = half speed)
   */
  public getFallSpeedModifier(): number {
    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'slow_fall' && booster.isActive) {
        return booster.value;
      }
    }
    return 1.0;
  }

  /**
   * Get wild die chance modifier from active boosters
   * @returns The additional wild die chance (0.0 to 1.0)
   */
  public getWildChanceModifier(): number {
    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'wild_chance' && booster.isActive) {
        return booster.value;
      }
    }
    return 0.0;
  }

  /**
   * Get size boost modifier from active boosters
   * @returns The additional size boost value
   */
  public getSizeBoostModifier(): number {
    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'size_boost' && booster.isActive) {
        return booster.value;
      }
    }
    return 0;
  }

  /**
   * Get gravity delay from active boosters
   * @returns The gravity delay in milliseconds
   */
  public getGravityDelay(): number {
    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'gravity_delay' && booster.isActive) {
        return booster.value;
      }
    }
    return 0;
  }

  /**
   * Consume piece-based boosters (green wild chance, yellow extra time)
   */
  public consumePieceBasedBoosters(): void {
    for (const booster of this.activeBoosters.values()) {
      if (booster.type === 'wild_chance' || booster.type === 'extra_time') {
        booster.decrementDuration(1);
      }
    }
  }

  /**
   * Get booster data for HUD display
   */
  public getHUDData(): Array<{
    color: DieColor;
    icon: string;
    name: string;
    description: string;
    progress: number;
    displayColor: string;
  }> {
    const hudData: Array<{
      color: DieColor;
      icon: string;
      name: string;
      description: string;
      progress: number;
      displayColor: string;
    }> = [];

    for (const booster of this.activeBoosters.values()) {
      const displayInfo = booster.getDisplayInfo();
      hudData.push({
        color: booster.color,
        icon: displayInfo.icon,
        name: displayInfo.name,
        description: displayInfo.description,
        progress: booster.getProgress(),
        displayColor: displayInfo.color
      });
    }

    return hudData;
  }

  /**
   * Clear all boosters (for game reset)
   */
  public clear(): void {
    this.removeAllBoosters();
  }

  /**
   * Generate a unique key for a booster
   * @param color The color of the booster
   * @param type The type of the booster
   */
  private getBoosterKey(color: DieColor, type: string): string {
    return `${color}-${type}`;
  }

  /**
   * Set audio events handler
   */
  public setAudioEvents(audioEvents: AudioEvents): void {
    this.audioEvents = audioEvents;
  }

  /**
   * Get debug information about active boosters
   */
  public getDebugInfo(): string {
    const boosterInfo = Array.from(this.activeBoosters.values())
      .map(booster => `${booster.color}:${booster.type}(${Math.ceil(booster.remainingDuration)})`)
      .join(', ');
    
    return `ActiveBoosters(${this.activeBoosters.size}): [${boosterInfo}]`;
  }
}
