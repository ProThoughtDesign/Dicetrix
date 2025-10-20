import { Die } from './Die.js';
import { GridPosition, DieColor, SizeEffect, ColorBooster, BoosterEffect } from '../../../shared/types/game.js';

/**
 * MatchGroup class representing a group of matched dice
 * Handles size calculation, color analysis, and effect determination
 */
export class MatchGroup {
  public dice: Die[];
  public positions: GridPosition[];
  public matchedNumber: number;
  public size: number;
  public colors: Map<DieColor, number>;

  constructor(dice: Die[], positions: GridPosition[], matchedNumber: number) {
    this.dice = dice;
    this.positions = positions;
    this.matchedNumber = matchedNumber;
    this.size = dice.length;
    this.colors = new Map<DieColor, number>();
    
    this.analyzeColors();
  }

  /**
   * Analyze the colors in this match group
   */
  private analyzeColors(): void {
    this.colors.clear();
    
    for (const die of this.dice) {
      const color = die.color;
      this.colors.set(color, (this.colors.get(color) || 0) + 1);
    }
  }

  /**
   * Get the size effect for this match group
   */
  public getSizeEffect(): SizeEffect {
    if (this.size >= 9) {
      return { type: 'grid_clear', description: 'Clear entire grid' };
    } else if (this.size >= 7) {
      return { type: 'area_clear', description: 'Clear 7x7 area' };
    } else if (this.size >= 5) {
      return { type: 'spawn_wild', description: 'Spawn wild die' };
    } else if (this.size >= 4) {
      return { type: 'line_clear', description: 'Clear row or column' };
    } else {
      return { type: 'standard', description: 'Clear matched dice' };
    }
  }

  /**
   * Get color boosters that should be activated from this match
   */
  public getColorBoosters(): ColorBooster[] {
    const boosters: ColorBooster[] = [];
    
    // Find colors with 3+ dice
    const eligibleColors: DieColor[] = [];
    let maxCount = 0;
    
    for (const [color, count] of this.colors.entries()) {
      if (count >= 3) {
        if (count > maxCount) {
          maxCount = count;
          eligibleColors.length = 0; // Clear array
          eligibleColors.push(color);
        } else if (count === maxCount) {
          eligibleColors.push(color);
        }
      }
    }
    
    // Create boosters for tied colors
    for (const color of eligibleColors) {
      const booster = this.createColorBooster(color);
      if (booster) {
        boosters.push(booster);
      }
    }
    
    return boosters;
  }

  /**
   * Create a color booster for the specified color
   */
  private createColorBooster(color: DieColor): ColorBooster | null {
    const boosterEffects: Record<DieColor, BoosterEffect> = {
      red: { type: 'score_multiplier', value: 1.5, duration: 10000 },
      blue: { type: 'slow_fall', value: 0.5, duration: 15000 },
      green: { type: 'wild_chance', value: 0.1, duration: 3 }, // 3 pieces
      yellow: { type: 'extra_time', value: 5000, duration: 1 },
      purple: { type: 'chain_bonus', value: 2, duration: 8000 },
      orange: { type: 'size_boost', value: 1, duration: 5000 },
      cyan: { type: 'gravity_delay', value: 2000, duration: 12000 }
    };

    const effect = boosterEffects[color];
    if (!effect) {
      return null;
    }

    return {
      color,
      effect,
      remainingDuration: effect.duration,
      isActive: true
    };
  }

  /**
   * Calculate base score for this match group
   * Requirement 7.1: Base score = sum of die sides × match size × matched number
   */
  public calculateBaseScore(): number {
    let totalSides = 0;
    
    for (const die of this.dice) {
      totalSides += die.sides;
    }
    
    // Base score = sum of die sides × match size × matched number
    // For wild dice matches, use 1 as the matched number
    const effectiveMatchedNumber = this.matchedNumber === 0 ? 1 : this.matchedNumber;
    return totalSides * this.size * effectiveMatchedNumber;
  }

  /**
   * Get the center position of this match group (for area effects)
   */
  public getCenterPosition(): GridPosition {
    if (this.positions.length === 0) {
      return { x: 0, y: 0 };
    }
    
    let totalX = 0;
    let totalY = 0;
    
    for (const pos of this.positions) {
      totalX += pos.x;
      totalY += pos.y;
    }
    
    return {
      x: Math.round(totalX / this.positions.length),
      y: Math.round(totalY / this.positions.length)
    };
  }

  /**
   * Check if this match contains wild dice
   */
  public hasWildDice(): boolean {
    return this.dice.some(die => die.isWild);
  }

  /**
   * Check if this match contains black dice
   */
  public hasBlackDice(): boolean {
    return this.dice.some(die => die.isBlack);
  }

  /**
   * Get the most prevalent color in this match
   */
  public getDominantColor(): DieColor | null {
    let maxCount = 0;
    let dominantColor: DieColor | null = null;
    
    for (const [color, count] of this.colors.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }
    
    return dominantColor;
  }

  /**
   * Check if this is an Ultimate Combo (3+ adjacent wild dice)
   */
  public isUltimateCombo(): boolean {
    // Must have at least 3 dice and all must be wild
    if (this.size < 3) {
      return false;
    }
    
    return this.dice.every(die => die.isWild);
  }

  /**
   * Get positions that should be cleared for line effects
   */
  public getLineClearPositions(gridWidth: number, gridHeight: number): GridPosition[] {
    const positions: GridPosition[] = [];
    const center = this.getCenterPosition();
    
    // Determine whether to clear row or column based on match shape
    const minX = Math.min(...this.positions.map(p => p.x));
    const maxX = Math.max(...this.positions.map(p => p.x));
    const minY = Math.min(...this.positions.map(p => p.y));
    const maxY = Math.max(...this.positions.map(p => p.y));
    
    const horizontalSpread = maxX - minX;
    const verticalSpread = maxY - minY;
    
    if (horizontalSpread >= verticalSpread) {
      // Clear row
      for (let x = 0; x < gridWidth; x++) {
        positions.push({ x, y: center.y });
      }
    } else {
      // Clear column
      for (let y = 0; y < gridHeight; y++) {
        positions.push({ x: center.x, y });
      }
    }
    
    return positions;
  }

  /**
   * Get positions that should be cleared for area effects
   */
  public getAreaClearPositions(gridWidth: number, gridHeight: number, areaSize: number = 7): GridPosition[] {
    const positions: GridPosition[] = [];
    const center = this.getCenterPosition();
    const halfSize = Math.floor(areaSize / 2);
    
    for (let y = center.y - halfSize; y <= center.y + halfSize; y++) {
      for (let x = center.x - halfSize; x <= center.x + halfSize; x++) {
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          positions.push({ x, y });
        }
      }
    }
    
    return positions;
  }

  /**
   * Get all positions in the grid (for grid clear effect)
   */
  public getGridClearPositions(gridWidth: number, gridHeight: number): GridPosition[] {
    const positions: GridPosition[] = [];
    
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        positions.push({ x, y });
      }
    }
    
    return positions;
  }

  /**
   * Create a copy of this match group
   */
  public clone(): MatchGroup {
    return new MatchGroup([...this.dice], [...this.positions], this.matchedNumber);
  }

  /**
   * Get debug information about this match group
   */
  public getDebugInfo(): string {
    const colorInfo = Array.from(this.colors.entries())
      .map(([color, count]) => `${color}:${count}`)
      .join(', ');
    
    return `MatchGroup(size:${this.size}, number:${this.matchedNumber}, colors:[${colorInfo}], effect:${this.getSizeEffect().type})`;
  }
}
