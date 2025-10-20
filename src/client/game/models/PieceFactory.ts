import { Piece } from './Piece.js';
import { TetrominoShape, GameMode } from '../../../shared/types/game.js';
import { PIECE_SHAPES, GAME_MODES } from '../../../shared/config/game-modes.js';

/**
 * Factory class for creating random Tetromino pieces based on game mode
 */
export class PieceFactory {
  private gameMode: GameMode;
  private availableShapes: TetrominoShape[];
  private cellSize: number;

  constructor(gameMode: GameMode, cellSize: number = 32) {
    this.gameMode = gameMode;
    this.cellSize = cellSize;
    this.availableShapes = this.getAvailableShapes();
  }

  /**
   * Create a random piece with mode-specific generation rules
   */
  public createRandomPiece(scene: Phaser.Scene, gridX: number = 4, gridY: number = 0): Piece {
    const shape = this.getModeAwareRandomShape();
    return new Piece(scene, shape, this.gameMode, gridX, gridY, this.cellSize);
  }

  /**
   * Create a specific piece
   */
  public createPiece(
    scene: Phaser.Scene,
    shape: TetrominoShape,
    gridX: number = 4,
    gridY: number = 0
  ): Piece {
    return new Piece(scene, shape, this.gameMode, gridX, gridY, this.cellSize);
  }

  /**
   * Create next piece for preview
   */
  public createNextPiece(scene: Phaser.Scene): Piece {
    const shape = this.getRandomShape();
    // Position off-screen for preview
    return new Piece(scene, shape, this.gameMode, -5, -5, this.cellSize);
  }

