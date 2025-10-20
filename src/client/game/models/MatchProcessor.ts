import { Grid } from './Grid.js';
import { MatchGroup } from './MatchGroup.js';
import { MatchEffects } from './MatchEffects.js';
import { BoosterManager } from './BoosterManager.js';
import { Die } from './Die.js';
import { GridPosition, ColorBooster, SizeEffect } from '../../../shared/types/game.js';
import { AudioEvents } from '../audio/AudioEvents.js';

/**
 * MatchProcessor handles the complete match detection and clearing workflow
 * Coordinates between Grid, MatchGroup, MatchEffects, and BoosterManager classes
 */
export class MatchProcessor {
  private grid: Grid;
  private effects: MatchEffects;
  private boosterManager: BoosterManager;
  private scene: Phaser.Scene;
  private audioEvents: AudioEvents | null = null;

  constructor(grid: Grid, scene: Phaser.Scene, boosterManager: BoosterManager) {
    this.grid = grid;
    this.scene = scene;
    this.boosterManager = boosterManager;
    this.effects = new MatchEffects(scene);
  }

  /**
   * Process all matches in the grid and return results
   */
  public async processMatches(): Promise<MatchProcessResult> {
    const matches = this.grid.detectMatches();
    
    if (matches.length === 0) {
      return {
        matchesFound: false,
        totalScore: 0,
        activatedBoosters: [],
        clearedDice: [],
        sizeEffects: [],
        ultimateComboTriggered: false
      };
    }

    const result: MatchProcessResult = {
      matchesFound: true,
      totalScore: 0,
      activatedBoosters: [],
      clearedDice: [],
      sizeEffects: [],
      ultimateComboTriggered: false
    };

    // Process each match
    for (const match of matches) {
      await this.processSingleMatch(match, result);
    }

    return result;
  }

  /**
   * Process a single match group
   */
  private async processSingleMatch(match: MatchGroup, result: MatchProcessResult): Promise<void> {
    // Check for Black Die first (it removes boosters before other effects)
    if (match.hasBlackDice()) {
      if (this.audioEvents) {
        this.audioEvents.onBlackDieActivate();
      }
      await this.effects.playBlackDieEffect(match, this.grid.gridToScreen.bind(this.grid));
    }

    // Check for Ultimate Combo
    if (match.isUltimateCombo()) {
      result.ultimateComboTriggered = true;
      if (this.audioEvents) {
        this.audioEvents.onUltimateCombo();
      }
      await this.effects.playUltimateComboEffect(match, this.grid.gridToScreen.bind(this.grid));
      
      // Upgrade all dice in the grid to maximum values
      this.upgradeAllDiceToMax();
    }

    // Get size effect
    const sizeEffect = match.getSizeEffect();
    result.sizeEffects.push(sizeEffect);

    // Calculate base score and apply booster effects
    const baseScore = match.calculateBaseScore();
    const modifiedScore = this.boosterManager.applyScoreMultipliers(baseScore);
    result.totalScore += modifiedScore;

    // Process match with booster manager (handles both activation and black die removal)
    this.boosterManager.processMatchGroup(match);
    
    // Get color boosters for result tracking (only if not black die)
    if (!match.hasBlackDice()) {
      const boosters = match.getColorBoosters();
      result.activatedBoosters.push(...boosters);
    }

    // Play audio for match clearing
    if (this.audioEvents && !match.hasBlackDice() && !match.isUltimateCombo()) {
      this.audioEvents.onMatchClear(match.size);
    }

    // Play visual effects (if not already played for black die or ultimate combo)
    if (!match.hasBlackDice() && !match.isUltimateCombo()) {
      await this.effects.playMatchClearEffect(match, this.grid.gridToScreen.bind(this.grid));
    }

    // Clear dice based on size effect
    const clearedDice = await this.applySizeEffect(match, sizeEffect);
    result.clearedDice.push(...clearedDice);
  }

