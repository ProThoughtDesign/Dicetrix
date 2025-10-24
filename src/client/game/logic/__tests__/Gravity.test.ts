import { describe, test, expect } from 'vitest';
import { applyGravity, applyIndividualGravity } from '../Gravity';
import { GridState } from '../types';
import { GAME_CONSTANTS } from '../../../../shared/constants/GameConstants';

describe('Gravity System', () => {
  
  function createEmptyGrid(): GridState {
    const grid: GridState = {
      width: GAME_CONSTANTS.GRID_WIDTH,
      height: GAME_CONSTANTS.GRID_HEIGHT,
      cells: []
    };
    
    // Initialize 16 rows of 8 columns each
    for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
      grid.cells.push(new Array(GAME_CONSTANTS.GRID_WIDTH).fill(null));
    }
    
    return grid;
  }

  describe('8x16 Grid Gravity Tests', () => {
    test('should apply gravity correctly within 16-row height limits', () => {
      const grid = createEmptyGrid();
      
      // Place dice in middle of grid that should fall to bottom
      grid.cells[10][2] = { id: 'fall1', sides: 6, number: 3, color: 'red' } as any; // Grid Y=5
      grid.cells[8][2] = { id: 'fall2', sides: 6, number: 4, color: 'blue' } as any; // Grid Y=7
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(true);
      
      // Dice should have fallen to bottom (array indices 15 and 14)
      expect(grid.cells[15][2]).toEqual({ id: 'fall1', sides: 6, number: 3, color: 'red' });
      expect(grid.cells[14][2]).toEqual({ id: 'fall2', sides: 6, number: 4, color: 'blue' });
      
      // Original positions should be empty
      expect(grid.cells[10][2]).toBeNull();
      expect(grid.cells[8][2]).toBeNull();
    });

    test('should compact dice toward Y=0 (bottom) in 8x16 grid', () => {
      const grid = createEmptyGrid();
      
      // Place dice with gaps in column 4
      grid.cells[12][4] = { id: 'top', sides: 6, number: 1, color: 'green' } as any; // Grid Y=3
      grid.cells[14][4] = { id: 'middle', sides: 6, number: 2, color: 'yellow' } as any; // Grid Y=1
      // Gap at grid Y=2 (array index 13)
      grid.cells[15][4] = { id: 'bottom', sides: 6, number: 3, color: 'purple' } as any; // Grid Y=0
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(true);
      
      // All dice should be compacted to bottom with no gaps
      expect(grid.cells[15][4]).toEqual({ id: 'bottom', sides: 6, number: 3, color: 'purple' }); // Y=0
      expect(grid.cells[14][4]).toEqual({ id: 'middle', sides: 6, number: 2, color: 'yellow' }); // Y=1
      expect(grid.cells[13][4]).toEqual({ id: 'top', sides: 6, number: 1, color: 'green' }); // Y=2
      
      // Original top position should be empty
      expect(grid.cells[12][4]).toBeNull();
    });

    test('should handle gravity at grid boundaries correctly', () => {
      const grid = createEmptyGrid();
      
      // Place dice at edges of 8x16 grid
      grid.cells[5][0] = { id: 'left', sides: 6, number: 1, color: 'red' } as any; // Left edge, Grid Y=10
      grid.cells[5][7] = { id: 'right', sides: 6, number: 2, color: 'blue' } as any; // Right edge, Grid Y=10
      grid.cells[0][3] = { id: 'top', sides: 6, number: 3, color: 'green' } as any; // Top edge, Grid Y=15
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(true);
      
      // All dice should fall to bottom
      expect(grid.cells[15][0]).toEqual({ id: 'left', sides: 6, number: 1, color: 'red' }); // Y=0
      expect(grid.cells[15][7]).toEqual({ id: 'right', sides: 6, number: 2, color: 'blue' }); // Y=0
      expect(grid.cells[15][3]).toEqual({ id: 'top', sides: 6, number: 3, color: 'green' }); // Y=0
    });

    test('should not change grid when no gravity is needed', () => {
      const grid = createEmptyGrid();
      
      // Place dice already at bottom with no gaps
      grid.cells[15][1] = { id: 'stable1', sides: 6, number: 1, color: 'red' } as any; // Y=0
      grid.cells[14][1] = { id: 'stable2', sides: 6, number: 2, color: 'blue' } as any; // Y=1
      grid.cells[13][1] = { id: 'stable3', sides: 6, number: 3, color: 'green' } as any; // Y=2
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(false);
      
      // Dice should remain in same positions
      expect(grid.cells[15][1]).toEqual({ id: 'stable1', sides: 6, number: 1, color: 'red' });
      expect(grid.cells[14][1]).toEqual({ id: 'stable2', sides: 6, number: 2, color: 'blue' });
      expect(grid.cells[13][1]).toEqual({ id: 'stable3', sides: 6, number: 3, color: 'green' });
    });
  });

  describe('Individual Gravity Tests', () => {
    test('should apply individual gravity within 16-row height', () => {
      const grid = createEmptyGrid();
      
      // Place dice with gaps below them
      grid.cells[13][2] = { id: 'fall1', sides: 6, number: 1, color: 'red' } as any; // Grid Y=2, space below at Y=1
      grid.cells[11][3] = { id: 'fall2', sides: 6, number: 2, color: 'blue' } as any; // Grid Y=4, space below at Y=3
      
      const result = applyIndividualGravity(grid);
      
      expect(result.changed).toBe(true);
      
      // Each die should fall one step down
      expect(grid.cells[14][2]).toEqual({ id: 'fall1', sides: 6, number: 1, color: 'red' }); // Y=1
      expect(grid.cells[12][3]).toEqual({ id: 'fall2', sides: 6, number: 2, color: 'blue' }); // Y=3
      
      // Original positions should be empty
      expect(grid.cells[13][2]).toBeNull();
      expect(grid.cells[11][3]).toBeNull();
    });

    test('should not move dice that are already at bottom or blocked', () => {
      const grid = createEmptyGrid();
      
      // Place dice at bottom (Y=0)
      grid.cells[15][1] = { id: 'bottom', sides: 6, number: 1, color: 'red' } as any;
      
      // Place dice with another die directly below
      grid.cells[14][1] = { id: 'blocked', sides: 6, number: 2, color: 'blue' } as any; // Y=1, blocked by die at Y=0
      
      const result = applyIndividualGravity(grid);
      
      expect(result.changed).toBe(false);
      
      // Dice should remain in same positions
      expect(grid.cells[15][1]).toEqual({ id: 'bottom', sides: 6, number: 1, color: 'red' });
      expect(grid.cells[14][1]).toEqual({ id: 'blocked', sides: 6, number: 2, color: 'blue' });
    });
  });

  describe('Gravity Edge Cases', () => {
    test('should handle empty grid gracefully', () => {
      const grid = createEmptyGrid();
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(false);
      expect(result.grid).toBe(grid);
    });

    test('should handle full column correctly', () => {
      const grid = createEmptyGrid();
      
      // Fill entire column 0 from bottom to top
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        const arrayY = GAME_CONSTANTS.GRID_HEIGHT - 1 - y; // Convert grid Y to array Y
        grid.cells[arrayY][0] = { id: `full${y}`, sides: 6, number: y + 1, color: 'red' } as any;
      }
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(false);
      
      // All dice should remain in place
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        const arrayY = GAME_CONSTANTS.GRID_HEIGHT - 1 - y;
        expect(grid.cells[arrayY][0]).toEqual({ id: `full${y}`, sides: 6, number: y + 1, color: 'red' });
      }
    });

    test('should handle multiple columns independently', () => {
      const grid = createEmptyGrid();
      
      // Place dice in different columns at different heights
      grid.cells[10][1] = { id: 'col1', sides: 6, number: 1, color: 'red' } as any; // Column 1, Grid Y=5
      grid.cells[8][3] = { id: 'col3', sides: 6, number: 2, color: 'blue' } as any; // Column 3, Grid Y=7
      grid.cells[12][5] = { id: 'col5', sides: 6, number: 3, color: 'green' } as any; // Column 5, Grid Y=3
      
      const result = applyGravity(grid);
      
      expect(result.changed).toBe(true);
      
      // Each die should fall to bottom of its respective column
      expect(grid.cells[15][1]).toEqual({ id: 'col1', sides: 6, number: 1, color: 'red' }); // Y=0
      expect(grid.cells[15][3]).toEqual({ id: 'col3', sides: 6, number: 2, color: 'blue' }); // Y=0
      expect(grid.cells[15][5]).toEqual({ id: 'col5', sides: 6, number: 3, color: 'green' }); // Y=0
      
      // Other columns should remain empty
      expect(grid.cells[15][0]).toBeNull();
      expect(grid.cells[15][2]).toBeNull();
      expect(grid.cells[15][4]).toBeNull();
      expect(grid.cells[15][6]).toBeNull();
      expect(grid.cells[15][7]).toBeNull();
    });
  });
});
