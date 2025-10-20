import { Die } from './Die.js';
import { DieFactory } from './DieFactory.js';
import { TetrominoShape, GameMode, GridPosition } from '../../../shared/types/game.js';
import { PIECE_SHAPES } from '../../../shared/config/game-modes.js';

/**
 * Piece class representing a Tetromino-shaped group of dice that falls as a unit
 */
export class Piece extends Phaser.GameObjects.Group {
  public dice: Die[];
  public shape: TetrominoShape;
  public rotation: number;
  public gridX: number;
  public gridY: number;
  public shapeMatrix: number[][];
  private dieFactory: DieFactory;
  private cellSize: number;

  constructor(
    scene: Phaser.Scene,
    shape: TetrominoShape,
    gameMode: GameMode,
    gridX: number = 4, // Start in middle of 10-wide grid
    gridY: number = 0,
    cellSize: number = 32
  ) {
    super(scene);
    
    this.shape = shape;
    this.rotation = 0;
    this.gridX = gridX;
    this.gridY = gridY;
    this.cellSize = cellSize;
    this.dieFactory = new DieFactory(gameMode);
    const shapeData = PIECE_SHAPES[shape];
    if (!shapeData) {
      throw new Error(`Unknown piece shape: ${shape}`);
    }
    this.shapeMatrix = this.getRotatedMatrix(shapeData, 0);
    this.dice = [];
    
    this.createDice();
    this.updateDicePositions();
    
    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create dice based on the piece shape
   */
  private createDice(): void {
    const diceCount = this.countDiceInShape();
    this.dice = this.dieFactory.createDiceForPiece(this.scene, diceCount);
    
    // Add dice to this group
    this.dice.forEach(die => {
      this.add(die);
    });
  }

  /**
   * Count how many dice are needed for this shape
   */
  private countDiceInShape(): number {
    let count = 0;
    for (let row = 0; row < this.shapeMatrix.length; row++) {
      const matrixRow = this.shapeMatrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1) {
            count++;
          }
        }
      }
    }
    return count;
  }

  /**
   * Update dice positions based on current grid position and rotation
   */
  private updateDicePositions(): void {
    let dieIndex = 0;
    
    for (let row = 0; row < this.shapeMatrix.length; row++) {
      const matrixRow = this.shapeMatrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1 && dieIndex < this.dice.length) {
          const die = this.dice[dieIndex];
          if (die) {
            const worldX = (this.gridX + col) * this.cellSize + this.cellSize / 2;
            const worldY = (this.gridY + row) * this.cellSize + this.cellSize / 2;
            
            die.setPosition(worldX, worldY);
            dieIndex++;
          }
        }
      }
    }
    }
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
   * Rotate piece clockwise by 90 degrees
   */
  public rotatePiece(): boolean {
    const newRotation = (this.rotation + 90) % 360;
    const shapeData = PIECE_SHAPES[this.shape];
    if (!shapeData) {
      return false;
    }
    const newMatrix = this.getRotatedMatrix(shapeData, newRotation);
    
    // Check if rotation is valid at current position
    if (this.canMoveToWithMatrix(this.gridX, this.gridY, newMatrix)) {
      this.rotation = newRotation;
      this.shapeMatrix = newMatrix;
      this.updateDicePositions();
      return true;
    }
    
    // Try wall kicks (move left/right to accommodate rotation)
    const kicks = [-1, 1, -2, 2]; // Try moving left/right by 1 or 2 cells
    for (const kick of kicks) {
      if (this.canMoveToWithMatrix(this.gridX + kick, this.gridY, newMatrix)) {
        this.gridX += kick;
        this.rotation = newRotation;
        this.shapeMatrix = newMatrix;
        this.updateDicePositions();
        return true;
      }
    }
    
    return false;
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
   * Get rotated matrix for the shape
   */
  private getRotatedMatrix(originalMatrix: number[][], degrees: number): number[][] {
    let matrix = originalMatrix.map(row => [...row]); // Deep copy
    
    const rotations = (degrees / 90) % 4;
    for (let i = 0; i < rotations; i++) {
      matrix = this.rotateMatrix90(matrix);
    }
    
    return matrix;
  }

  /**
   * Rotate matrix 90 degrees clockwise
   */
  private rotateMatrix90(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const firstRow = matrix[0];
    if (!firstRow) return matrix;
    
    const cols = firstRow.length;
    const rotated: number[][] = [];
    
    for (let col = 0; col < cols; col++) {
      const newRow: number[] = [];
      for (let row = rows - 1; row >= 0; row--) {
        const matrixRow = matrix[row];
        if (matrixRow) {
          newRow.push(matrixRow[col] || 0);
        }
      }
      rotated.push(newRow);
    }
    
    return rotated;
  }

  /**
   * Lock piece to grid (called when piece can't move down further)
   */
  public lockToGrid(): GridPosition[] {
    const positions: GridPosition[] = [];
    
    for (let row = 0; row < this.shapeMatrix.length; row++) {
      const matrixRow = this.shapeMatrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1) {
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
    
    for (let row = 0; row < this.shapeMatrix.length; row++) {
      const matrixRow = this.shapeMatrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1) {
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
    
    for (let row = 0; row < this.shapeMatrix.length; row++) {
      const matrixRow = this.shapeMatrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1) {
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
    ghost.shapeMatrix = this.shapeMatrix.map(row => [...row]);
    
    // Make ghost dice semi-transparent
    ghost.dice.forEach(die => {
      die.setAlpha(0.3);
    });
    
    return ghost;
  }

  /**
   * Destroy the piece and all its dice
   */
  public override destroy(): void {
    this.dice.forEach(die => die.destroy());
    this.dice = [];
    super.destroy();
  }

  /**
   * Get piece data for serialization
   */
  public toData(): {
    shape: TetrominoShape;
    rotation: number;
    gridX: number;
    gridY: number;
    dice: ReturnType<Die['toData']>[];
  } {
    return {
      shape: this.shape,
      rotation: this.rotation,
      gridX: this.gridX,
      gridY: this.gridY,
      dice: this.dice.map(die => die.toData())
    };
  }
}
