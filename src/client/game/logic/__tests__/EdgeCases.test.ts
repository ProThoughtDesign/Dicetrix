import { describe, test, expect, beforeEach } from 'vitest';
import GameBoard from '../GameBoard';
import { GAME_CONSTANTS, SPAWN_POSITIONS } from '../../../../shared/constants/GameConstants';
import { GridBoundaryValidator } from '../../../../shared/utils/GridBoundaryValidator';
import { CoordinateConverter } from '../../../../shared/utils/CoordinateConverter';

/**
 * Edge case tests for coordinate system including spawning, stacking, and boundary conditions
 */
describe('Coordinate System Edge Cases', () => {
  let gameBoard: GameBoard;
  let converter: CoordinateConverter;

  beforeEach(() => {
    gameBoard = new GameBoard(GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
    converter = new CoordinateConverter(GAME_CONSTANTS.GRID_HEIGHT);
  });

  describe('Spawning Edge Cases', () => {
    test('should handle spawning with maximum height pieces', () => {
      // Create a very tall piece (4 dice high)
      const tallPiece = [
        { x: 0, y: 0 }, // Bottom
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 }  // Top
      ];

      const minRelativeY = Math.min(...tallPiece.map(pos => pos.y));
      const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
      
      // Calculate all dice positions
      const dicePositions = tallPiece.map(pos => ({
        x: GAME_CONSTANTS.SPAWN_X_CENTER + pos.x,
        y: spawnY + pos.y
      }));

      // All dice should be above the visible grid for 8x16 (spawn area)
      dicePositions.forEach(pos => {
        expect(pos.y).toBeGreaterThan(GAME_CONSTANTS.TOP_Y);
      });

      // Lowest die should be at Y=16
      const lowestY = Math.min(...dicePositions.map(pos => pos.y));
      expect(lowestY).toBe(16);

      // Highest die should be at Y=19 (16 + 3)
      const highestY = Math.max(...dicePositions.map(pos => pos.y));
      expect(highestY).toBe(19);
    });

    test('should handle spawning at grid edges', () => {
      // Test spawning wide pieces at different X positions
      const widePiece = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 }
      ];

      const edgeSpawnTests = [
        { spawnX: 0, shouldFit: true, description: 'spawn at left edge' },
        { spawnX: 4, shouldFit: true, description: 'spawn at right edge (piece extends to X=7)' },
        { spawnX: 5, shouldFit: false, description: 'spawn too far right (piece would extend beyond X=7)' },
        { spawnX: -1, shouldFit: false, description: 'spawn beyond left edge' }
      ];

      edgeSpawnTests.forEach(({ spawnX, shouldFit, description }) => {
        const allDiceValid = widePiece.every(relativePos => {
          const absoluteX = spawnX + relativePos.x;
          return absoluteX >= 0 && absoluteX < GAME_CONSTANTS.GRID_WIDTH;
        });

        expect(allDiceValid).toBe(shouldFit);
      });
    });

    test('should handle spawning with irregular piece shapes', () => {
      // Test complex piece shapes
      const complexPieces = [
        {
          name: 'Z-shape',
          positions: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
          ]
        },
        {
          name: 'Plus-shape',
          positions: [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 1, y: 2 }
          ]
        },
        {
          name: 'Offset-L',
          positions: [
            { x: 0, y: -1 }, // Below origin
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
          ]
        }
      ];

      complexPieces.forEach(({ name, positions }) => {
        const minRelativeY = Math.min(...positions.map(pos => pos.y));
        const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
        
        // All dice should spawn at or above Y=13 for 8x16 grid
        positions.forEach(relativePos => {
          const absoluteY = spawnY + relativePos.y;
          expect(absoluteY).toBeGreaterThanOrEqual(13);
        });

        // Lowest die should be at Y=16
        const lowestDieY = spawnY + minRelativeY;
        expect(lowestDieY).toBe(16);
      });
    });
  });

  describe('Stacking Edge Cases', () => {
    test('should handle stacking to maximum height', () => {
      const centerX = GAME_CONSTANTS.SPAWN_X_CENTER;
      
      // Stack dice to near maximum height
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT - 1; y++) {
        gameBoard.addPieceAt([{
          pos: { x: centerX, y },
          die: { id: `stack-${y}`, sides: 6, number: y + 1, color: 'red' } as any
        }]);
      }

      // Verify stack height
      let stackHeight = 0;
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        if (!gameBoard.isEmpty(centerX, y)) {
          stackHeight = y + 1;
        }
      }
      expect(stackHeight).toBe(GAME_CONSTANTS.GRID_HEIGHT - 1);

      // Try to add one more piece - should fit at Y=19
      expect(gameBoard.isEmpty(centerX, GAME_CONSTANTS.GRID_HEIGHT - 1)).toBe(true);
      
      // Add the final piece
      gameBoard.addPieceAt([{
        pos: { x: centerX, y: GAME_CONSTANTS.GRID_HEIGHT - 1 },
        die: { id: 'top-piece', sides: 6, number: 6, color: 'blue' } as any
      }]);

      // Now column should be completely full
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        expect(gameBoard.isEmpty(centerX, y)).toBe(false);
      }
    });

    test('should handle irregular stacking patterns', () => {
      // Create an irregular base pattern
      const basePattern = [
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 4, y: 2 }
      ];

      basePattern.forEach((pos, index) => {
        gameBoard.addPieceAt([{
          pos,
          die: { id: `base-${index}`, sides: 6, number: index + 1, color: 'red' } as any
        }]);
      });

      // Test stacking on this irregular pattern
      const stackingTests = [
        { x: 2, expectedY: 1, description: 'stack on single base at X=2' },
        { x: 3, expectedY: 2, description: 'stack on double base at X=3' },
        { x: 4, expectedY: 3, description: 'stack on triple base at X=4' },
        { x: 1, expectedY: 0, description: 'place on empty ground at X=1' },
        { x: 5, expectedY: 0, description: 'place on empty ground at X=5' }
      ];

      stackingTests.forEach(({ x, expectedY, description }) => {
        // Find the lowest empty position in this column
        let lowestEmpty = -1;
        for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
          if (gameBoard.isEmpty(x, y)) {
            lowestEmpty = y;
            break;
          }
        }

        expect(lowestEmpty).toBe(expectedY);
      });
    });

    test('should handle stacking with gaps', () => {
      // Create a pattern with gaps
      gameBoard.addPieceAt([
        { pos: { x: 5, y: 0 }, die: { id: 'bottom', sides: 6, number: 1, color: 'red' } as any },
        { pos: { x: 5, y: 2 }, die: { id: 'floating', sides: 6, number: 2, color: 'blue' } as any }, // Gap at Y=1
        { pos: { x: 5, y: 4 }, die: { id: 'higher', sides: 6, number: 3, color: 'green' } as any }  // Gap at Y=3
      ]);

      // Verify gaps exist
      expect(gameBoard.isEmpty(5, 1)).toBe(true);
      expect(gameBoard.isEmpty(5, 3)).toBe(true);

      // Simulate gravity filling gaps (this would happen in real game)
      // For testing, we manually check what should happen
      const occupiedPositions = [];
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        if (!gameBoard.isEmpty(5, y)) {
          occupiedPositions.push(y);
        }
      }

      expect(occupiedPositions).toEqual([0, 2, 4]); // Gaps at Y=1 and Y=3
    });
  });

  describe('Boundary Condition Edge Cases', () => {
    test('should handle coordinate conversion at exact boundaries', () => {
      const boundaryTests = [
        { gridX: 0, gridY: 0, description: 'bottom-left corner' },
        { gridX: 9, gridY: 0, description: 'bottom-right corner' },
        { gridX: 0, gridY: 19, description: 'top-left corner' },
        { gridX: 9, gridY: 19, description: 'top-right corner' },
        { gridX: 4, gridY: 0, description: 'bottom center' },
        { gridX: 4, gridY: 19, description: 'top center' }
      ];

      const boardMetrics = {
        boardX: 100,
        boardY: 50,
        cellW: 30,
        cellH: 25,
        rows: 20,
        cols: 10
      };

      boundaryTests.forEach(({ gridX, gridY, description }) => {
        // Test grid to screen conversion
        const screenPos = converter.gridToScreen(gridX, gridY, boardMetrics);
        expect(typeof screenPos.x).toBe('number');
        expect(typeof screenPos.y).toBe('number');
        expect(isFinite(screenPos.x)).toBe(true);
        expect(isFinite(screenPos.y)).toBe(true);

        // Test screen to grid conversion (with offset to be inside cell)
        const backToGrid = converter.screenToGrid(
          screenPos.x + 15, 
          screenPos.y + 12, 
          boardMetrics
        );
        expect(backToGrid).toEqual({ x: gridX, y: gridY });
      });
    });

    test('should handle positions just outside valid boundaries', () => {
      const outsideBoundaryTests = [
        { x: -1, y: 0, valid: false, reason: 'left of grid' },
        { x: 10, y: 0, valid: false, reason: 'right of grid' },
        { x: 0, y: -1, valid: false, reason: 'below grid' },
        { x: 0, y: 20, valid: false, reason: 'above visible grid' },
        { x: -1, y: -1, valid: false, reason: 'bottom-left outside' },
        { x: 10, y: 20, valid: false, reason: 'top-right outside' }
      ];

      outsideBoundaryTests.forEach(({ x, y, valid, reason }) => {
        const isValid = GridBoundaryValidator.validatePosition(
          x, y, 
          GAME_CONSTANTS.GRID_WIDTH, 
          GAME_CONSTANTS.GRID_HEIGHT
        );
        expect(isValid).toBe(valid);

        // Test clamping
        const clamped = GridBoundaryValidator.clampPosition(
          x, y,
          GAME_CONSTANTS.GRID_WIDTH,
          GAME_CONSTANTS.GRID_HEIGHT
        );
        
        expect(clamped.x).toBeGreaterThanOrEqual(0);
        expect(clamped.x).toBeLessThan(GAME_CONSTANTS.GRID_WIDTH);
        expect(clamped.y).toBeGreaterThanOrEqual(0);
        expect(clamped.y).toBeLessThan(GAME_CONSTANTS.GRID_HEIGHT);
      });
    });

    test('should handle array index conversion at boundaries', () => {
      const conversionTests = [
        { gridY: 0, expectedArrayY: 15, description: 'bottom grid to top array' },
        { gridY: 15, expectedArrayY: 0, description: 'top grid to bottom array' },
        { gridY: 8, expectedArrayY: 7, description: 'middle grid to middle array' },
        { arrayY: 0, expectedGridY: 15, description: 'top array to bottom grid' },
        { arrayY: 15, expectedGridY: 0, description: 'bottom array to top grid' },
        { arrayY: 7, expectedGridY: 8, description: 'middle array to middle grid' }
      ];

      conversionTests.forEach(test => {
        if ('gridY' in test) {
          const arrayY = converter.gridToArrayY(test.gridY);
          expect(arrayY).toBe(test.expectedArrayY);
        }
        
        if ('arrayY' in test) {
          const gridY = converter.arrayToGridY(test.arrayY);
          expect(gridY).toBe(test.expectedGridY);
        }
      });
    });
  });

  describe('Complex Interaction Edge Cases', () => {
    test('should handle simultaneous boundary conditions', () => {
      // Test piece that hits multiple boundaries simultaneously
      const cornerPiece = [
        { x: 0, y: 0 }, // Will be at grid corner
        { x: -1, y: 0 }, // Will be outside left boundary
        { x: 0, y: -1 }  // Will be outside bottom boundary
      ];

      const pieceX = 0;
      const pieceY = 0;

      const collisionResults = cornerPiece.map(relativePos => {
        const absoluteX = pieceX + relativePos.x;
        const absoluteY = pieceY + relativePos.y;
        
        const outOfBounds = absoluteX < 0 || 
                           absoluteX >= GAME_CONSTANTS.GRID_WIDTH ||
                           absoluteY < GAME_CONSTANTS.GROUND_Y;
        
        return {
          pos: { x: absoluteX, y: absoluteY },
          outOfBounds
        };
      });

      expect(collisionResults[0].outOfBounds).toBe(false); // (0,0) is valid
      expect(collisionResults[1].outOfBounds).toBe(true);  // (-1,0) is out of bounds
      expect(collisionResults[2].outOfBounds).toBe(true);  // (0,-1) is out of bounds
    });

    test('should handle rapid coordinate changes', () => {
      // Simulate rapid movement/falling
      const piece = [{ x: 0, y: 0 }];
      let currentX = GAME_CONSTANTS.SPAWN_X_CENTER;
      let currentY = 25; // Start well above grid

      const movementHistory = [];

      // Simulate falling with occasional horizontal movement
      while (currentY > GAME_CONSTANTS.GROUND_Y) {
        // Record current position
        movementHistory.push({ x: currentX, y: currentY });

        // Move down
        currentY += GAME_CONSTANTS.FALL_STEP;

        // Occasionally move horizontally
        if (movementHistory.length % 3 === 0) {
          const direction = Math.random() > 0.5 ? 1 : -1;
          const newX = currentX + direction;
          
          // Only move if within bounds
          if (newX >= 0 && newX < GAME_CONSTANTS.GRID_WIDTH) {
            currentX = newX;
          }
        }

        // Stop if hit bottom
        if (currentY <= GAME_CONSTANTS.GROUND_Y) {
          currentY = GAME_CONSTANTS.GROUND_Y;
          movementHistory.push({ x: currentX, y: currentY });
          break;
        }
      }

      // Verify movement history makes sense
      expect(movementHistory.length).toBeGreaterThan(0);
      expect(movementHistory[0].y).toBeGreaterThan(GAME_CONSTANTS.TOP_Y);
      expect(movementHistory[movementHistory.length - 1].y).toBe(GAME_CONSTANTS.GROUND_Y);

      // Verify all X positions were within bounds
      movementHistory.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThan(GAME_CONSTANTS.GRID_WIDTH);
      });
    });

    test('should handle coordinate system consistency under stress', () => {
      // Fill grid with random pattern and verify coordinate consistency
      const randomPositions = [];
      
      // Generate random positions
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * GAME_CONSTANTS.GRID_WIDTH);
        const y = Math.floor(Math.random() * GAME_CONSTANTS.GRID_HEIGHT);
        
        if (gameBoard.isEmpty(x, y)) {
          gameBoard.addPieceAt([{
            pos: { x, y },
            die: { id: `random-${i}`, sides: 6, number: (i % 6) + 1, color: 'red' } as any
          }]);
          randomPositions.push({ x, y });
        }
      }

      // Verify all positions are correctly stored and retrievable
      randomPositions.forEach(pos => {
        expect(gameBoard.isEmpty(pos.x, pos.y)).toBe(false);
        
        // Test coordinate conversion consistency
        const arrayY = converter.gridToArrayY(pos.y);
        const backToGridY = converter.arrayToGridY(arrayY);
        expect(backToGridY).toBe(pos.y);
      });

      // Test that empty positions are still empty
      for (let x = 0; x < GAME_CONSTANTS.GRID_WIDTH; x++) {
        for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
          const isInRandomPositions = randomPositions.some(pos => pos.x === x && pos.y === y);
          const isEmpty = gameBoard.isEmpty(x, y);
          
          expect(isEmpty).toBe(!isInRandomPositions);
        }
      }
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle large numbers of coordinate conversions efficiently', () => {
      const startTime = performance.now();
      
      // Perform many coordinate conversions
      const conversions = 10000;
      const boardMetrics = {
        boardX: 100, boardY: 50, cellW: 30, cellH: 25, rows: 20, cols: 10
      };

      for (let i = 0; i < conversions; i++) {
        const gridX = i % GAME_CONSTANTS.GRID_WIDTH;
        const gridY = i % GAME_CONSTANTS.GRID_HEIGHT;
        
        const screenPos = converter.gridToScreen(gridX, gridY, boardMetrics);
        const backToGrid = converter.screenToGrid(
          screenPos.x + 15, 
          screenPos.y + 12, 
          boardMetrics
        );
        
        // Verify conversion accuracy
        expect(backToGrid).toEqual({ x: gridX, y: gridY });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for 10k conversions
    });

    test('should handle memory efficiency with large grids', () => {
      // Test with a larger theoretical grid
      const largeConverter = new CoordinateConverter(100);
      
      // Test conversions still work correctly
      expect(largeConverter.gridToArrayY(0)).toBe(99);
      expect(largeConverter.gridToArrayY(99)).toBe(0);
      expect(largeConverter.arrayToGridY(0)).toBe(99);
      expect(largeConverter.arrayToGridY(99)).toBe(0);
    });
  });
});
