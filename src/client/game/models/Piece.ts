import { SimpleDie } from './SimpleDie.js';
import { DieFactory } from './DieFactory.js';
import { TetrominoShape, GameMode, GridPosition } from '../../../shared/types/game.js';
import { PIECE_SHAPES } from '../../../shared/config/game-modes.js';

/**
 * Piece class representing a Tetromino-shaped group of dice that falls as a unit
 */
export class Piece {
  public dice: SimpleDie[];
  public shape: TetrominoShape;
  public rotation: number;
  public gridX: number;
  public gridY: number;
  public shapeMatrix: number[][];
  private dieFactory: DieFactory;
  private cellSize: number;
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;
  private scene: Phaser.Scene;
  
  // Fixed-size matrix containing dice (null for empty cells)
  private diceMatrix: (SimpleDie | null)[][];
  private matrixSize: number;

  constructor(
    scene: Phaser.Scene,
    shape: TetrominoShape,
    gameMode: GameMode,
    gridX: number = 4, // Start in middle of 10-wide grid
    gridY: number = 0,
    cellSize: number = 32
  ) {
    this.scene = scene;
    this.shape = shape;
    this.rotation = 0;
    this.gridX = gridX;
    this.gridY = gridY;
    this.cellSize = cellSize;
    this.dieFactory = new DieFactory(gameMode, cellSize);
    
    const shapeData = PIECE_SHAPES[shape];
    if (!shapeData) {
      throw new Error(`Unknown piece shape: ${shape}`);
    }
    
    // Calculate matrix size (max of width and height for square matrix)
    this.matrixSize = Math.max(shapeData.length, Math.max(...shapeData.map(row => row.length)));
    
    // Initialize the dice matrix and shape matrix
    this.initializeMatrices(shapeData);
    this.updateDicePositions();
  }

  /**
   * Initialize both the dice matrix and shape matrix from the original shape data
   */
  private initializeMatrices(originalShape: number[][]): void {
    // Create square matrices filled with nulls/zeros
    this.diceMatrix = Array(this.matrixSize).fill(null).map(() => Array(this.matrixSize).fill(null as SimpleDie | null));
    this.shapeMatrix = Array(this.matrixSize).fill(null).map(() => Array(this.matrixSize).fill(0));
    
    // Create dice and place them in the matrix according to the original shape
    const diceNeeded = this.countDiceInOriginalShape(originalShape);
    this.dice = this.dieFactory.createDiceForPiece(this.scene, diceNeeded);
    
    let dieIndex = 0;
    for (let row = 0; row < originalShape.length; row++) {
      const shapeRow = originalShape[row];
      if (shapeRow) {
        for (let col = 0; col < shapeRow.length; col++) {
          if (shapeRow[col] === 1 && dieIndex < this.dice.length) {
            // Place die in matrix
            this.diceMatrix[row][col] = this.dice[dieIndex];
            this.shapeMatrix[row][col] = 1;
            dieIndex++;
          }
        }
      }
    }
    
    console.log(`Initialized ${this.matrixSize}x${this.matrixSize} matrix with ${dieIndex} dice`);
  }

  /**
   * Count dice needed in original shape
   */
  private countDiceInOriginalShape(shape: number[][]): number {
    let count = 0;
    for (let row = 0; row < shape.length; row++) {
      const shapeRow = shape[row];
      if (shapeRow) {
        for (let col = 0; col < shapeRow.length; col++) {
          if (shapeRow[col] === 1) {
            count++;
          }
        }
      }
    }
    return count;
  }

