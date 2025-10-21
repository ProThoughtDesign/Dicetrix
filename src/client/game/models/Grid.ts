import { SimpleDie } from './SimpleDie.js';
import { Piece } from './Piece.js';
import { MatchGroup } from './MatchGroup.js';
import { GridPosition } from '../../../shared/types/game.js';
import { GAME_CONSTANTS } from '../../../shared/config/game-modes.js';
import { Die } from './Die.js';

/**
 * Grid class representing the 10x20 playing field where dice pieces are placed
 * Handles collision detection, piece placement, and match detection
 */
export class Grid {
  public cells: (SimpleDie | null)[][];
  public lockedPieces: Piece[]; // Pieces that are locked but still cohesive
  public readonly width: number = GAME_CONSTANTS.GRID_WIDTH;
  public readonly height: number = GAME_CONSTANTS.GRID_HEIGHT;
  private cellSize: number;
  private offsetX: number;
  private offsetY: number;

  constructor(cellSize: number = 32, offsetX: number = 0, offsetY: number = 0) {
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.lockedPieces = [];
    
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
  public getDie(x: number, y: number): SimpleDie | null {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    const row = this.cells[y];
    return row ? (row[x] ?? null) : null;
  }

  /**
   * Set a die at a specific grid position
   */
  public setDie(x: number, y: number, die: SimpleDie | null): boolean {
    if (!this.isValidPosition(x, y)) {
      console.log(`❌ GRID: Invalid position (${x}, ${y})`);
      return false;
    }
    
    const row = this.cells[y];
    if (!row) {
      console.log(`❌ GRID: No row at y=${y}`);
      return false;
    }
    
    if (die) {
      console.log(`📍 GRID: Placing die ${die.getDisplayText()} at (${x}, ${y})`);
      row[x] = die;
      
      // Update die's visual position
      const worldPos = this.gridToScreen(x, y);
      die.setPosition(worldPos.x, worldPos.y);
    } else {
      console.log(`🧹 GRID: Clearing position (${x}, ${y})`);
      row[x] = null;
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
    // Use the dice matrix for accurate collision detection
    const diceMatrix = piece.getDiceMatrix();
    const matrixSize = piece.getMatrixSize();
    
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        const die = diceMatrix[row]?.[col];
        if (die) {
          const absoluteX = newGridX + col;
          const absoluteY = newGridY + row;
          
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
      }
    }
    
    return false; // No collision
  }

  /**
   * Check collision for individual die at specific position
   */
  public checkDieCollision(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || x >= this.width || y >= this.height) {
      return true; // Collision with boundaries
    }
    
    // Allow movement above the grid (negative Y)
    if (y < 0) {
      return false;
    }
    
    // Check if position is occupied
    return !this.isEmpty(x, y);
  }

  /**
   * Add a piece to the grid at its current position (breaks piece into individual dice)
   */
  public addPiece(piece: Piece): boolean {
    // Get dice directly from the piece's rotated matrix to maintain proper positioning
    const diceToPlace: Array<{ die: SimpleDie; x: number; y: number }> = [];
    
    // Extract dice from the piece's dice matrix (which is properly rotated)
    if (typeof piece.getDiceMatrix === 'function' && typeof piece.getMatrixSize === 'function') {
      const diceMatrix = piece.getDiceMatrix();
      const matrixSize = piece.getMatrixSize();
      
      for (let row = 0; row < matrixSize; row++) {
        for (let col = 0; col < matrixSize; col++) {
          const die = diceMatrix[row]?.[col];
          if (die) {
            const gridX = piece.gridX + col;
            const gridY = piece.gridY + row;
            diceToPlace.push({ die, x: gridX, y: gridY });
          }
        }
      }
    } else {
      // Fallback to old method if piece doesn't have dice matrix
      const positions = piece.getDicePositions();
      for (let i = 0; i < positions.length && i < piece.dice.length; i++) {
        const pos = positions[i];
        const die = piece.dice[i];
        if (pos && die) {
          diceToPlace.push({ die, x: pos.x, y: pos.y });
        }
      }
    }
    
    // First check if all positions are valid and empty
    for (const { x, y } of diceToPlace) {
      if (!this.isValidPosition(x, y) || !this.isEmpty(x, y)) {
        return false;
      }
    }
    
    // Place all dice at their correct rotated positions
    for (const { die, x, y } of diceToPlace) {
      this.setDie(x, y, die);
    }
    
    return true;
  }

