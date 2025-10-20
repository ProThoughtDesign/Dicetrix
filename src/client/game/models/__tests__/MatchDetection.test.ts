import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Grid } from '../Grid.js';
import { Die } from '../Die.js';
import { MatchGroup } from '../MatchGroup.js';

// Mock scene for Die creation
const mockScene = {
  add: {
    sprite: vi.fn().mockReturnValue({
      setPosition: vi.fn(),
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setAlpha: vi.fn(),
      setScale: vi.fn(),
      destroy: vi.fn()
    })
  }
} as any;

describe('Match Detection Validation', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(32, 0, 0);
  });

  describe('Basic Match Detection', () => {
    it('should detect horizontal matches of 3 dice', () => {
      // Place 3 dice with same number horizontally
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die3 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      die1.number = 3;
      die2.number = 3;
      die3.number = 3;
      
      grid.setDie(0, 0, die1);
      grid.setDie(1, 0, die2);
      grid.setDie(2, 0, die3);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
      expect(matches[0].matchedNumber).toBe(3);
    });

    it('should detect vertical matches of 3 dice', () => {
      // Place 3 dice with same number vertically
      const die1 = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      const die3 = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      
      die1.number = 4;
      die2.number = 4;
      die3.number = 4;
      
      grid.setDie(0, 0, die1);
      grid.setDie(0, 1, die2);
      grid.setDie(0, 2, die3);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
      expect(matches[0].matchedNumber).toBe(4);
    });

    it('should detect L-shaped matches', () => {
      // Create L-shaped match pattern
      const dice = Array.from({ length: 5 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'green', false, false);
        die.number = 5;
        return die;
      });
      
      // Place L-shape: horizontal line + one vertical
      grid.setDie(0, 0, dice[0]); // Top of L
      grid.setDie(0, 1, dice[1]); // Middle of L
      grid.setDie(0, 2, dice[2]); // Bottom of L
      grid.setDie(1, 2, dice[3]); // Right bottom
      grid.setDie(2, 2, dice[4]); // Far right bottom
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(5);
      expect(matches[0].matchedNumber).toBe(5);
    });

    it('should not detect matches with only 2 adjacent dice', () => {
      // Place only 2 dice with same number
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      die1.number = 2;
      die2.number = 2;
      
      grid.setDie(0, 0, die1);
      grid.setDie(1, 0, die2);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(0);
    });

    it('should not detect matches with non-adjacent dice', () => {
      // Place 3 dice with same number but not adjacent
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die3 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      die1.number = 3;
      die2.number = 3;
      die3.number = 3;
      
      grid.setDie(0, 0, die1);
      grid.setDie(2, 0, die2); // Gap between die1 and die2
      grid.setDie(4, 0, die3); // Gap between die2 and die3
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('Wild Die Matching', () => {
    it('should match wild dice with any number', () => {
      // Place wild die with regular dice
      const wildDie = new Die(mockScene, 0, 0, 6, 'green', true, false);
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      die1.number = 4;
      die2.number = 4;
      
      grid.setDie(0, 0, wildDie);
      grid.setDie(1, 0, die1);
      grid.setDie(2, 0, die2);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
    });

    it('should detect Ultimate Combo with 3+ wild dice', () => {
      // Place 3 wild dice adjacent
      const wildDie1 = new Die(mockScene, 0, 0, 6, 'green', true, false);
      const wildDie2 = new Die(mockScene, 0, 0, 6, 'green', true, false);
      const wildDie3 = new Die(mockScene, 0, 0, 6, 'green', true, false);
      
      grid.setDie(0, 0, wildDie1);
      grid.setDie(1, 0, wildDie2);
      grid.setDie(2, 0, wildDie3);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
      expect(matches[0].isUltimateCombo()).toBe(true);
    });

    it('should match mixed wild and regular dice', () => {
      // Mix wild and regular dice in a match
      const wildDie = new Die(mockScene, 0, 0, 6, 'green', true, false);
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die3 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      die1.number = 6;
      die2.number = 6;
      die3.number = 6;
      
      grid.setDie(0, 0, die1);
      grid.setDie(1, 0, wildDie); // Wild in the middle
      grid.setDie(2, 0, die2);
      grid.setDie(3, 0, die3);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(4);
    });
  });

  describe('Black Die Detection', () => {
    it('should detect black dice in matches', () => {
      // Place black die with regular dice
      const blackDie = new Die(mockScene, 0, 0, 6, 'black', false, true);
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      blackDie.number = 5;
      die1.number = 5;
      die2.number = 5;
      
      grid.setDie(0, 0, blackDie);
      grid.setDie(1, 0, die1);
      grid.setDie(2, 0, die2);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
      expect(matches[0].hasBlackDice()).toBe(true);
    });
  });

  describe('Multiple Matches', () => {
    it('should detect multiple separate matches', () => {
      // Create two separate horizontal matches
      const dice1 = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 3;
        return die;
      });
      
      const dice2 = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'blue', false, false);
        die.number = 4;
        return die;
      });
      
      // First match (row 0)
      grid.setDie(0, 0, dice1[0]);
      grid.setDie(1, 0, dice1[1]);
      grid.setDie(2, 0, dice1[2]);
      
      // Second match (row 2, separated by empty row)
      grid.setDie(0, 2, dice2[0]);
      grid.setDie(1, 2, dice2[1]);
      grid.setDie(2, 2, dice2[2]);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(2);
      expect(matches.some(m => m.matchedNumber === 3)).toBe(true);
      expect(matches.some(m => m.matchedNumber === 4)).toBe(true);
    });

    it('should detect overlapping matches correctly', () => {
      // Create cross-shaped pattern that forms overlapping matches
      const dice = Array.from({ length: 5 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 2;
        return die;
      });
      
      // Cross pattern centered at (1,1)
      grid.setDie(1, 0, dice[0]); // Top
      grid.setDie(0, 1, dice[1]); // Left
      grid.setDie(1, 1, dice[2]); // Center
      grid.setDie(2, 1, dice[3]); // Right
      grid.setDie(1, 2, dice[4]); // Bottom
      
      const matches = grid.detectMatches();
      
      // Should detect one large connected match, not separate ones
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty grid', () => {
      const matches = grid.detectMatches();
      expect(matches).toHaveLength(0);
    });

    it('should handle grid with single die', () => {
      const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
      die.number = 1;
      
      grid.setDie(5, 5, die);
      
      const matches = grid.detectMatches();
      expect(matches).toHaveLength(0);
    });

    it('should handle matches at grid boundaries', () => {
      // Test match at top-left corner
      const dice = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 6;
        return die;
      });
      
      grid.setDie(0, 0, dice[0]);
      grid.setDie(1, 0, dice[1]);
      grid.setDie(2, 0, dice[2]);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
    });

    it('should handle matches at bottom-right corner', () => {
      // Test match at bottom-right corner
      const dice = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 1;
        return die;
      });
      
      const maxX = grid.width - 1;
      const maxY = grid.height - 1;
      
      grid.setDie(maxX - 2, maxY, dice[0]);
      grid.setDie(maxX - 1, maxY, dice[1]);
      grid.setDie(maxX, maxY, dice[2]);
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(3);
    });

    it('should handle large matches (9+ dice)', () => {
      // Create a large connected match
      const dice = Array.from({ length: 12 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 3;
        return die;
      });
      
      // Create 3x4 rectangle of matching dice
      let dieIndex = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 3; x++) {
          grid.setDie(x, y, dice[dieIndex++]);
        }
      }
      
      const matches = grid.detectMatches();
      
      expect(matches).toHaveLength(1);
      expect(matches[0].size).toBe(12);
      expect(matches[0].getSizeEffect().type).toBe('grid_clear');
    });
  });

  describe('Performance Validation', () => {
    it('should detect matches efficiently in full grid', () => {
      // Fill entire grid with random dice
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
          die.number = Math.floor(Math.random() * 6) + 1;
          grid.setDie(x, y, die);
        }
      }
      
      const startTime = performance.now();
      const matches = grid.detectMatches();
      const endTime = performance.now();
      
      // Should complete within reasonable time (< 100ms for full grid)
      expect(endTime - startTime).toBeLessThan(100);
      expect(Array.isArray(matches)).toBe(true);
    });

    it('should handle repeated match detection calls', () => {
      // Set up a simple match
      const dice = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 4;
        return die;
      });
      
      grid.setDie(0, 0, dice[0]);
      grid.setDie(1, 0, dice[1]);
      grid.setDie(2, 0, dice[2]);
      
      // Call match detection multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(grid.detectMatches());
      }
      
      // All results should be consistent
      results.forEach(matches => {
        expect(matches).toHaveLength(1);
        expect(matches[0].size).toBe(3);
      });
    });
  });
});
