import { describe, test, expect } from 'vitest';
import { detectMatches } from '../MatchDetector';
import { applyGravity } from '../Gravity';
import { GridState } from '../types';
import { GAME_CONSTANTS } from '../../../../shared/constants/GameConstants';

describe('Cascade System', () => {
  
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

  function clearMatches(grid: GridState, matches: Array<{ positions: Array<{ x: number; y: number }> }>): void {
    // Clear matched positions from grid
    for (const match of matches) {
      for (const pos of match.positions) {
        // Convert grid coordinates to array coordinates
        const arrayY = GAME_CONSTANTS.GRID_HEIGHT - 1 - pos.y;
        if (grid.cells[arrayY]) {
          grid.cells[arrayY][pos.x] = null;
        }
      }
    }
  }

  describe('8x16 Grid Cascade Tests', () => {
    test('should handle cascade chain reactions within 16-row height', () => {
      const grid = createEmptyGrid();
      
      // Set up a cascade scenario:
      // Bottom: 3 matching dice (will be cleared)
      // Middle: 2 dice that will fall and create new match
      // Top: 1 die that will fall
      
      // Bottom row - horizontal match that will be cleared first
      grid.cells[15][2] = { id: 'b1', sides: 6, number: 3, color: 'red' } as any; // Grid Y=0
      grid.cells[15][3] = { id: 'b2', sides: 6, number: 3, color: 'red' } as any; // Grid Y=0
      grid.cells[15][4] = { id: 'b3', sides: 6, number: 3, color: 'red' } as any; // Grid Y=0
      
      // Middle section - dice that will fall after bottom is cleared
      grid.cells[13][2] = { id: 'm1', sides: 6, number: 5, color: 'blue' } as any; // Grid Y=2
      grid.cells[12][3] = { id: 'm2', sides: 6, number: 5, color: 'blue' } as any; // Grid Y=3
      grid.cells[11][4] = { id: 'm3', sides: 6, number: 5, color: 'blue' } as any; // Grid Y=4
      
      // Top section - will fall and potentially create another match
      grid.cells[8][3] = { id: 't1', sides: 6, number: 7, color: 'green' } as any; // Grid Y=7

      // Step 1: Detect initial matches
      let matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
      expect(matches[0].size).toBe(3);
      
      // Step 2: Clear matches
      clearMatches(grid, matches);
      
      // Step 3: Apply gravity
      const gravityResult = applyGravity(grid);
      expect(gravityResult.changed).toBe(true);
      
      // Step 4: Check if new matches formed after gravity
      matches = detectMatches(grid, 3);
      
      // Verify dice positions after gravity
      expect(grid.cells[15][2]).toEqual({ id: 'm1', sides: 6, number: 5, color: 'blue' }); // Y=0
      expect(grid.cells[15][3]).toEqual({ id: 'm2', sides: 6, number: 5, color: 'blue' }); // Y=0
      expect(grid.cells[15][4]).toEqual({ id: 'm3', sides: 6, number: 5, color: 'blue' }); // Y=0
      expect(grid.cells[14][3]).toEqual({ id: 't1', sides: 6, number: 7, color: 'green' }); // Y=1
      
      // Should detect new match of blue dice
      expect(matches.length).toBe(1);
      expect(matches[0].size).toBe(3);
    });

    test('should handle cascade at grid boundaries in 8x16 space', () => {
      const grid = createEmptyGrid();
      
      // Create match at left edge of 8-column grid
      grid.cells[15][0] = { id: 'l1', sides: 6, number: 2, color: 'yellow' } as any; // Grid Y=0, X=0
      grid.cells[15][1] = { id: 'l2', sides: 6, number: 2, color: 'yellow' } as any; // Grid Y=0, X=1
      grid.cells[15][2] = { id: 'l3', sides: 6, number: 2, color: 'yellow' } as any; // Grid Y=0, X=2
      
      // Dice above that will fall
      grid.cells[10][0] = { id: 'f1', sides: 6, number: 4, color: 'purple' } as any; // Grid Y=5, X=0
      grid.cells[9][1] = { id: 'f2', sides: 6, number: 4, color: 'purple' } as any; // Grid Y=6, X=1
      grid.cells[8][2] = { id: 'f3', sides: 6, number: 4, color: 'purple' } as any; // Grid Y=7, X=2
      
      // Clear initial match
      let matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
      clearMatches(grid, matches);
      
      // Apply gravity
      applyGravity(grid);
      
      // Check final positions at left boundary
      expect(grid.cells[15][0]).toEqual({ id: 'f1', sides: 6, number: 4, color: 'purple' }); // Y=0
      expect(grid.cells[15][1]).toEqual({ id: 'f2', sides: 6, number: 4, color: 'purple' }); // Y=0
      expect(grid.cells[15][2]).toEqual({ id: 'f3', sides: 6, number: 4, color: 'purple' }); // Y=0
      
      // Should create new match
      matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
    });

    test('should handle cascade at right edge of 8-column grid', () => {
      const grid = createEmptyGrid();
      
      // Create match at right edge (columns 5, 6, 7)
      grid.cells[15][5] = { id: 'r1', sides: 6, number: 6, color: 'orange' } as any; // Grid Y=0, X=5
      grid.cells[15][6] = { id: 'r2', sides: 6, number: 6, color: 'orange' } as any; // Grid Y=0, X=6
      grid.cells[15][7] = { id: 'r3', sides: 6, number: 6, color: 'orange' } as any; // Grid Y=0, X=7
      
      // Dice above that will fall
      grid.cells[12][5] = { id: 'rf1', sides: 6, number: 8, color: 'cyan' } as any; // Grid Y=3, X=5
      grid.cells[11][6] = { id: 'rf2', sides: 6, number: 8, color: 'cyan' } as any; // Grid Y=4, X=6
      grid.cells[10][7] = { id: 'rf3', sides: 6, number: 8, color: 'cyan' } as any; // Grid Y=5, X=7
      
      // Clear initial match
      let matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
      clearMatches(grid, matches);
      
      // Apply gravity
      applyGravity(grid);
      
      // Check final positions at right boundary
      expect(grid.cells[15][5]).toEqual({ id: 'rf1', sides: 6, number: 8, color: 'cyan' }); // Y=0
      expect(grid.cells[15][6]).toEqual({ id: 'rf2', sides: 6, number: 8, color: 'cyan' }); // Y=0
      expect(grid.cells[15][7]).toEqual({ id: 'rf3', sides: 6, number: 8, color: 'cyan' }); // Y=0
      
      // Should create new match
      matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
    });

    test('should handle vertical cascade within 16-row height limit', () => {
      const grid = createEmptyGrid();
      
      // Create vertical match in middle column
      grid.cells[15][3] = { id: 'v1', sides: 6, number: 1, color: 'pink' } as any; // Grid Y=0
      grid.cells[14][3] = { id: 'v2', sides: 6, number: 1, color: 'pink' } as any; // Grid Y=1
      grid.cells[13][3] = { id: 'v3', sides: 6, number: 1, color: 'pink' } as any; // Grid Y=2
      
      // Dice above in same column that will fall
      grid.cells[10][3] = { id: 'vf1', sides: 6, number: 9, color: 'brown' } as any; // Grid Y=5
      grid.cells[8][3] = { id: 'vf2', sides: 6, number: 9, color: 'brown' } as any; // Grid Y=7
      grid.cells[5][3] = { id: 'vf3', sides: 6, number: 9, color: 'brown' } as any; // Grid Y=10
      
      // Clear initial vertical match
      let matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
      clearMatches(grid, matches);
      
      // Apply gravity
      applyGravity(grid);
      
      // Check that dice fell and stacked properly
      expect(grid.cells[15][3]).toEqual({ id: 'vf1', sides: 6, number: 9, color: 'brown' }); // Y=0
      expect(grid.cells[14][3]).toEqual({ id: 'vf2', sides: 6, number: 9, color: 'brown' }); // Y=1
      expect(grid.cells[13][3]).toEqual({ id: 'vf3', sides: 6, number: 9, color: 'brown' }); // Y=2
      
      // Should create new vertical match
      matches = detectMatches(grid, 3);
      expect(matches.length).toBe(1);
      
      // Sort positions by Y coordinate for consistent comparison
      const sortedPositions = matches[0].positions.sort((a, b) => a.y - b.y);
      expect(sortedPositions).toEqual([
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 }
      ]);
    });

    test('should prevent infinite cascade loops with proper termination', () => {
      const grid = createEmptyGrid();
      
      // Create a simple scenario that could potentially loop
      grid.cells[15][1] = { id: 'loop1', sides: 6, number: 7, color: 'red' } as any;
      grid.cells[15][2] = { id: 'loop2', sides: 6, number: 7, color: 'red' } as any;
      grid.cells[15][3] = { id: 'loop3', sides: 6, number: 7, color: 'red' } as any;
      
      let cascadeCount = 0;
      const maxCascades = 10; // Prevent infinite loops
      
      while (cascadeCount < maxCascades) {
        const matches = detectMatches(grid, 3);
        if (matches.length === 0) break;
        
        clearMatches(grid, matches);
        const gravityResult = applyGravity(grid);
        
        if (!gravityResult.changed) break;
        cascadeCount++;
      }
      
      // Should terminate within reasonable number of cascades
      expect(cascadeCount).toBeLessThan(maxCascades);
      
      // Grid should be empty after clearing the match
      const finalMatches = detectMatches(grid, 3);
      expect(finalMatches.length).toBe(0);
    });

    test('should handle complex multi-column cascade in 8x16 grid', () => {
      const grid = createEmptyGrid();
      
      // Create matches in multiple columns that will trigger cascades
      // Column 1: horizontal match at bottom
      grid.cells[15][1] = { id: 'h1', sides: 6, number: 3, color: 'red' } as any;
      grid.cells[15][2] = { id: 'h2', sides: 6, number: 3, color: 'red' } as any;
      grid.cells[15][3] = { id: 'h3', sides: 6, number: 3, color: 'red' } as any;
      
      // Dice above that will fall and potentially create new matches
      grid.cells[12][1] = { id: 'f1', sides: 6, number: 5, color: 'blue' } as any; // Grid Y=3
      grid.cells[11][2] = { id: 'f2', sides: 6, number: 5, color: 'blue' } as any; // Grid Y=4
      grid.cells[10][3] = { id: 'f3', sides: 6, number: 5, color: 'blue' } as any; // Grid Y=5
      
      // Additional dice in other columns
      grid.cells[13][5] = { id: 'o1', sides: 6, number: 2, color: 'green' } as any; // Grid Y=2
      grid.cells[12][6] = { id: 'o2', sides: 6, number: 4, color: 'yellow' } as any; // Grid Y=3
      
      // Simulate cascade sequence
      let totalCascades = 0;
      let matches = detectMatches(grid, 3);
      
      while (matches.length > 0 && totalCascades < 5) {
        clearMatches(grid, matches);
        applyGravity(grid);
        matches = detectMatches(grid, 3);
        totalCascades++;
      }
      
      // Verify cascade completed properly
      expect(totalCascades).toBeGreaterThan(0);
      expect(totalCascades).toBeLessThan(5);
      
      // Check that remaining dice are in valid positions
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.GRID_WIDTH; x++) {
          const arrayY = GAME_CONSTANTS.GRID_HEIGHT - 1 - y;
          const cell = grid.cells[arrayY] ? grid.cells[arrayY][x] : null;
          if (cell) {
            // Verify dice are properly stacked (no floating dice)
            if (y > 0) {
              const belowArrayY = GAME_CONSTANTS.GRID_HEIGHT - y; // y-1 in grid coords
              const cellBelow = grid.cells[belowArrayY] ? grid.cells[belowArrayY][x] : null;
              // If there's a die above ground level, there should be support below or it should be at ground
              if (y > 0) {
                expect(cellBelow || y === 0).toBeTruthy();
              }
            }
          }
        }
      }
    });
  });
});