  /**
   * Count how many dice are needed for this shape
   */
  private countDiceInShape(): number {
    let count = 0;
    for (let row = 0; row < this.matrixSize; row++) {
      for (let col = 0; col < this.matrixSize; col++) {
        if (this.shapeMatrix[row][col] === 1) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Update dice positions based on current grid position and rotation
   */
  private updateDicePositions(): void {
    this.updateDicePositionsWithOffset(this.gridOffsetX, this.gridOffsetY);
  }

  /**
   * Update dice positions with grid offset (for proper positioning within the game grid)
   */
  public updateDicePositionsWithOffset(gridOffsetX: number, gridOffsetY: number): void {
    // Simply iterate through the dice matrix and position each die
    for (let row = 0; row < this.matrixSize; row++) {
      for (let col = 0; col < this.matrixSize; col++) {
        const die = this.diceMatrix[row][col];
        if (die) {
          die.setGridPosition(
            this.gridX + col,
            this.gridY + row,
            this.cellSize,
            gridOffsetX,
            gridOffsetY
          );
        }
      }
    }
  }

  /**
   * Set the grid offset for this piece (called by Game scene)
   */
  public setGridOffset(gridOffsetX: number, gridOffsetY: number): void {
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;
    this.updateDicePositions();
  }

  /**
   * Move piece left by one grid cell
   */
  public moveLeft(): boolean {
    const newX = this.gridX - 1;
    if (this.canMoveTo(newX, this.gridY)) {
      this.gridX = newX;
      this.updateDicePositions();
      return true;
    }
    return false;
  }

  /**
   * Move piece right by one grid cell
   */
  public moveRight(): boolean {
    const newX = this.gridX + 1;
    if (this.canMoveTo(newX, this.gridY)) {
      this.gridX = newX;
      this.updateDicePositions();
      return true;
    }
    return false;
  }

  /**
   * Move piece down by one grid cell
   */
  public moveDown(): boolean {
    const newY = this.gridY + 1;
    if (this.canMoveTo(this.gridX, newY)) {
      this.gridY = newY;
      this.updateDicePositions();
      return true;
    }
    return false;
  }

  /**
   * Move piece down by one grid cell with grid collision detection
   */
  public moveDownWithGrid(grid: any): boolean {
    const newY = this.gridY + 1;
    if (this.canMoveToWithGrid(this.gridX, newY, grid)) {
      this.gridY = newY;
      this.updateDicePositions();
      return true;
    }
    return false;
  }

  /**
   * Rotate piece clockwise by 90 degrees
   */
  public rotatePiece(): boolean {
    // Create rotated matrices
    const newDiceMatrix = this.rotateMatrixClockwise(this.diceMatrix);
    const newShapeMatrix = this.rotateMatrixClockwise(this.shapeMatrix);
    
    // Check if rotation is valid at current position
    if (this.canMoveToWithMatrix(this.gridX, this.gridY, newShapeMatrix)) {
      this.rotation = (this.rotation + 90) % 360;
      this.diceMatrix = newDiceMatrix;
      this.shapeMatrix = newShapeMatrix;
      this.updateDicePositions();
      console.log(`Piece rotated to ${this.rotation} degrees`);
      return true;
    }
    
    // Try wall kicks (move left/right to accommodate rotation)
    const kicks = [-1, 1, -2, 2];
    for (const kick of kicks) {
      if (this.canMoveToWithMatrix(this.gridX + kick, this.gridY, newShapeMatrix)) {
        this.gridX += kick;
        this.rotation = (this.rotation + 90) % 360;
        this.diceMatrix = newDiceMatrix;
        this.shapeMatrix = newShapeMatrix;
        this.updateDicePositions();
        console.log(`Piece rotated to ${this.rotation} degrees with kick ${kick}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Rotate a matrix 90 degrees clockwise
   */
  private rotateMatrixClockwise<T>(matrix: T[][]): T[][] {
    const size = matrix.length;
    const rotated: T[][] = Array(size).fill(null).map(() => Array(size).fill(null as T));
    
    for (let row = 0; row < size; row++) {
      const matrixRow = matrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          // Clockwise rotation: new_row = col, new_col = size - 1 - row
          const rotatedRow = rotated[col];
          if (rotatedRow) {
            rotatedRow[size - 1 - row] = matrixRow[col];
          }
        }
      }
    }
    
    return rotated;
  }

  /**
   * Check if piece can move to specified grid position
   * Note: This only checks bounds. For full collision detection, use canMoveToWithGrid()
   */
  public canMoveTo(x: number, y: number): boolean {
    return this.canMoveToWithMatrix(x, y, this.shapeMatrix);
  }

  /**
   * Check if piece can move to specified position using grid collision detection
   */
  public canMoveToWithGrid(x: number, y: number, grid: any): boolean {
    // First check bounds
    if (!this.canMoveToWithMatrix(x, y, this.shapeMatrix)) {
      return false;
    }
    
    // Then check collision with grid (if grid is provided)
    if (grid && typeof grid.checkCollision === 'function') {
      return !grid.checkCollision(this, x, y);
    }
    
    return true;
  }

  /**
   * Check if piece can move to specified position with given matrix
   * Note: This method provides basic bounds checking. For full collision detection
   * with existing dice, use Grid.checkCollision() method.
   */
  private canMoveToWithMatrix(x: number, y: number, matrix: number[][]): boolean {
    for (let row = 0; row < matrix.length; row++) {
      const matrixRow = matrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1) {
            const gridX = x + col;
            const gridY = y + row;
            
            // Check bounds (allow negative Y for pieces entering from top)
            if (gridX < 0 || gridX >= 10 || gridY >= 20) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }



  /**
   * Lock piece to grid (called when piece can't move down further)
   */
  public lockToGrid(): GridPosition[] {
    const positions: GridPosition[] = [];
    
    for (let row = 0; row < this.matrixSize; row++) {
      const shapeRow = this.shapeMatrix[row];
      if (shapeRow) {
        for (let col = 0; col < shapeRow.length; col++) {
          if (shapeRow[col] === 1) {
            positions.push({
              x: this.gridX + col,
              y: this.gridY + row
            });
          }
        }
      }
    }
    
    return positions;
  }

  /**
   * Get all dice positions in grid coordinates
   */
  public getDicePositions(): GridPosition[] {
    const positions: GridPosition[] = [];
    
    for (let row = 0; row < this.matrixSize; row++) {
      const shapeRow = this.shapeMatrix[row];
      if (shapeRow) {
        for (let col = 0; col < shapeRow.length; col++) {
          if (shapeRow[col] === 1) {
            positions.push({
              x: this.gridX + col,
              y: this.gridY + row
            });
          }
        }
      }
    }
    
    return positions;
  }

  /**
   * Get piece bounds for collision detection
   */
  public getBounds(): { left: number; right: number; top: number; bottom: number } {
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    
    for (let row = 0; row < this.matrixSize; row++) {
      const shapeRow = this.shapeMatrix[row];
      if (shapeRow) {
        for (let col = 0; col < shapeRow.length; col++) {
          if (shapeRow[col] === 1) {
            const x = this.gridX + col;
            const y = this.gridY + row;
            
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
    }
    
    return { left, right, top, bottom };
  }

  /**
   * Create a ghost/preview piece at specified position
   */
  public createGhost(scene: Phaser.Scene, ghostY: number): Piece {
    const ghost = new Piece(scene, this.shape, this.dieFactory.getGameMode(), this.gridX, ghostY, this.cellSize);
    ghost.rotation = this.rotation;
    
    // Copy the matrices
    ghost.shapeMatrix = this.shapeMatrix.map(row => [...row]);
    ghost.diceMatrix = this.diceMatrix.map(row => [...row]);
    
    // Make ghost dice semi-transparent
    ghost.dice.forEach(die => {
      die.setAlpha(0.3);
    });
    
    return ghost;
  }

  /**
   * Destroy the piece and all its dice
   */
  public destroy(): void {
    this.dice.forEach(die => die.destroy());
    this.dice = [];
  }

  /**
   * Get piece data for serialization
   */
  public toData(): {
    shape: TetrominoShape;
    rotation: number;
    gridX: number;
    gridY: number;
    dice: ReturnType<SimpleDie['toData']>[];
  } {
    return {
      shape: this.shape,
      rotation: this.rotation,
      gridX: this.gridX,
      gridY: this.gridY,
      dice: this.dice.map(die => die.toData())
    };
  }

  /**
   * Get the dice matrix (for Grid access)
   */
  public getDiceMatrix(): (SimpleDie | null)[][] {
    return this.diceMatrix;
  }

  /**
   * Get the matrix size (for Grid access)
   */
  public getMatrixSize(): number {
    return this.matrixSize;
  }

  /**
   * Debug method to verify die positions
   */
  public debugDiePositions(): void {
    console.log(`=== Piece ${this.shape} Debug (Rotation: ${this.rotation}°) ===`);
    console.log('Shape matrix:');
    this.shapeMatrix.forEach((row, rowIndex) => {
      console.log(`Row ${rowIndex}: [${row.join(', ')}]`);
    });
    
    console.log('Dice matrix:');
    this.diceMatrix.forEach((row, rowIndex) => {
      const rowDisplay = row.map(die => die ? die.getDisplayText() : '.');
      console.log(`Row ${rowIndex}: [${rowDisplay.join(', ')}]`);
    });
  }
}