  /**
   * Get available shapes based on game mode difficulty
   */
  private getAvailableShapes(): TetrominoShape[] {
    const config = GAME_MODES[this.gameMode];
    
    // Base shapes available in all modes
    const baseShapes: TetrominoShape[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
    
    // Add complex shapes for higher difficulties
    if (config.maxPieceSize >= 6) {
      baseShapes.push('PLUS');
    }
    
    if (config.maxPieceSize >= 7) {
      baseShapes.push('CROSS');
    }
    
    return baseShapes;
  }

  /**
   * Get random shape from available shapes
   */
  private getRandomShape(): TetrominoShape {
    const randomIndex = Math.floor(Math.random() * this.availableShapes.length);
    const shape = this.availableShapes[randomIndex];
    if (!shape) {
      throw new Error('No available shapes for current game mode');
    }
    return shape;
  }

  /**
   * Get weighted random shape (some shapes more common than others)
   */
  public getWeightedRandomShape(): TetrominoShape {
    // Define weights for different shapes
    const weights: Record<TetrominoShape, number> = {
      'I': 1.0,  // Line piece - common
      'O': 1.0,  // Square piece - common
      'T': 1.2,  // T piece - slightly more common
      'L': 1.0,  // L piece - common
      'J': 1.0,  // J piece - common
      'S': 0.8,  // S piece - slightly less common
      'Z': 0.8,  // Z piece - slightly less common
      'PLUS': 0.5,  // Plus piece - rare
      'CROSS': 0.3  // Cross piece - very rare
    };

    // Create weighted array
    const weightedShapes: TetrominoShape[] = [];
    this.availableShapes.forEach(shape => {
      const weight = weights[shape] || 1.0;
      const count = Math.ceil(weight * 10); // Scale weights
      for (let i = 0; i < count; i++) {
        weightedShapes.push(shape);
      }
    });

    // Select random shape from weighted array
    const randomIndex = Math.floor(Math.random() * weightedShapes.length);
    const shape = weightedShapes[randomIndex];
    if (!shape) {
      throw new Error('No weighted shapes available');
    }
    return shape;
  }

  /**
   * Create a sequence of pieces using 7-bag randomization
   * (ensures each shape appears once before any shape repeats)
   */
  public create7BagSequence(scene: Phaser.Scene): Piece[] {
    const shuffledShapes = [...this.availableShapes];
    
    // Fisher-Yates shuffle
    for (let i = shuffledShapes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledShapes[i];
      const swapItem = shuffledShapes[j];
      if (temp && swapItem) {
        shuffledShapes[i] = swapItem;
        shuffledShapes[j] = temp;
      }
    }

    return shuffledShapes.map(shape => 
      new Piece(scene, shape, this.gameMode, -5, -5, this.cellSize)
    );
  }

  /**
   * Get all available shapes for current mode
   */
  public getAvailableShapesList(): TetrominoShape[] {
    return [...this.availableShapes];
  }

  /**
   * Get shape matrix for preview/UI purposes
   */
  public getShapeMatrix(shape: TetrominoShape): number[][] {
    const matrix = PIECE_SHAPES[shape];
    if (!matrix) {
      throw new Error(`Unknown piece shape: ${shape}`);
    }
    return matrix;
  }

  /**
   * Calculate piece size (number of dice)
   */
  public getPieceSize(shape: TetrominoShape): number {
    const matrix = PIECE_SHAPES[shape];
    if (!matrix) {
      throw new Error(`Unknown piece shape: ${shape}`);
    }
    
    let count = 0;
    
    for (let row = 0; row < matrix.length; row++) {
      const matrixRow = matrix[row];
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
   * Check if shape is available in current game mode
   */
  public isShapeAvailable(shape: TetrominoShape): boolean {
    return this.availableShapes.includes(shape);
  }

  /**
   * Update game mode and reconfigure available shapes
   */
  public setGameMode(gameMode: GameMode): void {
    this.gameMode = gameMode;
    this.availableShapes = this.getAvailableShapes();
  }

  /**
   * Set cell size for piece rendering
   */
  public setCellSize(cellSize: number): void {
    this.cellSize = cellSize;
  }

  /**
   * Get mode-aware random shape with difficulty-based distribution
   */
  private getModeAwareRandomShape(): TetrominoShape {
    const config = GAME_MODES[this.gameMode];
    
    // Adjust shape distribution based on game mode
    const weights: Record<TetrominoShape, number> = {
      'I': 1.0,
      'O': 1.0,
      'T': 1.2,
      'L': 1.0,
      'J': 1.0,
      'S': 0.8,
      'Z': 0.8,
      'PLUS': 0.5,
      'CROSS': 0.3
    };

    // Modify weights based on difficulty
    switch (this.gameMode) {
      case 'easy':
        // Favor simpler shapes in easy mode
        weights['I'] = 1.5;
        weights['O'] = 1.5;
        weights['T'] = 1.3;
        weights['PLUS'] = 0.2;
        weights['CROSS'] = 0.1;
        break;
        
      case 'medium':
        // Balanced distribution
        break;
        
      case 'hard':
        // Slightly favor complex shapes
        weights['PLUS'] = 0.7;
        weights['CROSS'] = 0.4;
        weights['S'] = 1.0;
        weights['Z'] = 1.0;
        break;
        
      case 'expert':
        // More complex shapes
        weights['PLUS'] = 1.0;
        weights['CROSS'] = 0.6;
        weights['S'] = 1.2;
        weights['Z'] = 1.2;
        break;
        
      case 'zen':
        // Favor easier shapes for relaxed play
        weights['I'] = 1.8;
        weights['O'] = 1.8;
        weights['T'] = 1.5;
        weights['PLUS'] = 0.3;
        weights['CROSS'] = 0.2;
        break;
    }

    // Create weighted array
    const weightedShapes: TetrominoShape[] = [];
    this.availableShapes.forEach(shape => {
      const weight = weights[shape] || 1.0;
      const count = Math.ceil(weight * 10);
      for (let i = 0; i < count; i++) {
        weightedShapes.push(shape);
      }
    });

    // Select random shape
    const randomIndex = Math.floor(Math.random() * weightedShapes.length);
    const shape = weightedShapes[randomIndex];
    if (!shape) {
      throw new Error('No weighted shapes available');
    }
    return shape;
  }

  /**
   * Get current game mode
   */
  public getGameMode(): GameMode {
    return this.gameMode;
  }

  /**
   * Create test pieces for debugging
   */
  public createTestPieces(scene: Phaser.Scene): Piece[] {
    return this.availableShapes.map((shape, index) => 
      new Piece(scene, shape, this.gameMode, index * 3, 0, this.cellSize)
    );
  }
}
