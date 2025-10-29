import { describe, test, expect } from 'vitest';
import { Grid } from '../Grid';

describe('Grid', () => {
  test('setCell and getCell work and occupiedPositions reports', () => {
    const g = new Grid(4, 4);
    expect(g.isEmpty(1, 1)).toBe(true);
    g.setCell({ x: 1, y: 1 }, { id: 'd1', sides: 6, number: 3, color: 'red' } as any);
    const c = g.getCell({ x: 1, y: 1 });
    expect(c).not.toBeNull();
    expect((c as any).number).toBe(3);
    const occ = g.occupiedPositions();
    expect(occ).toContainEqual({ x: 1, y: 1 });
  });
});

