import { GridPosition } from '../types/game.js';

/**
 * Die interface for Black Die operations
 * Using a minimal interface to avoid circular dependencies
 */
export interface BlackDie {
  id: string;
  sides: number;
  number: number;
  isBlack?: boolean;
  isWild?: boolean;
}

/**
 * GameBoard interface for area conversion operations
 * Using a minimal interface to avoid circular dependencies
 */
export interface GameBoard {
  state: {
    width: number;
    height: number;
    cells: (BlackDie | null)[][];
  };
  getCell(pos: GridPosition): BlackDie | null;
  lockCell(pos: GridPosition, die: BlackDie): void;
  isValidPosition(x: number, y: number): boolean;
}

/**
 * BlackDieManager handles Black Die wild matching capabilities and area conversion effects.
 * Black Dice are special wild dice that match any number and trigger area conversion effects.
 */
export class BlackDieManager {
  
  /**
   * Checks if a die is a Black Die
   * @param die The die to check
   * @returns True if the die is a Black Die
   */
  static isBlackDie(die: BlackDie): boolean {
    return die.isBlack === true;
  }

  /**
   * Determines if a Black Die can match with a target number
   * Black Dice are wild and can match with any number
   * @param blackDie The Black Die to check
   * @param targetNumber The number to match against
   * @returns True if the Black Die can match (always true for valid Black Dice)
   */
  static canMatchWith(blackDie: BlackDie, targetNumber: number): boolean {
    if (!this.isBlackDie(blackDie)) {
      return false;
    }

    // Black Dice are wild and can match any valid dice number
    // Validate that targetNumber is within reasonable dice range (1-20)
    return targetNumber >= 1 && targetNumber <= 20;
  }

  /**
   * Checks if a die has wild matching capabilities
   * This includes Black Dice and any other dice marked as wild
   * @param die The die to check
   * @returns True if the die can match wildly
   */
  static isWildDie(die: BlackDie): boolean {
    return die.isWild === true || this.isBlackDie(die);
  }

  /**
   * Gets the effective matching number for a die
   * For wild dice, this returns the target number they're matching against
   * For normal dice, this returns their face value
   * @param die The die to get the matching number for
   * @param targetNumber The number being matched against (for wild dice)
   * @returns The effective matching number
   */
  static getMatchingNumber(die: BlackDie, targetNumber?: number): number {
    if (this.isWildDie(die) && targetNumber !== undefined) {
      return targetNumber;
    }
    return die.number;
  }

  /**
   * Validates that a Black Die is properly configured
   * @param die The die to validate
   * @returns True if the Black Die is valid
   */
  static validateBlackDie(die: BlackDie): boolean {
    if (!this.isBlackDie(die)) {
      return false;
    }

    // Black Dice should be d20
    if (die.sides !== 20) {
      return false;
    }

    // Black Dice should have valid numbers (1-20)
    if (die.number < 1 || die.number > 20) {
      return false;
    }

    // Black Dice should be marked as wild
    if (!die.isWild) {
      return false;
    }

    return true;
  }

  /**
   * Creates a properly configured Black Die
   * @param id Unique identifier for the die
   * @param number Face value (1-20)
   * @param relativePos Position relative to piece center
   * @returns A properly configured Black Die
   */
  static createBlackDie(id: string, number: number, relativePos: GridPosition): BlackDie {
    // Validate number range
    if (number < 1 || number > 20) {
      throw new Error(`Black Die number must be between 1 and 20, got ${number}`);
    }

    return {
      id,
      sides: 20,
      number,
      isBlack: true,
      isWild: true
    };
  }

  /**
   * Triggers area conversion effect centered on a Black Die position
   * Converts all dice in a 3×3 grid to d20 dice with rerolled numbers
   * @param centerPos The center position of the area conversion
   * @param gameBoard The game board to apply conversion to
   */
  static triggerAreaConversion(centerPos: GridPosition, gameBoard: GameBoard): void {
    if (!gameBoard || !gameBoard.state) {
      throw new Error('Invalid game board provided for area conversion');
    }

    // Validate center position is within bounds
    if (!gameBoard.isValidPosition(centerPos.x, centerPos.y)) {
      throw new Error(`Area conversion center position (${centerPos.x}, ${centerPos.y}) is out of bounds`);
    }

    // Convert dice in 3×3 area to d20
    this.convertToD20InArea(centerPos, gameBoard);

    // Get all positions in the 3×3 area for rerolling
    const areaPositions = this.getAreaPositions(centerPos, gameBoard);
    
    // Reroll numbers for all converted dice
    this.rerollDiceInArea(areaPositions, gameBoard);
  }

  /**
   * Converts all dice in a 3×3 grid centered on the given position to d20 dice
   * @param centerPos The center position of the conversion area
   * @param gameBoard The game board to apply conversion to
   */
  private static convertToD20InArea(centerPos: GridPosition, gameBoard: GameBoard): void {
    const areaPositions = this.getAreaPositions(centerPos, gameBoard);

    for (const pos of areaPositions) {
      const existingDie = gameBoard.getCell(pos);
      if (existingDie) {
        // Create a new d20 die with the same ID but updated properties
        const convertedDie: BlackDie = {
          ...existingDie,
          sides: 20,
          // Keep the current number for now, will be rerolled in next step
          number: Math.min(existingDie.number, 20) // Clamp to d20 range
        };

        // Update the die in the game board
        gameBoard.lockCell(pos, convertedDie);
      }
    }
  }

  /**
   * Rerolls the numbers for all dice in the specified positions
   * @param positions Array of positions to reroll dice at
   * @param gameBoard The game board containing the dice
   */
  private static rerollDiceInArea(positions: GridPosition[], gameBoard: GameBoard): void {
    for (const pos of positions) {
      const die = gameBoard.getCell(pos);
      if (die) {
        // Generate new random number based on die sides (should be d20 after conversion)
        const newNumber = Math.floor(Math.random() * die.sides) + 1;
        
        // Create updated die with new number
        const rerolledDie: BlackDie = {
          ...die,
          number: newNumber
        };

        // Update the die in the game board
        gameBoard.lockCell(pos, rerolledDie);
      }
    }
  }

  /**
   * Gets all valid positions in a 3×3 grid centered on the given position
   * @param centerPos The center position of the area
   * @param gameBoard The game board to check bounds against
   * @returns Array of valid positions in the 3×3 area
   */
  private static getAreaPositions(centerPos: GridPosition, gameBoard: GameBoard): GridPosition[] {
    const positions: GridPosition[] = [];

    // Check 3×3 grid centered on the position
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const pos = {
          x: centerPos.x + dx,
          y: centerPos.y + dy
        };

        // Only include positions that are within the game board bounds
        if (gameBoard.isValidPosition(pos.x, pos.y)) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }

  /**
   * Validates that area conversion can be safely applied at the given position
   * @param centerPos The center position for area conversion
   * @param gameBoard The game board to validate against
   * @returns True if area conversion is safe to apply
   */
  static canApplyAreaConversion(centerPos: GridPosition, gameBoard: GameBoard): boolean {
    if (!gameBoard || !gameBoard.state) {
      return false;
    }

    // Check if center position is valid
    if (!gameBoard.isValidPosition(centerPos.x, centerPos.y)) {
      return false;
    }

    // Area conversion is always safe as it only affects existing dice
    // and respects board boundaries through getAreaPositions
    return true;
  }
}