  /**
   * Apply the size effect for a match
   */
  private async applySizeEffect(match: MatchGroup, sizeEffect: SizeEffect): Promise<Die[]> {
    let clearedDice: Die[] = [];

    switch (sizeEffect.type) {
      case 'standard':
        // Standard clear effect for 3-dice matches
        clearedDice = this.applyStandardClear(match);
        break;
      
      case 'line_clear':
        // Row/column clearing for 4-dice matches
        clearedDice = this.applyLineClear(match);
        break;
      
      case 'spawn_wild':
        // Wild die spawning for 5-dice matches
        clearedDice = this.applyWildSpawn(match);
        break;
      
      case 'area_clear':
        // 7x7 area clearing for 7-dice matches
        clearedDice = this.applyAreaClear(match);
        break;
      
      case 'grid_clear':
        // Full grid clearing for 9+ dice matches
        clearedDice = this.applyGridClear(match);
        break;
    }

    // Destroy the visual dice objects
    for (const die of clearedDice) {
      if (die && typeof die.destroy === 'function') {
        die.destroy();
      }
    }

    return clearedDice;
  }

  /**
   * Apply standard clear effect (3-dice matches)
   */
  private applyStandardClear(match: MatchGroup): Die[] {
    // Clear only the matched dice
    return this.grid.clearCells(match.positions);
  }

  /**
   * Apply line clear effect (4-dice matches)
   */
  private applyLineClear(match: MatchGroup): Die[] {
    const center = match.getCenterPosition();
    
    // Determine whether to clear row or column based on match shape
    const minX = Math.min(...match.positions.map(p => p.x));
    const maxX = Math.max(...match.positions.map(p => p.x));
    const minY = Math.min(...match.positions.map(p => p.y));
    const maxY = Math.max(...match.positions.map(p => p.y));
    
    const horizontalSpread = maxX - minX;
    const verticalSpread = maxY - minY;
    
    let clearedDice: Die[] = [];
    
    if (horizontalSpread >= verticalSpread) {
      // Clear entire row
      clearedDice = this.grid.clearRow(center.y);
    } else {
      // Clear entire column
      clearedDice = this.grid.clearColumn(center.x);
    }
    
    return clearedDice;
  }

  /**
   * Apply wild spawn effect (5-dice matches)
   */
  private applyWildSpawn(match: MatchGroup): Die[] {
    // First clear the matched dice
    const clearedDice = this.grid.clearCells(match.positions);
    
    // Then spawn a wild die
    this.spawnWildDie();
    
    // Play wild die spawn sound
    if (this.audioEvents) {
      this.audioEvents.onWildDieSpawn();
    }
    
    return clearedDice;
  }

  /**
   * Apply area clear effect (7-dice matches)
   */
  private applyAreaClear(match: MatchGroup): Die[] {
    const center = match.getCenterPosition();
    
    // Clear 7x7 area centered on the match
    return this.grid.clearArea(center.x, center.y, 7);
  }

  /**
   * Apply grid clear effect (9+ dice matches)
   */
  private applyGridClear(_match: MatchGroup): Die[] {
    // Clear the entire grid
    return this.grid.clearAll();
  }

