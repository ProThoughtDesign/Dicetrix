import { Die } from './Die.js';
import { Piece } from './Piece.js';
import { MatchGroup } from './MatchGroup.js';
import { GridPosition } from '../../../shared/types/game.js';
import { GAME_CONSTANTS } from '../../../shared/config/game-modes.js';

/**
 * Grid class representing the 10x20 playing field where dice pieces are placed
 * Handles collision detection, piece placement, and match detection
 */
export class Grid {
  public cells: (Die | null)[][];
  public readonly width: number = GAME_CONSTANTS.GRID_WIDTH;
  public readonly height: number = GAME_CONSTANTS.GRID_HEIGHT;
  private cellSize: number;
  private offsetX: number;
  private offsetY: number;

  constructor(cellSize: number = 32, offsetX: number = 0, offsetY: number = 0) {
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    
    // Initialize empty grid
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      const row: (Die | null)[] = [];
      for (let x = 0; x < this.width; x++) {
        row[x] = null;
      }
      this.cells[y] = row;
    }
  }

  /**
   * Check if a grid position is empty
   */
  public isEmpty(x: number, y: number): boolean {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    const row = this.cells[y];
    return row ? row[x] === null : false;
  }

  /**
   * Check if a grid position is within valid bounds
   */
  public isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get the die at a specific grid position
   */
  public getDie(x: number, y: number): Die | null {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    const row = this.cells[y];
    return row ? (row[x] ?? null) : null;
  }

  /**
   * Set a die at a specific grid position
   */
  public setDie(x: number, y: number, die: Die | null): boolean {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    
    const row = this.cells[y];
    if (!row) {
      return false;
    }
    
    row[x] = die;
    
    // Update die's visual position if placing a die
    if (die) {
      const worldPos = this.gridToScreen(x, y);
      die.setPosition(worldPos.x, worldPos.y);
    }
    
    return true;
  }

  /**
   * Check if a piece can be placed at the specified position
   */
  public canPlacePiece(piece: Piece, gridX: number, gridY: number): boolean {
    const positions = piece.getDicePositions();
    
    for (const pos of positions) {
      const absoluteX = gridX + pos.x - piece.gridX;
      const absoluteY = gridY + pos.y - piece.gridY;
      
      // Check bounds
      if (!this.isValidPosition(absoluteX, absoluteY)) {
        return false;
      }
      
      // Check if position is occupied
      if (!this.isEmpty(absoluteX, absoluteY)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check collision for piece movement
   */
  public checkCollision(piece: Piece, newGridX: number, newGridY: number): boolean {
    const positions = piece.getDicePositions();
    
    for (const pos of positions) {
      const absoluteX = newGridX + pos.x - piece.gridX;
      const absoluteY = newGridY + pos.y - piece.gridY;
      
      // Check bounds
      if (absoluteX < 0 || absoluteX >= this.width || absoluteY >= this.height) {
        return true; // Collision with boundaries
      }
      
      // Allow movement above the grid (negative Y)
      if (absoluteY < 0) {
        continue;
      }
      
      // Check if position is occupied
      if (!this.isEmpty(absoluteX, absoluteY)) {
        return true; // Collision with existing die
      }
    }
    
    return false; // No collision
  }

  /**
   * Add a piece to the grid at its current position
   */
  public addPiece(piece: Piece): boolean {
    const positions = piece.getDicePositions();
    
    // First check if all positions are valid and empty
    for (const pos of positions) {
      if (!this.isValidPosition(pos.x, pos.y) || !this.isEmpty(pos.x, pos.y)) {
        return false;
      }
    }
    
    // Place all dice
    for (let i = 0; i < positions.length && i < piece.dice.length; i++) {
      const pos = positions[i];
      const die = piece.dice[i];
      if (pos && die) {
        this.setDie(pos.x, pos.y, die);
      }
    }
    
    return true;
  }

  /**
   * Remove dice from specified positions
   */
  public clearCells(positions: GridPosition[]): Die[] {
    const clearedDice: Die[] = [];
    
    for (const pos of positions) {
      if (this.isValidPosition(pos.x, pos.y)) {
        const row = this.cells[pos.y];
        if (row) {
          const die = row[pos.x];
          if (die !== null && die !== undefined) {
            clearedDice.push(die);
            row[pos.x] = null;
          }
        }
      }
    }
    
    return clearedDice;
  }

  /**
   * Apply gravity to make dice fall down after clearing
   */
  public applyGravity(): boolean {
    let moved = false;
    
    // Process from bottom to top, right to left
    for (let x = 0; x < this.width; x++) {
      let writeIndex = this.height - 1;
      
      // Collect all non-null dice in this column from bottom to top
      for (let y = this.height - 1; y >= 0; y--) {
        const row = this.cells[y];
        if (!row) continue;
        
        const die = row[x];
        if (die !== null && die !== undefined) {
          if (writeIndex !== y) {
            // Move die down
            const writeRow = this.cells[writeIndex];
            if (writeRow) {
              writeRow[x] = die;
              row[x] = null;
              
              // Update die's visual position
              const worldPos = this.gridToScreen(x, writeIndex);
              die.setPosition(worldPos.x, worldPos.y);
              
              moved = true;
            }
          }
          writeIndex--;
        }
      }
    }
    
    return moved;
  }

  /**
   * Detect matches of 3+ adjacent dice with the same number
   */
  public detectMatches(): MatchGroup[] {
    const visited: boolean[][] = [];
    const matches: MatchGroup[] = [];
    
    // Initialize visited array
    for (let y = 0; y < this.height; y++) {
      const visitedRow: boolean[] = [];
      for (let x = 0; x < this.width; x++) {
        visitedRow[x] = false;
      }
      visited[y] = visitedRow;
    }
    
    // Check each cell for potential matches
    for (let y = 0; y < this.height; y++) {
      const visitedRow = visited[y];
      const cellRow = this.cells[y];
      if (!visitedRow || !cellRow) continue;
      
      for (let x = 0; x < this.width; x++) {
        if (!visitedRow[x] && cellRow[x] !== null) {
          const match = this.floodFillMatch(x, y, visited);
          if (match && match.size >= 3) {
            matches.push(match);
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Flood fill algorithm to find connected dice with the same match value
   */
  private floodFillMatch(startX: number, startY: number, visited: boolean[][]): MatchGroup | null {
    const startRow = this.cells[startY];
    if (!startRow) return null;
    
    const startDie = startRow[startX];
    if (!startDie) {
      return null;
    }
    
    const matchValue = startDie.getMatchValue();
    const dice: Die[] = [];
    const positions: GridPosition[] = [];
    const stack: GridPosition[] = [{ x: startX, y: startY }];
    
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      
      const { x, y } = current;
      
      // Skip if out of bounds or already visited
      const visitedRow = visited[y];
      if (!this.isValidPosition(x, y) || !visitedRow || visitedRow[x]) {
        continue;
      }
      
      const cellRow = this.cells[y];
      if (!cellRow) continue;
      
      const die = cellRow[x];
      if (!die) {
        continue;
      }
      
      // Check if die matches (including wild dice logic)
      if (!this.canDiceMatch(startDie, die)) {
        continue;
      }
      
      // Mark as visited and add to match
      visitedRow[x] = true;
      dice.push(die);
      positions.push({ x, y });
      
      // Add adjacent cells to stack (4-directional)
      stack.push(
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      );
    }
    
    if (dice.length < 3) {
      return null;
    }
    
    // Create and return MatchGroup instance
    return new MatchGroup(dice, positions, matchValue === -1 ? 0 : matchValue);
  }

  /**
   * Check if two dice can match (handles wild dice logic)
   */
  private canDiceMatch(die1: Die, die2: Die): boolean {
    // Wild dice match with anything
    if (die1.isWild || die2.isWild) {
      return true;
    }
    
    // Regular dice match if they have the same number
    return die1.number === die2.number;
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  public gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.offsetX + gridX * this.cellSize + this.cellSize / 2,
      y: this.offsetY + gridY * this.cellSize + this.cellSize / 2
    };
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  public screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: Math.floor((screenX - this.offsetX) / this.cellSize),
      y: Math.floor((screenY - this.offsetY) / this.cellSize)
    };
  }

  /**
   * Get all dice in a specific row
   */
  public getRow(y: number): (Die | null)[] {
    if (y < 0 || y >= this.height) {
      return [];
    }
    const row = this.cells[y];
    return row ? [...row] : [];
  }

  /**
   * Get all dice in a specific column
   */
  public getColumn(x: number): (Die | null)[] {
    if (x < 0 || x >= this.width) {
      return [];
    }
    
    const column: (Die | null)[] = [];
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      column.push(row ? (row[x] ?? null) : null);
    }
    return column;
  }

  /**
   * Clear an entire row
   */
  public clearRow(y: number): Die[] {
    if (y < 0 || y >= this.height) {
      return [];
    }
    
    const clearedDice: Die[] = [];
    const row = this.cells[y];
    if (!row) return clearedDice;
    
    for (let x = 0; x < this.width; x++) {
      const die = row[x];
      if (die) {
        clearedDice.push(die);
        row[x] = null;
      }
    }
    
    return clearedDice;
  }

  /**
   * Clear an entire column
   */
  public clearColumn(x: number): Die[] {
    if (x < 0 || x >= this.width) {
      return [];
    }
    
    const clearedDice: Die[] = [];
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      const die = row[x];
      if (die) {
        clearedDice.push(die);
        row[x] = null;
      }
    }
    
    return clearedDice;
  }

  /**
   * Clear a rectangular area around a center point
   */
  public clearArea(centerX: number, centerY: number, size: number): Die[] {
    const clearedDice: Die[] = [];
    const halfSize = Math.floor(size / 2);
    
    for (let y = centerY - halfSize; y <= centerY + halfSize; y++) {
      for (let x = centerX - halfSize; x <= centerX + halfSize; x++) {
        if (this.isValidPosition(x, y)) {
          const row = this.cells[y];
          if (!row) continue;
          
          const die = row[x];
          if (die) {
            clearedDice.push(die);
            row[x] = null;
          }
        }
      }
    }
    
    return clearedDice;
  }

  /**
   * Clear the entire grid
   */
  public clearAll(): Die[] {
    const clearedDice: Die[] = [];
    
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      for (let x = 0; x < this.width; x++) {
        const die = row[x];
        if (die) {
          clearedDice.push(die);
          row[x] = null;
        }
      }
    }
    
    return clearedDice;
  }

  /**
   * Check if the grid is full (game over condition)
   */
  public isFull(): boolean {
    // Check top row for any dice
    const topRow = this.cells[0];
    if (!topRow) return false;
    
    for (let x = 0; x < this.width; x++) {
      if (topRow[x] !== null) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the number of filled cells in the grid
   */
  public getFilledCellCount(): number {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      for (let x = 0; x < this.width; x++) {
        if (row[x] !== null) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Find the lowest empty position in a column (for piece drop preview)
   */
  public findDropPosition(piece: Piece, gridX: number): number {
    let dropY = piece.gridY;
    
    // Keep moving down until collision
    while (!this.checkCollision(piece, gridX, dropY + 1)) {
      dropY++;
    }
    
    return dropY;
  }

  /**
   * Get grid state for debugging or serialization
   */
  public getGridState(): (string | null)[][] {
    const state: (string | null)[][] = [];
    
    for (let y = 0; y < this.height; y++) {
      const stateRow: (string | null)[] = [];
      const row = this.cells[y];
      if (!row) {
        state[y] = stateRow;
        continue;
      }
      
      for (let x = 0; x < this.width; x++) {
        const die = row[x];
        stateRow[x] = die ? die.getDisplayText() : null;
      }
      state[y] = stateRow;
    }
    
    return state;
  }

  /**
   * Reset the grid to empty state
   */
  public reset(): void {
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      for (let x = 0; x < this.width; x++) {
        const die = row[x];
        if (die) {
          die.destroy();
        }
        row[x] = null;
      }
    }
  }

  /**
   * Update visual positions of all dice (useful after screen resize)
   */
  public updateDicePositions(): void {
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      for (let x = 0; x < this.width; x++) {
        const die = row[x];
        if (die) {
          const worldPos = this.gridToScreen(x, y);
          die.setPosition(worldPos.x, worldPos.y);
        }
      }
    }
  }

  /**
   * Set grid offset and cell size (for responsive design)
   */
  public setLayout(cellSize: number, offsetX: number, offsetY: number): void {
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.updateDicePositions();
  }
}
