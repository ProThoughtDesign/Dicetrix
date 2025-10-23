import { describe, test, expect } from 'vitest';
import { detectMatches } from '../MatchDetector';
import { GridState } from '../types';

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
});
