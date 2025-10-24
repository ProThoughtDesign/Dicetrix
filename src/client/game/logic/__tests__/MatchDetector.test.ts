import { describe, test, expect } from 'vitest';
import { detectMatches } from '../MatchDetector';
import { GridState } from '../types';
import { GAME_CONSTANTS } from '../../../../shared/constants/GameConstants';

describe('MatchDetector', () => {
  test('detects a simple horizontal match', () => {
    const grid: GridState = { width: 5, height: 3, cells: [] } as any;
    grid.cells = [
      new Array(5).fill(null),
      new Array(5).fill(null),
      new Array(5).fill(null),
    ];
    // place three matching dice horizontally at row 1
    grid.cells[1][1] = { id: 'a', sides: 6, number: 2, color: 'red' } as any;
    grid.cells[1][2] = { id: 'b', sides: 6, number: 2, color: 'red' } as any;
    grid.cells[1][3] = { id: 'c', sides: 6, number: 2, color: 'red' } as any;

    const matches = detectMatches(grid, 3);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const m = matches.find(mm => mm.size === 3);
    expect(m).toBeDefined();
  });

  test('wild die matches any number', () => {
    const grid: GridState = { width: 3, height: 1, cells: [] } as any;
    grid.cells = [new Array(3).fill(null)];
    grid.cells[0][0] = { id: 'a', sides: 6, number: 4, color: 'red' } as any;
    grid.cells[0][1] = { id: 'w', sides: 6, number: 1, color: 'grey', isWild: true } as any;
    grid.cells[0][2] = { id: 'b', sides: 6, number: 4, color: 'red' } as any;

    const matches = detectMatches(grid, 3);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].size).toBe(3);
  });

  describe('8x16 Grid Boundary Tests', () => {
    test('should work correctly with 8x16 grid boundaries', () => {
      // Create 8x16 grid using current game constants
      const grid: GridState = { 
        width: GAME_CONSTANTS.GRID_WIDTH, 
        height: GAME_CONSTANTS.GRID_HEIGHT, 
        cells: [] 
      } as any;
      
      // Initialize 16 rows of 8 columns each
      grid.cells = [];
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        grid.cells.push(new Array(GAME_CONSTANTS.GRID_WIDTH).fill(null));
      }

      // Place matching dice at bottom-left corner (array coordinates)
      grid.cells[15][0] = { id: 'a1', sides: 6, number: 3, color: 'blue' } as any; // Grid Y=0
      grid.cells[15][1] = { id: 'a2', sides: 6, number: 3, color: 'blue' } as any; // Grid Y=0
      grid.cells[15][2] = { id: 'a3', sides: 6, number: 3, color: 'blue' } as any; // Grid Y=0

      const matches = detectMatches(grid, 3);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      
      const match = matches.find(m => m.size === 3);
      expect(match).toBeDefined();
      expect(match!.positions).toEqual([
        { x: 0, y: 0 }, // Grid coordinates (bottom-left origin)
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ]);
    });

    test('should detect matches at top-right corner of 8x16 grid', () => {
      const grid: GridState = { 
        width: GAME_CONSTANTS.GRID_WIDTH, 
        height: GAME_CONSTANTS.GRID_HEIGHT, 
        cells: [] 
      } as any;
      
      // Initialize grid
      grid.cells = [];
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        grid.cells.push(new Array(GAME_CONSTANTS.GRID_WIDTH).fill(null));
      }

      // Place matching dice at top-right corner (array coordinates)
      grid.cells[0][5] = { id: 'b1', sides: 6, number: 5, color: 'red' } as any; // Grid Y=15
      grid.cells[0][6] = { id: 'b2', sides: 6, number: 5, color: 'red' } as any; // Grid Y=15
      grid.cells[0][7] = { id: 'b3', sides: 6, number: 5, color: 'red' } as any; // Grid Y=15

      const matches = detectMatches(grid, 3);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      
      const match = matches.find(m => m.size === 3);
      expect(match).toBeDefined();
      expect(match!.positions).toEqual([
        { x: 5, y: 15 }, // Grid coordinates (top row)
        { x: 6, y: 15 },
        { x: 7, y: 15 }
      ]);
    });

    test('should detect vertical matches within 16-row height', () => {
      const grid: GridState = { 
        width: GAME_CONSTANTS.GRID_WIDTH, 
        height: GAME_CONSTANTS.GRID_HEIGHT, 
        cells: [] 
      } as any;
      
      // Initialize grid
      grid.cells = [];
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        grid.cells.push(new Array(GAME_CONSTANTS.GRID_WIDTH).fill(null));
      }

      // Place vertical matching dice in middle column
      grid.cells[15][3] = { id: 'c1', sides: 6, number: 4, color: 'green' } as any; // Grid Y=0
      grid.cells[14][3] = { id: 'c2', sides: 6, number: 4, color: 'green' } as any; // Grid Y=1
      grid.cells[13][3] = { id: 'c3', sides: 6, number: 4, color: 'green' } as any; // Grid Y=2

      const matches = detectMatches(grid, 3);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      
      const match = matches.find(m => m.size === 3);
      expect(match).toBeDefined();
      
      // Sort positions by Y coordinate for consistent comparison
      const sortedPositions = match!.positions.sort((a, b) => a.y - b.y);
      expect(sortedPositions).toEqual([
        { x: 3, y: 0 }, // Grid coordinates (bottom to top)
        { x: 3, y: 1 },
        { x: 3, y: 2 }
      ]);
    });

    test('should not detect matches outside 8x16 boundaries', () => {
      const grid: GridState = { 
        width: GAME_CONSTANTS.GRID_WIDTH, 
        height: GAME_CONSTANTS.GRID_HEIGHT, 
        cells: [] 
      } as any;
      
      // Initialize grid
      grid.cells = [];
      for (let y = 0; y < GAME_CONSTANTS.GRID_HEIGHT; y++) {
        grid.cells.push(new Array(GAME_CONSTANTS.GRID_WIDTH).fill(null));
      }

      // Place only 2 matching dice (not enough for a match)
      grid.cells[15][0] = { id: 'd1', sides: 6, number: 6, color: 'yellow' } as any;
      grid.cells[15][1] = { id: 'd2', sides: 6, number: 6, color: 'yellow' } as any;

      const matches = detectMatches(grid, 3);
      expect(matches.length).toBe(0);
    });
  });
});
