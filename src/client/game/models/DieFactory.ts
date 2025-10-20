import { Die } from './Die.js';
import { DieColor, GameMode } from '../../../shared/types/game.js';
import { GAME_MODES } from '../../../shared/config/game-modes.js';

/**
 * Factory class for creating dice based on game mode configurations
 */
export class DieFactory {
  private gameMode: GameMode;
  private config: typeof GAME_MODES[GameMode];

  constructor(gameMode: GameMode) {
    this.gameMode = gameMode;
    this.config = GAME_MODES[gameMode];
  }

  /**
   * Create a random die based on current game mode configuration
   */
  public createRandomDie(scene: Phaser.Scene, x: number, y: number): Die {
    // Determine if this should be a black die
    const isBlack = Math.random() < this.config.blackDieChance;
    
    if (isBlack) {
      // Black dice use random sides and color from available options
      const sides = this.getRandomSides();
      const color = this.getRandomColor();
      return new Die(scene, x, y, sides, color, false, true);
    }

    // Regular die creation
    const sides = this.getRandomSides();
    const color = this.getRandomColor();
    const isWild = false; // Wild dice are created through special effects, not randomly
    
    return new Die(scene, x, y, sides, color, isWild, false);
  }

  /**
   * Create a wild die with specified color
   */
  public createWildDie(scene: Phaser.Scene, x: number, y: number, color?: DieColor): Die {
    const dieColor = color || this.getRandomColor();
    const sides = this.getRandomSides(); // Wild dice still have sides for visual consistency
    
    return new Die(scene, x, y, sides, dieColor, true, false);
  }

  /**
   * Create a specific die with given properties
   */
  public createSpecificDie(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sides: number,
    color: DieColor,
    isWild: boolean = false,
    isBlack: boolean = false
  ): Die {
    return new Die(scene, x, y, sides, color, isWild, isBlack);
  }

  /**
   * Create an array of random dice for a piece
   */
  public createDiceForPiece(scene: Phaser.Scene, count: number): Die[] {
    const dice: Die[] = [];
    
    for (let i = 0; i < count; i++) {
      // Position will be set by the piece, using 0,0 as placeholder
      const die = this.createRandomDie(scene, 0, 0);
      dice.push(die);
    }
    
    return dice;
  }

  /**
   * Get random die sides based on current game mode
   */
  private getRandomSides(): number {
    const availableSides = this.config.diceTypes;
    const randomIndex = Math.floor(Math.random() * availableSides.length);
    return availableSides[randomIndex]!;
  }

  /**
   * Get random color based on current game mode
   */
  private getRandomColor(): DieColor {
    const availableColors = this.config.colors;
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    return availableColors[randomIndex]!;
  }

  /**
   * Get maximum sides available in current game mode
   */
  public getMaxSides(): number {
    return Math.max(...this.config.diceTypes);
  }

  /**
   * Get all available colors in current game mode
   */
  public getAvailableColors(): DieColor[] {
    return [...this.config.colors];
  }

  /**
   * Get all available die sides in current game mode
   */
  public getAvailableSides(): number[] {
    return [...this.config.diceTypes];
  }

  /**
   * Check if black dice are enabled in current mode
   */
  public hasBlackDice(): boolean {
    return this.config.blackDieChance > 0;
  }

  /**
   * Get the probability of black dice in current mode
   */
  public getBlackDieChance(): number {
    return this.config.blackDieChance;
  }

  /**
   * Update game mode and reconfigure factory
   */
  public setGameMode(gameMode: GameMode): void {
    this.gameMode = gameMode;
    this.config = GAME_MODES[gameMode];
  }

  /**
   * Get current game mode
   */
  public getGameMode(): GameMode {
    return this.gameMode;
  }

  /**
   * Create dice with specific distribution for testing
   */
  public createTestDice(
    scene: Phaser.Scene,
    specifications: Array<{
      sides: number;
      color: DieColor;
      isWild?: boolean;
      isBlack?: boolean;
    }>
  ): Die[] {
    return specifications.map((spec, index) => 
      new Die(
        scene,
        index * 40, // Spread them out horizontally
        0,
        spec.sides,
        spec.color,
        spec.isWild || false,
        spec.isBlack || false
      )
    );
  }
}
