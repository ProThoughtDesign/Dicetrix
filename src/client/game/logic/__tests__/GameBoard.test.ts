import { describe, it, expect } from 'vitest';
import GameBoard from '../GameBoard';
import { Die } from '../types';

function makeDie(id: string, sides = 6, number = 1, color = 'red'): Die {
  return { id, sides, number, color } as any;
}

describe('GameBoard.lockAt', () => {
  it('locks a die and detects a simple horizontal match', () => {
    const gb = new GameBoard(6, 6);
    // Pre-fill two adjacent dice
    gb.addPieceAt([
      { pos: { x: 2, y: 4 }, die: makeDie('d2', 6, 3, 'red') },
      { pos: { x: 3, y: 4 }, die: makeDie('d3', 6, 3, 'red') },
    ]);

    // Lock a third die to make a match of 3
    const res = gb.lockAt({ x: 4, y: 4 }, makeDie('d4', 6, 3, 'red'), 3);
    expect(res.matches.length).toBeGreaterThanOrEqual(1);
    // The cleared positions should include our three
    const clearedKeys = res.cleared.map((p) => `${p.x},${p.y}`);
    expect(clearedKeys).toEqual(expect.arrayContaining(['2,4', '3,4', '4,4']));
  });

  it('does not produce matches when isolated', () => {
    const gb = new GameBoard(4, 4);
    const res = gb.lockAt({ x: 1, y: 1 }, makeDie('d1', 6, 2, 'blue'), 3);
    expect(res.matches.length).toBe(0);
    expect(res.cleared.length).toBe(0);
  });
});