  /**
   * Spawn a wild die (for 5-dice matches)
   */
  private spawnWildDie(): void {
    // Find an empty cell to spawn the wild die
    const emptyPositions: GridPosition[] = [];
    
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        if (this.grid.isEmpty(x, y)) {
          emptyPositions.push({ x, y });
        }
      }
    }

    if (emptyPositions.length > 0) {
      // Choose a random empty position
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      const position = emptyPositions[randomIndex];
      
      if (position) {
        // Create a wild die
        const wildDie = new Die(
          this.scene,
          0, 0, // Position will be set by grid
          6, // Default sides for wild die
          'green', // Default color for wild die
          true, // isWild
          false // isBlack
        );
        
        // Place it in the grid
        this.grid.setDie(position.x, position.y, wildDie);
      }
    } else {
      // If no empty positions, emit an event to add wild die to next piece
      // This will be handled by the game scene
      this.scene.events.emit('wildDieSpawned');
    }
  }

  /**
   * Upgrade all dice in the grid to maximum values (Ultimate Combo effect)
   */
  private upgradeAllDiceToMax(): void {
    // Get maximum sides from current game mode
    const maxSides = this.getMaxSidesForCurrentMode();
    
    console.log(`Ultimate Combo triggered! Upgrading all dice to maximum values (${maxSides} sides)`);
    
    let upgradedCount = 0;
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const die = this.grid.getDie(x, y);
        if (die && !die.isWild && !die.isBlack) {
          die.upgradeToMax(maxSides);
          upgradedCount++;
        }
      }
    }
    
    console.log(`Ultimate Combo: Upgraded ${upgradedCount} dice to maximum values`);
  }

  /**
   * Get maximum die sides for current game mode
   * This should be set by the game scene
   */
  private getMaxSidesForCurrentMode(): number {
    // Default to 20 if not set, but this should be configured by the game scene
    return (this as any).maxSides || 20;
  }

  /**
   * Set the maximum die sides for the current game mode
   */
  public setMaxSides(maxSides: number): void {
    (this as any).maxSides = maxSides;
  }



  /**
   * Get fall speed modifier from active boosters
   */
  public getFallSpeedModifier(): number {
    return this.boosterManager.getFallSpeedModifier();
  }

  /**
   * Get wild die chance modifier from active boosters
   */
  public getWildChanceModifier(): number {
    return this.boosterManager.getWildChanceModifier();
  }

  /**
   * Get size boost modifier from active boosters
   */
  public getSizeBoostModifier(): number {
    return this.boosterManager.getSizeBoostModifier();
  }

  /**
   * Get gravity delay from active boosters
   */
  public getGravityDelay(): number {
    return this.boosterManager.getGravityDelay();
  }

  /**
   * Consume piece-based boosters (called when a new piece is generated)
   */
  public consumePieceBasedBoosters(): void {
    this.boosterManager.consumePieceBasedBoosters();
  }

  /**
   * Process cascading matches after gravity is applied
   * @deprecated Use CascadeManager.processCascadeSequence() instead
   */
  public async processCascades(maxCascades: number = 10): Promise<CascadeResult> {
    console.warn('MatchProcessor.processCascades() is deprecated. Use CascadeManager.processCascadeSequence() instead.');
    
    let cascadeCount = 0;
    let totalScore = 0;
    let totalClearedDice: Die[] = [];
    let allActivatedBoosters: ColorBooster[] = [];
    let ultimateComboTriggered = false;

    while (cascadeCount < maxCascades) {
      // Apply gravity first
      const gravityApplied = this.grid.applyGravity();
      if (!gravityApplied) {
        break; // No dice moved, no point in checking for matches
      }

      // Check for new matches
      const matchResult = await this.processMatches();
      
      if (!matchResult.matchesFound) {
        break; // No more matches found
      }

      cascadeCount++;
      
      // Calculate chain multiplier: floor(log2(chain_index)) + booster bonus
      const baseChainMultiplier = Math.floor(Math.log2(cascadeCount));
      const modifiedChainMultiplier = this.boosterManager.applyChainBonus(baseChainMultiplier);
      const chainScore = matchResult.totalScore * Math.max(1, modifiedChainMultiplier);
      
      totalScore += chainScore;
      totalClearedDice.push(...matchResult.clearedDice);
      allActivatedBoosters.push(...matchResult.activatedBoosters);
      
      if (matchResult.ultimateComboTriggered) {
        ultimateComboTriggered = true;
      }

      // Play cascade effect
      if (matchResult.clearedDice.length > 0) {
        // Use the center of the first cleared die as the effect position
        const firstMatch = this.grid.detectMatches()[0];
        if (firstMatch) {
          const centerPos = firstMatch.getCenterPosition();
          await this.effects.playCascadeEffect(cascadeCount, centerPos, this.grid.gridToScreen.bind(this.grid));
        }
      }
    }

    return {
      cascadeCount,
      totalScore,
      clearedDice: totalClearedDice,
      activatedBoosters: allActivatedBoosters,
      ultimateComboTriggered,
      maxCascadesReached: cascadeCount >= maxCascades
    };
  }

  /**
   * Get all current matches without processing them (for preview/debugging)
   */
  public getCurrentMatches(): MatchGroup[] {
    return this.grid.detectMatches();
  }

  /**
   * Check if there are any matches available
   */
  public hasMatches(): boolean {
    return this.grid.detectMatches().length > 0;
  }

  /**
   * Set audio events handler
   */
  public setAudioEvents(audioEvents: AudioEvents): void {
    this.audioEvents = audioEvents;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.effects.destroy();
  }
}

/**
 * Result of processing matches
 */
export interface MatchProcessResult {
  matchesFound: boolean;
  totalScore: number;
  activatedBoosters: ColorBooster[];
  clearedDice: Die[];
  sizeEffects: SizeEffect[];
  ultimateComboTriggered: boolean;
}

/**
 * Result of cascade processing
 */
export interface CascadeResult {
  cascadeCount: number;
  totalScore: number;
  clearedDice: Die[];
  activatedBoosters: ColorBooster[];
  ultimateComboTriggered: boolean;
  maxCascadesReached: boolean;
}
