import { describe, test, expect } from 'vitest';
import { CoordinateConverter } from '../utils/CoordinateConverter';

describe('CoordinateConverter', () => {
  const gridHeight = 16;
  const converter = new CoordinateConverter(gridHeight);

  describe('gridToArrayY', () => {
    test('should convert bottom-left grid Y=0 to array index 15', () => {
      expect(converter.gridToArrayY(0)).toBe(15);
    });

    test('should convert top grid Y=15 to array index 0', () => {
      expect(converter.gridToArrayY(15)).toBe(0);
    });

    test('should convert middle grid Y=8 to array index 7', () => {
      expect(converter.gridToArrayY(8)).toBe(7);
    });

    test('should handle edge cases correctly', () => {
      expect(converter.gridToArrayY(1)).toBe(14);
      expect(converter.gridToArrayY(14)).toBe(1);
    });
  });

  describe('arrayToGridY', () => {
    test('should convert array index 0 to grid Y=15', () => {
      expect(converter.arrayToGridY(0)).toBe(15);
    });

    test('should convert array index 15 to grid Y=0', () => {
      expect(converter.arrayToGridY(15)).toBe(0);
    });

    test('should convert array index 7 to grid Y=8', () => {
      expect(converter.arrayToGridY(7)).toBe(8);
    });

    test('should handle edge cases correctly', () => {
      expect(converter.arrayToGridY(1)).toBe(14);
      expect(converter.arrayToGridY(14)).toBe(1);
    });
  });

  describe('coordinate conversion symmetry', () => {
    test('should be symmetric for all valid coordinates', () => {
      for (let gridY = 0; gridY < gridHeight; gridY++) {
        const arrayY = converter.gridToArrayY(gridY);
        const backToGridY = converter.arrayToGridY(arrayY);
        expect(backToGridY).toBe(gridY);
      }
    });

    test('should be symmetric for all valid array indices', () => {
      for (let arrayY = 0; arrayY < gridHeight; arrayY++) {
        const gridY = converter.arrayToGridY(arrayY);
        const backToArrayY = converter.gridToArrayY(gridY);
        expect(backToArrayY).toBe(arrayY);
      }
    });
  });

  describe('gridToScreen', () => {
    const boardMetrics = {
      boardX: 100,
      boardY: 50,
      cellW: 30,
      cellH: 25,
      rows: 16
    };

    test('should convert grid bottom-left (0,0) to correct screen position', () => {
      const screenPos = converter.gridToScreen(0, 0, boardMetrics);
      expect(screenPos.x).toBe(100); // boardX + 0 * cellW
      expect(screenPos.y).toBe(425); // boardY + (rows - 1 - 0) * cellH = 50 + 15 * 25
    });

    test('should convert grid top-left (0,15) to correct screen position', () => {
      const screenPos = converter.gridToScreen(0, 15, boardMetrics);
      expect(screenPos.x).toBe(100); // boardX + 0 * cellW
      expect(screenPos.y).toBe(50);  // boardY + (rows - 1 - 15) * cellH = 50 + 0 * 25
    });

    test('should convert grid center position correctly', () => {
      const screenPos = converter.gridToScreen(4, 8, boardMetrics);
      expect(screenPos.x).toBe(220); // 100 + 4 * 30
      expect(screenPos.y).toBe(225); // 50 + (16 - 1 - 8) * 25 = 50 + 7 * 25
    });
  });

  describe('screenToGrid', () => {
    const boardMetrics = {
      boardX: 100,
      boardY: 50,
      cellW: 30,
      cellH: 25,
      rows: 16,
      cols: 8
    };

    test('should convert screen position to grid coordinates correctly', () => {
      // Screen position that should map to grid (0,0)
      const screenX = 115; // Within first cell X
      const screenY = 440; // Within bottom cell Y
      const gridPos = converter.screenToGrid(screenX, screenY, boardMetrics);
      expect(gridPos).toEqual({ x: 0, y: 0 });
    });

    test('should convert screen position to grid top correctly', () => {
      // Screen position that should map to grid (0,15)
      const screenX = 115; // Within first cell X
      const screenY = 60;  // Within top cell Y
      const gridPos = converter.screenToGrid(screenX, screenY, boardMetrics);
      expect(gridPos).toEqual({ x: 0, y: 15 });
    });

    test('should return null for positions outside grid', () => {
      // Position outside grid bounds
      const gridPos1 = converter.screenToGrid(50, 60, boardMetrics); // Left of board
      const gridPos2 = converter.screenToGrid(500, 60, boardMetrics); // Right of board
      const gridPos3 = converter.screenToGrid(115, 30, boardMetrics); // Above board
      const gridPos4 = converter.screenToGrid(115, 600, boardMetrics); // Below board
      
      expect(gridPos1).toBeNull();
      expect(gridPos2).toBeNull();
      expect(gridPos3).toBeNull();
      expect(gridPos4).toBeNull();
    });

    test('should be symmetric with gridToScreen for valid positions', () => {
      for (let gridX = 0; gridX < 8; gridX++) {
        for (let gridY = 0; gridY < 16; gridY++) {
          const screenPos = converter.gridToScreen(gridX, gridY, boardMetrics);
          // Add small offset to ensure we're within the cell
          const backToGrid = converter.screenToGrid(
            screenPos.x + 15, 
            screenPos.y + 12, 
            boardMetrics
          );
          expect(backToGrid).toEqual({ x: gridX, y: gridY });
        }
      }
    });
  });
});