  /**
   * Add a locked piece to the grid (keeps piece cohesive until matches break it)
   */
  public addLockedPiece(piece: Piece): boolean {
    const positions = piece.getDicePositions();
    
    // First check if all positions are valid and empty
    for (const pos of positions) {
      if (!this.isValidPosition(pos.x, pos.y) || !this.isEmpty(pos.x, pos.y)) {
        return false;
      }
    }
    
    // Add piece to locked pieces array
    this.lockedPieces.push(piece);
    
    // Also place dice in cells array for collision detection
    for (let i = 0; i < positions.length && i < piece.dice.length; i++) {
      const pos = positions[i];
      const die = piece.dice[i];
      if (pos && die) {
        this.setDie(pos.x, pos.y, die);
      }
    }
    
    console.log(`Locked piece ${piece.shape} added to grid. Total locked pieces: ${this.lockedPieces.length}`);
    return true;
  }

  /**
   * Remove dice from specified positions
   */
  public clearCells(positions: GridPosition[]): SimpleDie[] {
    const clearedDice: SimpleDie[] = [];
    
    console.log(`🧹 GRID: Clearing ${positions.length} cells`);
    
    for (const pos of positions) {
      if (this.isValidPosition(pos.x, pos.y)) {
        const row = this.cells[pos.y];
        if (row) {
          const die = row[pos.x];
          if (die !== null && die !== undefined) {
            console.log(`🧹 GRID: Clearing die ${die.getDisplayText()} at (${pos.x}, ${pos.y})`);
            clearedDice.push(die);
            row[pos.x] = null; // Clear the cell
          } else {
            console.log(`⚠️ GRID: No die found at (${pos.x}, ${pos.y}) to clear`);
          }
        }
      } else {
        console.log(`❌ GRID: Invalid position (${pos.x}, ${pos.y})`);
      }
    }
    
    console.log(`🧹 GRID: Successfully cleared ${clearedDice.length} dice`);
    return clearedDice;
  }

  /**
   * Apply gravity with smooth animations
   * Only affects individual dice, not locked pieces
   */
  public async applyGravityWithAnimation(scene: Phaser.Scene): Promise<boolean> {
    const fallOperations: Array<{
      die: SimpleDie;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }> = [];

    // Find all dice that can fall (only individual dice, not part of pieces)
    for (let x = 0; x < this.width; x++) {
      for (let y = this.height - 2; y >= 0; y--) { // Start from second-to-bottom row
        const die = this.getDie(x, y);
        if (die && !this.isDiePartOfLockedPiece(die, x, y)) {
          const fallDistance = this.calculateFallDistance(x, y);
          if (fallDistance > 0) {
            fallOperations.push({
              die,
              fromX: x,
              fromY: y,
              toX: x,
              toY: y + fallDistance
            });
          }
        }
      }
    }

    if (fallOperations.length === 0) {
      return false; // No dice to fall
    }

    // Execute fall animations
    await this.executeFallAnimations(scene, fallOperations);
    return true;
  }

  /**
   * Calculate how far a die can fall
   */
  private calculateFallDistance(x: number, y: number): number {
    let distance = 0;
    let checkY = y + 1;

    while (checkY < this.height && this.isEmpty(x, checkY)) {
      distance++;
      checkY++;
    }

    return distance;
  }

