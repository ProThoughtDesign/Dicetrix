/**
 * Utility class for validating and clamping grid positions within boundaries.
 */
export class GridBoundaryValidator {
  /**
   * Validate if a position is within grid boundaries
   * @param x X coordinate
   * @param y Y coordinate
   * @param gridWidth Grid width
   * @param gridHeight Grid height
   * @returns True if position is valid
   */
  static validatePosition(x: number, y: number, gridWidth: number, gridHeight: number): boolean {
    return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
  }

  /**
   * Clamp a position to valid grid boundaries
   * @param x X coordinate
   * @param y Y coordinate
   * @param gridWidth Grid width
   * @param gridHeight Grid height
   * @returns Clamped position within valid bounds
   */
  static clampPosition(
    x: number, 
    y: number, 
    gridWidth: number, 
    gridHeight: number
  ): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(x, gridWidth - 1)),
      y: Math.max(0, Math.min(y, gridHeight - 1))
    };
  }

  /**
   * Validate if a piece spawn position is valid (above the grid)
   * @param pieceY Piece Y coordinate
   * @param minRelativeY Minimum relative Y of dice in the piece
   * @param spawnY Required spawn Y position
   * @returns True if spawn position is valid
   */
  static validateSpawnPosition(pieceY: number, minRelativeY: number, spawnY: number): boolean {
    const lowestDieY = pieceY + minRelativeY;
    return lowestDieY >= spawnY;
  }

  /**
   * Check if a position is at the bottom boundary (Y = 0)
   * @param y Y coordinate
   * @returns True if at bottom boundary
   */
  static isAtBottom(y: number): boolean {
    return y <= 0;
  }

  /**
   * Check if a position is at the top boundary
   * @param y Y coordinate
   * @param gridHeight Grid height
   * @returns True if at top boundary
   */
  static isAtTop(y: number, gridHeight: number): boolean {
    return y === gridHeight - 1;
  }

  /**
   * Check if a position would be below the grid (invalid for collision)
   * @param y Y coordinate
   * @returns True if below grid
   */
  static isBelowGrid(y: number): boolean {
    return y < 0;
  }

  /**
   * Check if a position would be above the visible grid (spawn area)
   * @param y Y coordinate
   * @param gridHeight Grid height
   * @returns True if above visible grid
   */
  static isAboveGrid(y: number, gridHeight: number): boolean {
    return y >= gridHeight;
  }
}
