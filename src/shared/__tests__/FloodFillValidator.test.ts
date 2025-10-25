import { describe, it, expect } from 'vitest';
import { FloodFillValidator } from '../utils/FloodFillValidator.js';
import { GridPosition } from '../types/game.js';

describe('FloodFillValidator', () => {
  describe('validateConnectivity', () => {
    it('should return true for a single position', () => {
      const positions: GridPosition[] = [{ x: 0, y: 0 }];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should return true for two adjacent positions', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should return true for a connected L-shape', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should return true for a connected T-shape', () => {
      const positions: GridPosition[] = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should return true for a complex connected shape', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should return false for disconnected positions', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 2, y: 2 } // Not adjacent
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(false);
    });

    it('should return false for partially connected groups', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 }, // Connected to first
        { x: 3, y: 3 },
        { x: 4, y: 3 }  // Connected to third but not to first group
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(false);
    });

    it('should handle negative coordinates correctly', () => {
      const positions: GridPosition[] = [
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 0, y: 0 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should handle large coordinate values correctly', () => {
      const positions: GridPosition[] = [
        { x: 100, y: 100 },
        { x: 101, y: 100 },
        { x: 101, y: 101 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error for null positions array', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity(null as any);
      }).toThrow('Invalid positions array: must be a non-null array');
    });

    it('should throw error for undefined positions array', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity(undefined as any);
      }).toThrow('Invalid positions array: must be a non-null array');
    });

    it('should throw error for non-array input', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity('not an array' as any);
      }).toThrow('Invalid positions array: must be a non-null array');
    });

    it('should throw error for empty positions array', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity([]);
      }).toThrow('Invalid positions array: cannot be empty');
    });

    it('should throw error for invalid position object', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity([{ x: 0 } as any]);
      }).toThrow('Invalid position at index 0: must have numeric x and y properties');
    });

    it('should throw error for non-numeric coordinates', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity([{ x: 'invalid', y: 0 } as any]);
      }).toThrow('Invalid position at index 0: must have numeric x and y properties');
    });

    it('should throw error for non-integer coordinates', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity([{ x: 1.5, y: 0 }]);
      }).toThrow('Invalid position at index 0: x and y must be integers');
    });

    it('should throw error for duplicate positions', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity([
          { x: 0, y: 0 },
          { x: 0, y: 0 }
        ]);
      }).toThrow('Duplicate position found: (0, 0)');
    });

    it('should throw error for null position in array', () => {
      expect(() => {
        FloodFillValidator.validateConnectivity([null as any]);
      }).toThrow('Invalid position at index 0: must have numeric x and y properties');
    });
  });

  describe('edge cases', () => {
    it('should handle positions with zero coordinates', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should correctly identify diagonal-only connections as disconnected', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 } // Diagonal only, not 4-directionally connected
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(false);
    });

    it('should handle a long chain of connected positions', () => {
      const positions: GridPosition[] = [];
      for (let i = 0; i < 10; i++) {
        positions.push({ x: i, y: 0 });
      }
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });

    it('should handle a square shape', () => {
      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ];
      expect(FloodFillValidator.validateConnectivity(positions)).toBe(true);
    });
  });
});