  /**
   * Execute fall animations with smooth tweening
   */
  private async executeFallAnimations(scene: Phaser.Scene, operations: Array<{
    die: SimpleDie;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }>): Promise<void> {
    // Clear dice from current positions
    for (const op of operations) {
      this.setDie(op.fromX, op.fromY, null);
    }

    // Create animation promises
    const animationPromises: Promise<void>[] = [];

    for (const op of operations) {
      // Place die in new position in grid
      this.setDie(op.toX, op.toY, op.die);

      // Create smooth fall animation
      const targetPos = this.gridToScreen(op.toX, op.toY);
      const fallDistance = op.toY - op.fromY;
      const duration = Math.min(300 + fallDistance * 50, 800); // Longer falls take more time

      const animationPromise = new Promise<void>((resolve) => {
        // Safety check - make sure die and its components exist
        if (!op.die || !op.die.graphics || !op.die.text) {
          console.warn('Die or its components missing during animation');
          resolve();
          return;
        }

        // Check if the die components are still valid (not destroyed)
        if (op.die.graphics.scene && op.die.text.scene) {
          scene.tweens.add({
            targets: [op.die.graphics, op.die.text],
            x: targetPos.x,
            y: targetPos.y,
            duration: duration,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
            onError: () => {
              console.warn('Animation error for die');
              resolve();
            }
          });
        } else {
          console.warn('Die components destroyed before animation');
          resolve();
        }
      });

      animationPromises.push(animationPromise);
    }

    // Wait for all animations to complete
    await Promise.all(animationPromises);
  }

