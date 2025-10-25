import { GridPosition } from '../types/game.js';

/**
 * FloodFillValidator provides connectivity validation for piece generation
 * using flood fill algorithm to ensure all positions form a connected shape.
 */
export class FloodFillValidator {
  /**
   * Validates that all positions in the array form a connected shape
   * @param positions Array of grid positions to validate
   * @returns True if all positions are connected, false otherwise
   * @throws Error if positions array is invalid
   */
  static validateConnectivity(positions: GridPosition[]): boolean {
    // Handle edge cases
    if (!positions || !Array.isArray(positions)) {
      throw new Error('Invalid positions array: must be a non-null array');
    }

    if (positions.length === 0) {
      throw new Error('Invalid positions array: cannot be empty');
    }

    if (positions.length === 1) {
      // Single position is always connected
      return true;
    }

    // Validate position objects
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      if (!pos || typeof pos !== 'object') {
        throw new Error(`Invalid position at index ${i}: must have numeric x and y properties`);
      }
      if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        throw new Error(`Invalid position at index ${i}: must have numeric x and y properties`);
      }
      if (!Number.isInteger(pos.x) || !Number.isInteger(pos.y)) {
        throw new Error(`Invalid position at index ${i}: x and y must be integers`);
      }
    }

    // Check for duplicate positions
    const positionKeys = new Set<string>();
    for (const pos of positions) {
      const key = this.positionKey(pos);
      if (positionKeys.has(key)) {
        throw new Error(`Duplicate position found: (${pos.x}, ${pos.y})`);
      }
      positionKeys.add(key);
    }

    // Perform flood fill starting from the first position
    const visited = new Set<string>();
    const connectedCount = this.floodFill(positions, visited, positions[0]!);

    // All positions should be reachable from the starting position
    return connectedCount === positions.length;
  }

  /**
   * Performs flood fill algorithm to count connected positions
   * @param positions Array of all positions to check
   * @param visited Set of already visited position keys
   * @param start Starting position for flood fill
   * @returns Number of connected positions found
   */
  private static floodFill(
    positions: GridPosition[], 
    visited: Set<string>, 
    start: GridPosition
  ): number {
    const startKey = this.positionKey(start);
    
    // If already visited or not in the positions array, return 0
    if (visited.has(startKey) || !this.isPositionInArray(start, positions)) {
      return 0;
    }

    // Mark as visited
    visited.add(startKey);
    let count = 1;

    // Check all adjacent positions (4-directional)
    const adjacent = this.getAdjacent(start);
    for (const adjPos of adjacent) {
      count += this.floodFill(positions, visited, adjPos);
    }

    return count;
  }

  /**
   * Gets all adjacent positions (4-directional: up, down, left, right)
   * @param pos Center position
   * @returns Array of adjacent positions
   */
  private static getAdjacent(pos: GridPosition): GridPosition[] {
    return [
      { x: pos.x, y: pos.y + 1 }, // Up
      { x: pos.x, y: pos.y - 1 }, // Down
      { x: pos.x - 1, y: pos.y }, // Left
      { x: pos.x + 1, y: pos.y }  // Right
    ];
  }

  /**
   * Creates a unique string key for position hashing and visited tracking
   * @param pos Grid position
   * @returns String key in format "x,y"
   */
  private static positionKey(pos: GridPosition): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Checks if a position exists in the positions array
   * @param target Position to find
   * @param positions Array of positions to search
   * @returns True if position is found
   */
  private static isPositionInArray(target: GridPosition, positions: GridPosition[]): boolean {
    const targetKey = this.positionKey(target);
    return positions.some(pos => this.positionKey(pos) === targetKey);
  }
}
