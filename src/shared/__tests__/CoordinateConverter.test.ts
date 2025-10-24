import { describe, test, expect } from 'vitest';
import { CoordinateConverter } from '../utils/CoordinateConverter';

describe('CoordinateConverter', () => {
  const gridHeight = 20;
  const converter = new CoordinateConverter(gridHeight);

  describe('gridToArrayY', () => {
    test('should convert bottom-left grid Y=0 to array index 19', () => {
      expect(converter.gridToArrayY(0)).toBe(19);
    });

    test('should convert top grid Y=19 to array index 0', () => {
      expect(converter.gridToArrayY(19)).toBe(0);
    });

    test('should convert middle grid Y=10 to array index 9', () => {
      expect(converter.gridToArrayY(10)).toBe(9);
    });

    test('should handle edge cases correctly', () => {
      expect(converter.gridToArrayY(1)).toBe(18);
      expect(converter.gridToArrayY(18)).toBe(1);
    });
  });

  describe('arrayToGridY', () => {
    test('should convert array index 0 to grid Y=19', () => {
      expect(converter.arrayToGridY(0)).toBe(19);
    });

    test('should convert array index 19 to grid Y=0', () => {
      expect(converter.arrayToGridY(19)).toBe(0);
    });

    test('should convert array index 9 to grid Y=10', () => {
      expect(converter.arrayToGridY(9)).toBe(10);
    });

    test('should handle edge cases correctly', () => {
      expect(converter.arrayToGridY(1)).toBe(18);
      expect(converter.arrayToGridY(18)).toBe(1);
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
      rows: 20
    };

    test('should convert grid bottom-left (0,0) to correct screen position', () => {
      const screenPos = converter.gridToScreen(0, 0, boardMetrics);
      expect(screenPos.x).toBe(100); // boardX + 0 * cellW
      expect(screenPos.y).toBe(525); // boardY + (rows - 1 - 0) * cellH = 50 + 19 * 25
    });

    test('should convert grid top-left (0,19) to correct screen position', () => {
      const screenPos = converter.gridToScreen(0, 19, boardMetrics);
      expect(screenPos.x).toBe(100); // boardX + 0 * cellW
      expect(screenPos.y).toBe(50);  // boardY + (rows - 1 - 19) * cellH = 50 + 0 * 25
    });

    test('should convert grid center position correctly', () => {
      const screenPos = converter.gridToScreen(5, 10, boardMetrics);
      expect(screenPos.x).toBe(250); // 100 + 5 * 30
      expect(screenPos.y).toBe(275); // 50 + (20 - 1 - 10) * 25 = 50 + 9 * 25
    });
  });

  describe('screenToGrid', () => {
    const boardMetrics = {
      boardX: 100,
      boardY: 50,
      cellW: 30,
      cellH: 25,
      rows: 20,
      cols: 10
    };

    test('should convert screen position to grid coordinates correctly', () => {
      // Screen position that should map to grid (0,0)
      const screenX = 115; // Within first cell X
      const screenY = 540; // Within bottom cell Y
      const gridPos = converter.screenToGrid(screenX, screenY, boardMetrics);
      expect(gridPos).toEqual({ x: 0, y: 0 });
    });

    test('should convert screen position to grid top correctly', () => {
      // Screen position that should map to grid (0,19)
      const screenX = 115; // Within first cell X
      const screenY = 60;  // Within top cell Y
      const gridPos = converter.screenToGrid(screenX, screenY, boardMetrics);
      expect(gridPos).toEqual({ x: 0, y: 19 });
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
      for (let gridX = 0; gridX < 10; gridX++) {
        for (let gridY = 0; gridY < 20; gridY++) {
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
