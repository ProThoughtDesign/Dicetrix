import { describe, test, expect, beforeEach } from 'vitest';
import GameBoard from '../GameBoard';
import { GAME_CONSTANTS, SPAWN_POSITIONS } from '../../../../shared/constants/GameConstants';
import { GridBoundaryValidator } from '../../../../shared/utils/GridBoundaryValidator';

/**
 * Integration tests for piece spawning behavior with bottom-left coordinate system
 */
describe('Piece Spawning Integration', () => {
  let gameBoard: GameBoard;

  beforeEach(() => {
    gameBoard = new GameBoard(GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
  });

  describe('Spawn Position Calculation', () => {
    test('should calculate correct spawn position for single die piece', () => {
      const singleDiePiece = [{ x: 0, y: 0 }];
      const minRelativeY = Math.min(...singleDiePiece.map(pos => pos.y));
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
      
      // Single die with relative Y=0 should spawn at Y=16
      expect(spawnY).toBe(16);
      
      // Lowest die should be at Y=16 (above visible grid)
      const lowestDieY = spawnY + minRelativeY;
      expect(lowestDieY).toBe(16);
      expect(lowestDieY).toBeGreaterThan(GAME_CONSTANTS.TOP_Y);
    });

    test('should calculate correct spawn position for vertical piece', () => {
      const verticalPiece = [
        { x: 0, y: 0 }, // Bottom die
        { x: 0, y: 1 }, // Middle die
        { x: 0, y: 2 }  // Top die
      ];
      const minRelativeY = Math.min(...verticalPiece.map(pos => pos.y));
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
      
      // Piece with lowest die at relative Y=0 should spawn at Y=16
      expect(spawnY).toBe(16);
      
      // Check all dice positions after spawning
      const dicePositions = verticalPiece.map(pos => ({
        x: GAME_CONSTANTS.SPAWN_X_CENTER + pos.x,
        y: spawnY + pos.y
      }));
      
      expect(dicePositions).toEqual([
        { x: 3, y: 16 }, // Bottom die at Y=16
        { x: 3, y: 17 }, // Middle die at Y=17
        { x: 3, y: 18 }  // Top die at Y=18
      ]);
      
      // Bottom die should be at spawn Y, others above visible grid
      expect(dicePositions[0].y).toBe(GAME_CONSTANTS.SPAWN_Y);
      expect(dicePositions[2].y).toBe(GAME_CONSTANTS.SPAWN_Y + 2); // Top die at Y=18
    });

    test('should calculate correct spawn position for L-shaped piece', () => {
      const lPiece = [
        { x: 0, y: 0 }, // Bottom-left
        { x: 0, y: 1 }, // One up
        { x: 0, y: 2 }, // Two up
        { x: 1, y: 0 }  // One right from bottom-left
      ];
      const minRelativeY = Math.min(...lPiece.map(pos => pos.y));
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
      
      expect(spawnY).toBe(16);
      
      // Check all dice positions
      const dicePositions = lPiece.map(pos => ({
        x: GAME_CONSTANTS.SPAWN_X_CENTER + pos.x,
        y: spawnY + pos.y
      }));
      
      expect(dicePositions).toEqual([
        { x: 3, y: 16 }, // Bottom-left at Y=16
        { x: 3, y: 17 }, // One up at Y=17
        { x: 3, y: 18 }, // Two up at Y=18
        { x: 4, y: 16 }  // One right at Y=16
      ]);
    });

    test('should handle piece with negative relative Y coordinates', () => {
      // Piece where some dice extend below the origin
      const offsetPiece = [
        { x: 0, y: -1 }, // Below origin
        { x: 0, y: 0 },  // At origin
        { x: 0, y: 1 }   // Above origin
      ];
      const minRelativeY = Math.min(...offsetPiece.map(pos => pos.y));
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
      
      // With minRelativeY = -1, spawn should be at Y=17
      expect(spawnY).toBe(17);
      
      // Check dice positions
      const dicePositions = offsetPiece.map(pos => ({
        x: GAME_CONSTANTS.SPAWN_X_CENTER + pos.x,
        y: spawnY + pos.y
      }));
      
      expect(dicePositions).toEqual([
        { x: 3, y: 16 }, // Lowest die at Y=16
        { x: 3, y: 17 }, // Middle die at Y=17
        { x: 3, y: 18 }  // Highest die at Y=18
      ]);
      
      // Lowest die should still be at Y=16
      const lowestDieY = Math.min(...dicePositions.map(pos => pos.y));
      expect(lowestDieY).toBe(16);
    });
  });

  describe('Spawn Position Validation', () => {
    test('should validate spawn positions are above grid', () => {
      const testPieces = [
        [{ x: 0, y: 0 }], // Single die
        [{ x: 0, y: 0 }, { x: 0, y: 1 }], // Vertical 2-piece
        [{ x: 0, y: -1 }, { x: 0, y: 0 }], // Piece with negative relative Y
      ];

      testPieces.forEach((piece, index) => {
        const minRelativeY = Math.min(...piece.map(pos => pos.y));
        const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
        
        // Validate using GridBoundaryValidator
        expect(GridBoundaryValidator.validateSpawnPosition(spawnY, minRelativeY, 13)).toBe(true);
        
        // Ensure lowest die is at or above Y=13
        const lowestDieY = spawnY + minRelativeY;
        expect(lowestDieY).toBeGreaterThanOrEqual(13);
        
        // Ensure spawn position is above the visible grid for 8x16
        expect(spawnY).toBeGreaterThan(GAME_CONSTANTS.TOP_Y);
      });
    });

    test('should detect invalid spawn positions', () => {
      // Test cases where spawn would be too low
      const invalidCases = [
        { spawnY: 12, minRelativeY: 0 }, // Would put lowest die at Y=12
        { spawnY: 11, minRelativeY: 0 }, // Would put lowest die at Y=11
        { spawnY: 13, minRelativeY: -1 }, // Would put lowest die at Y=12
      ];

      invalidCases.forEach(({ spawnY, minRelativeY }) => {
        expect(GridBoundaryValidator.validateSpawnPosition(spawnY, minRelativeY, 13)).toBe(false);
      });
    });
  });

  describe('Game Over Detection', () => {
    test('should detect game over when spawn area is blocked', () => {
      // Fill the grid up to the spawn entry point to simulate a full grid
      for (let x = 0; x < GAME_CONSTANTS.GRID_WIDTH; x++) {
        for (let y = 0; y <= 12; y++) { // Fill up to Y=12 to block spawn entry
          gameBoard.addPieceAt([{
            pos: { x, y },
            die: { id: `block-${x}-${y}`, sides: 6, number: 1, color: 'red' } as any
          }]);
        }
      }

      // Try to spawn a piece - should detect collision when entering grid
      const spawnX = GAME_CONSTANTS.SPAWN_X_CENTER;
      const spawnY = 13;
      const enterGridY = spawnY - 1; // Y=12, which should be blocked

      // Check if position Y=12 is occupied (should be true due to filled grid)
      expect(gameBoard.isEmpty(spawnX, enterGridY)).toBe(false);
      
      // This simulates the game over condition check
      const canEnterGrid = gameBoard.isEmpty(spawnX, enterGridY);
      expect(canEnterGrid).toBe(false);
    });

    test('should allow spawning when grid has space at top', () => {
      // Fill only bottom rows, leaving top clear
      for (let x = 0; x < GAME_CONSTANTS.GRID_WIDTH; x++) {
        for (let y = 0; y <= 11; y++) { // Fill bottom rows, leave top 4 rows clear
          gameBoard.addPieceAt([{
            pos: { x, y },
            die: { id: `block-${x}-${y}`, sides: 6, number: 1, color: 'red' } as any
          }]);
        }
      }

      // Try to spawn a piece - should succeed
      const spawnX = GAME_CONSTANTS.SPAWN_X_CENTER;
      const spawnY = 13;
      const enterGridY = 12; // Y=12 should be clear

      expect(gameBoard.isEmpty(spawnX, enterGridY)).toBe(true);
    });
  });

  describe('Piece Entry Simulation', () => {
    test('should simulate piece entering grid from spawn position', () => {
      const piece = [
        { x: 0, y: 0 }, // Single die
      ];
      
      const spawnX = GAME_CONSTANTS.SPAWN_X_CENTER;
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(0); // Should be 13
      
      // Simulate piece falling step by step
      let currentY = spawnY;
      const fallSteps = [];
      
      // Fall until hitting bottom or obstacle
      while (currentY + GAME_CONSTANTS.FALL_STEP >= GAME_CONSTANTS.GROUND_Y) {
        const nextY = currentY + GAME_CONSTANTS.FALL_STEP;
        
        // Above grid: can always fall
        if (nextY > GAME_CONSTANTS.MAX_VALID_Y) {
          currentY = nextY;
          fallSteps.push({ x: spawnX, y: currentY });
        }
        // Within grid: check if empty
        else if (nextY >= GAME_CONSTANTS.GROUND_Y && 
                 nextY <= GAME_CONSTANTS.MAX_VALID_Y) {
          if (gameBoard.isEmpty(spawnX, nextY)) {
            currentY = nextY;
            fallSteps.push({ x: spawnX, y: currentY });
          } else {
            // Hit obstacle within grid
            break;
          }
        } else {
          // Would go below grid, stop
          break;
        }
      }
      
      // Should have fallen through the visible grid
      expect(fallSteps.length).toBeGreaterThan(0);
      expect(fallSteps[0].y).toBeLessThan(spawnY); // First step should be lower
      expect(fallSteps[fallSteps.length - 1].y).toBe(GAME_CONSTANTS.GROUND_Y); // Should reach bottom
    });

    test('should simulate piece stacking on existing pieces', () => {
      // Place a die at bottom center
      gameBoard.addPieceAt([{
        pos: { x: GAME_CONSTANTS.SPAWN_X_CENTER, y: 0 },
        die: { id: 'bottom-die', sides: 6, number: 1, color: 'red' } as any
      }]);

      // Simulate new piece falling
      const spawnX = GAME_CONSTANTS.SPAWN_X_CENTER;
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(0);
      
      let currentY = spawnY;
      let finalY = currentY;
      
      // Fall until hitting the existing piece
      while (currentY + GAME_CONSTANTS.FALL_STEP >= GAME_CONSTANTS.GROUND_Y) {
        const nextY = currentY + GAME_CONSTANTS.FALL_STEP;
        
        // Above grid: can always fall
        if (nextY > GAME_CONSTANTS.MAX_VALID_Y) {
          currentY = nextY;
          finalY = currentY;
        }
        // Within grid: check if empty
        else if (nextY >= GAME_CONSTANTS.GROUND_Y && 
                 nextY <= GAME_CONSTANTS.MAX_VALID_Y) {
          if (gameBoard.isEmpty(spawnX, nextY)) {
            currentY = nextY;
            finalY = currentY;
          } else {
            // Hit existing piece, stop at current position
            break;
          }
        } else {
          // Would go below grid, stop
          break;
        }
      }
      
      // Should stop at Y=1 (on top of the existing piece at Y=0)
      expect(finalY).toBe(1);
      expect(gameBoard.isEmpty(spawnX, finalY)).toBe(true); // Position should be empty
      expect(gameBoard.isEmpty(spawnX, 0)).toBe(false); // Bottom should be occupied
    });
  });
});
