import { describe, test, expect } from 'vitest';
import { CoordinateConverter } from '../../../../shared/utils/CoordinateConverter';
import { GAME_CONSTANTS } from '../../../../shared/constants/GameConstants';

/**
 * Tests for visual rendering coordinate conversion with bottom-left coordinate system
 */
describe('Visual Rendering Coordinate Conversion', () => {
  const gridHeight = GAME_CONSTANTS.GRID_HEIGHT;
  const converter = new CoordinateConverter(gridHeight);

  // Standard board metrics for testing
  const standardBoardMetrics = {
    boardX: 100,
    boardY: 50,
    cellW: 30,
    cellH: 25,
    rows: 16,
    cols: 8
  };

  describe('Grid to Screen Coordinate Conversion', () => {
    test('should convert bottom-left grid origin to bottom screen position', () => {
      const screenPos = converter.gridToScreen(0, 0, standardBoardMetrics);
      
      // Grid Y=0 should map to bottom of screen board
      const expectedY = standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1) * standardBoardMetrics.cellH;
      expect(screenPos.x).toBe(standardBoardMetrics.boardX); // X=0 -> boardX
      expect(screenPos.y).toBe(expectedY); // Y=0 -> bottom of board
    });

    test('should convert top-left grid position to top screen position', () => {
      const screenPos = converter.gridToScreen(0, 15, standardBoardMetrics);
      
      // Grid Y=15 should map to top of screen board (16-row grid: 0-15)
      expect(screenPos.x).toBe(standardBoardMetrics.boardX); // X=0 -> boardX
      expect(screenPos.y).toBe(standardBoardMetrics.boardY); // Y=15 -> top of board
    });

    test('should convert grid center to screen center', () => {
      const centerX = Math.floor(GAME_CONSTANTS.GRID_WIDTH / 2);
      const centerY = Math.floor(GAME_CONSTANTS.GRID_HEIGHT / 2);
      
      const screenPos = converter.gridToScreen(centerX, centerY, standardBoardMetrics);
      
      const expectedX = standardBoardMetrics.boardX + centerX * standardBoardMetrics.cellW;
      const expectedY = standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1 - centerY) * standardBoardMetrics.cellH;
      
      expect(screenPos.x).toBe(expectedX);
      expect(screenPos.y).toBe(expectedY);
    });

    test('should handle all grid positions correctly', () => {
      // Test all positions in the grid
      for (let gridX = 0; gridX < GAME_CONSTANTS.GRID_WIDTH; gridX++) {
        for (let gridY = 0; gridY < GAME_CONSTANTS.GRID_HEIGHT; gridY++) {
          const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
          
          // Verify X coordinate
          const expectedX = standardBoardMetrics.boardX + gridX * standardBoardMetrics.cellW;
          expect(screenPos.x).toBe(expectedX);
          
          // Verify Y coordinate (bottom-left to top-left conversion)
          const expectedY = standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1 - gridY) * standardBoardMetrics.cellH;
          expect(screenPos.y).toBe(expectedY);
          
          // Ensure coordinates are within expected bounds
          expect(screenPos.x).toBeGreaterThanOrEqual(standardBoardMetrics.boardX);
          expect(screenPos.y).toBeGreaterThanOrEqual(standardBoardMetrics.boardY);
        }
      }
    });

    test('should handle different board metrics', () => {
      const customMetrics = {
        boardX: 200,
        boardY: 100,
        cellW: 40,
        cellH: 35,
        rows: 16,
        cols: 8
      };

      // Test bottom-left corner
      const bottomLeft = converter.gridToScreen(0, 0, customMetrics);
      expect(bottomLeft.x).toBe(200);
      expect(bottomLeft.y).toBe(100 + 15 * 35); // Bottom of board

      // Test top-right corner
      const topRight = converter.gridToScreen(7, 15, customMetrics);
      expect(topRight.x).toBe(200 + 7 * 40);
      expect(topRight.y).toBe(100); // Top of board
    });
  });

  describe('Screen to Grid Coordinate Conversion', () => {
    test('should convert screen bottom position to grid bottom-left', () => {
      // Click at bottom-left of board
      const screenX = standardBoardMetrics.boardX + 15; // Middle of first cell
      const screenY = standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1) * standardBoardMetrics.cellH + 12; // Middle of bottom cell
      
      const gridPos = converter.screenToGrid(screenX, screenY, standardBoardMetrics);
      expect(gridPos).toEqual({ x: 0, y: 0 });
    });

    test('should convert screen top position to grid top-left', () => {
      // Click at top-left of board
      const screenX = standardBoardMetrics.boardX + 15; // Middle of first cell
      const screenY = standardBoardMetrics.boardY + 12; // Middle of top cell
      
      const gridPos = converter.screenToGrid(screenX, screenY, standardBoardMetrics);
      expect(gridPos).toEqual({ x: 0, y: 15 });
    });

    test('should return null for positions outside board', () => {
      const outsidePositions = [
        { x: 50, y: 100, reason: 'left of board' },
        { x: 500, y: 100, reason: 'right of board' },
        { x: 150, y: 30, reason: 'above board' },
        { x: 150, y: 600, reason: 'below board' },
      ];

      outsidePositions.forEach(({ x, y, reason }) => {
        const gridPos = converter.screenToGrid(x, y, standardBoardMetrics);
        expect(gridPos).toBeNull();
      });
    });

    test('should handle edge positions correctly', () => {
      // Test positions at the exact edges of cells
      const edgeTests = [
        {
          screenX: standardBoardMetrics.boardX, // Left edge of first cell
          screenY: standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1) * standardBoardMetrics.cellH, // Top edge of bottom cell
          expectedGrid: { x: 0, y: 0 }
        },
        {
          screenX: standardBoardMetrics.boardX + standardBoardMetrics.cellW - 1, // Right edge of first cell
          screenY: standardBoardMetrics.boardY + standardBoardMetrics.cellH - 1, // Bottom edge of top cell
          expectedGrid: { x: 0, y: 15 }
        }
      ];

      edgeTests.forEach(({ screenX, screenY, expectedGrid }) => {
        const gridPos = converter.screenToGrid(screenX, screenY, standardBoardMetrics);
        expect(gridPos).toEqual(expectedGrid);
      });
    });
  });

  describe('Coordinate Conversion Symmetry', () => {
    test('should be symmetric for all valid grid positions', () => {
      // Test that gridToScreen -> screenToGrid returns original position
      for (let gridX = 0; gridX < GAME_CONSTANTS.GRID_WIDTH; gridX++) {
        for (let gridY = 0; gridY < GAME_CONSTANTS.GRID_HEIGHT; gridY++) {
          const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
          
          // Add small offset to ensure we're within the cell (not on edge)
          const testScreenX = screenPos.x + standardBoardMetrics.cellW / 2;
          const testScreenY = screenPos.y + standardBoardMetrics.cellH / 2;
          
          const backToGrid = converter.screenToGrid(testScreenX, testScreenY, standardBoardMetrics);
          expect(backToGrid).toEqual({ x: gridX, y: gridY });
        }
      }
    });

    test('should handle fractional screen positions correctly', () => {
      // Test positions within cells but not at exact centers
      const fractionalTests = [
        { gridX: 4, gridY: 8, offsetX: 0.25, offsetY: 0.75 },
        { gridX: 2, gridY: 15, offsetX: 0.8, offsetY: 0.1 },
        { gridX: 7, gridY: 3, offsetX: 0.5, offsetY: 0.5 },
      ];

      fractionalTests.forEach(({ gridX, gridY, offsetX, offsetY }) => {
        const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
        
        // Add fractional offset within the cell
        const testScreenX = screenPos.x + standardBoardMetrics.cellW * offsetX;
        const testScreenY = screenPos.y + standardBoardMetrics.cellH * offsetY;
        
        const backToGrid = converter.screenToGrid(testScreenX, testScreenY, standardBoardMetrics);
        expect(backToGrid).toEqual({ x: gridX, y: gridY });
      });
    });
  });

  describe('Piece Rendering Coordinate Conversion', () => {
    test('should convert active piece positions correctly', () => {
      // Simulate an active piece at various positions
      const testPieces = [
        {
          pieceX: 3, pieceY: 8,
          dice: [
            { relativePos: { x: 0, y: 0 } },
            { relativePos: { x: 1, y: 0 } },
            { relativePos: { x: 0, y: 1 } }
          ]
        },
        {
          pieceX: 2, pieceY: 5,
          dice: [
            { relativePos: { x: 0, y: 0 } },
            { relativePos: { x: 0, y: 1 } },
            { relativePos: { x: 0, y: 2 } }
          ]
        }
      ];

      testPieces.forEach(({ pieceX, pieceY, dice }) => {
        dice.forEach((die, index) => {
          const gridX = pieceX + die.relativePos.x;
          const gridY = pieceY + die.relativePos.y;
          
          // Convert to screen coordinates
          const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
          
          // Verify the conversion makes sense
          expect(screenPos.x).toBeGreaterThanOrEqual(standardBoardMetrics.boardX);
          expect(screenPos.y).toBeGreaterThanOrEqual(standardBoardMetrics.boardY);
          
          // Verify it's within the board bounds
          const maxScreenX = standardBoardMetrics.boardX + standardBoardMetrics.cols * standardBoardMetrics.cellW;
          const maxScreenY = standardBoardMetrics.boardY + standardBoardMetrics.rows * standardBoardMetrics.cellH;
          
          if (gridX < GAME_CONSTANTS.GRID_WIDTH && gridY < GAME_CONSTANTS.GRID_HEIGHT) {
            expect(screenPos.x).toBeLessThan(maxScreenX);
            expect(screenPos.y).toBeLessThan(maxScreenY);
          }
        });
      });
    });

    test('should handle pieces above visible grid correctly', () => {
      // Test pieces above the 8x16 grid (Y > 15)
      const spawnPiece = {
        pieceX: GAME_CONSTANTS.SPAWN_X_CENTER,
        pieceY: 16, // Above the 8x16 grid
        dice: [
          { relativePos: { x: 0, y: 0 } },
          { relativePos: { x: 0, y: 1 } }
        ]
      };

      spawnPiece.dice.forEach(die => {
        const gridX = spawnPiece.pieceX + die.relativePos.x;
        const gridY = spawnPiece.pieceY + die.relativePos.y;
        
        const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
        
        // Pieces above grid should have screen Y positions above the board
        expect(screenPos.y).toBeLessThan(standardBoardMetrics.boardY);
        
        // X position should still be valid
        expect(screenPos.x).toBeGreaterThanOrEqual(standardBoardMetrics.boardX);
      });
    });

    test('should handle locked piece rendering across entire grid', () => {
      // Simulate a full grid of locked pieces
      const lockedPieces = [];
      
      for (let gridY = 0; gridY < GAME_CONSTANTS.GRID_HEIGHT; gridY++) {
        for (let gridX = 0; gridX < GAME_CONSTANTS.GRID_WIDTH; gridX++) {
          const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
          
          lockedPieces.push({
            gridPos: { x: gridX, y: gridY },
            screenPos: screenPos
          });
        }
      }

      // Verify all positions are correctly converted
      lockedPieces.forEach(({ gridPos, screenPos }) => {
        // Check X coordinate
        const expectedX = standardBoardMetrics.boardX + gridPos.x * standardBoardMetrics.cellW;
        expect(screenPos.x).toBe(expectedX);
        
        // Check Y coordinate (bottom-left grid to top-left screen)
        const expectedY = standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1 - gridPos.y) * standardBoardMetrics.cellH;
        expect(screenPos.y).toBe(expectedY);
      });

      // Verify Y coordinates are in correct order (higher grid Y = lower screen Y)
      const bottomRow = lockedPieces.filter(p => p.gridPos.y === 0);
      const topRow = lockedPieces.filter(p => p.gridPos.y === 15);
      
      // Bottom row (Y=0) should have higher screen Y than top row (Y=15)
      expect(bottomRow[0].screenPos.y).toBeGreaterThan(topRow[0].screenPos.y);
    });
  });

  describe('Touch Input Coordinate Conversion', () => {
    test('should convert touch positions to correct grid coordinates', () => {
      const touchTests = [
        {
          description: 'Touch bottom-left cell',
          touchX: standardBoardMetrics.boardX + 15,
          touchY: standardBoardMetrics.boardY + (standardBoardMetrics.rows - 1) * standardBoardMetrics.cellH + 12,
          expectedGrid: { x: 0, y: 0 }
        },
        {
          description: 'Touch center cell',
          touchX: standardBoardMetrics.boardX + 3.5 * standardBoardMetrics.cellW,
          touchY: standardBoardMetrics.boardY + 8 * standardBoardMetrics.cellH,
          expectedGrid: { x: 3, y: 7 }
        },
        {
          description: 'Touch top-right cell',
          touchX: standardBoardMetrics.boardX + 7.5 * standardBoardMetrics.cellW,
          touchY: standardBoardMetrics.boardY + 0.5 * standardBoardMetrics.cellH,
          expectedGrid: { x: 7, y: 15 }
        }
      ];

      touchTests.forEach(({ description, touchX, touchY, expectedGrid }) => {
        const gridPos = converter.screenToGrid(touchX, touchY, standardBoardMetrics);
        expect(gridPos).toEqual(expectedGrid);
      });
    });

    test('should handle touch positions at cell boundaries', () => {
      // Test touches exactly on cell boundaries
      const boundaryTests = [
        {
          // Touch exactly on left edge of cell (1,1)
          touchX: standardBoardMetrics.boardX + standardBoardMetrics.cellW,
          touchY: standardBoardMetrics.boardY + (standardBoardMetrics.rows - 2) * standardBoardMetrics.cellH,
          expectedGrid: { x: 1, y: 1 }
        },
        {
          // Touch exactly on top edge of cell (5,8)
          touchX: standardBoardMetrics.boardX + 5.5 * standardBoardMetrics.cellW,
          touchY: standardBoardMetrics.boardY + (standardBoardMetrics.rows - 9) * standardBoardMetrics.cellH,
          expectedGrid: { x: 5, y: 8 }
        }
      ];

      boundaryTests.forEach(({ touchX, touchY, expectedGrid }) => {
        const gridPos = converter.screenToGrid(touchX, touchY, standardBoardMetrics);
        expect(gridPos).toEqual(expectedGrid);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle extreme coordinate values gracefully', () => {
      const extremeTests = [
        { gridX: -100, gridY: -100 },
        { gridX: 1000, gridY: 1000 },
        { gridX: 0, gridY: 1000 },
        { gridX: 1000, gridY: 0 }
      ];

      extremeTests.forEach(({ gridX, gridY }) => {
        // Should not throw errors
        expect(() => {
          const screenPos = converter.gridToScreen(gridX, gridY, standardBoardMetrics);
          expect(typeof screenPos.x).toBe('number');
          expect(typeof screenPos.y).toBe('number');
        }).not.toThrow();
      });
    });

    test('should handle zero and negative board metrics', () => {
      const edgeCaseMetrics = {
        boardX: 0,
        boardY: 0,
        cellW: 1,
        cellH: 1,
        rows: 16,
        cols: 8
      };

      // Should still work with minimal metrics
      const screenPos = converter.gridToScreen(4, 8, edgeCaseMetrics);
      expect(screenPos.x).toBe(4);
      expect(screenPos.y).toBe(7); // rows - 1 - gridY = 16 - 1 - 8 = 7
    });

    test('should maintain precision with fractional cell sizes', () => {
      const fractionalMetrics = {
        boardX: 100.5,
        boardY: 50.25,
        cellW: 30.75,
        cellH: 25.5,
        rows: 16,
        cols: 8
      };

      const screenPos = converter.gridToScreen(3, 7, fractionalMetrics);
      
      // Should handle fractional calculations correctly
      expect(screenPos.x).toBeCloseTo(100.5 + 3 * 30.75, 10);
      expect(screenPos.y).toBeCloseTo(50.25 + (16 - 1 - 7) * 25.5, 10);
    });
  });
});