  /**
   * Apply gravity to make dice fall down after clearing (synchronous version)
   * Only affects individual dice, not locked pieces
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
          // Check if this die is part of a locked piece
          const isPartOfLockedPiece = this.isDiePartOfLockedPiece(die, x, y);
          
          if (!isPartOfLockedPiece) {
            // Only move individual dice, not dice that are part of locked pieces
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
          } else {
            // Die is part of a locked piece, don't move it individually
            writeIndex--;
          }
        }
      }
    }
    
    return moved;
  }

  /**
   * Check if a die at a specific position is part of a locked piece
   */
  public isDiePartOfLockedPiece(die: SimpleDie, x: number, y: number): boolean {
    for (const piece of this.lockedPieces) {
      const positions = piece.getDicePositions();
      for (let i = 0; i < positions.length && i < piece.dice.length; i++) {
        const pos = positions[i];
        const pieceDie = piece.dice[i];
        if (pos && pieceDie === die && pos.x === x && pos.y === y) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Break a piece into individual dice (when matches occur)
   */
  public breakPiece(piece: Piece): void {
    const index = this.lockedPieces.indexOf(piece);
    if (index > -1) {
      this.lockedPieces.splice(index, 1);
      console.log(`Broke piece ${piece.shape}. Remaining locked pieces: ${this.lockedPieces.length}`);
    }
  }

  /**
   * Break pieces that contain any of the specified dice positions
   */
  public breakPiecesContaining(positions: GridPosition[]): void {
    const piecesToBreak: Piece[] = [];
    
    for (const piece of this.lockedPieces) {
      const piecePositions = piece.getDicePositions();
      
      // Check if any of the piece's positions match the cleared positions
      for (const piecePos of piecePositions) {
        for (const clearPos of positions) {
          if (piecePos.x === clearPos.x && piecePos.y === clearPos.y) {
            if (!piecesToBreak.includes(piece)) {
              piecesToBreak.push(piece);
            }
            break;
          }
        }
      }
    }
    
    // Break all affected pieces
    for (const piece of piecesToBreak) {
      this.breakPiece(piece);
    }
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
  public getRow(y: number): (SimpleDie | null)[] {
    if (y < 0 || y >= this.height) {
      return [];
    }
    const row = this.cells[y];
    return row ? [...row] : [];
  }

  /**
   * Get all dice in a specific column
   */
  public getColumn(x: number): (SimpleDie | null)[] {
    if (x < 0 || x >= this.width) {
      return [];
    }
    
    const column: (SimpleDie | null)[] = [];
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      column.push(row ? (row[x] ?? null) : null);
    }
    return column;
  }

  /**
   * Clear an entire row
   */
  public clearRow(y: number): SimpleDie[] {
    if (y < 0 || y >= this.height) {
      return [];
    }
    
    const clearedDice: SimpleDie[] = [];
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
  public clearColumn(x: number): SimpleDie[] {
    if (x < 0 || x >= this.width) {
      return [];
    }
    
    const clearedDice: SimpleDie[] = [];
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
  public clearArea(centerX: number, centerY: number, size: number): SimpleDie[] {
    const clearedDice: SimpleDie[] = [];
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
  public clearAll(): SimpleDie[] {
    const clearedDice: SimpleDie[] = [];
    
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
   * Debug method to print grid state
   */
  public debugPrintGrid(): void {
    console.log('🔍 GRID STATE:');
    let filledCells = 0;
    
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      let rowStr = `Row ${y.toString().padStart(2)}: `;
      for (let x = 0; x < this.width; x++) {
        const die = row[x];
        if (die) {
          rowStr += `[${die.getDisplayText().padStart(2)}]`;
          filledCells++;
        } else {
          rowStr += '[ ]';
        }
      }
      
      // Only print rows that have dice
      if (rowStr.includes('[') && !rowStr.match(/^\w+\s+\d+:\s+(\[\s+\])+$/)) {
        console.log(rowStr);
      }
    }
    
    console.log(`🔍 GRID: ${filledCells} total dice in grid`);
  }

  /**
   * Reset the grid to empty state
   */
  public reset(): void {
    // Clear locked pieces (this also destroys their dice)
    for (const piece of this.lockedPieces) {
      piece.destroy();
    }
    this.lockedPieces = [];
    
    // Clear the cells array
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      for (let x = 0; x < this.width; x++) {
        // Just clear the reference - dice were already destroyed with their pieces
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
   * Render all dice based on grid state - Grid is the single source of truth
   */
  public renderAllDice(): void {
    console.log('🎨 GRID: Rendering all dice from grid state');
    
    for (let y = 0; y < this.height; y++) {
      const row = this.cells[y];
      if (!row) continue;
      
      for (let x = 0; x < this.width; x++) {
        const die = row[x];
        if (die) {
          // Ensure die is positioned correctly and visible
          const worldPos = this.gridToScreen(x, y);
          die.setPosition(worldPos.x, worldPos.y);
          die.setVisible(true);
          
          // Make sure die is added to scene if not already
          if (!die.scene) {
            // This shouldn't happen, but just in case
            console.warn(`⚠️ Die at (${x}, ${y}) not in scene, re-adding`);
          }
        }
      }
    }
  }

  /**
   * Hide all dice that are not in the grid (cleanup orphaned dice)
   */
  public hideOrphanedDice(scene: Phaser.Scene): void {
    // Get all SimpleDie objects in the scene
    const allDice = scene.children.list.filter(child => 
      child instanceof SimpleDie
    ) as SimpleDie[];
    
    console.log(`🧹 GRID: Checking ${allDice.length} dice for orphans`);
    
    for (const die of allDice) {
      let foundInGrid = false;
      
      // Check if this die is in our grid
      for (let y = 0; y < this.height && !foundInGrid; y++) {
        const row = this.cells[y];
        if (!row) continue;
        
        for (let x = 0; x < this.width && !foundInGrid; x++) {
          if (row[x] === die) {
            foundInGrid = true;
          }
        }
      }
      
      if (!foundInGrid) {
        console.log(`🧹 GRID: Hiding orphaned die ${die.getDisplayText()}`);
        die.setVisible(false);
        // Optionally destroy it
        // die.destroy();
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
